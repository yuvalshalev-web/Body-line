
/**
 * מעבד תמונות בצד הלקוח:
 * 1. בדיקת גודל (עד 5MB)
 * 2. שינוי גודל (Resize) לרוחב מקסימלי
 * 3. המרה ל-WebP
 * 4. כיווץ איכות
 */
export const processImage = async (
  file: File, 
  maxWidth = 1200, 
  quality = 0.8
): Promise<{ blob: Blob; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    // ולידציה בסיסית לגודל קובץ מקורי
    if (file.size > 5 * 1024 * 1024) {
       return reject(new Error('הקובץ גדול מדי. הגודל המקסימלי המותר הוא 5MB.'));
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

        // חישוב מידות חדשות לשמירה על יחס גובה-רוחב
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('לא ניתן ליצור הקשר Canvas.'));

        // ציור התמונה על הקנבס במידות החדשות
        ctx.drawImage(img, 0, 0, width, height);

        // המרה ל-Blob בפורמט WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const dataUrl = canvas.toDataURL('image/webp', quality);
              resolve({ blob, dataUrl });
            } else {
              reject(new Error('עיבוד התמונה ל-Blob נכשל.'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('טעינת התמונה נכשלה. הקובץ עשוי להיות פגום.'));
    };
    reader.onerror = () => reject(new Error('קריאת הקובץ נכשלה.'));
  });
};
