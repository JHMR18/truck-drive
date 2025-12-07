# Android APK Build Guide for Truck Drive Management App

This guide provides step-by-step instructions for converting the Truck Drive Management React web application into an Android APK using Capacitor.

## Project Overview

The current application is:
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI with Tailwind CSS
- **Backend**: Directus CMS with Supabase integration
- **Maps**: Leaflet with React-Leaflet
- **Authentication**: Directus SDK
- **State Management**: TanStack Query

## Prerequisites

### Required Software
1. **Node.js** (v18 or later)
2. **npm** or **yarn**
3. **Java Development Kit (JDK)** (v17 or later)
4. **Android Studio** (latest version)
5. **Android SDK** (API level 33 or later)
6. **Git**

### Environment Setup
```bash
# Verify Node.js installation
node --version
npm --version

# Verify Java installation
java -version
javac -version

# Set Android SDK environment variables (add to ~/.bashrc or ~/.zshrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## Step 1: Install Capacitor

### 1.1 Install Capacitor Core Packages
```bash
# Install Capacitor CLI
npm install @capacitor/cli --save-dev

# Install Capacitor Core
npm install @capacitor/core

# Install Capacitor Android
npm install @capacitor/android
```

### 1.2 Initialize Capacitor
```bash
# Initialize Capacitor in your project
npx cap init "Truck Drive Management" "com.truckdrive.app"

# This will create capacitor.config.ts file
```

### 1.3 Configure Capacitor
Create/Update `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.truckdrive.app',
  appName: 'Truck Drive Management',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#1e40af",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#1e40af'
    },
    App: {
      appendUserAgent: 'TruckDriveApp/1.0'
    }
  }
};

export default config;
```

## Step 2: Add Required Capacitor Plugins

### 2.1 Core Plugins
```bash
# Install essential plugins for mobile functionality
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/app

# Geolocation for tracking
npm install @capacitor/geolocation

# Network monitoring
npm install @capacitor/network

# Device information
npm install @capacitor/device

# Camera and photo access (for driver documentation)
npm install @capacitor/camera @capacitor/filesystem

# Push notifications
npm install @capacitor/push-notifications

# Local notifications
npm install @capacitor/local-notifications

# Haptic feedback
npm install @capacitor/haptics
```

### 2.2 Native Dependencies
```bash
# For camera functionality
npm install @capacitor/ios

# For advanced features
npm install @capacitor/preferences
npm install @capacitor/keyboard
npm install @capacitor/clipboard
```

## Step 3: Configure Android Build Settings

### 3.1 Add Android Platform
```bash
# Add Android platform
npx cap add android
```

### 3.2 Update Package.json Scripts
Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "build:web": "vite build",
    "build:android": "npm run build:web && npx cap sync android",
    "run:android": "npx cap run android",
    "open:android": "npx cap open android",
    "sync:android": "npx cap sync android"
  }
}
```

## Step 4: Update Vite Configuration

