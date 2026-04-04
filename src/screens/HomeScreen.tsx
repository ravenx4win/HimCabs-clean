import React, { useState, useEffect } from "react";
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

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [vehicleType, setVehicleType] = useState("Bike");

  // ✅ Request location permission (important for user location)
  useEffect(() => {
    (async () => {
      await Location.requestForegroundPermissionsAsync();
    })();
  }, []);

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
        style={StyleSheet.absoluteFillObject}
        mapType="standard" // ✅ FIXED (was "none")
        initialRegion={{
          latitude: 32.219,
          longitude: 76.3234,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
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
      </MapView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1 },
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
