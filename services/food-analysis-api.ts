import axios from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';


interface FoodAnalysisResponse {
  success: boolean;
  analysis: string;
  error?: string;
}

// Helper function to convert file URI to base64
const uriToBase64 = async (uri: string): Promise<string> => {
  try {
    console.log('Processing URI:', uri);
    
    // If it's already a base64 string, return it
    if (uri.startsWith('data:')) {
      return uri.split(',')[1];
    }
    
    // If it's a base64 string without the data: prefix, return it
    if (uri.length > 100 && !uri.includes('://')) {
      return uri;
    }
    
    // Handle different URI schemes
    let fileUri = uri;
    
    // For iOS, we might get a file:// URI directly
    if (uri.startsWith('file://')) {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
    
    // If it's a content:// URI, we need to convert it to a file:// URI
    if (uri.startsWith('content://')) {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      fileUri = fileInfo.uri;
    }
    
    // If we have a file:// URI, proceed with reading
    if (fileUri.startsWith('file://')) {
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
    
    // For iOS, we might get a PHAsset URL
    if (uri.startsWith('ph://')) {
      // Convert PHAsset URL to file URI
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      const base64 = await FileSystem.readAsStringAsync(fileInfo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
    
    throw new Error('Unsupported URI scheme');
  } catch (error) {
    console.error('Error converting URI to base64:', error);
    throw new Error('Failed to process image. Please try again with a different image.');
  }
};

export const analyzeFoodComparison = async (beforeImage: string, afterImage: string): Promise<string> => {
  try {
    console.log('Starting food analysis comparison...');
    console.log('Platform:', Platform.OS);
    console.log('Before image type:', typeof beforeImage);
    console.log('After image type:', typeof afterImage);

    // Validate input images
    if (!beforeImage || !afterImage) {
      throw new Error('Both before and after images are required');
    }

    let requestData;
    let headers;

    if (Platform.OS === 'web') {
      // Web implementation remains the same
      const formData = new FormData();
      const beforeBlob = await fetch(`data:image/jpeg;base64,${beforeImage}`).then(res => res.blob());
      const afterBlob = await fetch(`data:image/jpeg;base64,${afterImage}`).then(res => res.blob());
      
      formData.append('beforeImage', beforeBlob, 'before.jpg');
      formData.append('afterImage', afterBlob, 'after.jpg');
      
      requestData = formData;
      headers = {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      };
    } else {
      try {
        // For mobile, use JSON with base64 encoded images
        console.log('Converting images to base64...');
        const beforeBase64 = await uriToBase64(beforeImage);
        const afterBase64 = await uriToBase64(afterImage);

        console.log('Base64 conversion successful');
        console.log('Before image length:', beforeBase64.length);
        console.log('After image length:', afterBase64.length);

        requestData = {
          beforeImage: beforeBase64,
          afterImage: afterBase64
        };
        
        headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        };
      } catch (error) {
        console.error('Error processing images:', error);
        throw new Error('Failed to process images. Please try again.');
      }
    }

    console.log('Sending request to server...');
    const response = await axios.post<FoodAnalysisResponse>(
      'https://food-stage-2.vercel.app/api/food-analysis',
      requestData,
      {
        headers,
        timeout: 120000,
        maxContentLength: 10 * 1024 * 1024,
        validateStatus: (status) => status >= 200 && status < 500
      }
    );

    console.log('Server response status:', response.status);
    console.log('Server response data:', response.data);

    if (!response.data) {
      throw new Error('Empty response from server');
    }

    if (response.data.success === false) {
      throw new Error(response.data.error || 'Server returned an error');
    }

    if (response.data.analysis) {
      return response.data.analysis;
    }

    throw new Error('Invalid response format from server');

  } catch (error: unknown) {
    console.error('Error in food analysis:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        }
      });
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      
      if (error.response?.status === 500) {
        throw new Error('Server error: Please try again later');
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout: Please check your internet connection');
      }
      
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error: Please check your internet connection');
      }
      
      throw new Error(error.message || 'Failed to analyze food');
    }
    
    throw error;
  }
};