import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { MapPin, MessageCircle, Navigation } from 'lucide-react-native';
import * as Location from 'expo-location';

export default function LocationSharing() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    if (isTracking) {
      startLocationTracking().then((subscription) => {
        locationSubscription = subscription;
      });
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isTracking]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return false;
    }
    return true;
  };

  const startLocationTracking = async () => {
    try {
      // Request permissions first
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return null;

      // Configure location tracking
      await Location.setGoogleApiKey('YOUR_GOOGLE_MAPS_API_KEY'); // Optional: For better location accuracy
      await Location.enableNetworkProviderAsync();

      // Start watching position
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 5, // Update every 5 meters
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );

      return subscription;
    } catch (error) {
      setErrorMsg('Error tracking location');
      return null;
    }
  };

  const generateLocationMessage = () => {
    if (!location) return '';
    
    const googleMapsUrl = `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`;
    return `I'm sharing my live location for safety: ${googleMapsUrl}\n\nSpeed: ${location.coords.speed ? Math.round(location.coords.speed * 3.6) + ' km/h' : 'N/A'}\nAltitude: ${location.coords.altitude ? Math.round(location.coords.altitude) + ' m' : 'N/A'}\nAccuracy: ${Math.round(location.coords.accuracy)} m`;
  };

  const shareViaWhatsApp = async () => {
    if (!location) {
      setErrorMsg('Location not available');
      return;
    }

    const message = generateLocationMessage();
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        setErrorMsg('WhatsApp is not installed');
      }
    } catch (error) {
      setErrorMsg('Could not open WhatsApp');
    }
  };

  const shareViaSMS = async () => {
    if (!location) {
      setErrorMsg('Location not available');
      return;
    }

    const message = generateLocationMessage();
    const smsUrl = Platform.select({
      ios: `sms:&body=${encodeURIComponent(message)}`,
      android: `sms:?body=${encodeURIComponent(message)}`,
      default: `sms:?body=${encodeURIComponent(message)}`
    });

    try {
      await Linking.openURL(smsUrl);
    } catch (error) {
      setErrorMsg('Could not open SMS');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Navigation size={32} color="#FF6B6B" />
        <Text style={styles.title}>Live Location Sharing</Text>
      </View>

      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : null}

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.trackingButton, isTracking && styles.trackingActiveButton]}
          onPress={() => setIsTracking(!isTracking)}>
          <MapPin size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>

        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              Latitude: {location.coords.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {location.coords.longitude.toFixed(6)}
            </Text>
            {location.coords.speed && (
              <Text style={styles.locationText}>
                Speed: {(location.coords.speed * 3.6).toFixed(1)} km/h
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.shareButton, styles.whatsappButton, !isTracking && styles.buttonDisabled]}
          onPress={shareViaWhatsApp}
          disabled={!isTracking}>
          <Text style={styles.buttonText}>Share via WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareButton, styles.smsButton, !isTracking && styles.buttonDisabled]}
          onPress={shareViaSMS}
          disabled={!isTracking}>
          <MessageCircle size={24} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Share via SMS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#4CAF50',
  },
  trackingActiveButton: {
    backgroundColor: '#f44336',
  },
  locationInfo: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  smsButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
});