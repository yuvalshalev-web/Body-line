const fs = require('fs');
let content = fs.readFileSync('src/contexts/DataContext.tsx', 'utf8');

content = content.replace(
  "import { Member, JoinRequest, Event, NewsItem, GalleryItem, GlossaryTerm, QuoteItem, Exercise, Podcast, PerformanceScore } from '../types';",
  "import { Member, JoinRequest, Event, NewsItem, GalleryItem, GlossaryTerm, QuoteItem, Exercise, Podcast, PerformanceScore, SurfCall } from '../types';"
);

fs.writeFileSync('src/contexts/DataContext.tsx', content);
