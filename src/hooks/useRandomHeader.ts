import { useState, useEffect } from 'react';

// Import all images from the headers directory
const headerImages = import.meta.glob('../assets/headers/*.{jpg,jpeg,png}', { eager: true, query: 'url', import: 'default' }) as Record<string, string>;
const headerUrls = Object.values(headerImages);

export const useRandomHeader = () => {
  const [headerImage, setHeaderImage] = useState(headerUrls[0] || '');

  useEffect(() => {
    if (headerUrls.length > 0) {
      const randomHeader = headerUrls[Math.floor(Math.random() * headerUrls.length)];
      setHeaderImage(randomHeader);
    }
  }, []);

  return headerImage;
};
