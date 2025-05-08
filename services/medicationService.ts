import { Medication } from '@/types/analysis';

const API_URL = 'https://food-app-backend-psi-eosin.vercel.app/api/medications';

const transformToDbFormat = (medication: Medication) => ({
  name: medication.name,
  dosage: medication.dosage,
  frequency: medication.frequency,
  time_of_day: medication.timeOfDay,
  notes: medication.notes,
});

export const medicationService = {
  async getMedications(userId: string): Promise<Medication[]> {
    const response = await fetch(`${API_URL}?user_id=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch medications');
    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id.toString(),
      name: item.name,
      dosage: item.dosage,
      frequency: item.frequency,
      timeOfDay: item.time_of_day,
      notes: item.notes,
    }));
  },

  async addMedication(userId: string, medication: Omit<Medication, 'id'>): Promise<Medication> {
    const id = Date.now().toString();
    const dataToSend = {
      id,
      ...transformToDbFormat(medication as Medication),
      user_id: userId,
    };
    
    console.log('Sending data to backend:', dataToSend);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API Error Response:', error);
      throw new Error('Failed to add medication');
    }

    const data = await response.json();
    return {
      id: data.id.toString(),
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      timeOfDay: data.time_of_day,
      notes: data.notes,
    };
  },

  async updateMedication(userId: string, medication: Medication): Promise<Medication> {
    const dataToSend = {
      id: medication.id,
      ...transformToDbFormat(medication),
      user_id: userId,
    };

    console.log('Sending update data to backend:', dataToSend);

    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API Error Response:', error);
      throw new Error('Failed to update medication');
    }

    const data = await response.json();
    return {
      id: data.id.toString(),
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      timeOfDay: data.time_of_day,
      notes: data.notes,
    };
  },

  async deleteMedication(userId: string, medicationId: string): Promise<void> {
    const response = await fetch(`${API_URL}?user_id=${userId}&id=${medicationId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      console.error('API Error Response:', error);
      throw new Error('Failed to delete medication');
    }
  },
}; 