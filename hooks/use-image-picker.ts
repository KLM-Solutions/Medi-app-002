import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { compressImage } from '@/utils/image-compression';
import * as ImageManipulator from 'expo-image-manipulator';

export function useImagePicker() {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access media library was denied');
      }
    }
  };

  const requestCameraPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access camera was denied');
      }
    } else {
      // Request camera permission for web
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        throw new Error('Permission to access camera was denied');
      }
    }
  };

  const pickImage = async () => {
    try {
      setLoading(true);
      await requestPermissions();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        if (Platform.OS === 'web') {
          // Web compression
          if (!result.assets[0].base64) {
            throw new Error('No base64 data available');
          }
          return await compressImage(result.assets[0].base64);
        } else if (Platform.OS === 'ios') {
          // iOS compression using ImageManipulator
          const manipResult = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 800 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );
          return manipResult.base64;
        }
        // For Android, return the original base64
        return result.assets[0].base64;
      }
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setLoading(true);
      await requestCameraPermissions();

      if (Platform.OS === 'web') {
        // Web implementation using MediaDevices API
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        video.srcObject = stream;
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play();
            resolve(null);
          };
        });

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Stop all video tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Convert canvas to base64 and compress
        const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        return await compressImage(base64Image);
      } else {
        // Native implementation
        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled) {
          // Ensure the base64 data is properly formatted for mobile display
          const base64Data = result.assets[0].base64;
          return base64Data;
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    pickImage,
    takePhoto,
    loading,
  };
}