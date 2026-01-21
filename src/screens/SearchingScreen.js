import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function SearchingScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#000" />
      <Text style={styles.text}>Searching for nearby driver...</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("RideTracking")}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: "#444",
  },
  button: {
    marginTop: 40,
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
