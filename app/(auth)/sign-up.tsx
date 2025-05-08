import { useSignUp } from '@clerk/clerk-expo'
import { useAuth } from '@clerk/clerk-expo'
import { Link, useRouter, Stack } from 'expo-router'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, ActivityIndicator, Platform, Dimensions, Animated, SafeAreaView, ScrollView } from 'react-native'
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

export default function SignUpScreen() {
  const { signUp, isLoaded, setActive } = useSignUp()
  const { signOut } = useAuth()
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" })
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [error, setError] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [lastAttemptTime, setLastAttemptTime] = React.useState(0)
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const wave1Anim = useRef(new Animated.Value(0)).current
  const wave2Anim = useRef(new Animated.Value(0)).current
  const errorAnim = useRef(new Animated.Value(0)).current
  
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
  
  // Check if we can use native driver
  // For web, we'll use a more compatible animation approach
  const canUseNativeDriver = () => {
    return Platform.OS !== 'web';
  };
  
  useEffect(() => {
    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: canUseNativeDriver(),
    }).start()
    
    // Slide up content
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: canUseNativeDriver(),
    }).start()
    
    // Animate background waves
    animateWaves()
    
    // Add food icon animation sequence
    const animateIcons = () => {
      Animated.timing(iconAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: canUseNativeDriver(),
      }).start(() => {
        setCurrentIconIndex((prev) => (prev + 1) % FOOD_ICONS.length);
        Animated.timing(iconAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: canUseNativeDriver(),
        }).start();
      });
    };
    
    // Initialize initial icon opacity
    Animated.timing(iconAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: canUseNativeDriver(),
    }).start();
    
    // Cycle through icons
    const iconInterval = setInterval(animateIcons, 3000);
    
    return () => {
      clearInterval(iconInterval);
    };
  }, []);
  
  // Animate background waves with cross-platform compatibility
  const animateWaves = () => {
    // Create animation loops for the waves
    Animated.loop(
      Animated.sequence([
        Animated.timing(wave1Anim, {
          toValue: 1,
          duration: 12000,
          useNativeDriver: canUseNativeDriver(),
        }),
        Animated.timing(wave1Anim, {
          toValue: 0,
          duration: 12000,
          useNativeDriver: canUseNativeDriver(),
        }),
      ])
    ).start()
    
    // Second wave with offset timing
    Animated.loop(
      Animated.sequence([
        Animated.timing(wave2Anim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: canUseNativeDriver(),
        }),
        Animated.timing(wave2Anim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: canUseNativeDriver(),
        }),
      ])
    ).start()
  }
  
  // Wave animation transformations with consistent cross-platform implementation
  const getWave1Style = () => {
    if (Platform.OS === 'web') {
      // For web, use left property animation
      return {
        left: wave1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [`${-width * 0.2}px`, `${width * 0.2}px`]
        })
      };
    } else {
      // For native, use transform
      return {
        transform: [{
          translateX: wave1Anim.interpolate({
            inputRange: [0, 1],
            outputRange: [-width * 0.2, width * 0.2]
          })
        }]
      };
    }
  };
  
  const getWave2Style = () => {
    if (Platform.OS === 'web') {
      // For web, use left property animation
      return {
        left: wave2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [`${width * 0.2}px`, `${-width * 0.2}px`]
        })
      };
    } else {
      // For native, use transform
      return {
        transform: [{
          translateX: wave2Anim.interpolate({
            inputRange: [0, 1],
            outputRange: [width * 0.2, -width * 0.2]
          })
        }]
      };
    }
  };
  
  // Cross-platform icon animation
  const getIconStyle = () => {
    if (Platform.OS === 'web') {
      return {
        opacity: iconAnim,
        transform: [{
          scale: iconAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1]
          })
        }]
      };
    } else {
      return {
        opacity: iconAnim,
        transform: [{
          scale: iconAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1]
          })
        }]
      };
    }
  };
  
  // Cross-platform slide animation
  const getSlideStyle = () => {
    if (Platform.OS === 'web') {
      return {
        opacity: fadeAnim,
        top: slideAnim.interpolate({
          inputRange: [0, 50],
          outputRange: ['0px', '50px']
        })
      };
    } else {
      return {
        opacity: fadeAnim,
        transform: [{
          translateY: slideAnim
        }]
      };
    }
  };

  // Create the wave SVG components to ensure consistency across platforms
  const Wave1SVG = () => (
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
  );

  const Wave2SVG = () => (
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
  );

  const getRedirectUrl = () => {
    // Check if we're in a web environment
    if (Platform.OS === 'web') {
      // For web, use window.location.origin
      return `${window.location.origin}/oauth-callback`;
    }
    // For native, use the Constants value or default
    return Constants.expoConfig?.extra?.redirectUrl || 'exp://localhost:8081/--/oauth-native-callback';
  }

  const onGoogleSignUp = async () => {
    if (!isLoaded) return

    try {
      setIsLoading(true)
      
      if (Platform.OS === 'web') {
        const redirectUrl = getRedirectUrl();
        await signUp.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl,
          redirectUrlComplete: redirectUrl
        })
      } else {
        const { createdSessionId, signUp, setActive } = await startOAuthFlow()

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId })
          router.replace('/onboarding/screen1')
        }
      }
    } catch (err: any) {
      console.error('Google sign up error:', err);
      setError(err.errors?.[0]?.message || 'Failed to sign up with Google')
      Alert.alert('Error', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Add error animation function
  const animateError = () => {
    Animated.timing(errorAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  // Update error setting to include animation
  const setErrorWithAnimation = (message: string) => {
    setError(message)
    animateError()
  }

  // Add function to clear error with animation
  const clearErrorWithAnimation = () => {
    Animated.timing(errorAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setError('')
    })
  }

  const onSignUpPress = async () => {
    if (!isLoaded) return

    // Rate limiting: Only allow one attempt every 2 seconds
    const now = Date.now()
    if (now - lastAttemptTime < 2000) {
      setErrorWithAnimation('Please wait a moment before trying again')
      return
    }

    // Validate inputs
    if (!emailAddress || !password) {
      setErrorWithAnimation('Please enter both email and password')
      return
    }

    setIsLoading(true)
    setLastAttemptTime(now)

    try {
      await signUp.create({
        emailAddress,
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
      clearErrorWithAnimation()
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || 'Failed to create account. Please try again.'
      setErrorWithAnimation(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const onVerifyPress = async () => {
    if (!isLoaded) return

    // Rate limiting for verification
    const now = Date.now()
    if (now - lastAttemptTime < 2000) {
      setErrorWithAnimation('Please wait a moment before trying again')
      return
    }

    // Validate code
    if (!code) {
      setErrorWithAnimation('Please enter the verification code')
      return
    }

    setIsLoading(true)
    setLastAttemptTime(now)

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/onboarding/screen1')
      } else {
        setErrorWithAnimation('Verification failed. Please try again.')
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || 'Failed to verify email. Please try again.'
      setErrorWithAnimation(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoaded) {
    return null
  }

  if (pendingVerification) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        
        {/* Background waves */}
        <View style={styles.backgroundWaves} pointerEvents="none">
          {/* First wave */}
          <Animated.View 
            style={[
              styles.wave, 
              styles.wave1, 
              getWave1Style()
            ]}
          >
            <Wave1SVG />
          </Animated.View>
          
          {/* Second wave */}
          <Animated.View 
            style={[
              styles.wave, 
              styles.wave2, 
              getWave2Style()
            ]}
          >
            <Wave2SVG />
          </Animated.View>
        </View>
        
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                styles.formContainer,
                getSlideStyle()
              ]}
            >
              <View style={styles.header}>
                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>Enter the verification code sent to your email</Text>
              </View>
                
              {error ? (
                <Animated.View 
                  style={[
                    styles.errorContainer,
                    {
                      opacity: errorAnim,
                      transform: [{
                        translateY: errorAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0]
                        })
                      }]
                    }
                  ]}
                >
                  <Ionicons name="alert-circle" size={20} color="#FFEBCD" style={styles.errorIcon} />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}
                
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="keypad-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    value={code}
                    onChangeText={(code) => {
                      setCode(code)
                      setError('')
                    }}
                    style={styles.input}
                    placeholder="Enter verification code"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    editable={!isLoading}
                  />
                </View>
              </View>
                
              <TouchableOpacity 
                style={[styles.primaryButton, isLoading && styles.disabledButton]} 
                onPress={onVerifyPress}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={ORANGE} />
                ) : (
                  <Text style={styles.primaryButtonText}>Verify Email</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Stack.Screen 
        options={{
          headerTitle: "",
          headerShown: true,
          headerStyle: {
            backgroundColor: ORANGE,
          },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          ...Platform.select({
            web: {
              headerTitle: "Sign Up",
              headerTitleStyle: {
                color: '#fff',
                fontSize: 20,
                fontWeight: '600',
              },
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
            getWave1Style()
          ]}
        >
          <Wave1SVG />
        </Animated.View>
        
        {/* Second wave */}
        <Animated.View 
          style={[
            styles.wave, 
            styles.wave2, 
            getWave2Style()
          ]}
        >
          <Wave2SVG />
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
                getIconStyle()
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
                    transform: Platform.OS === 'web' 
                      ? [{ translateY: iconAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [5, 0]
                        })}]
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
              getSlideStyle()
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.subtitle}>Join us to start your food analysis journey</Text>
            </View>
            
            {error ? (
              <Animated.View 
                style={[
                  styles.errorContainer,
                  {
                    opacity: errorAnim,
                    transform: [{
                      translateY: errorAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0]
                      })
                    }]
                  }
                ]}
              >
                <Ionicons name="alert-circle" size={20} color="#FFEBCD" style={styles.errorIcon} />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  autoCapitalize="none"
                  value={emailAddress}
                  placeholder="Email address"
                  placeholderTextColor="#999"
                  onChangeText={(email) => {
                    setEmailAddress(email)
                    if (error) clearErrorWithAnimation()
                  }}
                  style={styles.input}
                  editable={!isLoading}
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  value={password}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  onChangeText={(password) => {
                    setPassword(password)
                    if (error) clearErrorWithAnimation()
                  }}
                  style={styles.input}
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
              onPress={onSignUpPress}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={ORANGE} />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.googleButton}
              onPress={onGoogleSignUp}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Link href="../sign-in" style={styles.link}>
                <Text style={styles.linkText}>Sign in</Text>
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
    ...Platform.select({
      web: {
        willChange: 'transform, left', // Performance optimization for web
      }
    })
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
    position: 'relative',
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.2)',
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#FFEBCD',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  disabledButton: {
    opacity: 0.7,
  },
})