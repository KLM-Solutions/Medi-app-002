import React, { useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { colors } from '@/constants/colors';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/utils/image-crop';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onClose: () => void;
}

export function ImageCropper({ image, onCropComplete, onClose }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropping, setCropping] = useState(false);

  const handleCropComplete = async (croppedArea: any) => {
    if (cropping) return;
    setCropping(true);
    try {
      const croppedImage = await getCroppedImg(
        `data:image/jpeg;base64,${image}`,
        croppedArea
      );
      onCropComplete(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setCropping(false);
    }
  };

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.container}>
      <View style={styles.cropperContainer}>
        <Cropper
          image={`data:image/jpeg;base64,${image}`}
          crop={crop}
          zoom={zoom}
          aspect={4 / 3}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          style={styles.cropper}
        />
      </View>
      <View style={styles.controls}>
        <Text style={styles.instructionText}>
          Adjust the crop area and zoom to focus on your food
        </Text>
        <button
          onClick={onClose}
          style={styles.closeButton}
        >
          Cancel
        </button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  cropperContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 640,
    height: '60vh',
  },
  cropper: {
    width: '100%',
    height: '100%',
  },
  controls: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  closeButton: {
    padding: '10px 20px',
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
    fontSize: 16,
  },
}); 