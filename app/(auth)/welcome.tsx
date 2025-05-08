import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, Dimensions, Animated, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { colors, shadows } from '../../constants/colors';
import Svg, { Path, Circle, Rect, Line, Defs, LinearGradient, Stop, Mask } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const ORANGE = '#FF5A1F'; // Matching the bright orange from the image
const LIGHT_ORANGE = '#FF8F6D'; // Lighter orange for the waves
const isSmallDevice = width < 375; // iPhone SE and similar small devices

// Food images array
const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000', // Healthy salad
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000', // Vegetables
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000', // Breakfast bowl
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1000', // Fruit dish
];

// Food icon paths (simplified SVG paths)
const FOOD_ICONS = {
  apple: "M12,3c0,0-6.186,5.34-6.186,13.815C5.814,25.29,12,27,12,27s6.186-1.71,6.186-10.185C18.186,8.34,12,3,12,3z M15,15 c-1,0-2,0.5-2.75,1h-0.5C10.995,15.5,9.985,15,9,15c-1.645,0-3,1.355-3,3c0,0.353,0.022,0.694,0.051,1.027 C6.218,20.369,6.771,21.535,8,22h8c1.229-0.465,1.782-1.631,1.949-2.973C17.978,18.694,18,18.353,18,18C18,16.355,16.645,15,15,15z",
  carrot: "M10.5,5.3L8.8,7l13.9,13.9L24.4,19L10.5,5.3z M22.8,18.3c-3.4,3.4-7.5,2.1-10.4-0.8S8.2,10.5,11.7,7.2c0.2-0.2,0.2-0.5,0-0.7 c-0.2-0.2-0.5-0.2-0.7,0c-3.8,3.8-2.7,8.5,0.6,11.8s8,4.5,11.8,0.6c0.2-0.2,0.2-0.5,0-0.7C23.3,18.1,23,18.1,22.8,18.3z",
  avocado: "M6.4,11.4c-4.2,9,1.8,15,7.3,13.8c5.5-1.2,3.8-5.8,7.4-8.9c3.6-3,6-2.7,6-9.2s-1.7-7.1-7.9-7.1c-6.2,0-8.3,1.5-12.8,11.4z",
  broccoli: "M16.3,22h-5c-0.7-0.7-1.5-1.3-2.3-1.9c0.4-1.7,1.2-3.2,2.5-4.8c-0.4-0.2-0.8-0.5-1.2-0.7c-1.3,1.6-2.2,3.3-2.6,5.2 C7,19.5,6.3,19.3,5.5,19c-0.2-1.8,0.1-3.5,0.7-5.3c-0.5-0.1-0.9-0.1-1.4-0.2c-0.7,1.9-0.9,3.8-0.7,5.8C2.2,18.7,1,17.8,1,16.6 c0-0.2,0-0.4,0.1-0.6c-0.3,0.1-0.7,0.1-1,0.2c0,0.1,0,0.3,0,0.4c0,1.9,1.7,3.3,4.2,4.1c0.4,0.7,0.8,1.3,1.4,1.9 c-0.7,0-1.4,0-2.1,0C4.9,22.3,6,23,7.3,23h9c1.3,0,2.4-0.7,3.8-0.4c-0.7,0-1.4,0-2.1,0C17.5,22.6,16.9,22.3,16.3,22z M19.8,13.3 c-0.3-0.2-0.5-0.4-0.8-0.6c1.4-3.7,0.3-6.9-4.4-10.1c0.1,0.5,0.1,1,0.2,1.4c3.8,2.9,4.8,5.5,3.6,8.6c-0.7-0.3-1.4-0.7-2.1-0.9 c0.9-2.3,0.3-4.3-2.2-6.5c0,0.6,0,1.2,0,1.8c1.9,1.9,2.5,3.4,1.7,5.2c-0.6-0.2-1.1-0.3-1.7-0.4c0.6-1.4,0.3-2.6-1.2-3.9 c-1.4,1.2-1.8,2.4-1.1,3.8c-0.6,0.1-1.2,0.2-1.7,0.4c-0.7-1.8-0.1-3.3,1.8-5.1c0.1-0.6,0.1-1.2,0.1-1.8c-2.5,2.1-3.1,4.1-2.2,6.4 c-0.7,0.3-1.4,0.6-2.1,0.9c-1.2-3.1-0.1-5.6,3.7-8.5c0.1-0.5,0.1-1,0.2-1.4c-4.7,3.2-5.9,6.4-4.5,10C6.4,8.2,7.5,7.1,9,6.3 c0.1,0.4,0.2,0.8,0.3,1.2c-1.2,0.7-2.1,1.4-2.8,2.3c1.9-0.2,3.6,0.2,5.3,1.1c-0.1,0.5-0.3,1-0.4,1.5c-1.6-0.8-3.1-1.1-4.8-0.9 c0.4,0.6,0.7,1.1,1.1,1.6c1.3-0.2,2.4-0.1,3.6,0.3c-0.7,1.7-0.7,3.1,0.1,4.3c0.3,0.2,0.6,0.4,0.8,0.6c1.1-1.1,1.7-2.5,2-4.2 c0.4-0.1,0.8-0.2,1.2-0.2c-0.3,2-0.9,3.7-2.2,5c0.3,0.1,0.5,0.2,0.8,0.2c2.8-2.8,3.3-6.4,2.1-10.9c1.1-1,2.7-1.7,4.5-2.1c0.1-0.4,0.2-0.8,0.2-1.2 c-2.1,0.4-3.8,1.1-5.1,2.2C20.4,10.1,20.1,11.8,19.8,13.3z",
  bread: "M16,6C8,6,2,12,2,12s6,6,14,6s14-6,14-6S24,6,16,6z M16,16c-2.2,0-4-1.8-4-4c0-2.2,1.8-4,4-4s4,1.8,4,4 C20,14.2,18.2,16,16,16z",
  taco: "M25.5,12c-1.1-5.2-5.6-9-11-9s-9.9,3.8-11,9c-0.1,0.4-0.2,0.8-0.3,1.2c-1.3,4.7,0.4,9.9,4.4,12.8l0,0 c0.2,0.1,0.3,0.2,0.5,0.3C9.9,27.4,11.9,28,14,28c2.1,0,4.1-0.6,5.9-1.7l0,0c0.2-0.1,0.3-0.2,0.5-0.3c4-2.9,5.7-8.1,4.4-12.8 C25.7,12.8,25.6,12.4,25.5,12z M15.1,24.1c-2.6,0-4.7-3.1-4.7-7c0-3.9,2.1-7,4.7-7s4.7,3.1,4.7,7C19.8,21,17.6,24.1,15.1,24.1z"
};

