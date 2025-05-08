import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@onboarding_status';
const ONBOARDING_SCREENS_KEY = '@onboarding_screens';

export interface OnboardingStatus {
  isCompleted: boolean;
  lastScreenViewed: number;
  completedAt?: string;
}

export interface OnboardingScreenStatus {
  screenNumber: number;
  viewed: boolean;
  viewedAt?: string;
}

export const onboardingStorage = {
  // Get the overall onboarding status
  async getOnboardingStatus(): Promise<OnboardingStatus> {
    try {
      const status = await AsyncStorage.getItem(ONBOARDING_KEY);
      return status ? JSON.parse(status) : { isCompleted: false, lastScreenViewed: 0 };
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      return { isCompleted: false, lastScreenViewed: 0 };
    }
  },

  // Set the overall onboarding status
  async setOnboardingStatus(status: OnboardingStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(status));
    } catch (error) {
      console.error('Error setting onboarding status:', error);
    }
  },

  // Mark a specific screen as viewed
  async markScreenAsViewed(screenNumber: number): Promise<void> {
    try {
      const screens = await this.getScreensStatus();
      const updatedScreens = screens.map(screen => 
        screen.screenNumber === screenNumber 
          ? { ...screen, viewed: true, viewedAt: new Date().toISOString() }
          : screen
      );
      await AsyncStorage.setItem(ONBOARDING_SCREENS_KEY, JSON.stringify(updatedScreens));
    } catch (error) {
      console.error('Error marking screen as viewed:', error);
    }
  },

  // Get status of all screens
  async getScreensStatus(): Promise<OnboardingScreenStatus[]> {
    try {
      const screens = await AsyncStorage.getItem(ONBOARDING_SCREENS_KEY);
      if (!screens) {
        // Initialize with 6 screens
        const initialScreens = Array.from({ length: 6 }, (_, i) => ({
          screenNumber: i + 1,
          viewed: false
        }));
        await AsyncStorage.setItem(ONBOARDING_SCREENS_KEY, JSON.stringify(initialScreens));
        return initialScreens;
      }
      return JSON.parse(screens);
    } catch (error) {
      console.error('Error getting screens status:', error);
      return [];
    }
  },

  // Mark onboarding as completed
  async completeOnboarding(): Promise<void> {
    try {
      await this.setOnboardingStatus({
        isCompleted: true,
        lastScreenViewed: 6,
        completedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  },

  // Reset onboarding data
  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      await AsyncStorage.removeItem(ONBOARDING_SCREENS_KEY);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }
}; 