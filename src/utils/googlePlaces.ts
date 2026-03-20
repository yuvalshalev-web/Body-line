import { doc, updateDoc } from 'firebase/firestore';
import { getDb } from '../services/firebase';

export const extractAddressData = (place: any) => {
  if (!place.address_components) {
    throw new Error('No address components found in the place object.');
  }

  let street = '';
  let houseNum = '';
  let city = '';
  let country = '';

  for (const component of place.address_components) {
    const types = component.types;

    if (types.includes('route')) {
      street = component.long_name;
    } else if (types.includes('street_number')) {
      houseNum = component.long_name;
    } else if (types.includes('locality') || types.includes('postal_town')) {
      city = component.long_name;
    } else if (types.includes('country')) {
      country = component.long_name;
    }
  }

  const formatted = place.formatted_address || `${street} ${houseNum}, ${city}, ${country}`.trim();
  const lat = place.geometry?.location?.lat() || null;
  const lng = place.geometry?.location?.lng() || null;

  return {
    street,
    houseNum,
    city,
    country,
    lat,
    lng,
    formatted
  };
};

/**
 * Centralized Google Maps script loader to prevent multiple script tags
 * and handle loading states consistently.
 */
let scriptLoadingPromise: Promise<void> | null = null;

export const loadGoogleMaps = (): Promise<void> => {
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  const apiKey = 
    process.env.GOOGLE_MAPS_PLATFORM_KEY || 
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 
    '';
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API Key is missing. Please set GOOGLE_MAPS_PLATFORM_KEY in Secrets."));
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    
    const handleLoad = () => {
      // Small delay to ensure all objects are initialized
      setTimeout(() => {
        if (window.google?.maps?.places) {
          resolve();
        } else {
          reject(new Error("Google Maps Places library not found after script load"));
        }
      }, 100);
    };

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad);
      existingScript.addEventListener('error', () => reject(new Error("Google Maps script failed to load")));
      
      // If script is already loaded but window.google isn't ready yet
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Safety timeout
      setTimeout(() => clearInterval(checkInterval), 10000);
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=he&region=IL`;
      script.async = true;
      script.defer = true;
      script.onload = handleLoad;
      script.onerror = () => reject(new Error("Google Maps script failed to load"));
      document.head.appendChild(script);
    }
  });

  return scriptLoadingPromise;
};

/**
 * Extracts address components from a Google Places Autocomplete result
 * and updates the user's document in Firestore.
 * 
 * @param place - The place object returned by google.maps.places.Autocomplete
 * @param userId - The ID of the current user
 */
export const updateMemberAddress = async (userId: string, place: any) => {
  const addressData = extractAddressData(place);

  const db = getDb();
  const userRef = doc(db, 'members', userId);

  try {
    await updateDoc(userRef, {
      street_name: addressData.street,
      house_number: addressData.houseNum,
      city: addressData.city,
      country: addressData.country,
      lat: addressData.lat,
      lng: addressData.lng,
      full_address: addressData.formatted
    });
    console.log("פרופיל המשתמש עודכן בהצלחה!");
    return addressData;
  } catch (error) {
    console.error("שגיאה בעדכון הנתונים:", error);
    throw error;
  }
};
