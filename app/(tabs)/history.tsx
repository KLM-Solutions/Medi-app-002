import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView, Animated, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronRight, Trash2 } from 'lucide-react-native';
import { colors, shadows } from '@/constants/colors';
import { useAnalysisStore } from '@/stores/analysis-store';
import { HealthCategoryBadge } from '@/components/HealthCategoryBadge';
import { AlertModal } from '@/components/AlertModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const history = useAnalysisStore((state) => state.history);
  const isLoading = useAnalysisStore((state) => state.isLoading);
  const error = useAnalysisStore((state) => state.error);
  const deleteAnalysis = useAnalysisStore((state) => state.deleteAnalysis);
  const fetchHistory = useAnalysisStore((state) => state.fetchHistory);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (user?.primaryEmailAddress?.emailAddress) {
      await fetchHistory(user.primaryEmailAddress.emailAddress);
    }
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const animate = () => {
        if (!isActive) return;
        
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
      };

      // Fetch history when screen comes into focus
      if (user?.primaryEmailAddress?.emailAddress) {
        fetchHistory(user.primaryEmailAddress.emailAddress)
          .then(() => {
            if (isActive) {
              animate();
            }
          })
          .catch(console.error);
      }

      return () => {
        isActive = false;
      };
    }, [user])
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleClearHistory = () => {
    setConfirmVisible(true);
  };

  const confirmClearHistory = async () => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setIsDeleting(true);
      setDeleteError(null);
      try {
        console.log('Starting to clear history for user:', user.primaryEmailAddress.emailAddress);
        const response = await fetch(`https://food-app-backend-psi-eosin.vercel.app/api/analysis-history?user_id=${encodeURIComponent(user.primaryEmailAddress.emailAddress)}&delete_all=true`, {
          method: 'DELETE',
        });
        
        const data = await response.json();
        console.log('Clear history response:', data);
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to clear history');
        }
        
        // Clear the local state
        useAnalysisStore.getState().clearHistory();
        setConfirmVisible(false);
      } catch (error) {
        console.error('Error clearing history:', error);
        setDeleteError(error instanceof Error ? error.message : 'Failed to clear history');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>History</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (history.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>History</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No analysis history yet</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>History</Text>
        <Pressable
          onPress={handleClearHistory}
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.clearButtonPressed,
            isDeleting && styles.clearButtonDisabled
          ]}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Trash2 size={15} color={colors.danger} />
          )}
        </Pressable>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {history.map((item, index) => (
          <Animated.View
            key={item.id}
            style={[
              styles.historyItem,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Pressable
              style={styles.itemPressable}
              onPress={() => router.push(`/history/${item.id}`)}
            >
              <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
              <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                  <HealthCategoryBadge category={item.category} />
                  <Text style={styles.confidence}>{item.confidence}%</Text>
                </View>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.nutritionInfo}>
                  <Text style={styles.nutritionText}>
                    {item.calories} cal • {item.protein}g protein • {item.carbs}g carbs • {item.fats}g fat
                  </Text>
                </View>
                <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    if (user?.primaryEmailAddress?.emailAddress) {
                      deleteAnalysis(item.id, user.primaryEmailAddress.emailAddress);
                    }
                  }}
                  style={styles.deleteButton}
                >
                  <Trash2 size={20} color={colors.danger} />
                </Pressable>
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>

      <AlertModal
        visible={confirmVisible}
        title="Clear History"
        message={deleteError ? `Error: ${deleteError}` : "Are you sure you want to clear all history? This action cannot be undone."}
        onClose={() => {
          setConfirmVisible(false);
          setDeleteError(null);
        }}
        buttons={[
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setConfirmVisible(false);
              setDeleteError(null);
            }
          },
          {
            text: "Clear",
            style: "destructive",
            onPress: confirmClearHistory
          }
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
  },
  clearButtonPressed: {
    backgroundColor: colors.border,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    ...shadows.small,
  },
  itemPressable: {
    flexDirection: 'row',
    padding: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidence: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  nutritionInfo: {
    marginTop: 4,
    marginBottom: 4,
  },
  nutritionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
});