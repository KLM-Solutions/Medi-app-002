import { Medication } from '@/types/analysis';

const API_URL = 'https://food-app-backend-psi-eosin.vercel.app';

export const medicationService = {
  async getMedications(user_id: string): Promise<Medication[]> {
    try {
      const response = await fetch(`${API_URL}/api/medications?user_id=${encodeURIComponent(user_id)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Add CORS headers
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        mode: 'cors', // Enable CORS
        credentials: 'include' // Include credentials if needed
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch medications: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error in getMedications:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  async addMedication(user_id: string, medication: Medication): Promise<Medication> {
    try {
      const response = await fetch(`${API_URL}/api/medications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({
          ...medication,
          user_id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add medication: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error in addMedication:', error);
      throw error;
    }
  },

  async updateMedication(user_id: string, medication: Medication): Promise<Medication> {
    try {
      const response = await fetch(`${API_URL}/api/medications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({
          ...medication,
          user_id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update medication: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error in updateMedication:', error);
      throw error;
    }
  },

  async deleteMedication(user_id: string, id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/medications?id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(user_id)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        mode: 'cors',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete medication: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in deleteMedication:', error);
      throw error;
    }
  },
}; 