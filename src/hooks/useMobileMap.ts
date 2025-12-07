import { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';

export const useMobileMap = () => {
  const [currentPosition, setCurrentPosition] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const getCurrentPosition = async () => {
      try {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });

        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getCurrentPosition();
  }, []);

  return { currentPosition };
};