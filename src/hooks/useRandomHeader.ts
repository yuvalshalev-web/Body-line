import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';

// Fallback image if no headers are found
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1920&auto=format&fit=crop';

export const useRandomHeader = () => {
  const { siteAssets } = useData();
  const [headerImage, setHeaderImage] = useState(FALLBACK_IMAGE);

  useEffect(() => {
    if (!siteAssets) {
      setHeaderImage(FALLBACK_IMAGE);
      return;
    }

    const urls = (siteAssets?.headers && siteAssets.headers.length > 0) 
      ? siteAssets.headers 
      : (siteAssets?.staticHeroImage && siteAssets.staticHeroImage.length > 0 ? [siteAssets.staticHeroImage] : []);

    if (urls.length > 0) {
      const randomIndex = Math.floor(Math.random() * urls.length);
      const randomHeader = urls[randomIndex];
      setHeaderImage(randomHeader);
    } else {
      setHeaderImage(FALLBACK_IMAGE);
    }
  }, [siteAssets?.headers, siteAssets?.staticHeroImage]);

  return headerImage;
};
