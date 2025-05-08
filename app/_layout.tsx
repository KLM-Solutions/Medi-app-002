import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform } from "react-native";
import { ErrorBoundary } from "./error-boundary";
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import * as SecureStore from 'expo-secure-store';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useOnboardingStore } from '@/stores/onboarding-store';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const { hasCompletedOnboarding } = useOnboardingStore();
  const router = useRouter();

  useEffect(() => {
    console.log('RootLayoutNav state:', { isLoaded, isSignedIn, hasCompletedOnboarding });
    
    if (isLoaded) {
      if (!isSignedIn) {
        console.log('User not signed in, redirecting to welcome');
        router.replace('/welcome');
      } else if (!hasCompletedOnboarding) {
        console.log('User signed in but not completed onboarding, redirecting to onboarding');
        router.replace('/onboarding/screen1');
      } else {
        console.log('User signed in and completed onboarding, redirecting to home');
        router.replace('/');
      }
    }
  }, [isLoaded, isSignedIn, hasCompletedOnboarding]);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen name="(auth)/welcome" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY!}
        tokenCache={tokenCache}
        appearance={{
          elements: {
            formButtonPrimary: {
              backgroundColor: '#007AFF',
              '&:hover': {
                backgroundColor: '#0056b3',
              },
            },
          },
        }}
      >
        <RootLayoutNav />
      </ClerkProvider>
    </ErrorBoundary>
  );
}
