import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';

// Fallback image if no headers are found
const FALLBACK_IMAGE = '';

export const useRandomHeader = () => {
  const { siteAssets } = useData();
  const [headerImage, setHeaderImage] = useState(FALLBACK_IMAGE);

  useEffect(() => {
    const urls = (siteAssets?.headers && siteAssets.headers.length > 0) 
      ? siteAssets.headers 
      : (siteAssets?.staticHeroImage ? [siteAssets.staticHeroImage] : []);

    if (urls.length > 0) {
      const randomIndex = Math.floor(Math.random() * urls.length);
      const randomHeader = urls[randomIndex];
      setHeaderImage(randomHeader);
    } else {
      setHeaderImage('');
    }
  }, [siteAssets?.headers, siteAssets?.staticHeroImage]);

  return headerImage;
};
