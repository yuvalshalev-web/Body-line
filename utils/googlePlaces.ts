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
