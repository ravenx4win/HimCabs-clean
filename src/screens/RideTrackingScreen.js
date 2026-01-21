import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RideTrackingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛵 Ride in Progress</Text>
      <Text style={styles.subtitle}>Driver is on the way</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 8,
    color: '#555',
  },
});
