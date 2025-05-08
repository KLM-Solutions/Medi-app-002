import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Image, Modal, Animated, Dimensions } from 'react-native';
import { Camera, ImageIcon, RefreshCw, Scale, Info, Scissors, Menu, ArrowLeft, ChevronRight, X, Flame, Egg, Wheat, Droplet, Sprout } from 'lucide-react-native';
import { colors, shadows } from '@/constants/colors';
import { useAnalysisStore } from '@/stores/analysis-store';
import { useImagePicker } from '@/hooks/use-image-picker';
import { analyzeImage } from '@/services/gemini-api';
import { AnalysisResult } from '@/types/analysis';
import { HealthCategoryBadge } from '@/components/HealthCategoryBadge';
import { ConfidenceIndicator } from '@/components/ConfidenceIndicator';
import { AlertModal } from '@/components/AlertModal';
import { showAlert, setWebAlertState } from '@/utils/alert';
import { CameraPreview } from '@/components/CameraPreview';
import { Platform } from 'react-native';
import { analyzeFoodComparison } from '@/services/food-analysis-api';
import { summarizeMealAnalysis, analyzeMealStitchItem, AnalysisResponse, ParsedAnalysis } from '@/services/meal-stitch-api';
import { FormattedText } from '@/components/FormattedText';
import { useAuth } from '@clerk/clerk-expo';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useUser } from '@clerk/clerk-expo';
import { medicationService } from '@/services/medicationService';

type Feature = 'analyzer' | 'comparison' | 'meal-stitch';

// Add this helper function near the top of the component (before return)
function parseMedicationAlert(alert: string) {
  // Split by subheadings (e.g., **Medication:**, **Category:**, etc.)
  const regex = /\*\*(.+?):\*\*/g;
  let match;
  let lastIndex = 0;
  const sections = [];
  while ((match = regex.exec(alert)) !== null) {
    if (sections.length > 0) {
      // Set content for previous section
      sections[sections.length - 1].content = alert.slice(lastIndex, match.index).trim();
    }
    sections.push({ heading: match[1], content: '' });
    lastIndex = regex.lastIndex;
  }
  if (sections.length > 0) {
    sections[sections.length - 1].content = alert.slice(lastIndex).trim();
  }
  return sections.filter(s => s.content && s.content.length > 0);
}

