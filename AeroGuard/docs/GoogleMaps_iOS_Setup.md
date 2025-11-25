# Google Maps on iOS (Expo)

This app supports Google Maps on iOS. Due to SDK licensing, Google Maps is not available in the default Expo Go app. You must run a Development Build or a production build to use the Google map provider on iOS.

## Prerequisites

- Expo SDK 53+ (already configured)
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` set in `.env`
- `EXPO_PUBLIC_MAP_PROVIDER=google` in `.env`
- `app.json` contains:

```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"
      },
      "bundleIdentifier": "com.aseshnemal.aeroguard"
    },
    "android": {
      "config": { "googleMaps": { "apiKey": "$EXPO_PUBLIC_GOOGLE_MAPS_API_KEY" } }
    }
  }
}
```

The code in `src/screens/MapScreen.tsx` reads `EXPO_PUBLIC_MAP_PROVIDER` and sets `provider={PROVIDER_GOOGLE}` automatically when set to `google`.

## Run on iOS with Google Maps

Expo Go (App Store) does not include Google Maps SDK. Use one of these options:

1) Development Build (recommended for dev):

```bash
npx expo prebuild --platform ios # only if you need to eject native projects
npx expo run:ios                 # builds and installs a dev client locally
```

Or using EAS:

```bash
npx expo install expo-dev-client
eas build -p ios --profile development
```

2) Production Build:

```bash
eas build -p ios --profile production
```

After installing the Dev Client or production app on the device/simulator, start the Metro server and open the project with the custom client.

## Common Pitfalls

- Ensure the API key is valid and not restricted incorrectly; allow "Maps SDK for iOS" on this key.
- Rebuild the Development Client after changing native config (like `app.json` keys).
- Environment changes in `.env` require restarting the dev server.
- On iOS, the default "My Location" button is not shown by `react-native-maps`; this app includes a custom recenter button in the bottom-right.
