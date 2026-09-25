import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import MapView, { Marker, UrlTile, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";

// Default region: Dharamshala, Himachal Pradesh
const DEFAULT_REGION: Region = {
  latitude: 32.219,
  longitude: 76.3234,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

// Accuracy / distance filter suitable for a cab-booking app.
// BALANCED accuracy avoids excessive battery drain; 20m distance filter
// prevents marker jitter from GPS noise while still reflecting real movement.
const LOCATION_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.Balanced,
  distanceInterval: 20, // metres
  timeInterval: 5000,   // ms (Android; iOS uses distanceInterval)
};

export default function FullMapScreen() {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);

  // Current user coordinate — null until user explicitly requests it
  const [userCoord, setUserCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Whether we are currently tracking (watcher is active)
  const [isTracking, setIsTracking] = useState(false);

  // Whether the initial location fetch is in progress
  const [locating, setLocating] = useState(false);

  // Hold the watcher subscription so we can remove it on unmount or re-tap
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  // ─── Cleanup watcher on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (watcherRef.current) {
        watcherRef.current.remove();
        watcherRef.current = null;
      }
    };
  }, []);

  // ─── "Use my current location" handler ────────────────────────────────────
  const handleUseMyLocation = useCallback(async () => {
    // If a watcher is already running (user tapped again), just re-center
    // the map — do NOT start a duplicate watcher.
    if (isTracking) {
      if (userCoord && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: userCoord.latitude,
            longitude: userCoord.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          800,
        );
      }
      return;
    }

    setLocating(true);

    try {
      // ── Step 1: Check / request foreground permission ──
      const { status: existingStatus } =
        await Location.getForegroundPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status: requestedStatus } =
          await Location.requestForegroundPermissionsAsync();
        finalStatus = requestedStatus;
      }

      if (finalStatus !== "granted") {
        setLocating(false);
        Alert.alert(
          "Location Permission Needed",
          "HimCabs needs access to your location to show you on the map. " +
            "Please enable location access in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Location.enableNetworkProviderAsync().catch(() => {}),
            },
          ],
        );
        return;
      }

      // ── Step 2: Get initial position and center map ──
      let initialPosition: Location.LocationObject | null = null;
      try {
        initialPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch {
        // Location temporarily unavailable (e.g. simulator with no simulated location)
        setLocating(false);
        Alert.alert(
          "Location Unavailable",
          "Unable to get your current location. " +
            "Please ensure location services are enabled and try again.",
        );
        return;
      }

      const { latitude, longitude } = initialPosition.coords;
      setUserCoord({ latitude, longitude });

      // Center map on initial location (only on explicit first tap)
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          800,
        );
      }

      setLocating(false);
      setIsTracking(true);

      // ── Step 3: Start continuous watcher ──
      // Remove any stale watcher first (safety guard)
      if (watcherRef.current) {
        watcherRef.current.remove();
        watcherRef.current = null;
      }

      watcherRef.current = await Location.watchPositionAsync(
        LOCATION_OPTIONS,
        (location) => {
          const { latitude: lat, longitude: lng } = location.coords;
          // Update marker position only — do NOT force camera to follow,
          // so user can freely pan/zoom after the initial centering.
          setUserCoord({ latitude: lat, longitude: lng });
        },
      );
    } catch (err) {
      // Catch-all: ensure no uncaught promise rejection becomes a red screen
      setLocating(false);
      console.warn("[FullMapScreen] Location error:", err);
      Alert.alert(
        "Location Error",
        "Unable to get your current location. " +
          "Please enable location access and try again.",
      );
    }
  }, [isTracking, userCoord]);

  // ─── Close map ────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* ── Full-screen OSM map ── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapType="standard"
        initialRegion={DEFAULT_REGION}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        userInterfaceStyle="light"
        showsUserLocation={false}
      >
        {/* ── Existing OSM tile configuration preserved exactly ── */}
        <UrlTile
          urlTemplate="https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
          maximumZ={19}
          zIndex={-1}
        />

        {/* ── Default Himachal marker (always visible) ── */}
        <Marker
          coordinate={{ latitude: 32.219, longitude: 76.3234 }}
          title="Dharamshala"
          description="Himachal Pradesh"
        />

        {/* ── Current-location marker — only when we have a real GPS fix ── */}
        {userCoord && (
          <Marker
            coordinate={userCoord}
            title="My Location"
            description="Your current position"
            pinColor="#007AFF"
          />
        )}
      </MapView>

      {/* ── Top controls bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityLabel="Close map"
          accessibilityRole="button"
        >
          <Text style={styles.closeButtonText}>✕ Close</Text>
        </TouchableOpacity>

        <Text style={styles.mapTitle}>HimCabs Map</Text>

        {/* Spacer to balance the flex row */}
        <View style={styles.topBarSpacer} />
      </View>

      {/* ── "Use my current location" button ── */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[
            styles.locationButton,
            isTracking && styles.locationButtonActive,
          ]}
          onPress={handleUseMyLocation}
          disabled={locating}
          accessibilityLabel="Use my current location"
          accessibilityRole="button"
        >
          {locating ? (
            <ActivityIndicator
              size="small"
              color={isTracking ? "#fff" : "#007AFF"}
            />
          ) : (
            <Text
              style={[
                styles.locationButtonText,
                isTracking && styles.locationButtonTextActive,
              ]}
            >
              {isTracking ? "📍 Tracking Location" : "📍 Use My Current Location"}
            </Text>
          )}
        </TouchableOpacity>

        {isTracking && (
          <Text style={styles.trackingNote}>
            Location updates automatically while map is open
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Top bar ──
  topBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 30,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },
  mapTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a1a1a",
    backgroundColor: "#FFFFFFdd",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  topBarSpacer: {
    width: 80,
  },

  // ── Bottom controls ──
  bottomControls: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 44 : 24,
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 10,
  },
  locationButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 230,
    justifyContent: "center",
  },
  locationButtonActive: {
    backgroundColor: "#007AFF",
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#007AFF",
  },
  locationButtonTextActive: {
    color: "#FFFFFF",
  },
  trackingNote: {
    marginTop: 8,
    fontSize: 12,
    color: "#555",
    backgroundColor: "#FFFFFFcc",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
});
