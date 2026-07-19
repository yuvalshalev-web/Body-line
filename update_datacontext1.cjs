const fs = require('fs');
let content = fs.readFileSync('src/contexts/DataContext.tsx', 'utf8');

content = content.replace(
  "import { Member, JoinRequest, Event, GalleryItem, Podcast, NewsItem, GlossaryTerm, Exercise, QuoteItem, PerformanceScore } from '../types';",
  "import { Member, JoinRequest, Event, GalleryItem, Podcast, NewsItem, GlossaryTerm, Exercise, QuoteItem, PerformanceScore, SurfCall } from '../types';"
);

content = content.replace(
  "events: Event[];",
  "events: Event[];\n  surfCalls: SurfCall[];"
);

content = content.replace(
  "addEvent: (event: Omit<Event, 'id'>) => Promise<string>;",
  "addEvent: (event: Omit<Event, 'id'>) => Promise<string>;\n  addSurfCall: (call: Omit<SurfCall, 'id'>) => Promise<string>;\n  toggleSurfCallAttendance: (callId: string, memberId: string, memberName: string, avatar?: string) => Promise<void>;\n  archiveSurfCall: (callId: string) => Promise<void>;"
);

content = content.replace(
  "const [events, setEvents] = useState<Event[]>([]);",
  "const [events, setEvents] = useState<Event[]>([]);\n  const [surfCalls, setSurfCalls] = useState<SurfCall[]>([]);"
);

content = content.replace(
  "const unsubscribeEvents = onSnapshot(collection(db, 'events'), (snapshot) => {",
  `const unsubscribeSurfCalls = onSnapshot(collection(db, 'surf_calls'), (snapshot) => {
        const callsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SurfCall[];
        setSurfCalls(callsData);
      });\n      const unsubscribeEvents = onSnapshot(collection(db, 'events'), (snapshot) => {`
);

content = content.replace(
  "unsubscribeEvents();",
  "unsubscribeEvents();\n        unsubscribeSurfCalls();"
);

fs.writeFileSync('src/contexts/DataContext.tsx', content);
