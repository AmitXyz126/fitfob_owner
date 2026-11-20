/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/array-type */
/* eslint-disable @typescript-eslint/no-require-imports */
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import { deviceTokenApi } from '@/api/deviceTokenApi';

// Optional expo-notifications import for channels, tokens, and foreground presentation
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.warn('⚠️ Could not load expo-notifications module:', error);
}

// Fallback EAS project ID from app.json
const FALLBACK_PROJECT_ID = 'e22deb02-0025-469d-9ea6-3ad7639ab080';

// In-memory cache of currently registered device token in this session
let lastRegisteredToken: string | null = null;

// Helper to determine if running in standard Expo Go app
export const isExpoGoClient = () => {
  return (
    isRunningInExpoGo() ||
    (Constants as any)?.appOwnership === 'expo' ||
    (Constants as any)?.executionEnvironment === 'storeClient'
  );
};

// Safe cache and getter for @react-native-firebase/messaging
let cachedMessaging: any = undefined;

export const getFirebaseMessaging = () => {
  if (cachedMessaging !== undefined) {
    return cachedMessaging;
  }

  // 1. In Expo Go or Web, native Firebase TurboModules are never available
  if (Platform.OS === 'web' || isExpoGoClient()) {
    cachedMessaging = null;
    return null;
  }

  // 2. Safe check if native TurboModules/NativeModules are actually registered in this binary
  try {
    const { TurboModuleRegistry, NativeModules } = require('react-native');
    const hasAppModule =
      (TurboModuleRegistry?.get && TurboModuleRegistry.get('RNFBAppModule')) ||
      NativeModules?.RNFBAppModule;
    const hasMessagingModule =
      (TurboModuleRegistry?.get && TurboModuleRegistry.get('RNFBMessagingModule')) ||
      NativeModules?.RNFBMessagingModule;

    if (!hasAppModule || !hasMessagingModule) {
      // console.log( 'ℹ️ [Firebase FCM] Native modules not registered in this binary. Using Expo Notifications.');
      cachedMessaging = null;
      return null;
    }
  } catch (checkErr) {
    console.warn('ℹ️ [Firebase FCM] Native module registry check failed:', checkErr);
    cachedMessaging = null;
    return null;
  }

  // 3. Try requiring and calling messaging() safely inside try/catch
  try {
    const messagingModule = require('@react-native-firebase/messaging');
    const messaging = messagingModule?.default || messagingModule;
    if (typeof messaging === 'function') {
      const testInstance = messaging();
      if (testInstance) {
        cachedMessaging = messaging;
        return messaging;
      }
    }
    cachedMessaging = null;
    return null;
  } catch (err: any) {
    console.warn(
      'ℹ️ [Firebase FCM] Firebase Messaging initialization skipped:',
      err?.message || err
    );
    cachedMessaging = null;
    return null;
  }
};

// Configure notification behavior when app is in foreground
try {
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (handlerError) {
  console.warn('⚠️ Failed to set notification handler:', handlerError);
}

/**
 * Configure Android Notification Channels
 * Android 8.0+ (API 26+) requires a channel for ANY notification to display.
 */
export async function setupNotificationChannelsAsync() {
  if (Platform.OS !== 'android' || !Notifications) return;

  // In Expo Go on Android (SDK 53+), ExpoNotificationChannelManager has no provider
  if (isExpoGoClient()) {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E23744',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('high_importance', {
      name: 'High Importance',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E23744',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      sound: 'default',
    });

    // console.log('🔔 Android notification channels ("default", "high_importance") ready');
  } catch (channelError: any) {
    console.warn(
      '⚠️ Failed to set Android notification channel:',
      channelError?.message || channelError
    );
  }
}

// Ensure channel is registered on module load for Android (in Dev Build / Standalone)
if (Platform.OS === 'android' && !isExpoGoClient()) {
  setupNotificationChannelsAsync().catch(() => {});
}

