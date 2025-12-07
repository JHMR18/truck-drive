import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';

export const requestPermissions = async () => {
  try {
    // Request location permission
    await Geolocation.requestPermissions();

    // Request camera permission
    await Camera.requestPermissions();

    // Request push notification permission
    await PushNotifications.requestPermissions();

    return true;
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
};