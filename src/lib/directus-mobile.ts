import { createDirectus, rest } from '@directus/sdk';
import { Capacitor } from '@capacitor/core';

const getBaseUrl = () => {
  if (Capacitor.getPlatform() === 'web') {
    return 'http://localhost:8055'; // Development
  }
  return 'https://your-directus-server.com'; // Production - replace with actual production URL
};

export const directus = createDirectus(getBaseUrl()).with(rest());