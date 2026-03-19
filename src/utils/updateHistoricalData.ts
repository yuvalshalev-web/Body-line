import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { parseDate } from './dateUtils';

export const updateHistoricalData = async () => {
  const data = [
    { date: '25/09/2025', windSpeed: 27.0, waterTemp: 29.3 },
    { date: '02/10/2025', windSpeed: 9.0, waterTemp: 27.5 },
    { date: '09/10/2025', windSpeed: 6.48, waterTemp: 27.5 },
    { date: '16/10/2025', windSpeed: 9.0, waterTemp: 27.5 },
    { date: '23/10/2025', windSpeed: 7.56, waterTemp: 27.5 },
    { date: '30/10/2025', windSpeed: 8.28, waterTemp: 27.5 },
    { date: '06/11/2025', windSpeed: 7.2, waterTemp: 24.2 },
    { date: '13/11/2025', windSpeed: 11.52, waterTemp: 24.2 },
    { date: '20/11/2025', windSpeed: 7.2, waterTemp: 24.2 },
    { date: '27/11/2025', windSpeed: 31.68, waterTemp: 24.2 },
    { date: '04/12/2025', windSpeed: 8.64, waterTemp: 21.3 },
    { date: '11/12/2025', windSpeed: 8.28, waterTemp: 21.3 },
    { date: '18/12/2025', windSpeed: 11.88, waterTemp: 21.3 },
    { date: '25/12/2025', windSpeed: 4.32, waterTemp: 21.3 },
    { date: '01/01/2026', windSpeed: 20.16, waterTemp: 19.0 },
    { date: '08/01/2026', windSpeed: 50.04, waterTemp: 19.0 },
    { date: '15/01/2026', windSpeed: 10.08, waterTemp: 19.0 },
    { date: '22/01/2026', windSpeed: 12.6, waterTemp: 19.0 },
    { date: '29/01/2026', windSpeed: 23.04, waterTemp: 19.0 },
    { date: '05/02/2026', windSpeed: 10.44, waterTemp: 17.7 },
    { date: '12/02/2026', windSpeed: 8.28, waterTemp: 17.7 },
    { date: '19/02/2026', windSpeed: 14.4, waterTemp: 17.7 },
    { date: '26/02/2026', windSpeed: 6.84, waterTemp: 17.7 },
    { date: '05/03/2026', windSpeed: 12.6, waterTemp: 18.4 },
    { date: '12/03/2026', windSpeed: 17.28, waterTemp: 18.4 },
  ];

  try {
    const historyCollection = collection(db, 'weekly_history');
    const querySnapshot = await getDocs(historyCollection);
    
    for (const document of querySnapshot.docs) {
      const docData = document.data();
      const docDate = docData.date;
      const docDateObj = docDate?.toDate ? docDate.toDate() : new Date(docDate);

      for (const entry of data) {
        const entryDateObj = parseDate(entry.date);
        
        if (entryDateObj && docDateObj && 
            entryDateObj.getFullYear() === docDateObj.getFullYear() &&
            entryDateObj.getMonth() === docDateObj.getMonth() &&
            entryDateObj.getDate() === docDateObj.getDate()) {
          
          await updateDoc(doc(db, 'weekly_history', document.id), {
            windSpeed: entry.windSpeed,
            waterTemp: entry.waterTemp
          });
          console.log(`Updated: ${entry.date} for doc ${document.id}`);
        }
      }
    }
    return { success: true };
  } catch (error) {
    console.error('Error updating historical data:', error);
    return { success: false, error };
  }
};
