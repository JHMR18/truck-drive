# Android Build Guide - Truck Drive Management App

This guide provides step-by-step instructions for building the React app, syncing with Capacitor, and running it on an Android emulator.

## Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
2. **npm** (comes with Node.js)
3. **Android Studio** (latest version)
4. **Java JDK** (v17 or higher)
5. **Git**

### Android Studio Setup
1. Install Android Studio from [https://developer.android.com/studio](https://developer.android.com/studio)
2. Open Android Studio
3. Go to `Tools > SDK Manager`
4. Install:
   - Android SDK Platform-Tools
   - Android SDK Build-Tools
   - Android 12+ (API level 31+)
   - Android Virtual Device (AVD) with Google Play or Google APIs

## Project Setup

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd truck-drive
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_DIRECTUS_URL=http://192.168.101.84:8055
```

### 3. Android Emulator Setup
1. Open Android Studio
2. Go to `Tools > AVD Manager`
3. Create a new Virtual Device:
   - Choose a phone model (e.g., Pixel 8a)
   - Select a system image (Android 12+ with Google Play or Google APIs)
   - Give it a name and finish setup
4. Launch the emulator

## Build Commands

### Complete Build and Deploy Process
Run these commands in order:

```bash
# 1. Build the React app
npm run build

# 2. Sync with Capacitor
npx cap sync

# 3. Install APK on emulator
cd android
./gradlew installDebug

# OR run the complete sequence in one line:
npm run build && npx cap sync && cd android && ./gradlew installDebug
```

### Individual Commands Explained

#### 1. Build the Web App
```bash
npm run build
```
- Compiles the React TypeScript app
- Creates optimized production build in `/dist` folder
- Includes all environment variables from `.env` file

#### 2. Sync with Capacitor
```bash
npx cap sync
```
- Copies web assets to Android project
- Updates Android project configuration
- Installs Capacitor plugins
- Generates necessary Android files

#### 3. Build and Install APK
```bash
cd android
./gradlew installDebug
```
- Compiles the Android app
- Creates debug APK
- Installs on connected emulator/device

## Alternative: Run Directly on Emulator
```bash
# After sync, run this:
npx cap run android
```

## Development Workflow

### First Time Setup
```bash
# Install Capacitor CLI
npm install @capacitor/cli

# Initialize Capacitor (only needed once)
npx cap init "Truck Drive Management" "com.truckdrive.app"

# Add Android platform (only needed once)
npx cap add android
```

### Regular Development
```bash
# For web development
npm run dev

# To test changes on Android:
npm run build
npx cap sync
cd android && ./gradlew installDebug
```

## Troubleshooting

### Common Issues

#### 1. Network Requests Fail
If you get "Failed to fetch" errors:

1. Check `.env` file has correct Directus URL
2. Ensure Directus server is running and accessible
3. Verify network configuration in `capacitor.config.ts`:
   ```typescript
   server: {
     androidScheme: 'http',
     cleartext: true,
   },
   android: {
     allowMixedContent: true
   }
   ```

#### 2. Build Errors
```bash
# Clean build
cd android
./gradlew clean
./gradlew installDebug
```

#### 3. Emulator Not Found
```bash
# List available emulators
npx cap run android --list

# Run specific emulator
npx cap run android --target <emulator-id>
```

#### 4. Gradle Issues
```bash
# If Gradle wrapper is missing or corrupted:
cd android
gradle wrapper --gradle-version=8.0
```

### Debugging

#### View Console Logs
1. Open Chrome
2. Go to `chrome://inspect`
3. Under "Remote Target", find your emulator and click "inspect"
4. Go to Console tab to see logs

#### Android Debug Bridge (ADB)
```bash
# Check connected devices
adb devices

# View logs
adb logcat

# Clear app data
adb shell pm clear com.truckdrive.app
```

## Project Structure

```
truck-drive/
├── src/                     # React source code
├── android/                 # Android project (Capacitor)
├── android/app/             # Android app module
├── .env                     # Environment variables
├── capacitor.config.ts      # Capacitor configuration
├── package.json            # Node dependencies
└── dist/                   # Built web assets (generated)
```

## Important Configuration Files

### capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.truckdrive.app',
  appName: 'Truck Drive Management',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#1e40af",
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1e40af'
    }
  }
};

export default config;
```

### .env
```env
# Directus server URL
VITE_DIRECTUS_URL=http://192.168.101.84:8055
```

## Performance Tips

1. **Incremental Builds**: Use `./gradlew installDebug` instead of full builds when possible
2. **Fast Refresh**: For UI changes, use web development mode (`npm run dev`)
3. **Sync Only**: When only web assets change, run `npx cap sync` without full build

## Production Build

For release APK:
```bash
# Build production APK
cd android
./gradlew assembleRelease

# Install release APK
adb install app/build/outputs/apk/release/app-release.apk
```

Note: You'll need to generate a signing key for release builds.

## Support

If you encounter issues:
1. Check the console logs in Chrome DevTools
2. Verify all prerequisites are installed
3. Ensure the emulator is running before building
4. Check network connectivity for Directus server

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run build` | Build React app |
| `npx cap sync` | Sync with Capacitor |
| `npx cap run android` | Run on emulator |
| `cd android && ./gradlew installDebug` | Build and install APK |
| `adb devices` | List connected devices |
| `./gradlew clean` | Clean Android build |