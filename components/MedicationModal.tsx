import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { X, Search, Pill } from 'lucide-react-native';
import { colors, shadows } from '@/constants/colors';
import { useAnalysisStore } from '@/stores/analysis-store';
import { Medication } from '@/types/analysis';

const TIME_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Bedtime'] as const;

interface MedicationModalProps {
  visible: boolean;
  onClose: () => void;
  medication: Medication | null;
  onSubmit: (medication: Medication) => void;
  loading?: boolean;
}

interface MedicationSuggestion {
  name: string;
  strength: string;
}

export function MedicationModal({ visible, onClose, medication, onSubmit, loading }: MedicationModalProps) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [suggestions, setSuggestions] = useState<MedicationSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  const { addMedication, updateMedication } = useAnalysisStore();

  useEffect(() => {
    if (medication) {
      setName(medication.name);
      setDosage(medication.dosage);
      setFrequency(medication.frequency);
      setTimeOfDay(medication.timeOfDay);
      setNotes(medication.notes || '');
    } else {
      setName('');
      setDosage('');
      setFrequency('');
      setTimeOfDay([]);
      setNotes('');
    }
  }, [medication]);

  useEffect(() => {
    if (showSuggestions) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [showSuggestions]);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(`https://feature1-food.vercel.app/api/meddb?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    fetchSuggestions(text);
    setShowSuggestions(true);
  };

  const handleSuggestionSelect = (suggestion: MedicationSuggestion) => {
    setName(suggestion.name);
    if (suggestion.strength) {
      setDosage(suggestion.strength);
    }
    setShowSuggestions(false);
  };

  const toggleTimeOfDay = (time: string) => {
    if (timeOfDay.includes(time)) {
      setTimeOfDay(current => current.filter(t => t !== time));
    } else {
      setTimeOfDay(current => [...current, time]);
    }
  };

  const handleSubmit = () => {
    const newMedication: Medication = {
      id: medication?.id || Date.now().toString(),
      name,
      dosage,
      frequency,
      timeOfDay,
      notes: notes || undefined,
    };
    onSubmit(newMedication);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {medication ? 'Edit' : 'Add'} Medication
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Medication Name</Text>
              <View style={styles.suggestionContainer}>
                <View style={styles.inputWrapper}>
                  <Search size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={handleNameChange}
                    placeholder="Search medication..."
                    placeholderTextColor={colors.textSecondary}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  {isLoadingSuggestions && (
                    <ActivityIndicator style={styles.loader} color={colors.primary} />
                  )}
                </View>
              </View>
            </View>

            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsWrapperCardInline}>
                <View style={styles.suggestionsHeaderCard}>
                  <Text style={styles.suggestionsTitleCard}>Select Medication</Text>
                  <Pressable 
                    onPress={() => setShowSuggestions(false)}
                    style={styles.closeButton}
                  >
                    <X size={20} color={colors.text} />
                  </Pressable>
                </View>
                <ScrollView 
                  style={styles.suggestionsListCard}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {suggestions.map((suggestion, index) => (
                    <Pressable
                      key={index}
                      style={({ pressed }) => [
                        styles.suggestionCard,
                        pressed && styles.suggestionCardPressed
                      ]}
                      onPress={() => handleSuggestionSelect(suggestion)}
                    >
                      <View style={styles.suggestionCardContent}>
                        <View style={styles.suggestionCardIconWrap}>
                          <Pill size={22} color={colors.primary} />
                        </View>
                        <View style={styles.suggestionCardTextWrap}>
                          <Text style={styles.suggestionCardName}>{suggestion.name}</Text>
                          {suggestion.strength && (
                            <Text style={styles.suggestionCardStrength}>{suggestion.strength}</Text>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dosage</Text>
              <TextInput
                style={[styles.input, styles.dosageTextArea, styles.inputWithBorder]}
                value={dosage}
                onChangeText={setDosage}
                placeholder="e.g., 50mg"
                placeholderTextColor={colors.textSecondary}
                multiline={true}
                numberOfLines={2}
                textAlignVertical="top"
                scrollEnabled={true}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Frequency</Text>
              <TextInput
                style={[styles.input, styles.inputWithBorder]}
                value={frequency}
                onChangeText={setFrequency}
                placeholder="e.g., Once daily, Twice daily, etc."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Time of Day</Text>
              <View style={styles.timeOptions}>
                {TIME_OPTIONS.map((time) => (
                  <Pressable
                    key={time}
                    style={[
                      styles.timeOption,
                      timeOfDay.includes(time) && styles.timeOptionSelected,
                    ]}
                    onPress={() => toggleTimeOfDay(time)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        timeOfDay.includes(time) && styles.timeOptionTextSelected,
                      ]}
                    >
                      {time}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, styles.inputWithBorder]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any special instructions"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonText}>Save Medication</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    ...shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d0d5dd',
    ...shadows.small,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    padding: Platform.OS === 'ios' ? 16 : 12,
    fontSize: 16,
    color: colors.text,
    borderRadius: 12,
    borderWidth: 0,
    
    outlineColor: 'transparent',
  },
  textArea: {
    height: 100,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  timeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  timeOptionTextSelected: {
    color: colors.background,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
  },
  overlayPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  suggestionContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  suggestionsWrapperCard: {
    width: '98%',
    maxWidth: 520,
    backgroundColor: colors.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    zIndex: 2001,
    marginTop: 12,
    alignSelf: 'center',
    ...shadows.small,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    paddingBottom: 10,
  },
  suggestionsHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
    backgroundColor: '#fafbfc',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  suggestionsTitleCard: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  suggestionsListCard: {
    // No maxHeight or padding, let it grow naturally
  },
  suggestionCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  suggestionCardPressed: {
    backgroundColor: '#f2f4f7',
    elevation: 4,
    shadowOpacity: 0.15,
  },
  suggestionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  suggestionCardIconWrap: {
    marginRight: 14,
    backgroundColor: '#f3f7fa',
    borderRadius: 20,
    padding: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionCardTextWrap: {
    flex: 1,
  },
  suggestionCardName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 21,
  },
  suggestionCardStrength: {
    fontSize: 13,
    color: '#757575',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  loader: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  suggestionsWrapperCardInline: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 8,
    marginBottom: 16,
    alignSelf: 'stretch',
    ...shadows.small,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    paddingBottom: 10,
  },
  dosageTextArea: {
    minHeight: 48,
    maxHeight: 120,
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingBottom: Platform.OS === 'ios' ? 16 : 12,
    borderRadius: 12,
  },
  inputWithBorder: {
    borderWidth: 2,
    borderColor: '#d0d5dd',
    borderRadius: 12,
    backgroundColor: colors.card,
  },
});