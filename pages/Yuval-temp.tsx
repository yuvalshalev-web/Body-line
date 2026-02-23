import React, { useState, useEffect } from 'react';
// הייבוא המדויק עבור המבנה שלך:
import { getDb } from '../services/firebase'; 
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const AttendanceGrid = () => {
  const [people, setPeople] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // אתחול ה-DB מתוך ה-Service
    const db = getDb();
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPeople(usersList);
    });
    return () => unsubscribe();
  }, []);

  const toggleAttendance = async (person) => {
    const db = getDb();
    const personRef = doc(db, 'users', person.id);
    try {
      await updateDoc(personRef, { 
        isPresent: !person.isPresent 
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
    }
  };

  const filteredPeople = people.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-24 font-assistant">
      {/* Header & Search */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm pb-4 border-b border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-black text-blue-400">Body Line | נוכחות</h1>
          <div className="bg-blue-600 px-4 py-1 rounded-full font-bold shadow-lg shadow-blue-500/20">
            {people.filter(p => p.isPresent).length} נוכחים
          </div>
        </div>
        
        <input 
          type="text"
          placeholder="חיפוש חבר מהיר..."
          className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 mt-6">
        {filteredPeople.map((person) => (
          <div 
            key={person.id} 
            className="flex flex-col items-center cursor-pointer transform active:scale-95 transition-transform"
            onClick={() => toggleAttendance(person)}
          >
            <div className="relative">
              {/* Avatar Image */}
              <div className={`w-20 h-20 rounded-full border-4 transition-all duration-300 overflow-hidden
                ${person.isPresent ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-slate-700 opacity-40 grayscale'}`}>
                <img 
                  src={person.photoURL || 'https://via.placeholder.com/150'} 
                  className="w-full h-full object-cover" 
                  alt={person.name}
                />
              </div>

              {/* Checkmark Badge */}
              {person.isPresent && (
                <div className="absolute -bottom-1 -left-1 bg-green-500 text-white w-7 h-7 rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce-short">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            <span className={`mt-2 text-xs font-bold text-center truncate w-full px-1 ${person.isPresent ? 'text-green-400' : 'text-slate-500'}`}>
              {person.name || 'ללא שם'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceGrid;