import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Modal, Pressable } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { colors } from '@/constants/colors';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { Pencil, X } from 'lucide-react-native';

interface PersonalInfo {
  name: string;
  age: number;
  weight: number;
  weightUnit: string;
  height: number;
  heightUnit: string;
  activity_level: string;
}

interface OnboardingData {
  personalInfo?: PersonalInfo;
  goal?: string;
  trackMedications?: boolean;
}

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'light', label: 'Lightly active (1-3 days/week)' },
  { value: 'moderate', label: 'Moderately active (3-5 days/week)' },
  { value: 'very', label: 'Very active (6-7 days/week)' },
  { value: 'extra', label: 'Extra active (very active + physical job)' }
];

const formatValue = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '-';
  // Remove decimal places if they're .00
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
};

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut, getToken } = useAuth();
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchOnboardingData();
  }, [user]);

  const fetchOnboardingData = async () => {
    try {
      if (!user?.primaryEmailAddress?.emailAddress) return;

      const token = await getToken();
      const userId = user.primaryEmailAddress.emailAddress;

      // Fetch personal info
      const personalInfoResponse = await fetch(
        `https://food-app-backend-psi-eosin.vercel.app/api/onboarding/screen2?userId=${userId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const personalInfoData = await personalInfoResponse.json();

      // Fetch goal
      const goalResponse = await fetch(
        `https://food-app-backend-psi-eosin.vercel.app/api/onboarding/screen3?userId=${userId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const goalData = await goalResponse.json();

      // Fetch medication tracking preference
      const medicationResponse = await fetch(
        `https://food-app-backend-psi-eosin.vercel.app/api/onboarding/screen4?userId=${userId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const medicationData = await medicationResponse.json();

      setOnboardingData({
        personalInfo: personalInfoData.data,
        goal: goalData.data?.selected_goal,
        trackMedications: medicationData.data?.track_medications
      });
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/sign-in');
  };

  const handleEdit = (field: string) => {
    setEditingField(field);
    if (field === 'activity_level') {
      setShowActivityModal(true);
    } else {
      const value = onboardingData.personalInfo?.[field as keyof typeof onboardingData.personalInfo];
      setEditValue(value?.toString() || '');
    }
  };

  const handleSave = async () => {
    if (!editingField || !user?.primaryEmailAddress?.emailAddress) return;

    try {
      setIsSaving(true);
      const token = await getToken();
      const userId = user.primaryEmailAddress.emailAddress;

      // Get current values from onboardingData
      const currentData: PersonalInfo = onboardingData.personalInfo || {
        name: '',
        age: 0,
        weight: 0,
        weightUnit: 'lbs',
        height: 0,
        heightUnit: 'ft',
        activity_level: ''
      };
      
      // Create updated data object with all required fields
      const updatedData = {
        name: currentData.name,
        age: currentData.age,
        weight: currentData.weight,
        weightUnit: currentData.weightUnit,
        height: currentData.height,
        heightUnit: currentData.heightUnit,
        activityLevel: currentData.activity_level,
        // Update the field being edited
        [editingField]: editValue
      };

      // Convert numeric fields
      if (editingField === 'age' || editingField === 'weight' || editingField === 'height') {
        updatedData[editingField] = parseFloat(editValue);
      }

      const response = await fetch('https://food-app-backend-psi-eosin.vercel.app/api/onboarding/screen2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          ...updatedData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update data');
      }

      const data = await response.json();
      if (data.success) {
        setOnboardingData(prev => ({
          ...prev,
          personalInfo: data.data
        }));
      }
    } catch (error) {
      console.error('Error updating data:', error);
      alert(error instanceof Error ? error.message : 'Failed to update data. Please try again.');
    } finally {
      setIsSaving(false);
      setEditingField(null);
      setEditValue('');
    }
  };

  const handleActivitySelect = async (level: string) => {
    setEditValue(level);
    setShowActivityModal(false);
    setEditingField('activity_level');
    await handleSave();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        {user?.imageUrl ? (
          <Image
            source={{ uri: user.imageUrl }}
            style={styles.profileImage}
          />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImageText}>
              {user?.firstName?.[0] || 'U'}
            </Text>
          </View>
        )}
        <Text style={styles.name}>
          {onboardingData.personalInfo?.name || `${user?.firstName} ${user?.lastName}`}
        </Text>
        <Text style={styles.email}>{user?.emailAddresses[0]?.emailAddress}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoCard}>
          <EditableInfoRow 
            label="Age" 
            value={`${formatValue(onboardingData.personalInfo?.age)} years`}
            onEdit={() => handleEdit('age')}
            isEditing={editingField === 'age'}
            editValue={editValue}
            setEditValue={setEditValue}
            onSave={handleSave}
            keyboardType="numeric"
          />
          <EditableInfoRow 
            label="Weight" 
            value={`${formatValue(onboardingData.personalInfo?.weight)} ${onboardingData.personalInfo?.weightUnit || 'lbs'}`}
            onEdit={() => handleEdit('weight')}
            isEditing={editingField === 'weight'}
            editValue={editValue}
            setEditValue={setEditValue}
            onSave={handleSave}
            keyboardType="numeric"
          />
          <EditableInfoRow 
            label="Height" 
            value={`${formatValue(onboardingData.personalInfo?.height)} ${onboardingData.personalInfo?.heightUnit || 'ft'}`}
            onEdit={() => handleEdit('height')}
            isEditing={editingField === 'height'}
            editValue={editValue}
            setEditValue={setEditValue}
            onSave={handleSave}
            keyboardType="numeric"
          />
          <EditableInfoRow 
            label="Activity Level" 
            value={activityLevels.find(level => level.value === onboardingData.personalInfo?.activity_level)?.label || '-'}
            onEdit={() => handleEdit('activity_level')}
            isEditing={editingField === 'activity_level'}
            editValue={editValue}
            setEditValue={setEditValue}
            onSave={handleSave}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Goals & Preferences</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Fitness Goal" value={onboardingData.goal || '-'} />
          <InfoRow 
            label="Track Medications" 
            value={onboardingData.trackMedications ? 'Yes' : 'No'} 
          />
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>

      <Modal
        visible={showActivityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActivityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Activity Level</Text>
              <TouchableOpacity onPress={() => setShowActivityModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
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
        </View>
      </Modal>
    </ScrollView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const EditableInfoRow = ({ 
  label, 
  value, 
  onEdit, 
  isEditing, 
  editValue, 
  setEditValue, 
  onSave,
  keyboardType = 'default'
}: { 
  label: string; 
  value: string; 
  onEdit: () => void; 
  isEditing: boolean; 
  editValue: string; 
  setEditValue: (value: string) => void; 
  onSave: () => void;
  keyboardType?: 'default' | 'numeric';
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    {isEditing ? (
      <View style={styles.editContainer}>
        <TextInput
          style={styles.editInput}
          value={editValue}
          onChangeText={setEditValue}
          keyboardType={keyboardType}
          autoFocus
          placeholder="Enter value"
          placeholderTextColor={colors.textSecondary}
        />
        <View style={styles.editButtons}>
          <TouchableOpacity 
            onPress={() => {
              setEditValue('');
              onEdit();
            }} 
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSave} style={[styles.editButton, styles.saveButton]}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : (
      <TouchableOpacity onPress={onEdit} style={styles.valueContainer}>
        <Text style={styles.infoValue}>{value}</Text>
        <Pencil size={16} color={colors.primary} />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
    width: '30%',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  editContainer: {
    flex: 1,
    marginLeft: 16,
  },
  editInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  editButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
    marginTop: 'auto',
  },
  signOutButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
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
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.text,
  },
}); 