// Register background message handler for native Firebase (outside React tree)
try {
  const messaging = getFirebaseMessaging();
  if (messaging) {
    try {
      const instance = messaging();
      if (instance && typeof instance.setBackgroundMessageHandler === 'function') {
        instance.setBackgroundMessageHandler(async (remoteMessage: any) => {
          // console.log('📩 [Firebase FCM] Background Message handled:', remoteMessage);
        });
      }
    } catch (bgError) {
      console.warn('ℹ️ Firebase setBackgroundMessageHandler skipped:', bgError);
    }
  }
} catch {
  // Ignored in unsupported environments
}

/**
 * Request notification permissions from device
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    // 1. Try Firebase requestPermission if native module is present
    try {
      const messaging = getFirebaseMessaging();
      if (messaging) {
        const instance = messaging();
        if (instance && typeof instance.requestPermission === 'function') {
          const authStatus = await instance.requestPermission();
          const isAuthorized =
            authStatus === 1 || // AuthorizationStatus.AUTHORIZED
            authStatus === 2 || // AuthorizationStatus.PROVISIONAL
            authStatus === true;

          if (isAuthorized) {
            if (
              Platform.OS === 'ios' &&
              typeof instance.registerDeviceForRemoteMessages === 'function'
            ) {
              await instance.registerDeviceForRemoteMessages();
            }
            return true;
          }
        }
      }
    } catch (fbErr) {
      console.warn('ℹ️ Firebase permission request skipped/failed:', fbErr);
    }

    // 2. Fallback to expo-notifications permissions request
    if (Notifications) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    }

    return false;
  } catch (error) {
    console.warn('⚠️ Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Registers device for push notifications.
 *
 * NOTE: The FitFob backend explicitly requires tokens in the format:
 * `token.startsWith("ExpoPushToken[") || token.startsWith("ExponentPushToken[")`
 * to deliver push notifications via the Expo Push API (exp.host/--/api/v2/push/send).
 *
 * Therefore, we prioritize `getExpoPushTokenAsync()` first so it matches the backend's
 * delivery criteria, with fallback to FCM and device tokens.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  try {
    // Remote push notifications were removed from Expo Go on Android in SDK 53+.
    if (isExpoGoClient() && Platform.OS === 'android') {
      // console.log( 'ℹ️ Android push notifications require a Development Build (npx expo run:android) or Standalone Build. Push tokens are unavailable in Expo Go.');
      return undefined;
    }

    // Always ensure Android channel exists in dev build / standalone
    if (Platform.OS === 'android') {
      await setupNotificationChannelsAsync();
    }

    // Ensure permissions are granted
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('⚠️ Push notification permissions not granted on this device.');
      return undefined;
    }

    let token: string | undefined;

    // 1. Fetch Expo Push Token (Required by FitFob backend)
    if (Notifications?.getExpoPushTokenAsync) {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId ??
        (Constants as any)?.manifest?.extra?.eas?.projectId ??
        (Constants as any)?.manifest2?.extra?.eas?.projectId ??
        FALLBACK_PROJECT_ID;

      try {
        const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        if (pushTokenData?.data) {
          token = pushTokenData.data;
          // console.log('✅ [Push Notification] Retrieved Expo Push Token:', token);
          return token;
        }
      } catch (expoPushError: any) {
        console.warn(
          '⚠️ getExpoPushTokenAsync failed, checking native fallback:',
          expoPushError?.message || expoPushError
        );
      }
    }

    // 2. Fallback: Firebase Cloud Messaging (FCM) native token
    try {
      const messaging = getFirebaseMessaging();
      if (messaging) {
        const instance = messaging();
        if (instance && typeof instance.getToken === 'function') {
          const fcmToken = await instance.getToken();
          if (fcmToken) {
            // console.log('🔥 [Firebase FCM] Retrieved native FCM token:', fcmToken);
            return fcmToken;
          }
        }
      }
    } catch (firebaseErr: any) {
      console.warn('⚠️ Firebase FCM getToken failed:', firebaseErr?.message || firebaseErr);
    }

    // 3. Fallback: Native Device Push Token via expo-notifications
    if (Notifications?.getDevicePushTokenAsync) {
      try {
        const deviceTokenData = await Notifications.getDevicePushTokenAsync();
        if (deviceTokenData?.data) {
          token = deviceTokenData.data;
          // console.log('✅ [Push Notification] Retrieved Native Device Token:', token);
          return token;
        }
      } catch (deviceError: any) {
        console.warn('⚠️ getDevicePushTokenAsync also failed:', deviceError?.message || deviceError);
      }
    }

    return token;
  } catch (err) {
    console.warn('⚠️ Push notification registration skipped or failed:', err);
    return undefined;
  }
}

/**
 * Register device push token with the FitFob backend
 * POST /api/device-tokens/register
 */
