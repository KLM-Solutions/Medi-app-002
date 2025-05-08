import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { ChevronLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth, useUser } from '@clerk/clerk-expo';

const { width, height } = Dimensions.get('window');
const ORANGE = '#FF5A1F';

export default function OnboardingScreen3() {
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { user } = useUser();
  
  const goals = [
    'Maintain weight',
    'Lose weight',
    'Gain weight',
    'Improve overall nutrition',
    'Custom Goal'
  ];

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        if (!user?.primaryEmailAddress?.emailAddress) {
          setIsFetchingData(false);
          return;
        }
        
        const token = await getToken();
        const response = await fetch(`https://food-app-backend-psi-eosin.vercel.app/api/onboarding/screen3?userId=${user.primaryEmailAddress.emailAddress}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          const existingGoal = data.data.selected_goal;
          const goalIndex = goals.findIndex(goal => goal === existingGoal);
          if (goalIndex !== -1) {
            setSelectedGoal(goalIndex);
          }
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

      if (selectedGoal === null) {
        alert('Please select a goal');
        return;
      }

      if (!user?.primaryEmailAddress?.emailAddress) {
        alert('Email address not found. Please sign in again.');
        return;
      }

      const token = await getToken();
      
      const response = await fetch('https://food-app-backend-psi-eosin.vercel.app/api/onboarding/screen3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.primaryEmailAddress.emailAddress,
          selectedGoal: goals[selectedGoal]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save goal');
      }

      router.push('/onboarding/screen4');
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal. Please try again.');
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
              <View style={styles.progressBarActive} />
              <View style={styles.progressBar} />
              <View style={styles.progressBar} />
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Set your nutrition goals</Text>
              <Text style={styles.subtitle}>Select your goal for using NutriMed Assistant</Text>
            </View>

            <View style={styles.goalsContainer}>
              {goals.map((goal, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.goalOption}
                  onPress={() => setSelectedGoal(index)}
                >
                  <View style={[
                    styles.radioButton, 
                    selectedGoal === index && styles.radioButtonSelected
                  ]}>
                    {selectedGoal === index && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.goalText}>{goal}</Text>
                </TouchableOpacity>
              ))}
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
  goalsContainer: {
    marginTop: 10,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D1D1',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  goalText: {
    fontSize: 16,
    color: colors.text,
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