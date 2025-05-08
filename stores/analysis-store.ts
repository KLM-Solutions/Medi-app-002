import { create } from 'zustand';
import { AnalysisResult, Medication } from '@/types/analysis';
import { saveAnalysisHistory, getAnalysisHistory, deleteAnalysisHistory } from '@/services/analysis-history';

interface AnalysisState {
  history: AnalysisResult[];
  medications: Medication[];
  apiKey: string | null;
  isLoading: boolean;
  error: string | null;
  addAnalysis: (result: AnalysisResult, userEmail: string) => Promise<void>;
  deleteAnalysis: (id: string, userEmail: string) => Promise<void>;
  clearHistory: () => void;
  addMedication: (medication: Medication) => void;
  updateMedication: (medication: Medication) => void;
  deleteMedication: (id: string) => void;
  setApiKey: (key: string | null) => void;
  setMedications: (medications: Medication[]) => void;
  fetchHistory: (userEmail: string) => Promise<void>;
}

export const useAnalysisStore = create<AnalysisState>()((set, get) => ({
      history: [],
      medications: [],
      apiKey: null,
  isLoading: false,
  error: null,

  addAnalysis: async (result, userEmail) => {
    try {
      set({ isLoading: true, error: null });
      await saveAnalysisHistory(result, userEmail);
      // Fetch fresh history after saving to ensure consistency
      const history = await getAnalysisHistory(userEmail);
      set({ history, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to save analysis', isLoading: false });
      throw error;
    }
  },

  deleteAnalysis: async (id, userEmail) => {
    try {
      set({ isLoading: true, error: null });
      await deleteAnalysisHistory(id, userEmail);
        set((state) => ({
        history: state.history.filter((item) => item.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to delete analysis', isLoading: false });
      throw error;
    }
  },

  clearHistory: () => set({ history: [] }),

      addMedication: (medication) =>
        set((state) => ({
      medications: [...state.medications, medication],
        })),

      updateMedication: (medication) =>
        set((state) => ({
          medications: state.medications.map((med) => 
            med.id === medication.id ? medication : med
      ),
        })),

      deleteMedication: (id) =>
        set((state) => ({
      medications: state.medications.filter((med) => med.id !== id),
        })),

      setApiKey: (key) =>
        set(() => ({
      apiKey: key,
        })),

      setMedications: (medications) =>
        set(() => ({
      medications,
    })),

  fetchHistory: async (userEmail) => {
    try {
      set({ isLoading: true, error: null });
      const history = await getAnalysisHistory(userEmail);
      set({ history, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch history', isLoading: false });
      throw error;
    }
  },
}));