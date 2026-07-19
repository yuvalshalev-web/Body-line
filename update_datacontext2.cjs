const fs = require('fs');
let content = fs.readFileSync('src/contexts/DataContext.tsx', 'utf8');

const newFunctions = `
  const addSurfCall = useCallback(async (call: Omit<SurfCall, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'surf_calls'), call);
      return docRef.id;
    } catch (err: any) {
      console.error('Error adding surf call:', err);
      throw err;
    }
  }, [db]);

  const toggleSurfCallAttendance = useCallback(async (callId: string, memberId: string, memberName: string, avatar?: string) => {
    try {
      const callRef = doc(db, 'surf_calls', callId);
      const callDoc = await getDoc(callRef);
      if (!callDoc.exists()) return;
      
      const call = callDoc.data() as SurfCall;
      const joined = call.participantsJoined || [];
      const cancelled = call.participantsCancelled || [];
      
      const isAttending = joined.some(p => p.id === memberId);
      
      let newJoined = [...joined];
      let newCancelled = [...cancelled];
      
      if (isAttending) {
        newJoined = newJoined.filter(p => p.id !== memberId);
        if (!newCancelled.includes(memberId)) {
          newCancelled.push(memberId);
        }
      } else {
        newJoined.push({ id: memberId, name: memberName, avatar });
        newCancelled = newCancelled.filter(id => id !== memberId);
      }
      
      await updateDoc(callRef, {
        participantsJoined: newJoined,
        participantsCancelled: newCancelled
      });
    } catch (err) {
      console.error('Error toggling surf call attendance:', err);
      throw err;
    }
  }, [db]);

  const archiveSurfCall = useCallback(async (callId: string) => {
    try {
      const callRef = doc(db, 'surf_calls', callId);
      await updateDoc(callRef, { isArchived: true });
    } catch (err) {
      console.error('Error archiving surf call:', err);
      throw err;
    }
  }, [db]);

`;

content = content.replace(
  "const addEvent = useCallback(async (details: Omit<Event, 'id'>) => {",
  newFunctions + "const addEvent = useCallback(async (details: Omit<Event, 'id'>) => {"
);

// We also need to add them to the provider value
content = content.replace(
  "addEvent,",
  "addEvent,\n    surfCalls,\n    addSurfCall,\n    toggleSurfCallAttendance,\n    archiveSurfCall,"
);

fs.writeFileSync('src/contexts/DataContext.tsx', content);
