# AeroGuard Mobile 🌬️

[![React Native](https://img.shields.io/badge/React_Native-0.79.5-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~53.0.20-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-~5.8.3-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-0BSD-blue?style=for-the-badge)](LICENSE)

A comprehensive mobile application for real-time air quality monitoring and personalized health recommendations in Sri Lanka. AeroGuard helps users make informed decisions about outdoor activities based on current air quality conditions and their personal health profiles.

## 🌟 Features

### 🏠 Home Dashboard
- **Real-time AQI Display**: Current air quality index with color-coded risk levels
- **Personalized Recommendations**: Health-specific advice based on user profiles
- **Quick Actions**: Easy access to key features
- **Health Tips**: Daily recommendations for maintaining good health in various air quality conditions

### 🗺️ Interactive Map
- **Clean Route Finding**: Discover paths with better air quality
- **Real-time Monitoring Stations**: View AQI data from multiple locations
- **Location-based Alerts**: Get notified when entering areas with poor air quality

### 👤 Health Profile Management
- **Personal Health Conditions**: Track respiratory conditions, allergies, and sensitivities
- **Custom Recommendations**: Tailored advice based on individual health needs
- **Health History**: Monitor how air quality affects your well-being

### ⚙️ Smart Settings
- **Multi-language Support**: English, Sinhala, and Tamil
- **Notification Preferences**: Customizable alerts for air quality changes
- **Privacy Controls**: Manage data sharing and location permissions

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 16 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Android Studio](https://developer.android.com/studio) (for Android development)
- [Xcode](https://developer.apple.com/xcode/) (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AseshNemal/AeroGuardMobile.git
   cd AeroGuardMobile/AeroGuard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install web dependencies (for browser testing)**
   ```bash
   npx expo install react-dom react-native-web @expo/metro-runtime
   ```

4. **Set up API Keys**
   
   Create an account at [IQAir](https://www.iqair.com/air-pollution-data-api) and get your API key.
   
   Update the API key in `src/services/aqiService.ts`:
   ```typescript
   const API_KEY = 'your_actual_iqair_api_key_here';
   ```

5. **Start the development server**
   ```bash
   npx expo start
   ```

## 🎯 Running the App

### 📱 **Option 1: Expo Go (Recommended for Testing)**

1. **Install Expo Go** on your mobile device:
   - **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Start the development server**:
   ```bash
   npx expo start
   ```

3. **Scan the QR code** displayed in terminal with Expo Go app

### 🌐 **Option 2: Web Browser (Instant Testing)**

```bash
npx expo start --web
```
The app will automatically open in your default browser at `http://localhost:8081`

### 📱 **Option 3: Android Emulator**

1. **Setup Android emulator** in Android Studio
2. **Start the emulator** and wait for it to fully boot
3. **Accept USB debugging authorization** dialog when it appears
4. **Run the app**:
   ```bash
   npx expo start --android
   ```

### 🍎 **Option 4: iOS Simulator (macOS only)**

```bash
npx expo start --ios
```

## 🚀 Quick Start Commands

| Command | Description |
|---------|-------------|
| `npx expo start` | Start development server with QR code |
| `npx expo start --web` | Run in web browser |
| `npx expo start --android` | Run on Android emulator/device |
| `npx expo start --ios` | Run on iOS simulator (macOS only) |
| `npx expo start --tunnel` | Use tunnel for remote device testing |

## 📱 App Architecture

```
AeroGuard/
├── App.tsx                 # Main app component
├── index.ts               # App entry point
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
├── assets/               # App icons and images
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── src/
    ├── components/       # Reusable UI components
    │   ├── AppNavigator.tsx
    │   └── AQIDisplay.tsx
    ├── screens/         # App screens
    │   ├── HomeScreen.tsx
    │   ├── MapScreen.tsx
    │   ├── SettingsScreen.tsx
    │   └── UserProfileScreen.tsx
    ├── services/        # API and external services
    │   └── aqiService.ts
    ├── types/          # TypeScript type definitions
    │   └── index.ts
    └── utils/          # Utility functions
        └── localization.ts
```

## 🛠️ Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation 7
- **State Management**: React Hooks + AsyncStorage
- **Maps**: React Native Maps
- **Location Services**: Expo Location
- **Notifications**: Expo Notifications
- **UI Components**: React Native + Expo Vector Icons
- **Storage**: AsyncStorage for local data persistence
- **Web Support**: React Native Web for browser compatibility

## 🎮 Testing & Development

### ✅ **Verified Working Platforms:**
- ✅ **Web Browser** - Instant testing via `npx expo start --web`
- ✅ **Expo Go** - Mobile testing via QR code scanning
- ✅ **Android Emulator** - Full Android experience
- ✅ **iOS Simulator** - Native iOS testing (macOS only)

### 🔧 **Development Features:**
- **Hot Reload** - Instant code updates during development
- **Cross-Platform** - Single codebase for iOS, Android, and Web
- **TypeScript** - Type safety and better development experience
- **Mock Data** - Works without API key for initial testing

## 🔧 Configuration

### Environment Variables

The app uses the following configuration options:

- **API_KEY**: IQAir API key for real-time air quality data (optional - uses mock data if not provided)
- **Default Location**: Colombo, Sri Lanka (6.9271°N, 79.8612°E)

### Permissions

The app requires the following permissions:

- **Location**: For getting current location and providing location-based AQI data
- **Notifications**: For air quality alerts and health reminders

### Android Package Configuration

The app is configured with:
- **Package ID**: `com.aeroguard.mobile`
- **Target SDK**: Android 35 (API level 35)
- **Min SDK**: Compatible with modern Android devices

## 🔧 Troubleshooting

### Android Emulator Authorization Issues

If you see "This computer is not authorized for developing on Pixel_9":

1. **Look for authorization dialog** on emulator screen
2. **Click "OK"** to allow USB debugging
3. **Check "Always allow from this computer"** for future sessions
4. **Alternative**: Use Expo Go on real device or web browser version

### Common Solutions

```bash
# Clear ADB authorization and restart
adb kill-server
rm -rf ~/.android/adbkey*
adb start-server

# Start fresh emulator
/path/to/emulator @AVD_NAME -wipe-data

# Use web version for instant testing
npx expo start --web
```

## 🌍 Localization

AeroGuard supports three languages:

- **English** (en) - Default
- **Sinhala** (si) - සිංහල
- **Tamil** (ta) - தமிழ்

Language can be changed in the Settings screen, and the app will remember your preference.

## 📊 Air Quality Index (AQI) Scale

| AQI Range | Level | Color | Health Impact |
|-----------|-------|-------|---------------|
| 0-50 | Good | 🟢 Green | Safe for everyone |
| 51-100 | Moderate | 🟡 Yellow | Sensitive people should limit prolonged outdoor exertion |
| 101-150 | Unhealthy for Sensitive Groups | 🟠 Orange | Sensitive people should avoid prolonged outdoor exertion |
| 151-200 | Unhealthy | 🔴 Red | Everyone should limit prolonged outdoor exertion |
| 201-300 | Very Unhealthy | 🟣 Purple | Everyone should avoid prolonged outdoor exertion |
| 301+ | Hazardous | 🟤 Maroon | Everyone should avoid any outdoor exertion |

## 🤝 Contributing

We welcome contributions to AeroGuard! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful component and variable names
- Add comments for complex logic
- Test on both iOS and Android platforms
- Follow the existing code style and structure

## 📝 License

This project is licensed under the 0BSD License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [IQAir](https://www.iqair.com/) for providing air quality data API
- [Expo](https://expo.dev/) for the excellent development platform
- React Native community for the amazing ecosystem
- Contributors and testers who helped improve the app

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/AseshNemal/AeroGuardMobile/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with core features ✅
  - Real-time AQI monitoring with mock data support
  - Multi-language support (English, Sinhala, Tamil)
  - Health profile management
  - Interactive map functionality
  - Cross-platform support (iOS, Android, Web)
  - Expo Go compatibility for easy testing
  - Android emulator support with authorization handling

## 🚀 **Status: Ready for Use!**

Your AeroGuard app is now fully functional and tested on multiple platforms. The app includes mock data so you can test all features immediately, even without an API key.

**Quick Test Commands:**
```bash
# Web version (instant)
npx expo start --web

# Mobile testing
npx expo start  # Scan QR with Expo Go

# Android emulator
npx expo start --android
```

---

**Built with ❤️ for cleaner air and healthier communities in Sri Lanka**

*Breathe Easy, Live Healthy* 🌱
