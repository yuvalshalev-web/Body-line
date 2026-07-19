const fs = require('fs');

// 1. Update types
let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(
  "isArchived?: boolean;",
  "isArchived?: boolean;\n  comments?: { id: string; userId: string; userName: string; avatar?: string; text: string; timestamp: string }[];"
);
fs.writeFileSync('src/types.ts', types);

// 2. Update DataContext to initialize comments
let dataContext = fs.readFileSync('src/contexts/DataContext.tsx', 'utf8');
dataContext = dataContext.replace(
  "archiveSurfCall: (callId: string) => Promise<void>;",
  "archiveSurfCall: (callId: string) => Promise<void>;\n  addSurfCallComment: (callId: string, userId: string, userName: string, avatar: string | undefined, text: string) => Promise<void>;"
);

const newFunction = `
  const addSurfCallComment = useCallback(async (callId: string, userId: string, userName: string, avatar: string | undefined, text: string) => {
    try {
      const callRef = doc(db, 'surf_calls', callId);
      const callDoc = await getDoc(callRef);
      if (!callDoc.exists()) return;
      
      const call = callDoc.data() as SurfCall;
      const comments = call.comments || [];
      const newComment = {
        id: Math.random().toString(36).substring(2, 9),
        userId,
        userName,
        avatar,
        text,
        timestamp: new Date().toISOString()
      };
      
      await updateDoc(callRef, {
        comments: [...comments, newComment]
      });
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  }, [db]);
`;

dataContext = dataContext.replace(
  "const archiveSurfCall = useCallback(async (callId: string) => {",
  newFunction + "\n  const archiveSurfCall = useCallback(async (callId: string) => {"
);

dataContext = dataContext.replace(
  "archiveSurfCall,",
  "archiveSurfCall,\n    addSurfCallComment,"
);

fs.writeFileSync('src/contexts/DataContext.tsx', dataContext);