export default function AnalysisScreen() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [isBeforeImage, setIsBeforeImage] = useState(true);
  const [showFeatureSelector, setShowFeatureSelector] = useState(false);
  const [mealStitchImageCount, setMealStitchImageCount] = useState<number>(2);
  const [mealStitchImages, setMealStitchImages] = useState<(string | null)[]>(new Array(2).fill(null));
  const [mealSummary, setMealSummary] = useState<string | null>(null);
  const [completedAnalyses, setCompletedAnalyses] = useState<number>(0);
  const [analyses, setAnalyses] = useState<(AnalysisResponse & { parsed: ParsedAnalysis })[]>([]);
  const [mealStitchCaptureIndex, setMealStitchCaptureIndex] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<'Nutrition' | 'Insights'>('Nutrition');
  const [uploadOptionsAnim] = useState(new Animated.Value(0));
  const [uploadOptionsVisible, setUploadOptionsVisible] = useState(false);
  
  const { pickImage, takePhoto } = useImagePicker();
  const { apiKey, medications, addAnalysis, setMedications } = useAnalysisStore();

  // Add useEffect to fetch medications when component mounts
  useEffect(() => {
    const fetchMedications = async () => {
      if (user?.primaryEmailAddress?.emailAddress) {
        try {
          const data = await medicationService.getMedications(user.primaryEmailAddress.emailAddress);
          setMedications(data);
        } catch (error) {
          console.error('Error loading medications:', error);
        }
      }
    };

    fetchMedications();
  }, [user, setMedications]);

  // Add useFocusEffect to fetch medications when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const fetchMedications = async () => {
        if (user?.primaryEmailAddress?.emailAddress) {
          try {
            const data = await medicationService.getMedications(user.primaryEmailAddress.emailAddress);
            setMedications(data);
          } catch (error) {
            console.error('Error loading medications:', error);
          }
        }
      };

      fetchMedications();
    }, [user, setMedications])
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const menuSlideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const menuFadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const summaryRef = useRef<View>(null);

  // Add initial mount animation
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

  // Set up web alert state
  React.useEffect(() => {
    setWebAlertState({
      setVisible: setAlertVisible,
      setTitle: setAlertTitle,
      setMessage: setAlertMessage,
      setCallback: () => {},
    });
  }, []);

  useEffect(() => {
    // Reset animation when feature changes
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [selectedFeature]);

  useEffect(() => {
    // Slide to the right for Insights, to the left for Nutrition
    Animated.spring(slideAnim, {
      toValue: selectedTab === 'Nutrition' ? 0 : 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [selectedTab]);

  // Calculate interpolated values for the transform
  const nutritionTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30] // Move left when inactive
  });
  
  const insightsTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0] // Move right when inactive
  });

  const nutritionOpacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.3, 0]
  });
  
  const insightsOpacity = slideAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.3, 1]
  });

  const handleAnalysis = async (base64Image: string) => {
    try {
      setLoading(true);
      setCurrentAnalysis(null);
      setAnalyses([]);
      setCompletedAnalyses(0);
      setMealSummary(null);

      let result: AnalysisResult;
      if (selectedFeature === 'analyzer') {
        // Pass the medications from the store to analyzeImage
        console.log('Starting analyzer feature analysis...');
        result = await analyzeImage(base64Image, medications);
        console.log('Analyzer API Response:', result);
        // Add console logging for medication warnings
        console.log('Medication Warnings from API Response:', result.medicationAlerts);
        if (result.medicationAlerts && result.medicationAlerts.length > 0) {
          console.log('Medication Warning Text:', result.medicationAlerts.join('\n'));
        }
      } else if (selectedFeature === 'comparison') {
        if (!beforeImage || !afterImage) {
          showAlert({
            title: 'Error',
            message: 'Please capture both before and after images',
          });
          return;
        }
        console.log('Starting comparison feature analysis...');
        const comparisonResult = await analyzeFoodComparison(beforeImage, afterImage);
        console.log('Comparison API Response:', comparisonResult);
        // Convert comparison result to AnalysisResult format
        result = {
          id: Date.now().toString(),
          imageUri: `data:image/jpeg;base64,${base64Image}`,
          items: [],
          description: comparisonResult,
          category: 'Unknown',
          confidence: 1,
          timestamp: Date.now()
        };
      } else if (selectedFeature === 'meal-stitch') {
        // Handle meal stitch analysis
        console.log('Starting meal stitch analysis...');
        const newAnalyses = [...analyses];
        const newAnalysis = await analyzeMealStitchItem(base64Image, completedAnalyses + 1);
        console.log('Meal Stitch Item Analysis Response:', newAnalysis);
        newAnalyses.push(newAnalysis);
        setAnalyses(newAnalyses);
        setCompletedAnalyses(prev => prev + 1);

        if (completedAnalyses + 1 === mealStitchImageCount) {
          console.log('Generating meal summary...');
          const summary = await summarizeMealAnalysis(newAnalyses);
          console.log('Meal Summary Response:', summary);
          setMealSummary(summary.synthesis);
          setAlertVisible(true);
          setAlertTitle('Meal Analysis Complete');
          setAlertMessage(summary.synthesis);
        }
        return;
      } else {
        throw new Error('Invalid feature selected');
      }
      
      setCurrentAnalysis(result);
      console.log('Final Analysis Result:', result);

      // Save to history if user is signed in
      if (user?.primaryEmailAddress?.emailAddress) {
        try {
          await useAnalysisStore.getState().addAnalysis(result, user.primaryEmailAddress.emailAddress);
          console.log('Analysis saved to history successfully');
        } catch (error) {
          console.error('Error saving analysis history:', error);
          // Don't show error to user as this is not critical
        }
      }

      // Only show the analysis complete alert
      setAlertVisible(true);
      setAlertTitle('Analysis Complete');
      setAlertMessage('Your food has been analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to analyze image. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    try {
      // Clear previous analysis before starting new one
      setCurrentAnalysis(null);
      // Scroll to top
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      
      const base64Image = await pickImage();
      if (base64Image) {
        await handleAnalysis(base64Image);
      }
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to pick image. Please try again.',
      });
    }
  };

  const handleTakePhoto = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    // Clear previous analysis before starting new one
    setCurrentAnalysis(null);
    // Scroll to top
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    
    if (Platform.OS === 'web') {
      setShowCameraPreview(true);
    } else {
      try {
        const base64Image = await takePhoto();
        if (base64Image) {
          await handleAnalysis(base64Image);
        }
      } catch (error) {
        showAlert({
          title: 'Error',
          message: 'Failed to take photo. Please try again.',
        });
      }
    }
  };

  const handleCameraCapture = async (base64Image: string) => {
    setShowCameraPreview(false);
    // Clear previous analysis before starting new one
    setCurrentAnalysis(null);
    // Scroll to top
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    
    await handleAnalysis(base64Image);
  };

  const handleComparisonCameraCapture = async (base64Image: string) => {
    setShowCameraPreview(false);
    if (isBeforeImage) {
      setBeforeImage(base64Image);
    } else {
      setAfterImage(base64Image);
    }
  };

  const handleRefresh = () => {
    setAlertVisible(true);
    setAlertTitle('Confirm Reset');
    setAlertMessage('This will clear the current analysis. The result will still be saved in history. Continue?');
  };

  const confirmRefresh = () => {
    setCurrentAnalysis(null);
    setAlertVisible(false);
  };

  const handlePickBeforeImage = async (useCamera: boolean = false) => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    try {
      if (useCamera) {
        if (Platform.OS === 'web') {
          setShowCameraPreview(true);
        } else {
          const base64Image = await takePhoto();
          if (base64Image) {
            setBeforeImage(base64Image);
          }
        }
        setIsBeforeImage(true);
      } else {
        const base64Image = await pickImage();
        if (base64Image) {
          setBeforeImage(base64Image);
        }
      }
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to pick image. Please try again.',
      });
    }
  };

  const handlePickAfterImage = async (useCamera: boolean = false) => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    try {
      if (useCamera) {
        if (Platform.OS === 'web') {
          setShowCameraPreview(true);
        } else {
          const base64Image = await takePhoto();
          if (base64Image) {
            setAfterImage(base64Image);
          }
        }
        setIsBeforeImage(false);
      } else {
        const base64Image = await pickImage();
        if (base64Image) {
          setAfterImage(base64Image);
        }
      }
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to pick image. Please try again.',
      });
    }
  };

  const handleAnalyzeDifference = async () => {
    if (!beforeImage || !afterImage) {
      showAlert({
        title: 'Missing Images',
        message: 'Please upload both before and after images to analyze the difference.',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Ensure we're sending base64 strings without the data URI prefix
      const beforeBase64 = beforeImage.startsWith('data:image/jpeg;base64,') 
        ? beforeImage.split(',')[1] 
        : beforeImage;
      
      const afterBase64 = afterImage.startsWith('data:image/jpeg;base64,') 
        ? afterImage.split(',')[1] 
        : afterImage;

      const analysisResult = await analyzeFoodComparison(beforeBase64, afterBase64);
      
      showAlert({
        title: 'Analysis Complete',
        message: analysisResult,
      });
    } catch (error) {
      showAlert({
        title: 'Analysis Error',
        message: (error as Error).message || 'Failed to analyze images. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMealStitchImageCountChange = (count: number) => {
    setMealStitchImageCount(count);
    setMealStitchImages(new Array(count).fill(null));
    setMealSummary(null);
    setAnalyses([]);
    setCompletedAnalyses(0);
  };

  const handleMealStitchImageUpload = async (index: number, useCamera: boolean = false) => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    try {
      if (useCamera) {
        if (Platform.OS === 'web') {
          setMealStitchCaptureIndex(index);
          setShowCameraPreview(true);
          return;
        } else {
          const base64Image = await takePhoto();
          if (base64Image) {
            await processMealStitchImage(base64Image, index);
          }
        }
      } else {
        // Handle gallery pick
        const base64Image = await pickImage();
        if (!base64Image) {
          showAlert({
            title: 'Error',
            message: 'Failed to get image. Please try again.',
          });
          return;
        }

        await processMealStitchImage(base64Image, index);
      }
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to pick image. Please try again.',
      });
    }
  };

  const handleMealStitchCameraCapture = async (base64Image: string) => {
    setShowCameraPreview(false);
    if (mealStitchCaptureIndex !== null) {
      await processMealStitchImage(base64Image, mealStitchCaptureIndex);
      setMealStitchCaptureIndex(null);
    }
  };

  const processMealStitchImage = async (base64Image: string, index: number) => {
    setIsAnalyzing(true);
    console.log(`Processing meal stitch image ${index + 1}...`);
    // Update the images array first
    const newImages = [...mealStitchImages];
    newImages[index] = base64Image;
    setMealStitchImages(newImages);

    try {
      // Then analyze the image
      console.log(`Analyzing meal stitch item ${index + 1}...`);
      const result = await analyzeMealStitchItem(base64Image, index + 1);
      console.log(`Meal stitch item ${index + 1} analysis result:`, result);
      
      // Update analyses array
      const newAnalyses = [...analyses];
      newAnalyses[index] = result;
      setAnalyses(newAnalyses);
      
      // Update completed analyses count
      setCompletedAnalyses(prev => prev + 1);
      console.log(`Completed analyses: ${completedAnalyses + 1}/${mealStitchImageCount}`);

      // Show success message
      setAlertTitle('Success');
      setAlertMessage(`Item ${index + 1} has been analyzed successfully.`);
      setAlertVisible(true);
    } catch (analysisError) {
      console.error(`Error analyzing meal stitch item ${index + 1}:`, analysisError);
      // If analysis fails, keep the image but don't count it as analyzed
      showAlert({
        title: 'Analysis Error',
        message: `Failed to analyze item ${index + 1}. The image was saved but needs to be re-analyzed.`,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMealStitchAnalysis = async () => {
    try {
      setLoading(true);
      console.log('Starting meal stitch summary analysis...');
      console.log('Current analyses:', analyses);
      const summary = await summarizeMealAnalysis(analyses);
      console.log('Meal stitch summary result:', summary);
      
      // Store the summary in state
      setMealSummary(summary.synthesis);

      // Scroll to summary after a short delay to ensure it's rendered
      setTimeout(() => {
        summaryRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y, animated: true });
          },
          () => console.log('Failed to measure layout')
        );
      }, 100);
    } catch (error) {
      console.error('Error in meal stitch analysis:', error);
      showAlert({
        title: 'Analysis Error',
        message: 'Failed to analyze the meal. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMealStitchReset = () => {
    setMealStitchImages(new Array(mealStitchImageCount).fill(null));
    setMealSummary(null);
    setAnalyses([]);
    setCompletedAnalyses(0);
  };

  const formatTextWithBold = (text: string) => {
    // Remove the labels from the text
    const cleanedText = text
      .replace(/Caloric Content:\s*/g, '')
      .replace(/Macronutrients:\s*/g, '')
      .replace(/Nutritional Profile:\s*/g, '')
      .replace(/Health Implications:\s*/g, '')
      .replace(/Note:\s*/g, '')
      .replace(/Processing Level:\s*/g, '')
      .replace(/Items Identified:\s*/g, '');

    const parts = cleanedText.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={styles.boldText}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const handleFeatureSelect = async (feature: Feature) => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    // Fetch medications when analyzer feature is selected
    if (feature === 'analyzer' && user?.primaryEmailAddress?.emailAddress) {
      try {
        const data = await medicationService.getMedications(user.primaryEmailAddress.emailAddress);
        setMedications(data);
      } catch (error) {
        console.error('Error loading medications:', error);
      }
    }

    setSelectedFeature(feature);
    
    // First animate the menu closing
    Animated.parallel([
      Animated.timing(menuFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(menuSlideAnim, {
        toValue: Dimensions.get('window').height,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Then actually update the state
      setShowFeatureSelector(false);
    });
    
    if (feature === 'meal-stitch') {
      setMealStitchImageCount(2);
      setMealStitchImages(new Array(2).fill(null));
    } else if (feature === 'comparison') {
      setBeforeImage(null);
      setAfterImage(null);
    }
  };

  const handleImagePreview = (imageUri: string) => {
    console.log("Preview image URI:", imageUri);
    setPreviewImageUri(imageUri);
    setShowImagePreview(true);
  };

  const handleEmptySlotPress = (index: number) => {
    setSelectedSlotIndex(index);
    setUploadOptionsVisible(true);
    Animated.spring(uploadOptionsAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  };

  const handleUploadOptionSelect = (useCamera: boolean) => {
    if (selectedSlotIndex !== null) {
      Animated.spring(uploadOptionsAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 10,
      }).start(() => {
        setUploadOptionsVisible(false);
        handleMealStitchImageUpload(selectedSlotIndex, useCamera);
      });
    }
    setSelectedSlotIndex(null);
  };

  const FeatureSelector = () => (
    <View style={styles.featureSelectorContainer}>
      <View style={styles.featureSelectorList}>
        <Pressable
          style={({ pressed }) => [
            styles.featureSelectorItem,
            pressed && styles.featureSelectorItemPressed
          ]}
          onPress={() => handleFeatureSelect('analyzer')}
        >
          <View style={styles.featureIconContainer}>
            <Camera size={28} color={colors.primary} />
          </View>
          <View style={styles.featureSelectorTextContainer}>
            <Text style={styles.featureSelectorItemTitle}>Take a Picture</Text>
            <Text style={styles.featureSelectorItemDescription}>Analyze a single food item or meal</Text>
          </View>
          <View style={styles.featureSelectorArrow}>
            <ChevronRight size={20} color={colors.textSecondary} />
          </View>
        </Pressable>

        <View style={styles.featureDivider} />

        <Pressable
          style={({ pressed }) => [
            styles.featureSelectorItem,
            pressed && styles.featureSelectorItemPressed
          ]}
          onPress={() => handleFeatureSelect('comparison')}
        >
          <View style={styles.featureIconContainer}>
            <ImageIcon size={28} color={colors.primary} />
          </View>
          <View style={styles.featureSelectorTextContainer}>
            <Text style={styles.featureSelectorItemTitle}>Before/After</Text>
            <Text style={styles.featureSelectorItemDescription}>Compare before and after eating</Text>
          </View>
          <View style={styles.featureSelectorArrow}>
            <ChevronRight size={20} color={colors.textSecondary} />
          </View>
        </Pressable>

        <View style={styles.featureDivider} />

        <Pressable
          style={({ pressed }) => [
            styles.featureSelectorItem,
            pressed && styles.featureSelectorItemPressed
          ]}
          onPress={() => handleFeatureSelect('meal-stitch')}
        >
          <View style={styles.featureIconContainer}>
            <Scissors size={28} color={colors.primary} />
          </View>
          <View style={styles.featureSelectorTextContainer}>
            <Text style={styles.featureSelectorItemTitle}>Meal Stitch</Text>
            <Text style={styles.featureSelectorItemDescription}>Combine multiple food items into one meal</Text>
          </View>
          <View style={styles.featureSelectorArrow}>
            <ChevronRight size={20} color={colors.textSecondary} />
          </View>
        </Pressable>
      </View>
    </View>
  );

  // Animation for feature selector
  useEffect(() => {
    if (showFeatureSelector) {
      // Fade in the overlay
      Animated.timing(menuFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Slide up the content
      Animated.spring(menuSlideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out the overlay
      Animated.timing(menuFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // Slide down the content
      Animated.spring(menuSlideAnim, {
        toValue: Dimensions.get('window').height,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  }, [showFeatureSelector]);

  return (
    <View style={styles.container}>
      {isAnalyzing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingOverlayText}>Analyzing your food...</Text>
        </View>
      )}
      {showCameraPreview ? (
        <CameraPreview
          onCapture={
            selectedFeature === 'comparison' 
              ? handleComparisonCameraCapture 
              : selectedFeature === 'meal-stitch'
                ? handleMealStitchCameraCapture
                : handleCameraCapture
          }
          onClose={() => {
            setShowCameraPreview(false);
            if (selectedFeature === 'meal-stitch') {
              setMealStitchCaptureIndex(null);
            }
          }}
        />
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Analyzing your food...</Text>
            </View>
          ) : !selectedFeature ? (
            <Animated.View 
              style={[
                styles.featuresContainer, 
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={styles.featuresTitle}>Choose a Feature</Text>
              <Text style={styles.featuresSubtitle}>Select how you'd like to analyze your food</Text>
              {!isSignedIn && (
                <Animated.View 
                  style={[
                    styles.authCard,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }]
                    }
                  ]}
                >
                  <View style={styles.authIconContainer}>
                    <ImageIcon size={40} color={colors.primary} />
                  </View>
                  <Text style={styles.authTitle}>Welcome to Food Analyzer</Text>
                  <Text style={styles.authDescription}>
                    Sign in to access all features and start analyzing your food
                  </Text>
                  <View style={styles.authButtonContainer}>
                    <Pressable
                      style={[styles.authButton, styles.signInButton]}
                      onPress={() => router.push('/sign-in')}
                    >
                      <Text style={styles.authButtonText}>Sign In</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.authButton, styles.signUpButton]}
                      onPress={() => router.push('/sign-up')}
                    >
                      <Text style={[styles.authButtonText, styles.signUpButtonText]}>Sign Up</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              )}
              {isSignedIn && <FeatureSelector />}
            </Animated.View>
          ) : selectedFeature === 'analyzer' ? (
            <Animated.View 
              style={[
                styles.content, 
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.titleContainer}>
                <Pressable 
                  onPress={() => setSelectedFeature(null)}
                  style={styles.backButton}
                >
                  <ArrowLeft size={24} color={colors.primary} />
                </Pressable>
                <Text style={styles.title}>Food Analyzer</Text>
                {currentAnalysis && (
                  <Pressable 
                    onPress={handleRefresh}
                    style={({ pressed }) => [
                      styles.refreshButton,
                      pressed && styles.refreshButtonPressed
                    ]}
                  >
                    <RefreshCw size={24} color={colors.text} />
                  </Pressable>
                )}
                {!currentAnalysis && <View style={styles.titleSpacer} />}
              </View>
              <Text style={styles.subtitle}>
                Take a photo or choose from your gallery to analyze your food
              </Text>

              {!currentAnalysis ? (
                <View style={styles.buttonContainer}>
                  <Pressable
                    style={[styles.button, styles.cameraButton]}
                    onPress={handleTakePhoto}
                  >
                    <Camera size={24} color={colors.background} />
                    <Text style={styles.buttonText}>Take Photo</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.button, styles.galleryButton]}
                    onPress={handlePickImage}
                  >
                    <ImageIcon size={24} color={colors.text} />
                    <Text style={styles.galleryButtonText}>Choose</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={[styles.analysisContainer, { paddingLeft: 0, paddingRight: 0, marginLeft: 0, marginRight: 0 }]}>
                  {/* Segmented Control for Nutrition/Insights */}
                  <View style={styles.segmentedControl}>
                    <Pressable
                      style={[styles.segmentButton, selectedTab === 'Nutrition' && styles.segmentButtonActive]}
                      onPress={() => setSelectedTab('Nutrition')}
                    >
                      <Text style={[styles.segmentButtonText, selectedTab === 'Nutrition' && styles.segmentButtonTextActive]}>Nutrition</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.segmentButton, selectedTab === 'Insights' && styles.segmentButtonActive]}
                      onPress={() => setSelectedTab('Insights')}
                    >
                      <Text style={[styles.segmentButtonText, selectedTab === 'Insights' && styles.segmentButtonTextActive]}>Insights</Text>
                    </Pressable>
                  </View>

                  {/* Replace fade animation with slide animation */}
                  <View style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Nutrition Tab with animations */}
                    <Animated.View 
                      style={{ 
                        position: selectedTab === 'Insights' ? 'absolute' : 'relative',
                        width: '100%',
                        opacity: nutritionOpacity,
                        transform: [{ translateX: nutritionTranslate }],
                        zIndex: selectedTab === 'Nutrition' ? 1 : 0
                      }}
                    >
                      <View style={{  borderRadius: 20, padding: 20, marginBottom: 16 }}>
                        {/* Uploaded Food Image (always shown at top) */}
                        {currentAnalysis.imageUri && (
                          <View style={{ width: '100%', aspectRatio: 4/3, backgroundColor: '#f5f5f5', borderRadius: 12, marginBottom: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0' }}>
                            <Pressable 
                              onPress={() => {
                                const fullImageUri = currentAnalysis.imageUri.startsWith('data:image/') 
                                  ? currentAnalysis.imageUri 
                                  : `data:image/jpeg;base64,${currentAnalysis.imageUri}`;
                                handleImagePreview(fullImageUri);
                              }}
                              style={{ width: '100%', height: '100%' }}
                            >
                              <Image
                                source={{
                                  uri: currentAnalysis.imageUri.startsWith('data:image/')
                                    ? currentAnalysis.imageUri
                                    : `data:image/jpeg;base64,${currentAnalysis.imageUri}`
                                }}
                                style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                              />
                            </Pressable>
                          </View>
                        )}
                        {/* Food Name, Calories, Health Badge, Score */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 10 }}>
                              {currentAnalysis.dishName || currentAnalysis.items[0] || 'Food Item'}
                            </Text>
                            <View style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: 2 }}>
                              {/* Health Category Badge */}
                              {currentAnalysis.category && (
                                <HealthCategoryBadge category={currentAnalysis.category} size={18} />
                              )}
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8  }}>
                                <Flame size={16} color="#FF9500" style={{ marginRight: 4 }} />
                                <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 15 }}>
                                  {typeof currentAnalysis.calories === 'number' ? `${currentAnalysis.calories} calories` : '-'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          {/* Score Circle */}
                          <View style={{ alignItems: 'center', justifyContent: 'center', width: 100, height: 100 }}>
                            <Svg width={88} height={88}>
                              <Circle
                                cx={44}
                                cy={44}
                                r={38}
                                stroke="#e0e0e0"
                                strokeWidth={8}
                                fill="none"
                              />
                              <Circle
                                cx={44}
                                cy={44}
                                r={38}
                                stroke={colors.primary}
                                strokeWidth={8}
                                fill="none"
                                strokeDasharray={2 * Math.PI * 38}
                                strokeDashoffset={2 * Math.PI * 38 * (1 - ((currentAnalysis.confidence || 85) / 100))}
                                strokeLinecap="round"
                                rotation="-90"
                                origin="44,44"
                              />
                            </Svg>
                            <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', width: 64, height: 64 }}>
                              <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.primary }}>{Math.round(currentAnalysis.confidence || 85)}</Text>
                              <Text style={{ fontSize: 12, color: colors.textSecondary }}>/ 100</Text>
                            </View>
                          </View>
                        </View>

                        {/* Macronutrients Row */}
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Macronutrients</Text>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, backgroundColor: '#fafbfc', borderRadius: 20, padding: 16 }}>
                            {/* Protein */}
                            <View style={{ alignItems: 'center', flex: 1 }}>
                              <View style={{ backgroundColor: '#ecebff', borderRadius: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                                <Egg size={22} color="#6C47FF" />
                              </View>
                              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 2 }}>Protein</Text>
                              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                                {currentAnalysis.protein !== undefined ? `${currentAnalysis.protein}g` : '-'}
                              </Text>
                            </View>
                            {/* Carbs */}
                            <View style={{ alignItems: 'center', flex: 1 }}>
                              <View style={{ backgroundColor: '#ffeaea', borderRadius: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                                <Wheat size={22} color="#FF5A5F" />
                              </View>
                              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 2 }}>Carbs</Text>
                              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                                {currentAnalysis.carbs !== undefined ? `${currentAnalysis.carbs}g` : '-'}
                              </Text>
                            </View>
                            {/* Fats */}
                            <View style={{ alignItems: 'center', flex: 1 }}>
                              <View style={{ backgroundColor: '#fff6e6', borderRadius: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                                <Droplet size={22} color="#FF9500" />
                              </View>
                              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 2 }}>Fats</Text>
                              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                                {currentAnalysis.fats !== undefined ? `${currentAnalysis.fats}g` : '-'}
                              </Text>
                            </View>
                            {/* Fiber */}
                            <View style={{ alignItems: 'center', flex: 1 }}>
                              <View style={{ backgroundColor: '#e6ffe6', borderRadius: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                                <Sprout size={22} color="#4CD964" />
                              </View>
                              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 2 }}>Fiber</Text>
                              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                                {currentAnalysis.fiber !== undefined ? `${currentAnalysis.fiber}g` : '-'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Items Identified Card */}
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Items Identified</Text>
                          <View style={{ backgroundColor: '#fafbfc', borderRadius: 20, padding: 16, marginBottom: 18 }}>
                            {currentAnalysis && currentAnalysis.itemsIdentified ? (
                              typeof currentAnalysis.itemsIdentified === 'string' && 
                              currentAnalysis.itemsIdentified.includes('-') ? (
                                // If the text contains hyphens, split by hyphen and show as bullet points
                                currentAnalysis.itemsIdentified
                                  .split('-')
                                  .filter(str => str.trim().length > 0)
                                  .map((itemText, index, array) => (
                                    <View 
                                      key={index} 
                                      style={{ 
                                        flexDirection: 'row', 
                                        alignItems: 'flex-start', 
                                        marginBottom: index < array.length - 1 ? 8 : 0 
                                      }}
                                    >
                                      <Text style={{ fontSize: 16, color: colors.text, marginRight: 8 }}>•</Text>
                                      <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, flex: 1 }}>
                                        {itemText.trim()}
                                      </Text>
                                    </View>
                                  ))
                              ) : (
                                // Otherwise show as normal text
                                <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>
                                  {currentAnalysis.itemsIdentified}
                                </Text>
                              )
                            ) : currentAnalysis && currentAnalysis.items && currentAnalysis.items.length > 0 ? (
                              // If no itemsIdentified but there are items in the array
                              currentAnalysis.items.map((itemText, index) => (
                                <View 
                                  key={index} 
                                  style={{ 
                                    flexDirection: 'row', 
                                    alignItems: 'flex-start', 
                                    marginBottom: index < currentAnalysis.items.length - 1 ? 8 : 0 
                                  }}
                                >
                                  <Text style={{ fontSize: 16, color: colors.text, marginRight: 8 }}>•</Text>
                                  <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, flex: 1 }}>
                                    {itemText}
                                  </Text>
                                </View>
                              ))
                            ) : (
                              <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>
                                No items identified
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Nutritional Profile Card */}
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Nutritional Profile</Text>
                          <View style={{ backgroundColor: '#fafbfc', borderRadius: 20, padding: 16, marginBottom: 18 }}>
                            {currentAnalysis.nutritionalProfile ? (
                              <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>{currentAnalysis.nutritionalProfile}</Text>
                            ) : (
                              <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>No nutritional profile information available</Text>
                            )}
                          </View>
                        </View>
                        
                        {/* Caloric Content Card */}
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Caloric Content</Text>
                          <View style={{ backgroundColor: '#fafbfc', borderRadius: 20, padding: 16, marginBottom: 18 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                              <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, flex: 1 }}>{currentAnalysis.caloricContent || (typeof currentAnalysis.calories === 'number' ? `${currentAnalysis.calories} calories` : 'No caloric information available')}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Full Response Card */}
                        {/* <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Full Response</Text>
                          <View style={{ backgroundColor: '#fafbfc', borderRadius: 20, padding: 16, marginBottom: 18 }}>
                            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                              {currentAnalysis.fullResponse || 'No full response available'}
                            </Text>
                          </View>
                        </View> */}
                      </View>
                    </Animated.View>

                    {/* Insights Tab with animations */}
                    <Animated.View 
                      style={{ 
                        position: selectedTab === 'Nutrition' ? 'absolute' : 'relative',
                        width: '100%',
                        opacity: insightsOpacity,
                        transform: [{ translateX: insightsTranslate }],
                        zIndex: selectedTab === 'Insights' ? 1 : 0
                      }}
                    >
                      <View style={{ borderRadius: 20, padding: 20, marginBottom: 16}}>
                        <View style={{ marginTop: 0 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Medication Warnings</Text>
                          {currentAnalysis.medicationAlerts && currentAnalysis.medicationAlerts.length > 0 ? (
                            <View style={{ backgroundColor: '#FFF8E7', borderWidth: 1, borderColor: '#FFE9B0', borderRadius: 10, padding: 16, marginBottom: 8 }}>
                              {(() => {
                                const warnings = currentAnalysis.medicationAlerts;
                                if (!warnings) return null;
                                const combinedWarning = Array.isArray(warnings) ? warnings.join('') : warnings;
                                if (!combinedWarning) return null;
                                const firstAsteriskIndex = combinedWarning.indexOf('*');
                                const warningToShow = firstAsteriskIndex !== -1
                                  ? combinedWarning.slice(firstAsteriskIndex)
                                  : combinedWarning;
                                const formattedWarning = warningToShow.replace(/([^\n])\n([^\n])/g, '$1 $2');
                                // Split by bold markers (**...**)
                                const parts = formattedWarning.split(/(\*\*[^*]+\*\*)/g);
                                // Group each bold part and its following text as a new line
                                const lines = [];
                                for (let i = 0; i < parts.length; i++) {
                                  if (parts[i].startsWith('**') && parts[i].endsWith('**')) {
                                    const boldText = parts[i].slice(2, -2);
                                    const nextText = parts[i + 1] && !parts[i + 1].startsWith('**') ? parts[i + 1] : '';
                                    lines.push(
                                      <Text key={i} style={{ flexDirection: 'row' }}>
                                        <Text style={{ fontWeight: 'bold' }}>{boldText}</Text>
                                        <Text>{nextText}</Text>
                                      </Text>
                                    );
                                    if (nextText) i++; // skip the next part since it's already rendered
                                  } else if (i === 0 && parts[i]) {
                                    // If the first part is not bold, render it as the first line
                                    lines.push(
                                      <Text key={i}>{parts[i]}</Text>
                                    );
                                  }
                                }
                                return (
                                  <View>
                                    {lines.map((line, idx) => (
                                      <Text key={idx} style={{ marginBottom: 4 }}>{line}</Text>
                                    ))}
                                  </View>
                                );
                              })()}
                            </View>
                          ) : (
                            <Text style={{ color: colors.textSecondary }}>No medication warnings for this meal.</Text>
                          )}
                        </View>

                        {/* Macronutrients Details Card */}
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Macronutrients Details</Text>
                          <View style={{ backgroundColor: '#fafbfc', borderRadius: 20, padding: 16, marginBottom: 18 }}>
                            {currentAnalysis.macronutrients ? (
                              <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>{currentAnalysis.macronutrients}</Text>
                            ) : (
                              <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>No macronutrient information available</Text>
                            )}
                          </View>
                        </View>

                        {/* Processing Level Card */}
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Processing Level</Text>
                          <View style={{ backgroundColor: '#fafbfc', borderRadius: 20, padding: 16, marginBottom: 18 }}>
                            {currentAnalysis.processingLevel ? (
                              <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>{currentAnalysis.processingLevel}</Text>
                            ) : (
                              <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>No processing level information available</Text>
                            )}
                          </View>
                        </View>

                        {/* Health Implications Card */}
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Health Implications</Text>
                          <View style={{ backgroundColor: '#fafbfc', borderRadius: 20, padding: 16, marginBottom: 18 }}>
                            {currentAnalysis.healthImplications ? (
                              <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>{currentAnalysis.healthImplications}</Text>
                            ) : (
                              <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>No health implications information available</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </Animated.View>
                  </View>
                </View>
              )}
            </Animated.View>
          ) : selectedFeature === 'comparison' ? (
            <Animated.View 
              style={[
                styles.content, 
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.titleContainer}>
                <Pressable 
                  onPress={() => setSelectedFeature(null)}
                  style={styles.backButton}
                >
                  <ArrowLeft size={24} color={colors.primary} />
                </Pressable>
                <Text style={styles.title}>Before/After Comparison</Text>
                <View style={styles.titleSpacer} />
              </View>
              <Text style={styles.subtitle}>
                Upload photos of your meal before and after eating. We'll calculate the difference and identify what you consumed.
              </Text>

              <View style={styles.comparisonContainer}>
                <View style={styles.comparisonSection}>
                  <View style={styles.comparisonHeader}>
                    <Text style={styles.beforeLabel}>Before Meal</Text>
                    {beforeImage && (
                      <Pressable 
                        style={styles.clearButton}
                        onPress={() => setBeforeImage(null)}
                      >
                        <Text style={styles.clearButtonText}>Clear</Text>
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.uploadOptionsContainer}>
                    <Pressable 
                      style={[styles.uploadOptionButton, styles.cameraButton]}
                      onPress={() => handlePickBeforeImage(true)}
                    >
                      <Camera size={24} color={colors.background} />
                      <Text style={styles.uploadOptionButtonText}>Take Photo</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.uploadOptionButton, styles.galleryButton]}
                      onPress={() => handlePickBeforeImage(false)}
                    >
                      <ImageIcon size={24} color="#000000" />
                      <Text style={styles.galleryButtonText}>Choose</Text>
                    </Pressable>
                  </View>
                  {beforeImage && (
                    <Pressable 
                      onPress={() => handleImagePreview(`data:image/jpeg;base64,${beforeImage}`)}
                      style={styles.uploadedImageContainer}
                    >
                      <Image 
                        source={{ uri: `data:image/jpeg;base64,${beforeImage}` }} 
                        style={styles.comparisonImage} 
                      />
                    </Pressable>
                  )}
                </View>

                <View style={styles.comparisonDivider}>
                  <View style={styles.dividerLine} />
                  <View style={styles.dividerCircle}>
                    <Text style={styles.dividerText}>VS</Text>
                  </View>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.comparisonSection}>
                  <View style={styles.comparisonHeader}>
                    <Text style={styles.afterLabel}>After Meal</Text>
                    {afterImage && (
                      <Pressable 
                        style={styles.clearButton}
                        onPress={() => setAfterImage(null)}
                      >
                        <Text style={styles.clearButtonText}>Clear</Text>
                      </Pressable>
                    )}
                  </View>
                  <View style={styles.uploadOptionsContainer}>
                    <Pressable 
                      style={[styles.uploadOptionButton, styles.cameraButton]}
                      onPress={() => handlePickAfterImage(true)}
                    >
                      <Camera size={24} color={colors.background} />
                      <Text style={styles.uploadOptionButtonText}>Take Photo</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.uploadOptionButton, styles.galleryButton]}
                      onPress={() => handlePickAfterImage(false)}
                    >
                      <ImageIcon size={24} color="#000000" />
                      <Text style={styles.galleryButtonText}>Choose </Text>
                    </Pressable>
                  </View>
                  {afterImage && (
                    <Pressable 
                      onPress={() => handleImagePreview(`data:image/jpeg;base64,${afterImage}`)}
                      style={styles.uploadedImageContainer}
                    >
                      <Image 
                        source={{ uri: `data:image/jpeg;base64,${afterImage}` }} 
                        style={styles.comparisonImage}
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              <Pressable
                style={[
                  styles.button,
                  styles.analyzeButton,
                  (!beforeImage || !afterImage) && styles.buttonDisabled
                ]}
                onPress={handleAnalyzeDifference}
                disabled={!beforeImage || !afterImage}
              >
                <Scale size={24} color={colors.background} />
                <Text style={styles.buttonText}>Analyze Difference</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View 
              style={[
                styles.content, 
                { 
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.titleContainer}>
                <Pressable 
                  onPress={() => setSelectedFeature(null)}
                  style={styles.backButton}
                >
                  <ArrowLeft size={24} color={colors.primary} />
                </Pressable>
                <Text style={styles.title}>Meal Stitch</Text>
                <Pressable
                  style={[
                    styles.resetButton,
                    completedAnalyses === 0 && styles.buttonDisabled
                  ]}
                  onPress={handleMealStitchReset}
                  disabled={completedAnalyses === 0}
                >
                  <RefreshCw size={20} color={colors.background} />
                </Pressable>
              </View>
              <Text style={styles.subtitle}>
                Combine multiple food items into one comprehensive meal analysis
              </Text>

              <View style={styles.mealStitchContainer}>
                <Text style={styles.mealStitchLabel}>How many items in your meal? (1-5)</Text>
                <View style={styles.mealStitchCountSelector}>
                  {[1, 2, 3, 4, 5].map((count) => (
                    <Pressable
                      key={count}
                      style={[
                        styles.mealStitchCountButton,
                        mealStitchImageCount === count && styles.mealStitchCountButtonActive
                      ]}
                      onPress={() => handleMealStitchImageCountChange(count)}
                    >
                      <Text style={[
                        styles.mealStitchCountText,
                        mealStitchImageCount === count && styles.mealStitchCountTextActive
                      ]}>
                        {count}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.mealStitchUploadContainer}>
                  {mealStitchImages.map((image, index) => (
                    <View key={index} style={styles.mealStitchUploadItem}>
                      {image ? (
                        <View style={styles.uploadedImageContainer}>
                          <Pressable 
                            onPress={() => handleImagePreview(`data:image/jpeg;base64,${image}`)}
                            style={styles.mealStitchImageContainer}
                          >
                            <Image 
                              source={{ uri: `data:image/jpeg;base64,${image}` }} 
                              style={styles.mealStitchImage} 
                            />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable 
                          style={styles.emptyImageSlot}
                          onPress={() => handleEmptySlotPress(index)}
                        >
                          <View style={styles.emptyImageSlotContent}>
                            <ImageIcon size={32} color={colors.textSecondary} />
                            <Text style={styles.emptyImageSlotText}>Item {index + 1}</Text>
                            <Text style={styles.emptyImageSlotSubtext}>Tap to add image</Text>
                          </View>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>

                {/* Summary Display Section */}
                {mealSummary && (
                  <View ref={summaryRef} style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>Meal Summary</Text>
                    <Text style={styles.summaryText}>
                      {formatTextWithBold(mealSummary)}
                    </Text>
                  </View>
                )}

                <View style={styles.mealStitchButtonsContainer}>
                  <Pressable
                    style={[
                      styles.button,
                      styles.analyzeButton,
                      (completedAnalyses !== mealStitchImageCount) && styles.buttonDisabled
                    ]}
                    onPress={handleMealStitchAnalysis}
                    disabled={completedAnalyses !== mealStitchImageCount}
                  >
                    <Scale size={24} color={colors.background} />
                    <Text style={styles.buttonText}>
                      {completedAnalyses === mealStitchImageCount 
                        ? 'Generate Meal Summary' 
                        : `Waiting for ${mealStitchImageCount - completedAnalyses} more items`}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      )}

      {selectedFeature && (
        <Pressable
          style={styles.floatingMenuButton}
          onPress={() => setShowFeatureSelector(true)}
        >
          <Menu size={24} color={colors.background} />
        </Pressable>
      )}

      {/* Replace Modal with Animated Views */}
      <Animated.View 
        style={[
          styles.modalOverlay,
          { 
            opacity: menuFadeAnim,
            // Only make it visible when we want to show the menu
            // This prevents interactions with the hidden overlay
            pointerEvents: showFeatureSelector ? 'auto' : 'none'
          }
        ]}
        // Close menu when tapping the overlay
        onTouchEnd={() => {
          if (showFeatureSelector) {
            setShowFeatureSelector(false);
          }
        }}
      >
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: menuSlideAnim }]
            }
          ]}
          // Prevent touches on the modal content from closing the modal
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <FeatureSelector />
        </Animated.View>
      </Animated.View>

      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
        buttons={alertTitle === 'Medication Warning' ? [
          {
            text: "OK",
            style: "default",
            onPress: () => setAlertVisible(false)
          }
        ] : alertTitle === 'Meal Analysis Complete' ? [
          {
            text: "OK",
            style: "default",
            onPress: () => setAlertVisible(false)
          }
        ] : alertTitle === 'Success' ? [
          {
            text: "OK",
            style: "default",
            onPress: () => setAlertVisible(false),
          }
        ] : alertTitle === 'Analysis Complete' ? [
          {
            text: "OK",
            style: "default",
            onPress: () => setAlertVisible(false)
          }
        ] : [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setAlertVisible(false)
          },
          {
            text: "Reset",
            style: "destructive",
            onPress: confirmRefresh
          }
        ]}
      />

      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowImagePreview(false);
          setPreviewImageUri(null);
        }}
      >
        <View style={styles.imagePreviewOverlay}>
          <Pressable 
            style={styles.imagePreviewCloseButton}
            onPress={() => {
              setShowImagePreview(false);
              setPreviewImageUri(null);
            }}
          >
            <X size={24} color={colors.background} />
          </Pressable>
          {previewImageUri && (
            <Image
              source={{ uri: previewImageUri }}
              style={styles.imagePreview}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Replace the Upload Options Modal with Animated View */}
      {uploadOptionsVisible && (
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: uploadOptionsAnim,
              transform: [
                {
                  translateY: uploadOptionsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [500, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              Animated.spring(uploadOptionsAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 10,
              }).start(() => {
                setUploadOptionsVisible(false);
                setSelectedSlotIndex(null);
              });
            }}
          >
            <Animated.View 
              style={[
                styles.uploadOptionsModal,
                {
                  transform: [
                    {
                      translateY: uploadOptionsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [500, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.uploadOptionsTitle}>Add Image</Text>
              <View style={styles.uploadOptionsButtons}>
                <Pressable
                  style={[styles.uploadOptionButton, styles.cameraButton]}
                  onPress={() => handleUploadOptionSelect(true)}
                >
                  <Camera size={24} color={colors.background} />
                  <Text style={styles.uploadOptionButtonText}>Take Photo</Text>
                </Pressable>
                <Pressable
                  style={[styles.uploadOptionButton, styles.galleryButton]}
                  onPress={() => handleUploadOptionSelect(false)}
                >
                  <ImageIcon size={24} color="#000000" />
                  <Text style={styles.galleryButtonText}>Choose</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresContainer: {
    padding: 20,
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  featuresSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
    ...shadows.small,
  },
  titleSpacer: {
    width: 40,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  refreshButtonPressed: {
    backgroundColor: colors.border,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    width: '100%',
    height: 48,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cameraButton: {
    backgroundColor: colors.primary,
    marginBottom: 8,
    borderWidth: 0,
  },
  galleryButton: {
    backgroundColor: '#fbceb1',
    borderWidth: 0,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  analysisContainer: {
    padding: 16,
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    ...shadows.medium,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageWrapper: {
    width: '100%',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 4/3,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  section: {
    marginBottom: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 1,
  },
  item: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 1,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginVertical: 16,
    marginHorizontal: 20,
    backgroundColor: '#f5f5f7',
    borderRadius: 30,
    padding: 4,
    height: 48,
    ...shadows.small,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    height: 40,
  },
  segmentButtonActive: {
    backgroundColor: colors.background,
    ...shadows.small,
  },
  segmentButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  segmentButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  infoButton: {
    padding: 8,
    borderRadius: 8,
  },
  comparisonContainer: {
    width: '100%',
    gap: 24,
    marginBottom: 32,
  },
  comparisonSection: {
    gap: 12,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  beforeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  afterLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadButton: {
    height: 200,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  uploadButtonActive: {
    borderStyle: 'solid',
    borderColor: colors.primary,
  },
  uploadContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  comparisonImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadedImageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'solid',
    backgroundColor: '#f5f5f5',
  },
  uploadText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  comparisonDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },
  dividerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  analyzeButton: {
    backgroundColor: colors.primary,
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  floatingMenuButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  featureSelectorContainer: {
    padding: 16,
    backgroundColor: colors.background,
    width: '100%',
  },
  featureSelectorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  featureSelectorList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.small,
    width: '100%',
  },
  featureSelectorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    width: '100%',
  },
  featureSelectorItemPressed: {
    backgroundColor: colors.border,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  featureSelectorTextContainer: {
    flex: 1,
    flexShrink: 1,
  },
  featureSelectorItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureSelectorItemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    flexWrap: 'wrap',
  },
  featureSelectorArrow: {
    marginLeft: 8,
    flexShrink: 0,
  },
  featureDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  mealStitchContainer: {
    width: '100%',
    gap: 24,
    marginTop: 16,
  },
  mealStitchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  mealStitchLabel: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'left',
    flex: 1,
  },
  mealStitchCountSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  mealStitchCountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  mealStitchCountButtonActive: {
    backgroundColor: colors.primary,
  },
  mealStitchCountText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  mealStitchCountTextActive: {
    color: colors.background,
  },
  mealStitchUploadContainer: {
    width: '100%',
    gap: 16,
  },
  mealStitchUploadItem: {
    gap: 12,
  },
  uploadOptionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    marginBottom: 16,
    padding: 8,
  },
  emptyImageSlot: {
    width: '100%',
    height: 150,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImageSlotContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyImageSlotText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  emptyImageSlotSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  clearImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 8,
  },
  clearImageButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    ...shadows.medium,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'justify',
  },
  boldText: {
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingOverlayText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  authCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    ...shadows.medium,
  },
  authIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  authDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  authButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  authButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButton: {
    backgroundColor: colors.primary,
  },
  signUpButton: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  signUpButtonText: {
    color: colors.primary,
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  imagePreview: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  galleryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  mealStitchButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginTop: 16,
  },
  resetButton: {
    backgroundColor: colors.danger,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  uploadOptionsModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  uploadOptionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadOptionsButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  uploadOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    height: 56,
  },
  uploadOptionButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  mealStitchImageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mealStitchImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});