export async function registerDeviceTokenWithBackend(
  deviceToken?: string,
  force: boolean = false
): Promise<any> {
  try {
    const token = deviceToken || (await registerForPushNotificationsAsync());

    if (!token) {
      if (!isExpoGoClient() || Platform.OS !== 'android') {
        console.warn('⚠️ No device push token available to register with backend');
      }
      return;
    }

    // Skip redundant network hit if this exact token is already registered in this session
    if (!force && lastRegisteredToken === token) {
      // console.log('ℹ️ Device token already registered with backend in current session');
      return { success: true, message: 'Already registered' };
    }

    // console.log('📡 Registering device token with backend:', { token, platform: Platform.OS });
    const result = await deviceTokenApi.registerDeviceToken(token, Platform.OS);
    lastRegisteredToken = token;
    // console.log('✅ Device token successfully registered with backend:', result);
    return result;
  } catch (error: any) {
    console.error(
      '❌ Failed to register device token with backend:',
      error?.response?.data || error.message
    );
  }
}

/**
 * Unregister device push token from backend upon user logout
 * POST /api/device-tokens/unregister
 */
export async function unregisterDeviceTokenWithBackend(deviceToken?: string): Promise<any> {
  try {
    const token = deviceToken || lastRegisteredToken || (await registerForPushNotificationsAsync());

    if (token) {
      // console.log('📡 Unregistering device token from backend:', { token });
      const result = await deviceTokenApi.unregisterDeviceToken(token);
      lastRegisteredToken = null;
      // console.log('✅ Device token successfully unregistered from backend:', result);
      return result;
    }
  } catch (error: any) {
    console.error(
      '❌ Failed to unregister device token with backend:',
      error?.response?.data || error.message
    );
  }
}

/**
 * Returns the currently registered token in memory
 */
export function getRegisteredDeviceToken(): string | null {
  return lastRegisteredToken;
}

