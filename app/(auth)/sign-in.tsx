import { useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter, Stack } from 'expo-router'
import { Text, TextInput, TouchableOpacity, View, StyleSheet, Alert, ActivityIndicator, Platform, Dimensions, Animated, SafeAreaView, ScrollView, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import React, { useRef, useEffect, useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import Constants from 'expo-constants'
import { useOAuth } from "@clerk/clerk-expo"
import { StatusBar } from 'expo-status-bar'
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

WebBrowser.maybeCompleteAuthSession()

// Design constants
const { width, height } = Dimensions.get('window');
const ORANGE = '#FF5A1F';
const LIGHT_ORANGE = '#FF8F6D';
const isSmallDevice = width < 375;

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" })
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [lastAttemptTime, setLastAttemptTime] = React.useState(0)
  const [isCheckingEmail, setIsCheckingEmail] = React.useState(false)
  const [isEmailVerified, setIsEmailVerified] = React.useState(false)
  const [accountType, setAccountType] = React.useState<'email' | 'google' | null>(null)
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const wave1Anim = useRef(new Animated.Value(0)).current
  const wave2Anim = useRef(new Animated.Value(0)).current
  
  // Add a state for food icon animation
  const iconAnim = useRef(new Animated.Value(0)).current;
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  
  // Food icon data
  const FOOD_ICONS = [
    {icon: "nutrition" as const, label: "Nutrition"},
    {icon: "leaf-outline" as const, label: "Healthy"},
    {icon: "restaurant-outline" as const, label: "Food"},
    {icon: "fitness-outline" as const, label: "Fitness"}
  ];
  
  // Add debounce for email check
  const emailCheckTimeout = useRef<NodeJS.Timeout>()

  // Function to check if email exists using Clerk's SDK
 // Improved checkEmailExists function
const checkEmailExists = async (email: string) => {
  if (!isLoaded || !email) return false

  try {
    setIsCheckingEmail(true)
    setIsEmailVerified(false)
    setAccountType(null)

    // Try to create a sign-in attempt
    const signInAttempt = await signIn.create({
      identifier: email,
    })

    // If we get here, the email exists
    setIsEmailVerified(true)
    
    // Check what sign-in strategies are available for this user
    const availableStrategies = signInAttempt.supportedFirstFactors || []
    
    // Look for OAuth provider strategy (Google)
    const hasOAuthStrategy = availableStrategies.some(
      factor => factor.strategy === 'oauth_google' || 
                (factor.strategy?.includes('oauth') && factor.strategy?.includes('google'))
    )
    
    // Look for password strategy
    const hasPasswordStrategy = availableStrategies.some(
      factor => factor.strategy === 'password'
    )
    
    if (hasOAuthStrategy) {
      // If OAuth Google is available, mark as Google account
      setAccountType('google')
    } else if (hasPasswordStrategy) {
      // If password is available, mark as email account
      setAccountType('email')
    } else {
      // Fallback to old method as a last resort
      try {
        // Try to sign in with password strategy
        await signInAttempt.attemptFirstFactor({
          strategy: "password",
          password: "dummy-password"
        })
        // If we get here without error, it's likely an email+password account
        setAccountType('email')
      } catch (err: any) {
        const errorMessage = err.errors?.[0]?.message?.toLowerCase() || ''
        
        // Check for various indicators of Google authentication
        if (errorMessage.includes('oauth') || 
            errorMessage.includes('google') ||
            errorMessage.includes('password not set') ||
            errorMessage.includes('verification strategy')) {
          setAccountType('google')
        } else {
          // For other errors, assume it's a regular email account
          setAccountType('email')
        }
      }
    }
    
    return true
  } catch (err: any) {
    // If the error is about invalid email, the email doesn't exist
    if (err.errors?.[0]?.message?.includes('not found')) {
      setIsEmailVerified(false)
      setAccountType(null)
      return false
    }
    // For other errors, we'll assume the email doesn't exist
    setIsEmailVerified(false)
    setAccountType(null)
    return false
  } finally {
    setIsCheckingEmail(false)
  }
}

  // Add email change handler with debounce
  const handleEmailChange = (email: string) => {
    setEmailAddress(email)
    setError('')

    // Clear previous timeout
    if (emailCheckTimeout.current) {
      clearTimeout(emailCheckTimeout.current)
    }

    // Set new timeout for email check
    emailCheckTimeout.current = setTimeout(async () => {
      if (email && email.includes('@')) {
        const exists = await checkEmailExists(email)
        if (!exists) {
          setError('No account found with this email address')
        }
      }
    }, 500) // 500ms debounce
  }

  useEffect(() => {
    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: Platform.OS !== 'web' || typeof document !== 'undefined',
    }).start()
    
    // Slide up content
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: Platform.OS !== 'web' || typeof document !== 'undefined',
    }).start()
    
    // Animate background waves
    animateWaves()
    
    // Add food icon animation sequence
    const animateIcons = () => {
      Animated.timing(iconAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web' || typeof document !== 'undefined',
      }).start(() => {
        setCurrentIconIndex((prev) => (prev + 1) % FOOD_ICONS.length);
        Animated.timing(iconAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: Platform.OS !== 'web' || typeof document !== 'undefined',
        }).start();
      });
    };
    
    // Initialize initial icon opacity
    Animated.timing(iconAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: Platform.OS !== 'web' || typeof document !== 'undefined',
    }).start();
    
    // Cycle through icons
    const iconInterval = setInterval(animateIcons, 3000);
    
    return () => {
      clearInterval(iconInterval);
    };
  }, [])
  
  // Animate background waves
  const animateWaves = () => {
    // Use a different approach based on platform
    const useNativeDriver = Platform.OS !== 'web' || typeof document !== 'undefined';
    
    // Infinite wave animation loops
    Animated.loop(
      Animated.sequence([
        Animated.timing(wave1Anim, {
          toValue: 1,
          duration: 12000,
          useNativeDriver,
        }),
        Animated.timing(wave1Anim, {
          toValue: 0,
          duration: 12000,
          useNativeDriver,
        }),
      ])
    ).start()
    
    // Second wave with offset timing
    Animated.loop(
      Animated.sequence([
        Animated.timing(wave2Anim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver,
        }),
        Animated.timing(wave2Anim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver,
        }),
      ])
    ).start()
  }
  
  // Wave animation transformations with platform-specific implementations
  const getWave1Transform = () => {
    if (Platform.OS === 'web' && typeof document === 'undefined') {
      // For web when SSR (document undefined), use a non-animated approach
      return { transform: [{ translateX: 0 }] };
    }
    
    return {
      transform: [{
        translateX: wave1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-width * 0.2, width * 0.2]
        })
      }]
    };
  };
  
  const getWave2Transform = () => {
    if (Platform.OS === 'web' && typeof document === 'undefined') {
      // For web when SSR (document undefined), use a non-animated approach
      return { transform: [{ translateX: 0 }] };
    }
    
    return {
      transform: [{
        translateX: wave2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [width * 0.2, -width * 0.2]
        })
      }]
    };
  };

  const getRedirectUrl = () => {
    // Check if we're in a web environment
    if (Platform.OS === 'web') {
      // For web, use window.location.origin
      return `${window.location.origin}/oauth-callback`;
    }
    // For native, use the Constants value or default
    return Constants.expoConfig?.extra?.redirectUrl || 'exp://localhost:8081/--/oauth-native-callback';
  }

  const onSignInPress = async () => {
    if (!isLoaded) return

    // Rate limiting: Only allow one attempt every 2 seconds
    const now = Date.now()
    if (now - lastAttemptTime < 2000) {
      Alert.alert('Please wait', 'Please wait a moment before trying again')
      return
    }

    // Validate inputs
    if (!emailAddress || !password) {
      setError('Please enter both email and password')
      return
    }

    setIsLoading(true)
    setLastAttemptTime(now)

    try {
      // First check if email exists
      const emailExists = await checkEmailExists(emailAddress)
      if (!emailExists) {
        setError('No account found with this email address')
        return
      }

      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
      } else {
        setError('Sign in attempt was not complete. Please try again.')
        Alert.alert('Error', error)
      }
    } catch (err: any) {
      // Check if the error is due to missing password for Google-authenticated user
      if (err.errors?.[0]?.message?.includes('password not set')) {
        Alert.alert(
          'Account Found',
          'This email is associated with a Google account. Would you like to set up a password for this account?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Set Password',
              onPress: () => {
                // Navigate to password setup screen
                router.push({
                  pathname: '/(auth)/set-password',
                  params: { email: emailAddress }
                })
              }
            }
          ]
        )
      } else {
        const errorMessage = err.errors?.[0]?.message || 'Failed to sign in. Please check your credentials and try again.'
        setError(errorMessage)
        Alert.alert('Error', errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onGoogleSignIn = async () => {
    if (!isLoaded) return

    try {
      setIsLoading(true)
      
      if (Platform.OS === 'web') {
        const redirectUrl = getRedirectUrl();
        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl,
          redirectUrlComplete: redirectUrl
        })
      } else {
        const { createdSessionId, signIn, setActive } = await startOAuthFlow()

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId })
          // For sign-in, always go to welcome page
          router.replace('/')
        }
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err.errors?.[0]?.message || 'Failed to sign in with Google')
      Alert.alert('Error', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!emailAddress || !isLoaded) {
      Alert.alert('Email Required', 'Please enter your email address first')
      return
    }

    try {
      setIsLoading(true)
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
      })

      // Check if the account exists and has password strategy
      const hasPasswordStrategy = signInAttempt.supportedFirstFactors?.some(
        factor => factor.strategy === 'password'
      )

      if (!hasPasswordStrategy) {
        Alert.alert(
          'Account Type',
          'This account was created using Google Sign-In. Please use Google to sign in.',
          [{ text: 'OK' }]
        )
        return
      }

      // Find the email address ID for password reset
      const emailFactor = signInAttempt.supportedFirstFactors?.find(
        factor => factor.strategy === 'reset_password_email_code'
      )

      if (!emailFactor) {
        throw new Error('Password reset not available for this account')
      }

      // Start password reset flow
      await signInAttempt.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId: emailFactor.emailAddressId
      })

      Alert.alert(
        'Reset Email Sent',
        'Please check your email for password reset instructions.',
        [{ text: 'OK' }]
      )
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || 'Failed to send reset email. Please try again.'
      Alert.alert('Error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Stack.Screen 
        options={{
          headerTitle: "",
          headerShown: Platform.OS !== 'ios',
          headerStyle: {
            backgroundColor: ORANGE,
          },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          ...Platform.select({
            web: {
              headerTitle: "Sign In",
              headerTitleStyle: {
                color: '#fff',
                fontSize: 20,
                fontWeight: '600',
              },
            },
            ios: {
              headerShown: true,
              headerLeft: () => (
                <TouchableOpacity onPress={() => router.push('/welcome')}>
                  <Ionicons name="arrow-back" size={24} color="#fff" style={{ marginLeft: 16 }} />
                </TouchableOpacity>
              ),
            }
          })
        }} 
      />
      
      {/* Background waves */}
      <View style={styles.backgroundWaves} pointerEvents="none">
        {/* First wave */}
        <Animated.View 
          style={[
            styles.wave, 
            styles.wave1, 
            getWave1Transform()
          ]}
        >
          <Svg height={height * 0.6} width={width * 1.4} viewBox={`0 0 ${width * 1.4} ${height * 0.6}`}>
            <Defs>
              <LinearGradient id="waveGradient1" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={LIGHT_ORANGE} stopOpacity="0.4" />
                <Stop offset="0.5" stopColor={LIGHT_ORANGE} stopOpacity="0.2" />
                <Stop offset="1" stopColor={LIGHT_ORANGE} stopOpacity="0.4" />
              </LinearGradient>
            </Defs>
            <Path
              d={`
                M0,${height * 0.2} 
                C${width * 0.3},${height * 0.1} ${width * 0.6},${height * 0.3} ${width},${height * 0.15}
                C${width * 1.2},${height * 0.05} ${width * 1.3},${height * 0.2} ${width * 1.4},${height * 0.1}
                L${width * 1.4},${height * 0.6} 
                L0,${height * 0.6} 
                Z
              `}
              fill="url(#waveGradient1)"
            />
          </Svg>
        </Animated.View>
        
        {/* Second wave */}
        <Animated.View 
          style={[
            styles.wave, 
            styles.wave2, 
            getWave2Transform()
          ]}
        >
          <Svg height={height * 0.6} width={width * 1.4} viewBox={`0 0 ${width * 1.4} ${height * 0.6}`}>
            <Defs>
              <LinearGradient id="waveGradient2" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.05" />
                <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.1" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.05" />
              </LinearGradient>
            </Defs>
            <Path
              d={`
                M0,${height * 0.3} 
                C${width * 0.4},${height * 0.4} ${width * 0.7},${height * 0.2} ${width * 0.9},${height * 0.35}
                C${width * 1.1},${height * 0.45} ${width * 1.3},${height * 0.3} ${width * 1.4},${height * 0.4}
                L${width * 1.4},${height * 0.6} 
                L0,${height * 0.6} 
                Z
              `}
              fill="url(#waveGradient2)"
            />
          </Svg>
        </Animated.View>
      </View>
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and Food Icon Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Svg width="100%" height="100%" viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="48" fill="#FFFFFF" />
              </Svg>
              <Animated.View style={[
                styles.iconWrapper,
                {
                  opacity: iconAnim,
                  transform: Platform.OS === 'web' && typeof document === 'undefined'
                    ? [{ scale: 1 }]
                    : [{ scale: iconAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })}]
                }
              ]}>
                <Ionicons 
                  name={FOOD_ICONS[currentIconIndex].icon} 
                  size={46} 
                  color={ORANGE} 
                />
                <Animated.Text style={[
                  styles.iconLabel, 
                  {
                    opacity: iconAnim,
                    transform: Platform.OS === 'web' && typeof document === 'undefined'
                      ? [{ translateY: 0 }]
                      : [{ translateY: iconAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [5, 0]
                        })}]
                  }
                ]}>
                  {FOOD_ICONS[currentIconIndex].label}
                </Animated.Text>
              </Animated.View>
            </View>
          </View>
          
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: Platform.OS === 'web' && typeof document === 'undefined'
                  ? [{ translateY: 0 }]
                  : [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.header}>
              {/* <Text style={styles.title}>Welcome Back</Text> */}
              <Text style={styles.subtitle}>Sign in to continue your food analysis journey</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  value={emailAddress}
                  placeholder="Email address"
                  placeholderTextColor="#999"
                  onChangeText={handleEmailChange}
                  editable={!isLoading}
                />
                {isCheckingEmail && (
                  <ActivityIndicator size="small" color={ORANGE} style={styles.emailCheckIndicator} />
                )}
              </View>
              {isEmailVerified && !isCheckingEmail && (
                <View style={[
                  styles.registrationInfoContainer,
                  accountType === 'google' ? styles.googleRegistrationInfo : styles.emailRegistrationInfo
                ]}>
                  <Ionicons 
                    name={accountType === 'google' ? "logo-google" : "mail"} 
                    size={18} 
                    color={accountType === 'google' ? "#FFA000" : "#FFA000"} 
                    style={styles.registrationIcon} 
                  />
                  <Text style={[
                    styles.registrationText,
                    accountType === 'google' ? styles.googleRegistrationText : styles.emailRegistrationText
                  ]}>
                    {accountType === 'google' 
                      ? 'This account was created using Google Sign-In' 
                      : 'This account was created with email and password'}
                  </Text>
                </View>
              )}
            </View>

            {accountType === 'google' ? (
              <View style={styles.googleSignInContainer}>
                <View style={styles.googleSignInGuide}>
                  <Text style={styles.googleSignInGuideTitle}>
                    Continue with Google
                  </Text>
                  <Text style={styles.googleSignInGuideText}>
                    This account was created using Google. Please use the button below to sign in.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.googleButton, styles.highlightedGoogleButton]}
                    onPress={onGoogleSignIn}
                    disabled={isLoading}
                  >
                    <Ionicons name="logo-google" size={24} color="#FFA000" />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={password}
                      placeholder="Password"
                      placeholderTextColor="#999"
                      secureTextEntry={!showPassword}
                      onChangeText={(password) => {
                        setPassword(password)
                        setError('')
                      }}
                      editable={!isLoading}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon} 
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off" : "eye"} 
                        size={22} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, isLoading && styles.disabledButton]} 
                  onPress={onSignInPress}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={ORANGE} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity 
                  style={styles.googleButton}
                  onPress={onGoogleSignIn}
                  disabled={isLoading}
                >
                  <Ionicons name="logo-google" size={20} color="#FFA000" />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Link href="/sign-up" style={styles.link}>
                <Text style={styles.linkText}>Sign up</Text>
              </Link>
            </View>
          </Animated.View>
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
  backgroundWaves: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    width: width * 1.4,
    left: -width * 0.2,
  },
  wave1: {
    top: -height * 0.1,
  },
  wave2: {
    top: height * 0.15,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: isSmallDevice ? 10 : 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logoCircle: {
    width: width * 0.28,
    height: width * 0.28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        shadowColor: "transparent",
        shadowOffset: {
          width: 0,
          height: 0,
        },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
      }
    }),
    position: 'relative',
  },
  iconWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    paddingBottom: 5,
  },
  iconLabel: {
    color: ORANGE,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    maxWidth: 300,
  },
  inputContainer: {
    marginBottom: 20,
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
    outline: 'none',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        outlineWidth: 0,
        outlineColor: 'transparent',
        boxShadow: 'none',
        border: 'none',
      },
    }),
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 58,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 24,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  footerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  link: {
    marginLeft: 4,
  },
  linkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#FFEBCD',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.7,
  },
  emailCheckIndicator: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  registrationInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  googleRegistrationInfo: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  emailRegistrationInfo: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  registrationIcon: {
    marginRight: 8,
  },
  registrationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  googleRegistrationText: {
    color: '#FFA000',
  },
  emailRegistrationText: {
    color: '#FFA000',
  },
  googleSignInContainer: {
    marginTop: 20,
  },
  googleSignInGuide: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  googleSignInGuideTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  googleSignInGuideText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  highlightedGoogleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFA000',
    transform: [{ scale: 1.05 }],
    paddingHorizontal: 32,
    height: 64,
  },
}) 