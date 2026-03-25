import { useState, useEffect } from 'react';

// Hardcoded list of headers from the public directory for absolute consistency
const headerUrls: string[] = [
  '/assets/headers/header_2.jpeg',
  '/assets/headers/header_3.jpeg',
  '/assets/headers/header_4.jpg',
  '/assets/headers/header_5.jpg',
  '/assets/headers/header_6.jpg',
  '/assets/headers/header_7.jpg',
  '/assets/headers/header_8.jpeg',
  '/assets/headers/header_9.jpeg',
  '/assets/headers/header_10.jpeg',
  '/assets/headers/header_11.jpg',
];

console.log('Header URLs defined (excluding static hero):', headerUrls.length);

// Fallback image if no headers are found
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1502680399488-2a6574c5037e?auto=format&fit=crop&q=80&w=1920';

export const useRandomHeader = () => {
  const [headerImage, setHeaderImage] = useState(headerUrls[0] || FALLBACK_IMAGE);

  useEffect(() => {
    if (headerUrls.length > 0) {
      const randomIndex = Math.floor(Math.random() * headerUrls.length);
      const randomHeader = headerUrls[randomIndex];
      console.log('Selecting random header:', randomHeader);
      setHeaderImage(randomHeader);
    } else {
      console.log('No headers found, using fallback');
    }
  }, []);

  return headerImage;
};
