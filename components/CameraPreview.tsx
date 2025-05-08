import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text, Pressable } from 'react-native';
import { colors } from '@/constants/colors';
import { X } from 'lucide-react-native';

interface CameraPreviewProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export function CameraPreview({ onCapture, onClose }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Check if we're on a mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    };
    setIsMobile(checkMobile());

    const checkPermissions = async () => {
      try {
        // Check if permissions API is available
        if (!navigator.permissions || !navigator.permissions.query) {
          return 'prompt';
        }

        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return result.state;
      } catch (error) {
        console.error('Error checking permissions:', error);
        return 'prompt';
      }
    };

    const setupCamera = async () => {
      try {
        setIsInitializing(true);
        setError(null);

        // Check if we're in a secure context
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          throw new Error('Camera access requires HTTPS or localhost');
        }

        // Check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not available in this browser');
        }

        // Check current permission status
        const status = await checkPermissions();
        setPermissionStatus(status);

        if (status === 'denied') {
          throw new Error('Camera access was denied. Please enable camera permissions in your browser settings.');
        }

        // Try different camera configurations
        const constraints = {
          video: {
            facingMode: isMobile ? 'environment' : 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        // First try with preferred constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await new Promise((resolve) => {
              videoRef.current!.onloadedmetadata = () => {
                videoRef.current!.play().then(() => {
                  setIsCameraReady(true);
                  setIsInitializing(false);
                  resolve(null);
                }).catch((error) => {
                  console.error('Error playing video:', error);
                  throw new Error('Failed to start camera preview');
                });
              };
            });
          }
        } catch (error) {
          console.error('Error with preferred constraints:', error);
          // If that fails, try with more basic constraints
          const fallbackConstraints = {
            video: true
          };
          const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          streamRef.current = stream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await new Promise((resolve) => {
              videoRef.current!.onloadedmetadata = () => {
                videoRef.current!.play().then(() => {
                  setIsCameraReady(true);
                  setIsInitializing(false);
                  resolve(null);
                }).catch((error) => {
                  console.error('Error playing video:', error);
                  throw new Error('Failed to start camera preview');
                });
              };
            });
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setError(error instanceof Error ? error.message : 'Failed to access camera');
        setIsInitializing(false);
      }
    };

    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onClose, isMobile]);

  const handlePermissionRequest = async () => {
    try {
      setIsInitializing(true);
      setError(null);
      
      // Try to get camera access again
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      // If successful, close and reopen the camera preview
      onClose();
      setTimeout(() => {
        const event = new CustomEvent('requestCamera');
        window.dispatchEvent(event);
      }, 100);
    } catch (error) {
      console.error('Error requesting permission:', error);
      setError('Failed to request camera permission. Please check your browser settings.');
    } finally {
      setIsInitializing(false);
    }
  };

  const capturePhoto = () => {
    if (Platform.OS !== 'web' || !videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(base64Image.split(',')[1]);
      } else {
        throw new Error('Could not get canvas context');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      setError(error instanceof Error ? error.message : 'Failed to capture photo');
    }
  };

  if (Platform.OS === 'web') {
    return (
      <div style={webStyles.container}>
        <div style={webStyles.closeButton} onClick={onClose}>
          <X size={24} color={colors.background} />
        </div>
        {error ? (
          <div style={webStyles.errorContainer}>
            <div style={webStyles.errorText}>{error}</div>
            <div style={webStyles.errorHelpText}>
              {isMobile ? 'Please ensure you have granted camera permissions and are using a supported browser.' : ''}
            </div>
            {permissionStatus === 'denied' ? (
              <div style={webStyles.errorHelpText}>
                Please enable camera permissions in your browser settings and try again.
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div style={webStyles.previewContainer}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={webStyles.video}
              />
              {(isInitializing || !isCameraReady) && (
                <div style={webStyles.loadingOverlay}>
                  <div style={webStyles.loadingText}>
                    {isInitializing ? 'Initializing camera...' : 'Waiting for camera...'}
                  </div>
                </div>
              )}
            </div>
            <div style={webStyles.controls}>
              <div style={webStyles.instructionText}>
                Position your food in the frame and tap Capture when ready
              </div>
              <button
                onClick={capturePhoto}
                style={webStyles.captureButton}
                disabled={!isCameraReady}
              >
                {isCameraReady ? 'Capture' : 'Loading...'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.closeButton}
        onPress={onClose}
      >
        <X size={24} color={colors.background} />
      </Pressable>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {isInitializing && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing camera...</Text>
        </View>
      )}
      {isCameraReady && (
        <Pressable
          style={styles.captureButton}
          onPress={capturePhoto}
        >
          <View style={styles.captureButtonInner} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  captureButton: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FB5A2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FB5A2D',
    borderWidth: 2,
    borderColor: 'black',
  },
});

const webStyles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  closeButton: {
    position: 'absolute',
    top: '60px',
    right: '20px',
    zIndex: 1,
    padding: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '20px',
    cursor: 'pointer',
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    maxWidth: '640px',
    maxHeight: '480px',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: '16px',
  },
  controls: {
    position: 'absolute',
    bottom: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  instructionText: {
    color: 'white',
    fontSize: '16px',
    textAlign: 'center',
  },
  captureButton: {
    padding: '10px 20px',
    backgroundColor: '#FB5A2D',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  errorText: {
    color: 'white',
    fontSize: '16px',
    textAlign: 'center',
    marginBottom: '10px',
  },
  errorHelpText: {
    color: 'white',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '10px',
  },
}; 