import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { RootStackParamList } from "../navigation/AppNavigator";

type SearchingRouteProp = RouteProp<RootStackParamList, "Searching">;

type SearchingNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Searching"
>;

export default function SearchingScreen() {
  const navigation = useNavigation<SearchingNavigationProp>();
  const route = useRoute<SearchingRouteProp>();

  const { booking } = route.params || {};
  const { pickupLocation, dropLocation, vehicleType } = booking || {};

  useEffect(() => {
    if (!booking) return;

    const timer = setTimeout(() => {
      const mockDriver = {
        name: "Rajesh Kumar",
        vehicleNumber: "HP 01 A 1234",
        rating: 4.8,
        phone: "+91 98765 43210",
      };

      navigation.replace("RideTracking", {
        booking,
        driver: mockDriver,
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [booking, navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000" />
      <Text style={styles.title}>Connecting to Drivers...</Text>
      <Text style={styles.subtitle}>
        Searching for <Text style={styles.bold}>{vehicleType}</Text> near{" "}
        <Text style={styles.bold}>{pickupLocation}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  bold: { fontWeight: "700", color: "#000" },
});