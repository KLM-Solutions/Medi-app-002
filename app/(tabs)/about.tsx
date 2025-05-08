import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Pressable, Platform } from 'react-native';
import { Info, ChevronRight, Shield, Heart, Brain, Star } from 'lucide-react-native';
import { colors, shadows } from '@/constants/colors';
import { HealthCategoryBadge } from '@/components/HealthCategoryBadge';
import { useFocusEffect } from 'expo-router';

export default function AboutScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useFocusEffect(
    React.useCallback(() => {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

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

      return () => {};
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerIconContainer}>
              <Info size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Food Analyzer</Text>
          </View>
          <View style={styles.headerDivider} />
          <Text style={styles.subtitle}>
            Your personal AI-powered food analysis assistant
          </Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Brain size={24} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>How It Works</Text>
          </View>
          <Text style={styles.sectionText}>
            Food Analyzer uses advanced AI to analyze your food images and provide detailed
            nutritional insights. Our technology can identify food items, estimate nutritional
            content, and assess the overall health impact of your meals.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Heart size={24} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Health Categories</Text>
          </View>
          
          <View style={styles.categoriesContainer}>
            <View style={styles.categoryCard}>
              <HealthCategoryBadge category="Clearly Healthy" />
              <Text style={styles.categoryDescription}>
                Nutrient-dense foods with minimal processing and beneficial health properties.
              </Text>
            </View>

            <View style={styles.categoryCard}>
              <HealthCategoryBadge category="Borderline" />
              <Text style={styles.categoryDescription}>
                Foods with some nutritional benefits but also some concerns or limitations.
              </Text>
            </View>

            <View style={styles.categoryCard}>
              <HealthCategoryBadge category="Mixed" />
              <Text style={styles.categoryDescription}>
                Foods containing both healthy and unhealthy components in significant amounts.
              </Text>
            </View>

            <View style={styles.categoryCard}>
              <HealthCategoryBadge category="Clearly Unhealthy" />
              <Text style={styles.categoryDescription}>
                Highly processed foods with low nutritional value and potential negative health impacts.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Shield size={24} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Privacy & Security</Text>
          </View>
          <Text style={styles.sectionText}>
            Your privacy is important to us. All images and analysis data are processed
            securely and never shared with third parties.
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerIconContainer}>
              <Star size={20} color={colors.primary} />
            </View>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>
          <Text style={styles.copyright}>© 2024 Food Analyzer. All rights reserved.</Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    backgroundColor: colors.background,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        ...shadows.medium,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    ...Platform.select({
      ios: {
        ...shadows.small,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    ...Platform.select({
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    ...Platform.select({
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
  content: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        ...shadows.small,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...Platform.select({
      ios: {
        ...shadows.small,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    ...Platform.select({
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
  sectionText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 24,
    ...Platform.select({
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
  categoriesContainer: {
    gap: 16,
  },
  categoryCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        ...shadows.small,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
    ...Platform.select({
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.card,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        ...shadows.small,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    ...Platform.select({
      ios: {
        ...shadows.small,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  version: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    ...Platform.select({
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
  copyright: {
    fontSize: 14,
    color: colors.textSecondary,
    ...Platform.select({
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
});