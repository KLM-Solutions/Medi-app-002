import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, Animated, Modal } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, shadows } from '@/constants/colors';
import { useAnalysisStore } from '@/stores/analysis-store';
import { HealthCategoryBadge } from '@/components/HealthCategoryBadge';
import { ConfidenceIndicator } from '@/components/ConfidenceIndicator';
import { Flame, Egg, Wheat, Droplet, Sprout, Info, X } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const history = useAnalysisStore((state) => state.history);
  const analysis = history.find(item => item.id === id);
  const [selectedTab, setSelectedTab] = useState<'Nutrition' | 'Insights'>('Nutrition');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
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

  const handleImagePreview = (imageUri: string) => {
    setPreviewImageUri(imageUri);
    setShowImagePreview(true);
  };

  if (!analysis) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Analysis not found</Text>
      </View>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
            <View style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}>
              {/* Food Image */}
              {analysis.imageUri && (
                <View style={{ width: '100%', aspectRatio: 4/3, backgroundColor: '#f5f5f5', borderRadius: 12, marginBottom: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0' }}>
                  <Pressable 
                    onPress={() => {
                      const fullImageUri = analysis.imageUri.startsWith('data:image/') 
                        ? analysis.imageUri 
                        : `data:image/jpeg;base64,${analysis.imageUri}`;
                      handleImagePreview(fullImageUri);
                    }}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <Image
                      source={{
                        uri: analysis.imageUri.startsWith('data:image/')
                          ? analysis.imageUri
                          : `data:image/jpeg;base64,${analysis.imageUri}`
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
                    {analysis.dishName || (analysis.items && analysis.items[0]) || 'Food Item'}
                  </Text>
                  <View style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: 2 }}>
                    {/* Health Category Badge */}
                    {analysis.category && (
                      <HealthCategoryBadge category={analysis.category} size={18} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                      <Flame size={16} color="#FF9500" style={{ marginRight: 4 }} />
                      <Text style={{ color: colors.danger, fontWeight: 'bold', fontSize: 15 }}>
                        {typeof analysis.calories === 'number' ? `${analysis.calories} calories` : '-'}
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
                      strokeDashoffset={2 * Math.PI * 38 * (1 - ((analysis.confidence || 85) / 100))}
                      strokeLinecap="round"
                      rotation="-90"
                      origin="44,44"
                    />
                  </Svg>
                  <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', width: 64, height: 64 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.primary }}>{Math.round(analysis.confidence || 85)}</Text>
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
                      {analysis.protein !== undefined ? `${analysis.protein}g` : '-'}
                    </Text>
                  </View>
                  {/* Carbs */}
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ backgroundColor: '#ffeaea', borderRadius: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <Wheat size={22} color="#FF5A5F" />
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 2 }}>Carbs</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                      {analysis.carbs !== undefined ? `${analysis.carbs}g` : '-'}
                    </Text>
                  </View>
                  {/* Fats */}
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ backgroundColor: '#fff6e6', borderRadius: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <Droplet size={22} color="#FF9500" />
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 2 }}>Fats</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                      {analysis.fats !== undefined ? `${analysis.fats}g` : '-'}
                    </Text>
                  </View>
                  {/* Fiber */}
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ backgroundColor: '#e6ffe6', borderRadius: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      <Sprout size={22} color="#4CD964" />
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 2 }}>Fiber</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                      {analysis.fiber !== undefined ? `${analysis.fiber}g` : '-'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Items Identified Card */}
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Items Identified</Text>
                <View style={{ backgroundColor: '#fafbfc', borderRadius: 20, padding: 16, marginBottom: 18 }}>
                  {analysis && analysis.itemsIdentified ? (
                    typeof analysis.itemsIdentified === 'string' && 
                    analysis.itemsIdentified.includes('-') ? (
                      // If the text contains hyphens, split by hyphen and show as bullet points
                      analysis.itemsIdentified
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
                        {analysis.itemsIdentified}
                      </Text>
                    )
                  ) : analysis && analysis.items && analysis.items.length > 0 ? (
                    // If no itemsIdentified but there are items in the array
                    analysis.items.map((itemText, index) => (
                      <View 
                        key={index} 
                        style={{ 
                          flexDirection: 'row', 
                          alignItems: 'flex-start', 
                          marginBottom: index < analysis.items.length - 1 ? 8 : 0 
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
                  {analysis.nutritionalProfile ? (
                    <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>{analysis.nutritionalProfile}</Text>
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
                    <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24, flex: 1 }}>{analysis.caloricContent || (typeof analysis.calories === 'number' ? `${analysis.calories} calories` : 'No caloric information available')}</Text>
                  </View>
                </View>
              </View>
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
            <View style={{ borderRadius: 20, padding: 20, marginBottom: 16 }}>
              <View style={{ marginTop: 0 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Medication Warnings</Text>
                {analysis.medicationAlerts && analysis.medicationAlerts.length > 0 ? (
                  <View style={{ backgroundColor: '#FFF8E7', borderWidth: 1, borderColor: '#FFE9B0', borderRadius: 10, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ backgroundColor: '#FFEFBF', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Info size={18} color="#E5A400" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#666666', fontSize: 15 }}>
                        {analysis.medicationAlerts.map(alert => {
                          // Fix any word splits (like 'Do lo' should be 'Dolo')
                          // First trim and remove newlines
                          let processed = alert.trim().replace(/\n/g, ' ');
                          
                          // Check if this is the specific case where medication names are split
                          // Look for common medication patterns and fix them
                          processed = processed.replace(/Do\s+lo\s+(\d+)/gi, 'Dolo $1');
                          
                          return processed;
                        }).join(' ')}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={{ color: colors.textSecondary }}>No medication warnings for this meal.</Text>
                )}
              </View>

              {/* Macronutrients Details Card */}
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Macronutrients Details</Text>
                <View style={{ backgroundColor: '#fafbfc', borderRadius: 20, padding: 16, marginBottom: 18 }}>
                  {analysis.macronutrients ? (
                    <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>{analysis.macronutrients}</Text>
                  ) : (
                    <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>No macronutrient information available</Text>
                  )}
                </View>
              </View>

              {/* Processing Level Card */}
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Processing Level</Text>
                <View style={{ backgroundColor: '#fafbfc', borderRadius: 20, padding: 16, marginBottom: 18 }}>
                  {analysis.processingLevel ? (
                    <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>{analysis.processingLevel}</Text>
                  ) : (
                    <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>No processing level information available</Text>
                  )}
                </View>
              </View>

              {/* Health Implications Card */}
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Health Implications</Text>
                <View style={{ backgroundColor: '#fafbfc', borderRadius: 20, padding: 16, marginBottom: 18 }}>
                  {analysis.healthImplications ? (
                    <Text style={{ fontSize: 16, color: colors.text, lineHeight: 24 }}>{analysis.healthImplications}</Text>
                  ) : (
                    <Text style={{ fontSize: 16, color: colors.textSecondary, lineHeight: 24 }}>No health implications information available</Text>
                  )}
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {showImagePreview && (
        <Modal
          visible={showImagePreview}
          animationType="fade"
          transparent={true}
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
              <X size={24} color="white" />
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
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  notFoundText: {
    fontSize: 16,
    color: colors.textSecondary,
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
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});