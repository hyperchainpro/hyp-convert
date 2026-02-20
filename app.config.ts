import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "HYP Convert",
    slug: "hyp-convert",
    version: "1.0.0",
    orientation: "default",
    icon: "./assets/images/icon.svg",
    scheme: "hypconvert",
    userInterfaceStyle: "automatic",
    splash: {
        image: "./assets/images/splash-icon.svg",
        resizeMode: "contain",
        backgroundColor: "#0f0f23"
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: "com.hypconvert.app"
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/images/adaptive-icon.svg",
            backgroundColor: "#0f0f23"
        },
        package: "com.hypconvert.app",
        permissions: [
            "READ_EXTERNAL_STORAGE",
            "WRITE_EXTERNAL_STORAGE"
        ]
    },
    web: {
        bundler: "metro",
        output: "static",
        favicon: "./assets/images/icon.png"
    },
    plugins: [
        "expo-router",
        [
            "react-native-google-mobile-ads",
            {
                androidAppId: process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || "ca-app-pub-3940256099942544~3347511713",
                iosAppId: process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || "ca-app-pub-3940256099942544~1458002511"
            }
        ]
    ],
    experiments: {
        typedRoutes: true
    },
    extra: {
        eas: {
            projectId: "12f2f3c3-8fca-4eb4-a54e-a7a8c985f1ec"
        }
    }
});
