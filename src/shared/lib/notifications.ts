import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const PREF_KEY = 'notifications_enabled';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function areNotificationsEnabled(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(PREF_KEY);
  return stored === 'true';
}

export async function requestAndEnable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  const granted = finalStatus === 'granted';
  await AsyncStorage.setItem(PREF_KEY, granted ? 'true' : 'false');
  return granted;
}

export async function disableNotifications(): Promise<void> {
  await AsyncStorage.setItem(PREF_KEY, 'false');
}

export async function notifyLowStock(items: { name: string; quantity: number }[]): Promise<void> {
  const enabled = await areNotificationsEnabled();
  if (!enabled || items.length === 0) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  if (items.length === 1) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Low stock',
        body: `${items[0].name} is running low (${items[0].quantity} left).`,
      },
      trigger: null,
    });
  } else {
    const names = items.map((i) => i.name).join(', ');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Low stock — ${items.length} items`,
        body: names,
      },
      trigger: null,
    });
  }
}
