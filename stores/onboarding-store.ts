import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
}

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  userProfile: UserProfile | null;
  setHasCompletedOnboarding: (completed: boolean) => void;
  setUserProfile: (profile: UserProfile) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      userProfile: null,
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      setUserProfile: (profile) => set({ userProfile: profile }),
    }),
    {
      name: 'onboarding-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 