export const getCroppedImg = async (imageSrc: string, crop: any): Promise<string> => {
  const image = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  return new Promise((resolve, reject) => {
    image.onload = () => {
      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      // Convert to base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      resolve(base64Image.split(',')[1]); // Remove the data URL prefix
    };

    image.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    image.src = imageSrc;
  });
}; 