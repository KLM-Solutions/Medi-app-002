import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, shadows } from '@/constants/colors';
import { ChevronLeft, Plus, Pencil, Trash2, Clock } from 'lucide-react-native';
import { useAnalysisStore } from '@/stores/analysis-store';
import { MedicationModal } from '@/components/MedicationModal';
import { Medication } from '@/types/analysis';
import { StatusBar } from 'expo-status-bar';
import { useUser } from '@clerk/clerk-expo';
import { medicationService } from '@/services/medicationService';

export default function OnboardingScreen5() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);
  
  const { medications, setMedications } = useAnalysisStore();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  
  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      loadMedications();
    }
  }, [user]);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const data = await medicationService.getMedications(user!.primaryEmailAddress!.emailAddress);
      setMedications(data);
    } catch (error) {
      console.error('Error loading medications:', error);
      Alert.alert('Error', 'Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    router.push('/onboarding/screen6');
  };

  const handleBack = () => {
    router.back();
  };

  const handleEdit = (medication: Medication): void => {
    setSelectedMedication(medication);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setSelectedMedication(null);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoadingDelete(id);
      await medicationService.deleteMedication(user!.primaryEmailAddress!.emailAddress, id);
      setMedications(medications.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting medication:', error);
      Alert.alert('Error', 'Failed to delete medication');
    } finally {
      setLoadingDelete(null);
    }
  };

  const handleModalSubmit = async (medication: Medication) => {
    try {
      setLoading(true);
      const userEmail = user!.primaryEmailAddress!.emailAddress;

      if (selectedMedication) {
        const updated = await medicationService.updateMedication(userEmail, medication);
        setMedications(medications.map(m => m.id === updated.id ? updated : m));
      } else {
        const newMedication = await medicationService.addMedication(userEmail, medication);
        setMedications([...medications, newMedication]);
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'Failed to save medication');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeOfDay = (times: string[]): string => {
    return times.join(', ');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar} />
            <View style={styles.progressBar} />
            <View style={styles.progressBar} />
            <View style={styles.progressBarActive} />
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Medication Tracking</Text>
            <Text style={styles.subtitle}>Keep track of your medications and get timely reminders</Text>
          </View>

          <View style={styles.previewContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading medications...</Text>
              </View>
            ) : (
              <ScrollView style={styles.list}>
                {medications.map((medication) => (
                  <View key={medication.id} style={styles.medicationCard}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationName}>{medication.name}</Text>
                      <View style={styles.actions}>
                        <TouchableOpacity
                          onPress={() => handleEdit(medication)}
                          style={styles.actionButton}
                          disabled={loadingDelete === medication.id}
                        >
                          <Pencil size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(medication.id)}
                          style={styles.actionButton}
                          disabled={loadingDelete === medication.id}
                        >
                          {loadingDelete === medication.id ? (
                            <ActivityIndicator size="small" color={colors.danger} />
                          ) : (
                            <Trash2 size={18} color={colors.danger} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.medicationDetails}>
                      <Text style={styles.dosage}>
                        {medication.dosage} • {medication.frequency}
                      </Text>
                      <View style={styles.timeContainer}>
                        <Clock size={14} color={colors.textSecondary} />
                        <Text style={styles.timeText}>
                          {formatTimeOfDay(medication.timeOfDay)}
                        </Text>
                      </View>
                      {medication.notes && (
                        <Text style={styles.notes}>{medication.notes}</Text>
                      )}
                    </View>
                  </View>
                ))}

                {medications.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No medications added yet</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.addButtonContainer}>
              <Pressable 
                style={styles.addButton} 
                onPress={handleAdd}
                disabled={loading}
              >
                <Plus size={20} color={colors.background} />
                <Text style={styles.addButtonText}>Add Medication</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.button}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
      </View>

      <MedicationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        medication={selectedMedication}
        onSubmit={handleModalSubmit}
        loading={loading}
      />
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
    marginBottom: 20,
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
  previewContainer: {
    flex: 1,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#F8F8F8',
  },
  list: {
    flex: 1,
    padding: 12,
  },
  medicationCard: {
    backgroundColor: colors.card || '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    ...shadows.small,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 3,
  },
  medicationDetails: {
    gap: 6,
  },
  dosage: {
    fontSize: 13,
    color: colors.text,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  notes: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  addButtonContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
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
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 10,
  },
}); 