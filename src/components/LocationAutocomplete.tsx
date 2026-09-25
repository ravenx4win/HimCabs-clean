/**
 * LocationAutocomplete
 *
 * Production-ready location search using the Photon API (komoot.io).
 * Photon is powered by OpenStreetMap data — free, no API key required,
 * consistent with the existing OSM tile layer used in the map view.
 *
 * Key design decisions:
 *  - Photon API  : https://photon.komoot.io/api/ (GeoJSON FeatureCollection)
 *  - HP bbox     : bbox=75.5,30.3,79.1,33.3 (lon_min,lat_min,lon_max,lat_max)
 *  - Debounce    : 300 ms via native setTimeout — no extra dependency
 *  - Min length  : 3 characters before firing any request
 *  - Client filter: double-checks address.state === "Himachal Pradesh"
 *  - Stale-fetch guard: incrementing fetchId discards out-of-order responses
 *  - Coordinates : passed to onSelectSuggestion so parent can use them for
 *                  routing without a second geocode round-trip
 *  - No FlatList : uses ScrollView + .map() to avoid nested-VirtualizedList error
 *  - dropdownZIndex prop: lets Pickup (30) stack above Drop (20) input
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Minimal shape of one Photon GeoJSON feature we care about */
interface PhotonFeature {
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    osm_id?: number;
    name?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    street?: string;
    housenumber?: string;
    type?: string;
  };
}

interface PhotonResponse {
  type: "FeatureCollection";
  features: PhotonFeature[];
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface Suggestion {
  /** Unique key derived from osm_id + geometry position */
  id: string;
  primaryName: string;   // e.g. "Kotwali Bazaar"
  secondaryName: string; // e.g. "Dharamshala, Kangra, HP"
  fullName: string;      // combined label stored in the text field
  coords: LocationCoords;
}

export interface LocationAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  /**
   * Called on every keystroke (name only) AND when an item is selected
   * (name + coords). This keeps the parent text state in sync at all times.
   */
  onSelectSuggestion: (name: string, coords?: LocationCoords) => void;
  /**
   * Stacking order relative to sibling LocationAutocomplete fields.
   * Pickup should be higher (30) than Drop (20). Default: 10.
   */
  dropdownZIndex?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PHOTON_URL = "https://photon.komoot.io/api/";

/**
 * Himachal Pradesh strict bounding box.
 * Photon bbox format: min_lon, min_lat, max_lon, max_lat
 */
const HP_BBOX = "75.5,30.3,79.1,33.3";
const HP_LIMIT = 5;          // results per request (keep it fast)
const HP_FETCH_LIMIT = 8;    // fetch a few extra so client filter has room

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

/** State values Photon can return for Himachal Pradesh */
const HP_STATE_NAMES = new Set([
  "Himachal Pradesh",
  "Himachal  Pradesh",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a human-readable primary + secondary name from a Photon feature.
 *
 * Primary  : feature.properties.name (the place name)
 * Secondary: district / city / county + state abbreviation
 */
function photonFeatureToSuggestion(feature: PhotonFeature, index: number): Suggestion {
  const p = feature.properties;

  const primary = p.name ?? p.street ?? "Unknown place";

  // Build a clean breadcrumb: city or district → county → "HP"
  const breadcrumbParts: string[] = [];
  if (p.city && p.city !== primary) breadcrumbParts.push(p.city);
  else if (p.district && p.district !== primary) breadcrumbParts.push(p.district);
  if (p.county && p.county !== primary && !breadcrumbParts.includes(p.county)) {
    breadcrumbParts.push(p.county);
  }
  breadcrumbParts.push("HP"); // always end with state abbreviation

  const secondary = breadcrumbParts.join(", ");
  const fullName = secondary ? `${primary}, ${secondary}` : primary;

  // Photon coordinates: [longitude, latitude]
  const [lng, lat] = feature.geometry.coordinates;

  return {
    id: `${p.osm_id ?? index}-${lat}-${lng}`,
    primaryName: primary,
    secondaryName: secondary,
    fullName,
    coords: { latitude: lat, longitude: lng },
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LocationAutocomplete({
  label,
  placeholder,
  value,
  onSelectSuggestion,
  dropdownZIndex = 10,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Stale-fetch guard: each call increments this; responses that don't match
  // the current ID are discarded silently.
  const fetchIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal query when parent resets value (e.g. clearing the form)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Core fetch (Photon API) ──────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (text: string) => {
    const currentFetchId = ++fetchIdRef.current;

    setLoading(true);
    setErrorMsg(null);

    try {
      const params = new URLSearchParams({
        q: text,
        limit: String(HP_FETCH_LIMIT),
        bbox: HP_BBOX,          // geofence to Himachal Pradesh
        lang: "en",             // English results
      });

      const response = await fetch(`${PHOTON_URL}?${params.toString()}`);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: PhotonResponse = await response.json();

      if (currentFetchId !== fetchIdRef.current) return; // stale — discard

      // ── Client-side HP filter ──────────────────────────────────────────────
      // bbox handles most geography, but Photon occasionally returns results
      // whose centroid is exactly on the bbox edge from another state.
      const hpFeatures = data.features.filter((f) => {
        const state = f.properties.state ?? "";
        return HP_STATE_NAMES.has(state);
      });

      const parsed = hpFeatures
        .slice(0, HP_LIMIT)
        .map((f, i) => photonFeatureToSuggestion(f, i));

      setSuggestions(parsed);
      setShowDropdown(parsed.length > 0);
    } catch {
      if (currentFetchId !== fetchIdRef.current) return;
      setErrorMsg("Unable to fetch locations. Check your connection.");
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      if (currentFetchId === fetchIdRef.current) setLoading(false);
    }
  }, []);

  // ── Debounced change handler ─────────────────────────────────────────────────
  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      onSelectSuggestion(text); // keep parent text state live while typing

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.trim().length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setShowDropdown(false);
        setErrorMsg(null);
        setLoading(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        fetchSuggestions(text.trim());
      }, DEBOUNCE_MS);
    },
    [fetchSuggestions, onSelectSuggestion],
  );

  // ── Selection handler ────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (suggestion: Suggestion) => {
      setQuery(suggestion.fullName);
      // Pass both name and coordinates to parent
      onSelectSuggestion(suggestion.fullName, suggestion.coords);
      setSuggestions([]);
      setShowDropdown(false);
      setErrorMsg(null);
      Keyboard.dismiss();
    },
    [onSelectSuggestion],
  );

