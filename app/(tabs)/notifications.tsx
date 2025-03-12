import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Switch, Platform } from 'react-native';
import { Bell, MapPin, Users, MessageSquare, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, scheduleSafetyCheck, stopSafetyCheck } from '@/lib/notifications';

const NOTIFICATIONS = [
  {
    id: '1',
    type: 'location',
    title: 'Location shared',
    message: 'Your location was shared with trusted contacts',
    time: '2 min ago',
    icon: MapPin,
  },
  {
    id: '2',
    type: 'contact',
    title: 'New trusted contact',
    message: 'John Doe was added to your trusted contacts',
    time: '1 hour ago',
    icon: Users,
  },
  {
    id: '3',
    type: 'chat',
    title: 'Emergency chat',
    message: 'New message in emergency chat',
    time: '2 hours ago',
    icon: MessageSquare,
  },
];

export default function NotificationsScreen() {
  const [isSafetyCheckEnabled, setIsSafetyCheckEnabled] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  useEffect(() => {
    setupNotifications();

    // Set up notification response handler
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const actionId = response.actionIdentifier;
      if (actionId === 'YES') {
        console.log('User is safe');
        // You can add additional logic here for when user confirms they're safe
      } else if (actionId === 'NO') {
        console.log('User needs help');
        // Implement emergency response logic here
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const setupNotifications = async () => {
    if (Platform.OS === 'web') {
      setNotificationStatus('Notifications are not supported on web');
      return;
    }

    const token = await registerForPushNotificationsAsync();
    if (!token) {
      setNotificationStatus('Permission not granted for notifications');
    }
  };

  const toggleSafetyCheck = async (value: boolean) => {
    setIsSafetyCheckEnabled(value);
    if (value) {
      await scheduleSafetyCheck();
    } else {
      await stopSafetyCheck();
    }
  };

  const renderNotification = ({ item }) => {
    const Icon = item.icon;
    return (
      <View style={styles.notificationItem}>
        <View style={styles.iconContainer}>
          <Icon size={24} color="#FF6B6B" />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Bell size={24} color="#333" />
      </View>

      {notificationStatus && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{notificationStatus}</Text>
        </View>
      )}

      <View style={styles.safetyCheckContainer}>
        <View style={styles.safetyCheckHeader}>
          <AlertTriangle size={24} color="#FF6B6B" />
          <Text style={styles.safetyCheckTitle}>Safety Check</Text>
        </View>
        <Text style={styles.safetyCheckDescription}>
          Receive periodic safety check notifications every 3 minutes
        </Text>
        <View style={styles.switchContainer}>
          <Switch
            value={isSafetyCheckEnabled}
            onValueChange={toggleSafetyCheck}
            trackColor={{ false: '#767577', true: '#FF6B6B' }}
            thumbColor={isSafetyCheckEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>

      <FlatList
        data={NOTIFICATIONS}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  statusText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  safetyCheckContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  safetyCheckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  safetyCheckTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  safetyCheckDescription: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
  },
  switchContainer: {
    alignItems: 'flex-end',
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
});