import React, { useState } from "react";
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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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

        <TouchableOpacity style={styles.bookButton} onPress={handleBookRide}>
          <Text style={styles.bookButtonText}>Book a Ride</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
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