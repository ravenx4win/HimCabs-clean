import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";

import { RootStackParamList } from "../navigation/AppNavigator";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const mapRef = useRef<MapView>(null);

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showDrivers, setShowDrivers] = useState(false);
  const [isFullMap, setIsFullMap] = useState(false);

  // ✅ Request location permission (important for user location)
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const MOCK_DRIVERS = [
    { id: "1", latitude: 32.2396, longitude: 76.3239 },
    { id: "2", latitude: 32.2432, longitude: 76.3343 },
    { id: "3", latitude: 32.2490, longitude: 76.3600 },
    { id: "4", latitude: 32.2167, longitude: 76.3200 },
    { id: "5", latitude: 32.2100, longitude: 76.3150 },
    { id: "6", latitude: 32.2380, longitude: 76.3210 },
    { id: "7", latitude: 32.0998, longitude: 76.2691 },
    { id: "8", latitude: 32.1050, longitude: 76.2750 },
    { id: "9", latitude: 32.2330, longitude: 76.3300 },
    { id: "10", latitude: 32.2270, longitude: 76.3250 },
    { id: "11", latitude: 32.2205, longitude: 76.3190 },
    { id: "12", latitude: 32.2405, longitude: 76.3355 },
    { id: "13", latitude: 32.2426, longitude: 76.3207 }, // Dalai Lama Temple (Tsuglagkhang)
    { id: "14", latitude: 32.2448, longitude: 76.3310 }, // Bhagsu Temple
    { id: "15", latitude: 32.2465, longitude: 76.3365 }, // Bhagsu Waterfall (more precise)
    { id: "16", latitude: 32.2422, longitude: 76.3276 }, // McLeod Ganj Main Square
    { id: "17", latitude: 32.2335, longitude: 76.3290 }, // Naddi Sunset Point
    { id: "18", latitude: 32.2370, longitude: 76.3215 }, // Dal Lake Dharamshala (refined)
    { id: "19", latitude: 32.2190, longitude: 76.3234 }, // HPCA Cricket Stadium
    { id: "20", latitude: 32.2253, longitude: 76.3180 }, // Dharamshala War Memorial
    { id: "21", latitude: 32.2305, longitude: 76.3162 }, // Tea Gardens Dharamshala
    { id: "22", latitude: 32.2640, longitude: 76.3750 }, // Triund Trek Base Area
    { id: "23", latitude: 32.1006, longitude: 76.2697 }, // Kangra Fort (refined)
    { id: "24", latitude: 32.1145, longitude: 76.2835 }, // Masroor Rock Cut Temple
    { id: "25", latitude: 32.2282, longitude: 76.3195 }, // St. John in the Wilderness Church
    { id: "26", latitude: 32.2355, longitude: 76.3228 }, // Dharamkot Meditation Area
    { id: "27", latitude: 32.2388, longitude: 76.3272 }, // Tibetan Museum
    { id: "28", latitude: 32.2105, longitude: 76.3155 }, // Dharamshala Market
    { id: "29", latitude: 32.2468, longitude: 76.3322 }, // Shiva Cafe (popular spot)
    { id: "30", latitude: 32.2535, longitude: 76.3605 }, // Triund Hill Top
  ];

  // ONLY NEW CHANGE: added this state BELOW your MOCK_DRIVERS

  const [drivers, setDrivers] = useState(MOCK_DRIVERS);

  // 🚀 NEW: simulate driver movement
  useEffect(() => {
    if (!showDrivers) return;

    const interval = setInterval(() => {
      setDrivers((prevDrivers) =>
        prevDrivers.map((driver) => {
          const randomOffset = () => (Math.random() - 0.5) * 0.0007;

          return {
            ...driver,
            latitude: driver.latitude + randomOffset(),
            longitude: driver.longitude + randomOffset(),
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [showDrivers]);

  const handleMyLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000,
      );
    } else {
      alert("Fetching user location... Please ensure permissions are granted.");
    }
  };

  const handleShowDrivers = () => {
    setShowDrivers(true);
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: 32.22,
          longitude: 76.324,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        1000,
      );
    }
  };

  const handleFullMap = () => {
    setIsFullMap(!isFullMap);
    if (!isFullMap) {
      setShowDrivers(false);
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: 32.219,
            longitude: 76.3234,
            latitudeDelta: 0.2,
            longitudeDelta: 0.2,
          },
          1000,
        );
      }
    } else {
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: 32.219,
            longitude: 76.3234,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          1000,
        );
      }
    }
  };

  const handleBookRide = () => {
    if (!pickupLocation || !dropLocation) {
      alert("Please enter pickup and drop locations");
      return;
    }

    navigation.navigate("Searching", {
      booking: {
        pickupLocation,
        dropLocation,
        vehicleType,
      },
    });
  };

  return (
    <View style={styles.wrapper}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        mapType="standard" // ✅ FIXED (was "none")
        initialRegion={{
          latitude: 32.219,
          longitude: 76.3234,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        userInterfaceStyle="light"
      >
        <UrlTile
          urlTemplate="https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" // ✅ more reliable server
          maximumZ={19}
          zIndex={-1}
        />
        <Marker
          coordinate={{ latitude: 32.219, longitude: 76.3234 }}
          title="Default Location"
          description="Himachal Pradesh"
        />
        {showDrivers &&
          drivers.map((driver) => (
            <Marker
              key={driver.id}
              coordinate={{
                latitude: driver.latitude,
                longitude: driver.longitude,
              }}
              title={`Driver ${driver.id}`}
              pinColor="blue"
            />
          ))}
      </MapView>

      <View style={styles.mapControls} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleMyLocation}
        >
          <Text style={styles.controlButtonText}>📍 My Location</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleShowDrivers}
        >
          <Text style={styles.controlButtonText}>🚕 Drivers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleFullMap}>
          <Text style={styles.controlButtonText}>
            {isFullMap ? "Hide Map" : "Full Map"}
          </Text>
        </TouchableOpacity>
      </View>

      {!isFullMap && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
          pointerEvents="box-none"
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <Text style={styles.logo}>🚕 HimCabs</Text>
              <Text style={styles.tagline}>Book bikes & rides easily</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Pickup Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Dharamshala Bus Stand"
                  value={pickupLocation}
                  onChangeText={setPickupLocation}
                />

                <Text style={styles.label}>Drop Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. McLeod Ganj Main Square"
                  value={dropLocation}
                  onChangeText={setDropLocation}
                />
              </View>

              <Text style={styles.label}>Select Vehicle</Text>
              <View style={styles.vehicleContainer}>
                <TouchableOpacity
                  style={[
                    styles.vehicleButton,
                    vehicleType === "Bike" && styles.vehicleButtonSelected,
                  ]}
                  onPress={() => setVehicleType("Bike")}
                >
                  <Text
                    style={[
                      styles.vehicleText,
                      vehicleType === "Bike" && styles.vehicleTextSelected,
                    ]}
                  >
                    🏍️ Bike
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.vehicleButton,
                    vehicleType === "Auto" && styles.vehicleButtonSelected,
                  ]}
                  onPress={() => setVehicleType("Auto")}
                >
                  <Text
                    style={[
                      styles.vehicleText,
                      vehicleType === "Auto" && styles.vehicleTextSelected,
                    ]}
                  >
                    🛺 Auto
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.bookButton}
                onPress={handleBookRide}
              >
                <Text style={styles.bookButtonText}>Book a Ride</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1 },
  mapControls: {
    position: "absolute",
    top: 60,
    left: 10,
    right: 10,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  controlButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    alignItems: "center",
  },
  controlButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "flex-end",
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  inputContainer: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#F0F2F5",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E4E6EB",
  },
  vehicleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  vehicleButton: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  vehicleButtonSelected: {
    backgroundColor: "#E8F0FE",
    borderColor: "#000",
    borderWidth: 1,
  },
  vehicleText: { fontSize: 16, color: "#555" },
  vehicleTextSelected: { fontWeight: "700", color: "#000" },
  bookButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
