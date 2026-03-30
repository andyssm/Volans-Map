import 'react-native-reanimated'; // must be first
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ImageBackground,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

export default function LocationInputScreen() {
  const router = useRouter();
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,   // ✅ Choose Low or Balanced
      maximumAge: 50,                  // Accept recent location if fast
      timeout: 30,                     // Fail fast if slow
    });

    setLatitude(location.coords.latitude.toString());
    setLongitude(location.coords.longitude.toString());
  } catch (error) {
    Alert.alert('Error', 'Could not get location in time. Try again.');
  }
};


  const handleStart = () => {
    if (!latitude || !longitude) {
      Alert.alert('Missing Data', 'Please enter or get your coordinates.');
      return;
    }

    router.push('/app');
  };

  return (
    <ImageBackground
      source={require('../assets/images/photorealistic-earth-planet.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.wrapper}>
        <Text style={styles.title}>Enter Initial Coordinates</Text>

        <TextInput
          style={styles.input}
          placeholder="Latitude"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={latitude}
          onChangeText={setLatitude}
        />

        <TextInput
          style={styles.input}
          placeholder="Longitude"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={longitude}
          onChangeText={setLongitude}
        />

        <TouchableOpacity style={styles.gpsButton} onPress={getCurrentLocation}>
          <Text style={styles.buttonText}>📍 Use Current Location</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Start Navigation</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: screenWidth * 0.85,
    padding: 25,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    color: '#fff',
  },
  gpsButton: {
    backgroundColor: '#555',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#00b894',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginTop: 25,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
