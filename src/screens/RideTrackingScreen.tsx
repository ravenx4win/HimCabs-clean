import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function RideTrackingScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const { booking, driver } = route.params || {};
  const { pickupLocation, dropLocation, vehicleType } = booking || {};
  const safeDriver = driver || {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ride in Progress</Text>
        <Text style={styles.eta}>ETA: 5 mins</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Driver Details</Text>
        <Text style={styles.driverName}>{safeDriver.name}</Text>
        <Text style={styles.vehicleInfo}>
          {vehicleType} • {safeDriver.vehicleNumber}
        </Text>
        <Text style={styles.rating}>⭐ {safeDriver.rating}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Trip Route</Text>

        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>{pickupLocation}</Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Drop</Text>
        <Text style={styles.value}>{dropLocation}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          })
        }
      >
        <Text style={styles.buttonText}>Cancel Ride</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F0F2F5",
    padding: 20,
    paddingTop: 60,
  },
  header: { alignItems: "center", marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "bold" },
  eta: { marginTop: 5, color: "#008000", fontWeight: "600" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
    fontWeight: "600",
  },
  driverName: { fontSize: 20, fontWeight: "bold" },
  vehicleInfo: { marginTop: 4, color: "#555" },
  rating: { marginTop: 8 },
  label: { fontSize: 12, color: "#888" },
  value: { fontSize: 16, fontWeight: "500", marginBottom: 10 },
  divider: { height: 1, backgroundColor: "#EEE", marginVertical: 12 },
  button: {
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
