import { ExpoConfig, ConfigContext } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.hashhealth.dev';
  }

  if (IS_PREVIEW) {
    return 'com.hashhealth.preview';
  }

  return 'com.hashhealth';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'Food Analyzer (Dev)';
  }

  if (IS_PREVIEW) {
    return 'Food Analyzer (Preview)';
  }

  return 'Food Analyzer';
};



export default ({config}: ConfigContext): ExpoConfig => ({
    ...config,
    name: getAppName(),
    slug: "hashhealth",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": getUniqueIdentifier(), 
        "infoPlist": {
      "ITSAppUsesNonExemptEncryption": false
    }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": getUniqueIdentifier(),
        "permissions": [
        "CAMERA"
      ]
    },
    "plugins": [
      "expo-router"
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "a784d6fc-4e8b-4242-8820-354cbc2fdcd2",
        "owner": "deepakes"
      }
    }
  })

