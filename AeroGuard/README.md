# AeroGuard Mobile App 🌍

A personalized pollution exposure minimizer aligned with **SDG 11 (Sustainable Cities and Communities)**, built with React Native and Expo. This app empowers users to make informed decisions about their outdoor activities based on real-time air quality data and personalized health recommendations.

![AeroGuard Logo](./assets/icon.png)

## ✨ Features

### 🌡️ Real-time Air Quality Monitoring
- Fetch live AQI data from IQAir API with mock data fallback
- Color-coded risk levels (Good, Moderate, Unhealthy, etc.)
- Detailed pollutant information (PM2.5, PM10, O3, NO2, SO2, CO)
- Auto-refresh every 30 minutes with pull-to-refresh capability

### 👤 Health Profile Management
- Personal information tracking (name, age)
- Health conditions management (Asthma, Heart Disease, Respiratory Issues, Diabetes)
- Severity levels (Mild, Moderate, Severe)
- Personalized recommendations based on health conditions
- Secure local data storage

### 🗺️ Interactive Map & Clean Routes
- Real-time location tracking with GPS integration
- Interactive map with clean route suggestions
- Color-coded routes based on air quality levels
- Route information panel with AQI and distance data
- Visual legend for understanding air quality indicators

### 🔔 Smart Notifications
- Configurable AQI threshold alerts
- Location-based air quality warnings
- Health condition-specific recommendations
- Push notification management

### 🌐 Multilingual Support
- **English** (en) - Primary language
- **Sinhala** (සිංහල) (si) - For Sri Lankan users
- **Tamil** (தமிழ்) (ta) - For Tamil-speaking users
- Complete translation system with easy language switching

### ♿ Accessibility & Inclusive Design
- Screen reader compatibility
- High contrast color schemes
- Large touch targets for easy interaction
- Descriptive labels for all interactive elements
- Voice-over support for visually impaired users

### 📱 Responsive Design
- Optimized for both phones and tablets
- Adaptive layouts for different screen sizes
- Professional UI with consistent design language

## 🛠 Technologies Used

- **React Native** with **Expo SDK 53** for cross-platform development
- **TypeScript** for enhanced type safety and code quality
- **React Navigation 6** with bottom tabs and stack navigation
- **AsyncStorage** for secure local data persistence
- **Expo Location** for GPS functionality and location services
- **Expo Notifications** for push notifications and alerts
- **React Native Maps** for interactive map visualization
- **React Native Gesture Handler** for smooth touch interactions
- **Expo Linear Gradient** for beautiful UI elements
- **Vector Icons** (@expo/vector-icons) for consistent iconography

## 📦 Installation & Setup

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or later) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally: `npm install -g @expo/cli`
- **iOS Simulator** (for iOS development on macOS)
- **Android Studio** (for Android development)
- **Expo Go** app on your mobile device for testing

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AseshNemal/AeroGuardMobile.git
   cd AeroGuardMobile/AeroGuard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Fix package compatibility (if needed):**
   ```bash
   npx expo install --fix
   ```

