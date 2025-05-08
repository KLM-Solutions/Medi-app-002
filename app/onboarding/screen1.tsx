import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { onboardingStorage } from '../utils/onboardingStorage';
import { useAuth } from '@clerk/clerk-expo';
import { ChevronLeft } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const ORANGE = '#FF5A1F';

export default function OnboardingScreen1() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  
  useEffect(() => {
    // Mark this screen as viewed when component mounts
    onboardingStorage.markScreenAsViewed(1);
  }, []);

  const handleBack = async () => {
    await signOut();
    router.replace('/');
  };

  const handleNext = async () => {
    // Update the last viewed screen
    await onboardingStorage.setOnboardingStatus({
      isCompleted: false,
      lastScreenViewed: 1
    });
    router.push('/onboarding/screen2');
  };

  return (
    <SafeAreaView style={[styles.container]} edges={['top']}>
      <StatusBar style="dark" />
      
      <Pressable 
        style={[styles.backButton, { top: insets.top + 10 }]} 
        onPress={handleBack}
      >
        <ChevronLeft size={24} color="#FFFFFF" />
      </Pressable>
      
      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/screen1.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      
      <View style={styles.whiteContainer}>
        <View style={styles.contentWrapper}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>NutriMed Assistant</Text>
            <Text style={styles.subtitle}>
              Track your nutrition, manage medications, and understand how they interact.
            </Text>
            
            <View style={styles.pagination}>
              <View style={[styles.dot, styles.activeDot]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>

          <Pressable
            style={[styles.button, { marginBottom: insets.bottom }]}
            onPress={handleNext}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
    padding: 8,
    backgroundColor: ORANGE,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: width,
    height: height * 0.7,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  whiteContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginBottom: 10,
    height: height * 0.4,
    overflow: 'hidden',
  },
  contentWrapper: {
    paddingTop: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  pagination: {
    flexDirection: 'row',
    marginTop: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: ORANGE,
    width: 20,
  },
  button: {
    backgroundColor: ORANGE,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: width - 48,
    alignItems: 'center',
    marginTop: 10,
    
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    
  },
}); 