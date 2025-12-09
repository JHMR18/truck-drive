import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const NetworkTest = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  const testConnectivity = async () => {
    setIsLoading(true);
    setTestResults([]);

    addResult(`Platform: ${Capacitor.getPlatform()}`);
    addResult(`User Agent: ${navigator.userAgent}`);

    // Test URLs - Get the actual configured Directus URL
    const directusUrl = Capacitor.getPlatform() === 'android'
      ? 'http://192.168.101.84:8055'  // Use the actual IP configured
      : (import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055');

    const urls = [
      directusUrl,
      'http://10.0.2.2:8055',
      'http://localhost:8055',
      'https://httpbin.org/get' // Public test endpoint
    ];

    for (const url of urls) {
      addResult(`\nTesting: ${url}`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          mode: 'cors'
        });

        clearTimeout(timeoutId);

        addResult(`✓ Success: ${response.status} ${response.statusText}`);

        if (url.includes('httpbin')) {
          const data = await response.json();
          addResult(`  Origin: ${data.origin}`);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          addResult(`✗ Timeout after 5 seconds`);
        } else {
          addResult(`✗ Error: ${error.message}`);
        }
      }
    }

    // Test environment variables
    addResult('\nEnvironment Variables:');
    addResult(`VITE_DIRECTUS_URL: ${import.meta.env.VITE_DIRECTUS_URL || 'NOT SET'}`);
    addResult(`VITE_DIRECTUS_MOBILE_URL: ${import.meta.env.VITE_DIRECTUS_MOBILE_URL || 'NOT SET'}`);

    setIsLoading(false);
  };

  return (
    <div style={{ padding: '20px', margin: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h3>Network Connectivity Test</h3>
      <button
        onClick={testConnectivity}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          backgroundColor: isLoading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? 'Testing...' : 'Test Network'}
      </button>

      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '4px',
        maxHeight: '400px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px',
        whiteSpace: 'pre-wrap'
      }}>
        {testResults.length > 0 ? testResults.join('\n') : 'Click "Test Network" to start testing...'}
      </div>
    </div>
  );
};