4. **Configure environment variables (Optional):**
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your preferences:
   ```bash
   # IQAir API Configuration (Optional - app works with mock data)
   EXPO_PUBLIC_IQAIR_API_KEY=your_api_key_here
   
   # App Configuration
   EXPO_PUBLIC_APP_ENV=development
   EXPO_PUBLIC_DEFAULT_CITY=Colombo
   EXPO_PUBLIC_DEFAULT_COUNTRY=Sri Lanka
   EXPO_PUBLIC_DEFAULT_LAT=6.9271
   EXPO_PUBLIC_DEFAULT_LNG=79.8612
   
   # Debug Settings
   EXPO_PUBLIC_ENABLE_LOGGING=true
   EXPO_PUBLIC_USE_MOCK_DATA=true
   ```
   
   **Note:** The app works perfectly without an API key using realistic mock data. To get real air quality data:
   - Visit [IQAir API Registration](https://www.iqair.com/commercial-air-quality-monitors/air-quality-monitors/indoor-air-quality-monitor/demo/api)
   - Create a free account and get your API key
   - Set `EXPO_PUBLIC_USE_MOCK_DATA=false` to use live data

5. **Start the development server:**
   ```bash
   npx expo start
   ```

### 🚀 Running on Different Platforms

- **iOS Simulator**: Press `i` in the terminal or run `npx expo start --ios`
- **Android Emulator**: Press `a` in the terminal or run `npx expo start --android`
- **Physical Device**: Scan the QR code with Expo Go app
- **Web Browser**: Press `w` in the terminal or run `npx expo start --web`

## ⚙️ Environment Configuration

### Environment Variables

The app uses environment variables for configuration and API keys. All variables are optional - the app works perfectly with default mock data.

**Available Environment Variables:**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `EXPO_PUBLIC_IQAIR_API_KEY` | IQAir API key for live data | - | No (uses mock data) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | - | No (uses default maps) |
| `EXPO_PUBLIC_APP_ENV` | App environment | `development` | No |
| `EXPO_PUBLIC_DEFAULT_CITY` | Default city name | `Colombo` | No |
| `EXPO_PUBLIC_DEFAULT_COUNTRY` | Default country | `Sri Lanka` | No |
| `EXPO_PUBLIC_DEFAULT_LAT` | Default latitude | `6.9271` | No |
| `EXPO_PUBLIC_DEFAULT_LNG` | Default longitude | `79.8612` | No |
| `EXPO_PUBLIC_ENABLE_LOGGING` | Enable console logging | `true` | No |
| `EXPO_PUBLIC_USE_MOCK_DATA` | Force mock data usage | `true` | No |
| `EXPO_PUBLIC_MAP_PROVIDER` | Map provider (google/default) | `default` | No |
| `EXPO_PUBLIC_MAP_STYLE` | Map style | `standard` | No |

### API Key Setup (Optional)

1. **IQAir API Key** (Free tier available):
   - Visit [IQAir API Portal](https://www.iqair.com/commercial-air-quality-monitors/air-quality-monitors/indoor-air-quality-monitor/demo/api)
   - Create a free account
   - Generate your API key
   - Add to `.env`: `EXPO_PUBLIC_IQAIR_API_KEY=your_key_here`
   - Set `EXPO_PUBLIC_USE_MOCK_DATA=false` to use live data

2. **Mock Data Mode** (Default):
   - Works without any API setup
   - Uses realistic air quality data for Colombo
   - Perfect for development and testing
   - No API rate limits or restrictions

### Google Maps Setup (Optional)

**Free Tier:** 28,000 map loads per month + generous API quotas

1. **Enable Google Maps APIs:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable these APIs:
     - Maps SDK for Android
     - Maps SDK for iOS  
     - Maps JavaScript API (for web)
     - Geocoding API (optional, for address lookup)
     - Directions API (optional, for routing)

2. **Create API Key:**
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Restrict your API key (recommended for production):
     - Android: Add your app's SHA-1 fingerprint
     - iOS: Add your app's bundle identifier
     - Web: Add your domain

3. **Configure in your app:**
   - Add to `.env`: `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here`
   - Set `EXPO_PUBLIC_MAP_PROVIDER=google`
   - Update `app.json` with your API key (replace `YOUR_GOOGLE_MAPS_API_KEY`)

4. **Test your setup:**
   ```bash
   npx expo start
   ```

**Note:** The app works perfectly with the default map provider without Google Maps API. Google Maps provides enhanced features like traffic data, satellite imagery, and better performance.

### 🔧 Troubleshooting Common Issues

**Gesture Handler Error:**
If you see "Unable to resolve module react-native-gesture-handler":
```bash
npm install react-native-gesture-handler
```
Ensure `import 'react-native-gesture-handler';` is at the top of your `index.ts` file.

**Package Version Conflicts:**
```bash
npx expo install --fix
```

**Metro Cache Issues:**
```bash
npx expo start --clear
```

### API Configuration

The app uses the IQAir API for real-time air quality data. To configure:

1. Sign up for a free account at [IQAir API](https://www.iqair.com/commercial-air-quality-monitors/air-quality-monitors/indoor-air-quality-monitor/demo/api)
2. Get your API key
3. Update the `API_KEY` constant in `src/services/aqiService.ts`

```typescript
const API_KEY = 'your_actual_api_key_here';
```

## 🏗 Project Structure

```
AeroGuard/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── AQIDisplay.tsx      # Real-time air quality display
│   │   └── AppNavigator.tsx    # Navigation configuration
│   ├── screens/                # Main application screens
│   │   ├── HomeScreen.tsx      # Dashboard with AQI overview
│   │   ├── UserProfileScreen.tsx # Health profile management
│   │   ├── MapScreen.tsx       # Interactive map with routes
│   │   └── SettingsScreen.tsx  # App preferences and settings
│   ├── services/               # API and business logic
│   │   └── aqiService.ts       # Air quality data service
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts            # Comprehensive type definitions
│   ├── utils/                  # Utility functions and helpers
│   │   └── localization.ts     # Multi-language support
│   └── index.ts                # Main export file
├── assets/                     # Static assets (images, icons)
├── App.tsx                     # Main application component
├── index.ts                    # Application entry point
├── package.json                # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── app.json                   # Expo configuration
└── README.md                  # Project documentation
```

## 📱 Screen Components Overview

### 1. 🏠 Home Screen (`HomeScreen.tsx`)
**Main dashboard providing an overview of air quality and quick access to features**

**Features:**
- Personalized welcome message with user's name
- Live AQI display with color-coded risk indicators
- Quick action cards for easy navigation to key features
- Health alerts for users with medical conditions
- Daily health tips and recommendations
- Pull-to-refresh functionality

**Health Integration:**
- Displays personalized recommendations based on user's health profile
- Shows alerts when air quality may affect specific health conditions
- Provides condition-specific advice (asthma, heart disease, etc.)

### 2. 👤 User Profile Screen (`UserProfileScreen.tsx`)
**Comprehensive health profile management with persistent data storage**

**Personal Information:**
- Name and age input with validation
- Data persistence using AsyncStorage
- Profile completion indicators

**Health Conditions Management:**
- Toggle-based condition selection (Asthma, Heart Disease, Respiratory Issues, Diabetes)
- Severity level selection (Mild, Moderate, Severe)
- Real-time impact on app recommendations

**Notification Preferences:**
- Push notification toggle
- Location-based alert settings
- Customizable AQI threshold alerts
- Notification frequency preferences

**Language Selection:**
- Three-language support with instant switching
- Complete UI translation
- Cultural adaptation for Sri Lankan users

### 3. 🗺️ Map Screen (`MapScreen.tsx`)
**Interactive mapping solution with clean route recommendations**

**Core Mapping Features:**
- Real-time GPS location tracking
- Interactive map with zoom and pan capabilities
- User location marker with custom styling
- MapView integration with gesture support

**Clean Route System:**
- Color-coded route suggestions based on air quality
- Route information panel with AQI data and distances
- Visual route indicators with custom markers
- Polyline routes with dashed styling for clarity

**Air Quality Visualization:**
- Color-coded legend for AQI levels
- Route markers showing air quality ratings
- Visual indicators for different pollution levels
- Interactive route selection with detailed information

**Location Services:**
- Automatic location permission handling
- Error handling for location access issues
- Manual location refresh capability
- Privacy-conscious location usage

### 4. ⚙️ Settings Screen (`SettingsScreen.tsx`)
**Comprehensive app configuration and user preferences**

**User Account Management:**
- Profile overview with edit capabilities
- Health condition summary display
- Quick access to profile editing

**Notification Management:**
- Push notification toggle with system integration
- Permission handling for notification access
- Alert threshold configuration
- Location-based notification settings

**Language & Localization:**
- Three-language radio button selection
- Instant language switching with persistence
- Cultural adaptation settings

**Data & Privacy:**
- Privacy policy access
- Data clearing functionality with confirmation
- Secure data handling practices
- User consent management

**About & Information:**
- App version information
- SDG 11 alignment information
- Developer and project details
- Help and support links

## Air Quality Index (AQI) Levels

| AQI Range | Level | Color | Health Impact |
|-----------|-------|-------|---------------|
| 0-50 | Good | Green | Minimal impact |
| 51-100 | Moderate | Yellow | Acceptable for most people |
| 101-150 | Unhealthy for Sensitive Groups | Orange | Sensitive individuals should limit outdoor exposure |
| 151-200 | Unhealthy | Red | Everyone should limit outdoor activities |
| 201-300 | Very Unhealthy | Purple | Avoid outdoor activities |
| 301+ | Hazardous | Maroon | Stay indoors |

## Localization

The app supports three languages:
- **English** (en)
- **Sinhala** (si) - සිංහල
- **Tamil** (ta) - தமிழ்

All text strings are managed in `src/utils/localization.ts`.

## Health Conditions Support

The app provides personalized recommendations for users with:
- Asthma
- Heart Disease
- Respiratory Issues
- Diabetes

Severity levels: Mild, Moderate, Severe

## Accessibility Features

- Screen reader support
- High contrast color schemes
- Large touch targets
- Descriptive labels for all interactive elements
- Voice-over compatibility

## Push Notifications

- AQI threshold alerts
- Location-based warnings
- Health-condition specific recommendations
- Configurable notification settings

## SDG 11 Alignment

This app supports **Sustainable Development Goal 11: Sustainable Cities and Communities** by:
- Promoting awareness of air quality
- Encouraging sustainable transportation choices
- Supporting public health initiatives
- Providing data-driven insights for urban planning

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Best Practices

- **TypeScript**: All components use strict TypeScript for type safety
- **Clean Code**: Follow React Native and Expo best practices
- **Error Handling**: Comprehensive error handling for API calls and user interactions
- **Performance**: Optimized for smooth performance on mobile devices
- **Testing**: Unit tests for critical functionality
- **Security**: Secure handling of API keys and user data

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the Expo documentation: https://docs.expo.dev/
- React Native documentation: https://reactnative.dev/docs/getting-started

## Acknowledgments

- IQAir for providing air quality data API
- Expo team for the excellent development platform
- React Native community for comprehensive libraries
- UN SDGs for inspiration and framework

---

**Made with ❤️ for cleaner, healthier cities**
