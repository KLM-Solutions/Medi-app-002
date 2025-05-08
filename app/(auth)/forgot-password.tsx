import { useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter, Stack } from 'expo-router'
import { Text, TextInput, TouchableOpacity, View, StyleSheet, Alert, ActivityIndicator, Platform, Dimensions, Animated, SafeAreaView, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Design constants
const { width, height } = Dimensions.get('window');
const ORANGE = '#FF5A1F';
const LIGHT_ORANGE = '#FF8F6D';
const isSmallDevice = width < 375;

export default function ForgotPassword() {
  const { signIn, isLoaded } = useSignIn()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [emailAddress, setEmailAddress] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleResetPassword = async () => {
    if (!emailAddress || !isLoaded) {
      Alert.alert('Missing Information', 'Please enter your email address')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      const signInAttempt = await signIn.create({
        identifier: emailAddress,
      })

      // Check if the account exists and supports password strategy
      const emailFactor = signInAttempt.supportedFirstFactors?.find(
        factor => factor.strategy === 'reset_password_email_code'
      )

      if (!emailFactor?.emailAddressId) {
        throw new Error('Password reset not available for this account')
      }

      // Prepare the reset password factor
      await signInAttempt.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId: emailFactor.emailAddressId
      })

      // Navigate to set password screen
      router.push({
        pathname: '/(auth)/set-password',
        params: { email: emailAddress }
      })
    } catch (err: any) {
      console.error('Password reset error:', err)
      const errorMessage = err.errors?.[0]?.message || 'Failed to send reset instructions. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Stack.Screen 
        options={{
          headerTitle: "Reset Password",
          headerShown: true,
          headerStyle: {
            backgroundColor: ORANGE,
          },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" style={{ marginLeft: 16 }} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you instructions to reset your password.
              </Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {isEmailSent ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successText}>
                  Please check your email for password reset instructions.
                </Text>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Text style={styles.backButtonText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      autoCapitalize="none"
                      value={emailAddress}
                      placeholder="Email address"
                      placeholderTextColor="#999"
                      onChangeText={(text) => {
                        setEmailAddress(text)
                        setError('')
                      }}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, isLoading && styles.disabledButton]} 
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={ORANGE} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Reset Instructions</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.backLink}
                  onPress={() => router.back()}
                >
                  <Text style={styles.backLinkText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ORANGE,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: isSmallDevice ? 10 : 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    height: 58,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    height: 58,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  primaryButtonText: {
    color: ORANGE,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  errorText: {
    color: '#FFEBCD',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  backLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: ORANGE,
    fontSize: 16,
    fontWeight: '600',
  },
}) 