// Default plate size for styles
const DEFAULT_PLATE_SIZE = width * 0.5;

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Animation values for scanning effect
  const scanAnim = useRef(new Animated.Value(0)).current;
  const scanProgressAnim = useRef(new Animated.Value(0)).current;
  const scanOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Corner animation values
  const cornerAnim1 = useRef(new Animated.Value(0)).current;
  const cornerAnim2 = useRef(new Animated.Value(0)).current;
  const cornerAnim3 = useRef(new Animated.Value(0)).current;
  const cornerAnim4 = useRef(new Animated.Value(0)).current;
  
  // Pulse animation for data points
  const pulseAnim = useRef(new Animated.Value(0)).current;
  
  // Wave animation values
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  
  // State for scan percentage with decimals
  const [scanPercent, setScanPercent] = useState("0.0%");
  
  useEffect(() => {
    // Food image cycling animation
    const cycleImages = () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % FOOD_IMAGES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      });
    };
    
    // Run scanning animation
    const runScanAnimation = () => {
      // Reset
      scanAnim.setValue(0);
      scanProgressAnim.setValue(0);
      setScanPercent("0.0%");
      
      // First show the scan overlay
      Animated.timing(scanOpacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      // Then run the scanning line animation
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();
      
      // Progress indicator animation with listeners to update text with decimals
      scanProgressAnim.addListener(({ value }) => {
        const percent = (value * 100).toFixed(1);
        setScanPercent(`${percent}%`);
      });
      
      Animated.timing(scanProgressAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start(() => {
        // Hide scan overlay after scan completes
        Animated.timing(scanOpacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          delay: 1000
        }).start(() => {
          // Remove listener to prevent memory leaks
          scanProgressAnim.removeAllListeners();
        });
      });
    };
    
    // Corner targeting animations
    const animateCorners = () => {
      // Sequence the four corners to animate one after another
      Animated.stagger(150, [
        Animated.timing(cornerAnim1, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(cornerAnim2, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(cornerAnim3, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(cornerAnim4, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset all corners after a delay
        setTimeout(() => {
          cornerAnim1.setValue(0);
          cornerAnim2.setValue(0);
          cornerAnim3.setValue(0);
          cornerAnim4.setValue(0);
        }, 2000);
      });
    };
    
    // Data points pulsing animation
    const pulsateDataPoints = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    
    // Animate background waves
    const animateWaves = () => {
      // Infinite wave animation loops
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave1Anim, {
            toValue: 1,
            duration: 12000,
            useNativeDriver: true,
          }),
          Animated.timing(wave1Anim, {
            toValue: 0,
            duration: 12000,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Second wave with offset timing
      Animated.loop(
        Animated.sequence([
          Animated.timing(wave2Anim, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(wave2Anim, {
            toValue: 0,
            duration: 8000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    
    // Start animations
    const imageInterval = setInterval(cycleImages, 5000);
    pulsateDataPoints();
    animateWaves();
    
    // Run the scanning animation every 5 seconds
    const scanInterval = setInterval(() => {
      runScanAnimation();
      
      // Run corner targeting animation after scan starts
      setTimeout(() => {
        animateCorners();
      }, 1000);
    }, 5000);
    
    // Initial scan
    setTimeout(() => {
      runScanAnimation();
      setTimeout(() => {
        animateCorners();
      }, 1000);
    }, 1000);
    
    return () => {
      clearInterval(imageInterval);
      clearInterval(scanInterval);
      scanProgressAnim.removeAllListeners();
    };
  }, []);

  // Calculate responsive sizes based on screen dimensions
  const getPlateSize = () => {
    if (height < 700) return width * 0.45; // Smaller devices
    if (width > 400) return width * 0.55; // Larger phones
    return width * 0.5; // Default size
  };

  const plateSize = getPlateSize();
  const topPadding = isSmallDevice ? 10 : (insets.top > 0 ? 20 : 40);
  const horizontalPadding = isSmallDevice ? 16 : 24;
  const headingSize = isSmallDevice ? 24 : 28;
  const subtitleSize = isSmallDevice ? 14 : 15;
  
  // Calculate scan line position from animation value
  const scanLineY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, plateSize]
  });
  
  // Corner scale and opacity animations
  const cornerScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3]
  });
  
  // Wave animation transformations
  const wave1Transform = {
    translateX: wave1Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-width * 0.2, width * 0.2]
    })
  };
  
  const wave2Transform = {
    translateX: wave2Anim.interpolate({
      inputRange: [0, 1],
      outputRange: [width * 0.2, -width * 0.2]
    })
  };

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
            { transform: [wave1Transform] }
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
            { transform: [wave2Transform] }
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
          <View style={[styles.topSection, { paddingTop: topPadding, paddingHorizontal: horizontalPadding }]}>
            <View style={styles.illustrationContainer}>
              <View style={styles.imageContainer}>
                <Text style={[styles.headline, { fontSize: headingSize }]}>
                  Snap. Analyze. Eat Smarter
                </Text>
                <Text style={[styles.subtitle, { fontSize: subtitleSize }]}>
                  AI-powered nutrition insights. Track nutrients, avoid risks, and stay medication-safe
                </Text>
                
                <View style={[styles.plateContainer, { height: plateSize * 1.2 }]}>
                  <View style={[styles.plate, { width: plateSize, height: plateSize }]}>
                    <Animated.Image
                      source={{ uri: FOOD_IMAGES[currentImageIndex] }}
                      style={[styles.foodImage, { opacity: fadeAnim }]}
                      resizeMode="cover"
                    />
                    
                    {/* AI Scanning Overlay */}
                    <Animated.View 
                      style={[
                        styles.scanOverlay, 
                        { 
                          opacity: scanOpacityAnim, 
                          width: '100%', 
                          height: '100%',
                          borderRadius: 14  // Match the plate's inner border radius
                        }
                      ]}
                      pointerEvents="none"
                    >
                      {/* Scanning line */}
                      <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]}>
                        <View style={styles.scanLineInner} />
                      </Animated.View>
                      
                      {/* Progress indicator */}
                      <View style={styles.scanProgress}>
                        <Text style={styles.scanPercentage}>
                          {scanPercent}
                        </Text>
                        <Text style={styles.scanLabel}>ANALYZING</Text>
                      </View>
                      
                      {/* Targeting corners */}
                      <Animated.View 
                        style={[
                          styles.targetCorner, 
                          styles.topLeft, 
                          { opacity: cornerAnim1, transform: [{ scale: cornerAnim1 }] }
                        ]}
                      />
                      <Animated.View 
                        style={[
                          styles.targetCorner, 
                          styles.topRight, 
                          { opacity: cornerAnim2, transform: [{ scale: cornerAnim2 }] }
                        ]}
                      />
                      <Animated.View 
                        style={[
                          styles.targetCorner, 
                          styles.bottomLeft, 
                          { opacity: cornerAnim3, transform: [{ scale: cornerAnim3 }] }
                        ]}
                      />
                      <Animated.View 
                        style={[
                          styles.targetCorner, 
                          styles.bottomRight, 
                          { opacity: cornerAnim4, transform: [{ scale: cornerAnim4 }] }
                        ]}
                      />
                      
                      {/* Data point indicators */}
                      {[...Array(6)].map((_, i) => {
                        // Position data points at random spots on the image
                        const randomX = Math.random() * 0.8 + 0.1; // Between 10-90% of width
                        const randomY = Math.random() * 0.8 + 0.1; // Between 10-90% of height
                        
                        return (
                          <Animated.View 
                            key={`data-point-${i}`} 
                            style={[
                              styles.dataPoint,
                              {
                                left: `${randomX * 100}%`,
                                top: `${randomY * 100}%`,
                                transform: [{ scale: cornerScale }],
                              }
                            ]}
                          >
                            <View style={styles.dataPointInner} />
                          </Animated.View>
                        );
                      })}
                    </Animated.View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[
          styles.bottomSection, 
          { 
            paddingBottom: Math.max(insets.bottom, 16),
            paddingHorizontal: horizontalPadding,
            paddingTop: isSmallDevice ? 16 : 24 
          }
        ]}>
          <Text style={styles.welcomeText}>Welcome to Food App</Text>
          <Text style={styles.descriptionText}>Your personal nutrition assistant</Text>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account?</Text>
            <TouchableOpacity 
              style={[styles.loginButton, styles.signUpButton]} 
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <Text style={styles.signUpButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.termsText, { lineHeight: isSmallDevice ? 14 : 18 }]}>
            By continuing, you agree to our{"\n"}
            <Text style={styles.link}>Terms of Service</Text> <Text style={styles.dot}>·</Text> <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ORANGE,
    position: 'relative',
    overflow: 'hidden',
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
  },
  topSection: {
    flex: 1,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    minHeight: height * 0.6,
  },
  illustrationContainer: {
    flex: 1,
    zIndex: 2,
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    zIndex: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.95,
    lineHeight: 22,
    zIndex: 3,
    paddingHorizontal: 10,
    maxWidth: 500, 
    alignSelf: 'center',
  },
  plateContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    zIndex: 3,
  },
  plate: {
    borderRadius: 20,
    borderWidth: 6,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 2,
    position: 'relative',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  // Scan overlay styles
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    zIndex: 10,
  },
  scanLineInner: {
    height: '100%',
    backgroundColor: ORANGE,
    opacity: 0.8,
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  scanProgress: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 6,
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 12,
  },
  scanPercentage: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scanLabel: {
    color: '#FFFFFF',
    fontSize: 8,
    opacity: 0.8,
    marginTop: 2,
  },
  targetCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
    zIndex: 11,
  },
  topLeft: {
    top: 10,
    left: 10,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 10,
    right: 10,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },
  dataPoint: {
    position: 'absolute',
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 12,
  },
  dataPointInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#32FFD2',
    shadowColor: '#32FFD2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 12,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  signUpContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  loginButton: {
    backgroundColor: ORANGE,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  signUpButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: ORANGE,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpButtonText: {
    color: ORANGE,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#888888',
    marginHorizontal: 16,
    fontSize: 14,
  },
  termsText: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
  },
  link: {
    color: ORANGE,
    textDecorationLine: 'underline',
  },
  dot: {
    color: '#888888',
  },
}); 