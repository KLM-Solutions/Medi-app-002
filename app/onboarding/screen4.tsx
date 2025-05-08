import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Switch, Image, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { ChevronLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth, useUser } from '@clerk/clerk-expo';

const { width, height } = Dimensions.get('window');
const ORANGE = '#FF5A1F';

export default function OnboardingScreen4() {
  const [medicationsEnabled, setMedicationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        if (!user?.primaryEmailAddress?.emailAddress) {
          setIsFetchingData(false);
          return;
        }
        
        const token = await getToken();
        const response = await fetch(`https://food-app-backend-psi-eosin.vercel.app/api/onboarding/screen4?userId=${user.primaryEmailAddress.emailAddress}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          setMedicationsEnabled(data.data.track_medications || false);
        }
      } catch (error) {
        console.error('Error fetching existing data:', error);
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchExistingData();
  }, [user, getToken]);

  const handleNext = async () => {
    try {
      setIsLoading(true);

      if (!user?.primaryEmailAddress?.emailAddress) {
        alert('Email address not found. Please sign in again.');
        return;
      }

      const token = await getToken();
      
      const response = await fetch('https://food-app-backend-psi-eosin.vercel.app/api/onboarding/screen4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.primaryEmailAddress.emailAddress,
          trackMedications: medicationsEnabled
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save medication tracking preference');
      }

      router.push('/onboarding/screen5');
    } catch (error) {
      console.error('Error saving medication tracking preference:', error);
      alert('Failed to save preference. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBack = async () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {isFetchingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
      ) : (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar} />
              <View style={styles.progressBar} />
              <View style={styles.progressBarActive} />
              <View style={styles.progressBar} />
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Medication Tracking</Text>
              <Text style={styles.subtitle}>Would you like to track your medications?</Text>
            </View>

            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>Do you take regular medications?</Text>
              <Switch
                value={medicationsEnabled}
                onValueChange={setMedicationsEnabled}
                trackColor={{ false: '#E5E5E5', true: colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>

            <Text style={styles.toggleDescription}>
              This helps you track medications and identify potential food interactions.
            </Text>

            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>Why track medications?</Text>
              <View style={styles.infoList}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemDot}>•</Text>
                  <Text style={styles.infoItemText}>Get reminders to take your medications on time</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemDot}>•</Text>
                  <Text style={styles.infoItemText}>Learn about potential food-drug interactions</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemDot}>•</Text>
                  <Text style={styles.infoItemText}>Track side effects and effectiveness</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoItemDot}>•</Text>
                  <Text style={styles.infoItemText}>Share reports with your healthcare provider</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? 'Saving...' : 'Next'}</Text>
            </Pressable>
          </View>
        </View>
      )}
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
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  progressBar: {
    height: 4,
    width: '20%',
    backgroundColor: '#E5E5E5',
    borderRadius: 2,
  },
  progressBarActive: {
    height: 4,
    width: '20%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  toggleText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  toggleDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  infoContainer: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoItemDot: {
    fontSize: 16,
    color: colors.primary,
    marginRight: 8,
    lineHeight: 20,
  },
  infoItemText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingVertical: 20,
  },
  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
}); 