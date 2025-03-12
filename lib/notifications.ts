import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'web') {
    // Web platform doesn't support push notifications
    return null;
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('safety-check', {
      name: 'Safety Check',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
    });
  }

  return token;
}

export async function scheduleSafetyCheck() {
  // Cancel any existing notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule a repeating notification every 3 minutes
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Safety Check",
      body: "Are you safe?",
      data: { type: 'safety-check' },
      categoryIdentifier: 'safety-check',
    },
    trigger: {
      seconds: 180, // 3 minutes
      repeats: true,
    },
  });

  // Set up notification categories with actions
  await Notifications.setNotificationCategoryAsync('safety-check', [
    {
      identifier: 'YES',
      buttonTitle: 'Yes, I\'m safe',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'NO',
      buttonTitle: 'No, I need help',
      options: {
        isDestructive: true,
        isAuthenticationRequired: false,
      },
    },
  ]);
}

export async function stopSafetyCheck() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}