export async function compressImage(base64Image: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw image with new dimensions
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 with specified quality
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64.split(',')[1]); // Remove the data URL prefix
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Set the source to the base64 image
    img.src = `data:image/jpeg;base64,${base64Image}`;
  });
} 