### 4.1 Modify vite.config.ts
Update your `vite.config.ts` for mobile optimization:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          radix: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          maps: ['leaflet', 'react-leaflet']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@capacitor/core', '@capacitor/android']
  }
}));
```

## Step 5: Configure Android Project

### 5.1 Open Android Studio
```bash
# Open the Android project in Android Studio
npx cap open android
```

### 5.2 Android Project Configuration

In Android Studio:

1. **SDK Configuration**:
   - Go to Tools > SDK Manager
   - Install Android SDK Platform 33 (Android 13)
   - Install Android Build-Tools 33.0.0
   - Install Android SDK Command-line Tools

2. **Gradle Configuration**:
   - Update `android/build.gradle`:
   ```gradle
   buildscript {
       ext.kotlin_version = '1.8.20'
       repositories {
           google()
           mavenCentral()
       }
       dependencies {
           classpath 'com.android.tools.build:gradle:8.0.0'
           classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.8.20'
       }
   }
   ```

3. **App Configuration**:
   - Update `android/app/build.gradle`:
   ```gradle
   android {
       namespace 'com.truckdrive.app'
       compileSdkVersion 33
       defaultConfig {
           applicationId "com.truckdrive.app"
           minSdkVersion 26
           targetSdkVersion 33
           versionCode 1
           versionName "1.0.0"
           testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
       }
       buildTypes {
           release {
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

## Step 6: Handle Web-specific Features for Mobile

### 6.1 Update Map Implementation
The current app uses Leaflet, which needs adjustments for mobile:

```typescript
// src/hooks/useMobileMap.ts
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
```

### 6.2 Request Permissions
Create a permissions utility:

```typescript
// src/utils/permissions.ts
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { pushNotifications } from '@capacitor/push-notifications';

export const requestPermissions = async () => {
  try {
    // Request location permission
    await Geolocation.requestPermissions();

    // Request camera permission
    await Camera.requestPermissions();

    // Request push notification permission
    await pushNotifications.requestPermissions();

    return true;
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
};
```

### 6.3 Update Network Requests
The app uses Directus SDK. Ensure it works with mobile:

```typescript
// src/lib/directus-mobile.ts
import { createDirectus, rest } from '@directus/sdk';
import { Capacitor } from '@capacitor/core';

const getBaseUrl = () => {
  if (Capacitor.getPlatform() === 'web') {
    return 'http://localhost:8055'; // Development
  }
  return 'https://your-directus-server.com'; // Production
};

export const directus = createDirectus(getBaseUrl()).with(rest());
```

## Step 7: Build Process

### 7.1 Development Build
```bash
# Build the web version
npm run build:web

# Sync with Android
npx cap sync android

# Run on connected device/emulator
npm run run:android
```

### 7.2 Production Build
```bash
# Build for production
npm run build:android

# Open Android Studio to generate APK
npm run open:android
```

In Android Studio:
1. Go to Build > Build Bundle(s) / APK(s) > Build APK(s)
2. Choose release variant
3. The APK will be generated in `android/app/build/outputs/apk/release/`

## Step 8: Generate Signed APK (for Play Store)

### 8.1 Generate Keystore
```bash
# Generate release keystore
keytool -genkey -v -keystore truck-drive-release.keystore -alias truck-drive -keyalg RSA -keysize 2048 -validity 10000
```

### 8.2 Configure Signing
Update `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('truck-drive-release.keystore')
            storePassword 'your-store-password'
            keyAlias 'truck-drive'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 8.3 Generate Release APK
```bash
# Build release APK
cd android
./gradlew assembleRelease

# Or use Android Studio Build menu
```

## Step 9: Testing and Quality Assurance

### 9.1 Required Testing Areas
- [ ] Authentication flow (login/logout)
- [ ] Map functionality and GPS tracking
- [ ] Driver dashboard and vehicle status
- [ ] Mission assignments and updates
- [ ] Communication features
- [ ] Offline capabilities
- [ ] Push notifications
- [ ] Camera integration for documentation
- [ ] Performance on different devices

### 9.2 Testing Commands
```bash
# Run on multiple devices
npx cap run android --list
npx cap run android --target <device-id>

# Android Studio emulator testing
# Use Android Studio's AVD Manager
```

## Step 10: Deployment

### 10.1 Google Play Store Preparation
1. **Create Google Play Developer Account** ($25 one-time fee)
2. **Prepare Store Listing**:
   - App name: "Truck Drive Management"
   - Description: Complete fleet management solution
   - Screenshots (phone and tablet)
   - App icon (512x512px)

### 10.2 Required Assets
- App icon: Multiple sizes (36dp to 144dp)
- Feature graphic: 1024x500px
- Screenshots: Minimum 2, maximum 8
- Privacy policy URL
- Target content rating

### 10.3 Upload to Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new application
3. Upload the signed APK
4. Complete store listing
5. Set pricing and distribution
6. Submit for review

## Troubleshooting

### Common Issues

1. **Build Errors**:
   ```bash
   # Clean and rebuild
   cd android
   ./gradlew clean
   ./gradlew build
   ```

2. **Capacitor Sync Issues**:
   ```bash
   # Force sync
   npx cap sync android --force
   ```

3. **Geolocation Permission**:
   - Add to `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   ```

4. **Network Issues**:
   - Configure network security in `android/app/src/main/res/xml/network_security_config.xml`

### Performance Optimization
- Enable code splitting
- Optimize images
- Use service workers for offline support
- Implement lazy loading for maps
- Optimize bundle size with webpack analyzer

## Maintenance and Updates

### Update Process
1. Update web code
2. Build and sync: `npm run build:android`
3. Test changes
4. Generate new APK
5. Update Play Store version

### Version Management
- Update version in `android/app/build.gradle`
- Update `capacitor.config.ts` if needed
- Keep changelog for Play Store updates

## Costs and Timeline

### Development Costs
- Developer time: 40-60 hours
- Google Play Developer account: $25 (one-time)
- Testing devices (if needed): $200-500
- Optional app signing service: $0-100

### Timeline
- Capacitor setup: 4-6 hours
- Android configuration: 2-4 hours
- Mobile adaptation: 20-30 hours
- Testing: 8-12 hours
- Deployment preparation: 4-6 hours
- **Total**: 40-60 hours (5-7 working days)

## Conclusion

This guide provides a comprehensive roadmap for converting your Truck Drive Management React application into an Android APK using Capacitor. The process involves setting up Capacitor, configuring the Android project, adapting web features for mobile, and following proper deployment procedures.

The resulting app will maintain all core functionality including fleet management, driver communication, vehicle tracking, and analytics while providing a native mobile experience optimized for Android devices.