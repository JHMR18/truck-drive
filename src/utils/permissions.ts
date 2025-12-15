import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';

export const requestPermissions = async () => {
  try {
    console.log('Requesting location permissions...');
    // Request location permission
    const locationResult = await Geolocation.requestPermissions();
    console.log('Location permission result:', locationResult);

    console.log('Requesting camera permissions...');
    // Request camera permission
    const cameraResult = await Camera.requestPermissions();
    console.log('Camera permission result:', cameraResult);

    console.log('Requesting push notification permissions...');
    // Request push notification permission
    const notificationResult = await PushNotifications.requestPermissions();
    console.log('Push notification permission result:', notificationResult);

    return true;
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
};