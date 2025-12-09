import { createDirectus, rest, authentication } from '@directus/sdk';
import { Capacitor } from '@capacitor/core';
import { DirectusSchema } from './directus';
import { logApiCall, logApiResponse, logApiError } from './apiLogger';

const getBaseUrl = () => {
  // Always use the configured Directus URL
  const baseUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://192.168.101.84:8055';

  // Log the platform and URL being used
  console.log(`[Directus] Platform: ${Capacitor.getPlatform()}, Base URL: ${baseUrl}`);
  console.log(`[Directus] Environment VITE_DIRECTUS_URL: ${import.meta.env.VITE_DIRECTUS_URL}`);

  return baseUrl;
};

// Create a custom fetch that adds the Authorization header and logs details
const customFetch = async (url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('directus_access_token');
  const urlStr = url.toString();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Add additional headers for mobile
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  // Log the request
  logApiCall(options.method || 'GET', urlStr, options.body);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'omit',
    });

    // Log response details
    const responseClone = response.clone();
    let responseData;
    try {
      responseData = await responseClone.json();
    } catch (e) {
      responseData = await responseClone.text();
    }

    logApiResponse(response, responseData);

    return response;
  } catch (error) {
    logApiError(error, urlStr);
    throw error;
  }
};

export const directus = createDirectus<DirectusSchema>(getBaseUrl(), {
  globals: {
    fetch: customFetch,
  },
}).with(rest()).with(authentication());