import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Animated } from 'react-native';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react-native';
import { colors, shadows } from '@/constants/colors';
import { MedicationModal } from '@/components/MedicationModal';
import { Medication } from '@/types/analysis';
import { useUser } from '@clerk/clerk-expo';
import { useFocusEffect } from 'expo-router';
import { medicationService } from '@/services/medicationService';
import { useAnalysisStore } from '@/stores/analysis-store';

export default function MedicationsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { medications, setMedications } = useAnalysisStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Memoize the loadMedications function
  const loadMedications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await medicationService.getMedications(user!.primaryEmailAddress!.emailAddress);
      setMedications(data);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, setMedications]);

  // Load medications only once when component mounts
  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      loadMedications();
    }
  }, [user, loadMedications]);

  useFocusEffect(
    React.useCallback(() => {
      // Reset animation values
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      // Start animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        // Cleanup if needed
      };
    }, [])
  );

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
      await medicationService.deleteMedication(user!.primaryEmailAddress!.emailAddress, id);
      setMedications(medications.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting medication:', error);
    }
  };

  const handleModalSubmit = async (medication: Medication) => {
    try {
      const userEmail = user!.primaryEmailAddress!.emailAddress;
      console.log('Sending medication data to backend:', {
        ...medication,
        user_id: userEmail
      });

      if (selectedMedication) {
        const updated = await medicationService.updateMedication(userEmail, medication);
        console.log('Updated medication response:', updated);
        setMedications(medications.map(m => m.id === updated.id ? updated : m));
      } else {
        const newMedication = await medicationService.addMedication(userEmail, medication);
        console.log('New medication response:', newMedication);
        setMedications([...medications, newMedication]);
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving medication:', error);
    }
  };

  const formatTimeOfDay = (times: string[]) => {
    return times.join(', ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your medications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.list}>
        {medications.map((medication) => (
          <Animated.View
            key={medication.id}
            style={[
              styles.medicationCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.medicationHeader}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => handleEdit(medication)}
                  style={styles.actionButton}
                >
                  <Pencil size={20} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(medication.id)}
                  style={styles.actionButton}
                >
                  <Trash2 size={20} color={colors.danger} />
                </Pressable>
              </View>
            </View>

            <View style={styles.medicationDetails}>
              <Text style={styles.dosage}>
                {medication.dosage} • {medication.frequency}
              </Text>
              <View style={styles.timeContainer}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.timeText}>
                  {formatTimeOfDay(medication.timeOfDay)}
                </Text>
              </View>
              {medication.notes && (
                <Text style={styles.notes}>{medication.notes}</Text>
              )}
            </View>
          </Animated.View>
        ))}

        {medications.length === 0 && (
          <Animated.View
            style={[
              styles.emptyState,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.emptyText}>No medications added yet</Text>
          </Animated.View>
        )}
      </ScrollView>

      <Animated.View
        style={[
          styles.addButtonContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Pressable style={styles.addButton} onPress={handleAdd}>
          <Plus size={24} color={colors.background} />
          <Text style={styles.addButtonText}>Add Medication</Text>
        </Pressable>
      </Animated.View>

      <MedicationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        medication={selectedMedication}
        onSubmit={handleModalSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  medicationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...shadows.small,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  medicationDetails: {
    gap: 8,
  },
  dosage: {
    fontSize: 14,
    color: colors.text,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notes: {
    fontSize: 14,
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
});