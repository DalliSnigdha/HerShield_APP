import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Settings2, MapPin, Users, Navigation, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { supabase } from '@/lib/supabase';
import { getTrustedContacts } from './trusted';

const FEATURE_BUTTONS = [
  {
    id: 'location',
    title: 'Location Sharing',
    icon: MapPin,
    route: '/location',
  },
  {
    id: 'trusted',
    title: 'Trusted Contact',
    icon: Users,
    route: '/trusted',
  },
  {
    id: 'community',
    title: 'Community',
    icon: Users,
    onPress: () => Linking.openURL('https://nas.io/hersheild/feed'),
  },
  {
    id: 'locate',
    title: 'Locate Me',
    icon: Navigation,
    onPress: () => Linking.openURL('https://graceful-blini-49da63.netlify.app/'),
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [isSOSPressed, setIsSOSPressed] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    getUserProfile();
    getLocation();
  }, []);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for SOS functionality');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const getUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      } else if (user?.email) {
        setUserName(user.email.split('@')[0]);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleSOSPress = async () => {
    setIsSOSPressed(true);
    
    try {
      // Get trusted contacts
      const trustedContacts = await getTrustedContacts();
      
      if (trustedContacts.length === 0) {
        Alert.alert('No trusted contacts', 'Please add trusted contacts in the Trusted Contacts section');
        return;
      }

      // Prepare message with location
      let message = "Your Beloved Woman is under trouble please contact her or try reaching nearest PS";
      
      if (currentLocation) {
        const mapsUrl = `https://www.google.com/maps?q=${currentLocation.coords.latitude},${currentLocation.coords.longitude}`;
        message += `\n\nLast known location: ${mapsUrl}`;
      }

      // Check if SMS is available
      const isAvailable = await SMS.isAvailableAsync();
      
      if (isAvailable) {
        // Send SMS to all trusted contacts
        await SMS.sendSMSAsync(
          trustedContacts.map(contact => contact.phone),
          message
        );
      } else {
        // Fallback for web or when SMS is not available
        Alert.alert(
          'SMS not available',
          'Emergency services have been notified. Please try calling emergency services directly.'
        );
      }

      // Try to make emergency call
      const emergencyNumber = '100';
      const phoneUrl = `tel:${emergencyNumber}`;
      
      const canCall = await Linking.canOpenURL(phoneUrl);
      if (canCall) {
        await Linking.openURL(phoneUrl);
      }
    } catch (error) {
      console.error('Error in SOS:', error);
      Alert.alert('Error', 'Failed to send emergency messages. Please try calling emergency services directly.');
    } finally {
      setTimeout(() => setIsSOSPressed(false), 2000);
    }
  };

  const handleButtonPress = (button) => {
    if (button.onPress) {
      button.onPress();
    } else if (button.route) {
      router.push(button.route);
    }
  };

  return (
    <LinearGradient
      colors={['#8B1A1A', '#FFB6C1']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey, {userName}</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Settings2 color="white" size={24} />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.subtitle}>Fearless, connected, protected</Text>
      <Text style={styles.tagline}>
        Stay connected,{'\n'}
        stay <Text style={styles.taglineHighlight}>protected</Text>.
      </Text>

      <View style={styles.grid}>
        {FEATURE_BUTTONS.map((button) => (
          <TouchableOpacity
            key={button.id}
            style={styles.button}
            onPress={() => handleButtonPress(button)}
          >
            <View style={styles.buttonContent}>
              <button.icon color="#333" size={24} />
              <Text style={styles.buttonText}>{button.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.sosButton, isSOSPressed && styles.sosButtonPressed]}
        onPress={handleSOSPress}
      >
        <View style={styles.sosInner}>
          <AlertTriangle color="white" size={32} />
          <Text style={styles.sosText}>SOS</Text>
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  tagline: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 40,
    lineHeight: 42,
  },
  taglineHighlight: {
    fontStyle: 'italic',
    color: '#1E1E1E',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  button: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  sosButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sosButtonPressed: {
    backgroundColor: '#CC0000',
    transform: [{ scale: 0.95 }],
  },
  sosInner: {
    alignItems: 'center',
  },
  sosText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
});