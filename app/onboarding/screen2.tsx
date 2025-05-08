import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, TouchableOpacity, Image, Dimensions, Modal, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { ChevronLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth, useUser } from '@clerk/clerk-expo';

const { width, height } = Dimensions.get('window');
const ORANGE = '#FF5A1F';

export default function OnboardingScreen2() {
  const [unit, setUnit] = useState('lbs');
  const [heightUnit, setHeightUnit] = useState('ft');
  const [heightInches, setHeightInches] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showWeightUnitModal, setShowWeightUnitModal] = useState(false);
  const [name, setName] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { user } = useUser();
  
  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
    { value: 'light', label: 'Lightly active (1-3 days/week)' },
    { value: 'moderate', label: 'Moderately active (3-5 days/week)' },
    { value: 'very', label: 'Very active (6-7 days/week)' },
    { value: 'extra', label: 'Extra active (very active + physical job)' }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const calculateAge = (day: number, month: number, year: number) => {
    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleDateSelect = () => {
    if (selectedDay === null || selectedMonth === null || selectedYear === null) {
      alert('Please select a complete date');
      return;
    }
    const calculatedAge = calculateAge(selectedDay, selectedMonth, selectedYear);
    setAge(calculatedAge.toString());
    setShowDatePicker(false);
  };

  const formatDate = (day: number | null, month: number | null, year: number | null) => {
    if (day === null || month === null || year === null) return '';
    return `${months[month - 1]} ${day}, ${year}`;
  };

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        if (!user?.primaryEmailAddress?.emailAddress) {
          setIsFetchingData(false);
          return;
        }
        
        const token = await getToken();
        const response = await fetch(`https://food-app-backend-psi-eosin.vercel.app/api/onboarding/screen2?userId=${user.primaryEmailAddress.emailAddress}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        
        if (data.success && data.data) {
          const existingData = data.data;
          setName(existingData.name || '');
          if (existingData.age) {
            const today = new Date();
            const birthYear = today.getFullYear() - existingData.age;
            setSelectedYear(birthYear);
            setSelectedMonth(today.getMonth() + 1);
            setSelectedDay(today.getDate());
            setAge(existingData.age.toString());
          }
          setWeight(existingData.weight ? Math.round(existingData.weight).toString() : '');
          if (existingData.height) {
            const totalInches = existingData.height;
            const feet = Math.floor(totalInches / 12);
            const inches = totalInches % 12;
            setHeightFeet(feet.toString());
            setHeightInches(inches.toString());
          }
          setUnit(existingData.weight_unit || 'lbs');
          setHeightUnit(existingData.height_unit || 'ft');
          setActivityLevel(existingData.activity_level || '');
        }
      } catch (error) {
        console.error('Error fetching existing data:', error);
      } finally {
        setIsFetchingData(false);
      }
    };

    if (isFetchingData) {
      fetchExistingData();
    }
  }, [user, getToken, isFetchingData]);

  const handleNext = async () => {
    try {
      setIsLoading(true);
      
      // Validate all fields are filled
      if (!name || !age || !weight || !heightFeet || !heightInches || !activityLevel || selectedDay === null || selectedMonth === null || selectedYear === null) {
        alert('Please fill in all fields');
        return;
      }

      if (!user?.primaryEmailAddress?.emailAddress) {
        alert('Email address not found. Please sign in again.');
        return;
      }

      // Convert height to total inches
      const totalInches = (parseInt(heightFeet) * 12) + parseInt(heightInches);

      const token = await getToken();
      
      const response = await fetch('https://food-app-backend-psi-eosin.vercel.app/api/onboarding/screen2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.primaryEmailAddress.emailAddress,
          name: name,
          age: parseInt(age),
          weight: parseFloat(weight),
          weightUnit: unit,
          height: totalInches,
          heightUnit: heightUnit,
          activityLevel: activityLevel
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save onboarding data');
      }

      // Update local state with the response data
      if (data.success && data.data) {
        const updatedData = data.data;
        if (updatedData.name !== name) setName(updatedData.name);
        if (updatedData.age?.toString() !== age) setAge(updatedData.age?.toString());
        const roundedWeight = updatedData.weight ? Math.round(updatedData.weight).toString() : '';
        if (roundedWeight !== weight) setWeight(roundedWeight);
        if (updatedData.height) {
          const totalInches = updatedData.height;
          const feet = Math.floor(totalInches / 12);
          const inches = totalInches % 12;
          if (feet.toString() !== heightFeet) setHeightFeet(feet.toString());
          if (inches.toString() !== heightInches) setHeightInches(inches.toString());
        }
        if (updatedData.weight_unit !== unit) setUnit(updatedData.weight_unit);
        if (updatedData.height_unit !== heightUnit) setHeightUnit(updatedData.height_unit);
        if (updatedData.activity_level !== activityLevel) setActivityLevel(updatedData.activity_level);
      }

      router.push('/onboarding/screen3');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBack = async () => {
    router.back();
  };

  const handleActivitySelect = (level: string) => {
    setActivityLevel(level);
    setShowActivityModal(false);
  };

  const handleWeightUnitSelect = (selectedUnit: string) => {
    setUnit(selectedUnit);
    setShowWeightUnitModal(false);
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
                <TouchableOpacity 
                  onPress={handleDateSelect}
                  style={styles.doneButton}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.selectedDateDisplay}>
                {formatDate(selectedDay, selectedMonth, selectedYear) || 'Select your date of birth'}
              </Text>
              
              <View style={styles.datePickerContent}>
                <ScrollView 
                  style={styles.datePickerColumn}
                  showsVerticalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={44}
                  contentContainerStyle={{ paddingVertical: 20 }}
                >
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.datePickerItem,
                        selectedDay === day && styles.selectedItem
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedDay === day && styles.selectedItemText
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView 
                  style={styles.datePickerColumn}
                  showsVerticalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={44}
                  contentContainerStyle={{ paddingVertical: 20 }}
                >
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.datePickerItem,
                        selectedMonth === index + 1 && styles.selectedItem
                      ]}
                      onPress={() => setSelectedMonth(index + 1)}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedMonth === index + 1 && styles.selectedItemText
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView 
                  style={styles.datePickerColumn}
                  showsVerticalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={44}
                  contentContainerStyle={{ paddingVertical: 20 }}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.datePickerItem,
                        selectedYear === year && styles.selectedItem
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedYear === year && styles.selectedItemText
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>
      );
    } else {
      // Android implementation
      return (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
        >
          <View style={[styles.modalContainer, Platform.OS === 'android' && styles.androidModalContainer]}>
            <View style={[styles.datePickerContainer, Platform.OS === 'android' && styles.androidDatePickerContainer]}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
                <TouchableOpacity 
                  onPress={handleDateSelect}
                  style={[styles.doneButton, Platform.OS === 'android' && styles.androidDoneButton]}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.selectedDateDisplay}>
                {formatDate(selectedDay, selectedMonth, selectedYear) || 'Select your date of birth'}
              </Text>
              
              <View style={[styles.datePickerContent, Platform.OS === 'android' && styles.androidDatePickerContent]}>
                <ScrollView 
                  style={styles.datePickerColumn}
                  showsVerticalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={44}
                  contentContainerStyle={{ paddingVertical: 20 }}
                >
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.datePickerItem,
                        selectedDay === day && styles.selectedItem,
                        Platform.OS === 'android' && styles.androidDatePickerItem
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedDay === day && styles.selectedItemText
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView 
                  style={styles.datePickerColumn}
                  showsVerticalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={44}
                  contentContainerStyle={{ paddingVertical: 20 }}
                >
                  {months.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.datePickerItem,
                        selectedMonth === index + 1 && styles.selectedItem,
                        Platform.OS === 'android' && styles.androidDatePickerItem
                      ]}
                      onPress={() => setSelectedMonth(index + 1)}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedMonth === index + 1 && styles.selectedItemText
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <ScrollView 
                  style={styles.datePickerColumn}
                  showsVerticalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={44}
                  contentContainerStyle={{ paddingVertical: 20 }}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.datePickerItem,
                        selectedYear === year && styles.selectedItem,
                        Platform.OS === 'android' && styles.androidDatePickerItem
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedYear === year && styles.selectedItemText
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </Modal>
      );
    }
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
              <View style={styles.progressBarActive} />
              <View style={styles.progressBar} />
              <View style={styles.progressBar} />
              <View style={styles.progressBar} />
            </View>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Tell us about yourself</Text>
                <Text style={styles.subtitle}>We'll use this to personalize your experience</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {formatDate(selectedDay, selectedMonth, selectedYear) || 'Select your date of birth'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Weight</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[styles.input, styles.inputWithUnitField]}
                    keyboardType="numeric"
                    placeholder=""
                    value={weight}
                    onChangeText={setWeight}
                  />
                  <TouchableOpacity 
                    style={styles.unitSelector}
                    onPress={() => setShowWeightUnitModal(true)}
                  >
                    <Text style={styles.unitText}>{unit}</Text>
                    <ChevronLeft size={16} color={colors.textSecondary} style={styles.unitIcon} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Height</Text>
                <View style={styles.heightInputContainer}>
                  <View style={styles.heightInputWrapper}>
                    <TextInput
                      style={styles.heightInputField}
                      keyboardType="numeric"
                      placeholder=""
                      value={heightFeet}
                      onChangeText={(text) => setHeightFeet(text.replace(/[^0-9]/g, ''))}
                      onFocus={() => {
                        if (Platform.OS === 'web') {
                          const input = document.activeElement as HTMLElement;
                          if (input) {
                            input.style.outline = 'none';
                            input.style.border = 'none';
                            input.style.boxShadow = 'none';
                          }
                        }
                      }}
                    />
                    <Text style={styles.heightUnitText}>feet</Text>
                  </View>
                  <View style={[styles.heightInputWrapper, { borderBottomWidth: 0 }]}>
                    <TextInput
                      style={styles.heightInputField}
                      keyboardType="numeric"
                      placeholder=""
                      value={heightInches}
                      onChangeText={(text) => setHeightInches(text.replace(/[^0-9]/g, ''))}
                      onFocus={() => {
                        if (Platform.OS === 'web') {
                          const input = document.activeElement as HTMLElement;
                          if (input) {
                            input.style.outline = 'none';
                            input.style.border = 'none';
                            input.style.boxShadow = 'none';
                          }
                        }
                      }}
                    />
                    <Text style={styles.heightUnitText}>inches</Text>
                  </View>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Activity level</Text>
                <TouchableOpacity 
                  style={styles.dropdownSelector}
                  onPress={() => setShowActivityModal(true)}
                >
                  <Text style={[styles.dropdownText, !activityLevel && styles.placeholderText]}>
                    {activityLevel ? activityLevels.find(level => level.value === activityLevel)?.label : 'Select activity level'}
                  </Text>
                  <ChevronLeft size={16} color={colors.textSecondary} style={styles.dropdownIcon} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.buttonContainer, { paddingBottom: Math.max(24, insets.bottom) }]}>
            <Pressable
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>{isLoading ? 'Saving...' : 'Next'}</Text>
            </Pressable>
          </View>

          <Modal
            visible={showActivityModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowActivityModal(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowActivityModal(false)}
            >
              <View style={styles.modalContent}>
                {activityLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={styles.modalItem}
                    onPress={() => handleActivitySelect(level.value)}
                  >
                    <Text style={styles.modalItemText}>{level.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          <Modal
            visible={showWeightUnitModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowWeightUnitModal(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowWeightUnitModal(false)}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleWeightUnitSelect('lbs')}
                >
                  <Text style={styles.modalItemText}>Pounds (lbs)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleWeightUnitSelect('kg')}
                >
                  <Text style={styles.modalItemText}>Kilograms (kg)</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {renderDatePicker()}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  formContainer: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  backButton: {
    marginRight: 15,
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#FFFFFF',
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWithUnitField: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  unitSelector: {
    width: 80,
    height: 56,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#E5E5E5',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  unitText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  unitIcon: {
    transform: [{ rotate: '-90deg' }],
  },
  heightInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  heightInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  heightInputField: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingRight: 8,
    backgroundColor: 'transparent',
  },
  heightUnitText: {
    fontSize: 16,
    color: colors.textSecondary,
    minWidth: 50,
  },
  dropdownSelector: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  dropdownIcon: {
    transform: [{ rotate: '-90deg' }],
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalItemText: {
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#E5E5E5',
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
  datePickerButton: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  selectedDateDisplay: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: Platform.OS === 'ios' ? '50%' : '45%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  doneButton: {
    padding: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  datePickerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
  },
  datePickerColumn: {
    flex: 1,
    maxHeight: 200,
    marginHorizontal: 4,
  },
  datePickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
  },
  selectedItem: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  datePickerItemText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedItemText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Android-specific styles
  androidModalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  androidDatePickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 4,
  },
  androidDatePickerContent: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  androidDatePickerItem: {
    elevation: 1,
  },
  androidDoneButton: {
    elevation: 2,
  },
}); 