  // ── Blur handler (delayed so tap on suggestion registers first) ──────────────
  const handleBlur = useCallback(() => {
    setTimeout(() => setShowDropdown(false), 150);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.wrapper, { zIndex: dropdownZIndex }]}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#AAAAAA"
          value={query}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
        />
        {loading && (
          <ActivityIndicator style={styles.spinner} size="small" color="#007AFF" />
        )}
      </View>

      {/* Inline network error */}
      {errorMsg !== null && (
        <Text style={styles.errorText}>{errorMsg}</Text>
      )}

      {/* Floating dropdown — ScrollView avoids nested-VirtualizedList error */}
      {showDropdown && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            scrollEnabled={suggestions.length > 3}
            nestedScrollEnabled={true}
          >
            {suggestions.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.suggestionRow,
                  index < suggestions.length - 1 && styles.suggestionRowBorder,
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                {/* Blue dot instead of emoji (emoji renders as iOS image) */}
                <View style={styles.pinDot} />
                <View style={styles.suggestionText}>
                  <Text style={styles.primaryName} numberOfLines={1}>
                    {item.primaryName}
                  </Text>
                  {item.secondaryName.length > 0 && (
                    <Text style={styles.secondaryName} numberOfLines={1}>
                      {item.secondaryName}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    // zIndex is applied inline from dropdownZIndex prop
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E4E6EB",
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: "#1a1a1a",
  },
  spinner: {
    marginRight: 12,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: "#FF3B30",
  },

  // ── Dropdown ──────────────────────────────────────────────────────────────
  dropdown: {
    position: "absolute",
    top: "100%",      // anchored directly below input + label
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E6EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    maxHeight: 270,
    zIndex: 999,
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  suggestionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F5",
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    marginRight: 12,
    marginLeft: 2,
    flexShrink: 0,
  },
  suggestionText: {
    flex: 1,
  },
  primaryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  secondaryName: {
    fontSize: 12,
    color: "#888888",
    marginTop: 2,
  },
});
