import { useState, useEffect } from 'react';

export const useRandomHeader = () => {
  const [headerImage, setHeaderImage] = useState('/headers/header_1.jpg');

  useEffect(() => {
    const headers = [
      'header_1.jpg', 'header_10.jpeg', 'header_11.jpg', 'header_2.jpeg',
      'header_3.jpeg', 'header_4.jpg', 'header_5.jpg', 'header_6.jpg',
      'header_7.jpg', 'header_8.jpeg'
    ];
    const randomHeader = headers[Math.floor(Math.random() * headers.length)];
    setHeaderImage(`/headers/${randomHeader}`);
  }, []);

  return headerImage;
};
