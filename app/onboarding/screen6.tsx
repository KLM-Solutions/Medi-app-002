import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, Image, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { Check } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { onboardingStorage } from '../utils/onboardingStorage';

const { width, height } = Dimensions.get('window');
const ORANGE = '#FF5A1F';

export default function OnboardingScreen6() {
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    startAnimations();
    onboardingStorage.markScreenAsViewed(6);
  }, []);

  const startAnimations = () => {
    // Checkmark animation
    Animated.sequence([
      Animated.timing(checkmarkScale, {
        toValue: 1.2,
        duration: 400,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.spring(checkmarkScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(checkmarkOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleComplete = async () => {
    await onboardingStorage.completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleBack = async () => {
    router.back();
  };

  const AnimatedCheck = Animated.createAnimatedComponent(Check);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.checkmarkContainer}>
            <View style={styles.checkmarkCircle}>
              <Animated.View
                style={[
                  styles.checkmark,
                  {
                    opacity: checkmarkOpacity,
                    transform: [{ scale: checkmarkScale }],
                  },
                ]}
              >
                <AnimatedCheck size={60} color="#FFF" strokeWidth={3} />
              </Animated.View>
            </View>
          </View>

          <Text style={styles.title}>You're all set</Text>
          <Text style={styles.subtitle}>
            Your profile is ready. Start tracking your nutrition and medications to get personalized insights.
          </Text>
        </View>

        <Pressable
          style={styles.button}
          onPress={handleComplete}
        >
          <Text style={styles.buttonText}>Go to Dashboard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkContainer: {
    width: 120,
    height: 120,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 24,
  },
  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
}); 