/**
 * Helper to display an immediate local notification (useful for in-app alerts and testing)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data: Record<string, any> = {},
  imageUrl?: string
) {
  try {
    if (!Notifications) return;
    await setupNotificationChannelsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        color: '#E23744',
        ...(imageUrl
          ? {
              attachments: [
                {
                  identifier: 'fitfob-image',
                  url: imageUrl,
                  type: 'image',
                },
              ],
            }
          : {}),
      },
      trigger: null, // show immediately
    });
  } catch (error) {
    console.warn('⚠️ Failed to display local notification:', error);
  }
}

/**
 * Unified notification listener setup.
 * Subscribes to:
 * 1. Foreground notifications (Expo & Firebase)
 * 2. Notification tap/interaction events (Expo & Firebase)
 * 3. Token refresh events (auto re-registers with backend)
 *
 * Returns a cleanup function that unsubscribes all listeners.
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationOpened?: (response: any) => void
): () => void {
  const unsubscribers: Array<() => void> = [];

  // 1. Expo Notifications - Foreground listener
  if (Notifications?.addNotificationReceivedListener) {
    try {
      const sub = Notifications.addNotificationReceivedListener((notification) => {
        // console.log('🔔 [Expo Notification] Foreground received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      });
      unsubscribers.push(() => sub.remove());
    } catch (err) {
      console.warn('⚠️ Failed to add Expo notification received listener:', err);
    }
  }

  // 2. Expo Notifications - Notification tap/response listener
  if (Notifications?.addNotificationResponseReceivedListener) {
    try {
      const sub = Notifications.addNotificationResponseReceivedListener((response) => {
        // console.log('📲 [Expo Notification] User tapped notification:', response);
        if (onNotificationOpened) {
          onNotificationOpened(response);
        }
      });
      unsubscribers.push(() => sub.remove());
    } catch (err) {
      console.warn('⚠️ Failed to add Expo notification response listener:', err);
    }
  }

  // 3. Firebase Cloud Messaging Listeners (if native Firebase is linked)
  try {
    const messaging = getFirebaseMessaging();
    if (messaging) {
      const messagingInstance = messaging();
      if (messagingInstance) {
        // FCM foreground message handler
        if (typeof messagingInstance.onMessage === 'function') {
          try {
            const unsubMessage = messagingInstance.onMessage(async (remoteMessage: any) => {
              // console.log('🔔 [Firebase FCM] Foreground notification received:', remoteMessage);

              // Present local heads-up notification if notification payload is present
              if (remoteMessage?.notification) {
                const imageUrl =
                  remoteMessage.notification.imageUrl ||
                  (remoteMessage.notification as any).android?.imageUrl ||
                  remoteMessage.data?.imageUrl ||
                  remoteMessage.data?.image;

                await sendLocalNotification(
                  remoteMessage.notification.title || 'FitFob Club',
                  remoteMessage.notification.body || '',
                  remoteMessage.data || {},
                  typeof imageUrl === 'string' ? imageUrl : undefined
                );
              }

              if (onNotificationReceived) {
                onNotificationReceived(remoteMessage);
              }
            });
            unsubscribers.push(unsubMessage);
          } catch (err) {
            console.warn('⚠️ Error subscribing to FCM onMessage:', err);
          }
        }

        // FCM Token refresh listener: re-register automatically
        if (typeof messagingInstance.onTokenRefresh === 'function') {
          try {
            const unsubRefresh = messagingInstance.onTokenRefresh(async (newToken: string) => {
              // console.log('🔄 [Firebase FCM] Device token refreshed:', newToken);
              await registerDeviceTokenWithBackend(newToken, true);
            });
            unsubscribers.push(unsubRefresh);
          } catch (err) {
            console.warn('⚠️ Error subscribing to FCM onTokenRefresh:', err);
          }
        }

        // FCM Notification opened app from background
        if (typeof messagingInstance.onNotificationOpenedApp === 'function') {
          try {
            const unsubOpen = messagingInstance.onNotificationOpenedApp((remoteMessage: any) => {
              // console.log('📲 [Firebase FCM] Notification opened app from background:', remoteMessage);
              if (onNotificationOpened) {
                onNotificationOpened(remoteMessage);
              }
            });
            unsubscribers.push(unsubOpen);
          } catch (err) {
            console.warn('⚠️ Error subscribing to FCM onNotificationOpenedApp:', err);
          }
        }

        // FCM Notification opened app from quit/cold state
        if (typeof messagingInstance.getInitialNotification === 'function') {
          try {
            messagingInstance
              .getInitialNotification()
              .then((remoteMessage: any) => {
                if (remoteMessage) {
                  // console.log( '📲 [Firebase FCM] Notification opened app from quit state:', remoteMessage );
                  if (onNotificationOpened) {
                    onNotificationOpened(remoteMessage);
                  }
                }
              })
              .catch(() => {});
          } catch (err) {
            console.warn('⚠️ Error calling FCM getInitialNotification:', err);
          }
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not setup Firebase notification listeners:', error);
  }

  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {}
    });
  };
}

// Backward compatibility alias
export const setupFirebaseNotificationListeners = setupNotificationListeners;
