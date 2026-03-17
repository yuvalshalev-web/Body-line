
/**
 * מעבד תמונות בצד הלקוח:
 * 1. בדיקת גודל (עד 5MB)
 * 2. שינוי גודל (Resize) לרוחב מקסימלי
 * 3. המרה ל-WebP
 * 4. כיווץ איכות
 */
export const processImage = async (
  file: File, 
  maxWidth = 800, 
  quality = 0.6,
  targetSizeKB = 50
): Promise<{ blob: Blob; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    // ולידציה בסיסית לגודל קובץ מקורי
    if (file.size > 10 * 1024 * 1024) {
       return reject(new Error('הקובץ גדול מדי. הגודל המקסימלי המותר הוא 10MB.'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('לא ניתן ליצור הקשר Canvas.'));

        ctx.drawImage(img, 0, 0, width, height);

        const compress = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // If blob is still too large and quality is high enough, try again
                if (blob.size > targetSizeKB * 1024 && q > 0.1) {
                  compress(q - 0.1);
                } else {
                  const dataUrl = canvas.toDataURL('image/webp', q);
                  resolve({ blob, dataUrl });
                }
              } else {
                reject(new Error('עיבוד התמונה ל-Blob נכשל.'));
              }
            },
            'image/webp',
            q
          );
        };

        compress(quality);
      };
      img.onerror = () => reject(new Error('טעינת התמונה נכשלה. הקובץ עשוי להיות פגום.'));
    };
    reader.onerror = () => reject(new Error('קריאת הקובץ נכשלה.'));
  });
};
