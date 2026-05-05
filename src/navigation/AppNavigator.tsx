import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import SearchingScreen from "../screens/SearchingScreen";
import RideTrackingScreen from "../screens/RideTrackingScreen";

/**
 * Define the navigation routes and their params.
 * This does NOT change functionality — it only adds type safety.
 */
export type RootStackParamList = {
  Home: undefined;
  Searching: {
    booking: {
      pickupLocation: string;
      dropLocation: string;
      vehicleType: string;
    };
  };
  RideTracking: {
    booking: {
      pickupLocation: string;
      dropLocation: string;
      vehicleType: string;
    };
    driver?: any;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator

        id="root-stack"
        initialRouteName="Home"

        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Searching" component={SearchingScreen} />
        <Stack.Screen name="RideTracking" component={RideTrackingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}