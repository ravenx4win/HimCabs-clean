import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import SearchingScreen from "../screens/SearchingScreen";
import RideTrackingScreen from "../screens/RideTrackingScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
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
