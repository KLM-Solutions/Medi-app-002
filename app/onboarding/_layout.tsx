import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Dimensions, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { useUser } from '@clerk/clerk-expo';
import { useAuth } from '@clerk/clerk-expo';

const { width } = Dimensions.get('window');

export default function OnboardingLayout() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Wait for Clerk to be fully loaded
      if (!isLoaded) return;

      // If no user is found, redirect to sign-in
      if (!user) {
        router.replace('/sign-in');
        return;
      }

      if (!user?.primaryEmailAddress?.emailAddress) {
        setIsLoading(false);
        return;
      }

      try {
        const token = await getToken();
        
        // Check if user has completed screen 4 (last required screen)
        const response = await fetch(`https://food-app-backend-psi-eosin.vercel.app/api/onboarding/screen4?userId=${user.primaryEmailAddress.emailAddress}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.data) {
          // User has completed onboarding, redirect to home
          router.replace('/');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // If there's an error checking onboarding status, redirect to sign-in
        router.replace('/sign-in');
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, isLoaded]);

  // Show loading screen until everything is ready
  if (!isLoaded || isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <Image
          source={require('@/assets/sandwich.gif')}
          style={styles.loaderImage}
          resizeMode="contain"
        />
        <View style={styles.textContainer}>
          <Text style={styles.loadingText}>Welcome back</Text>
          <Text style={styles.subText}>Loading your profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="screen1" />
        <Stack.Screen name="screen2" />
        <Stack.Screen name="screen3" />
        <Stack.Screen name="screen4" />
        <Stack.Screen name="screen5" />
        <Stack.Screen name="screen6" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderImage: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  loadingText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    opacity: 0.8,
  },
}); 