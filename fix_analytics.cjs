const fs = require('fs');
let content = fs.readFileSync('src/components/admin/SurfCallsAnalytics.tsx', 'utf8');

content = content.replace(
  "const popularBeaches = Object.entries(beachCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);",
  "const popularBeaches = Object.entries(beachCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);"
);

content = content.replace(
  "const popularTimes = Object.entries(timeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);",
  "const popularTimes = Object.entries(timeCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);"
);

content = content.replace(
  "const topCreators = Object.entries(creatorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);",
  "const topCreators = Object.entries(creatorCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);"
);

content = content.replace(
  "c.participantsJoined.forEach(p => {",
  "c.participantsJoined.forEach((p: any) => {"
);

content = content.replace(
  "const topJoiners = Object.entries(joinerCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);",
  "const topJoiners = Object.entries(joinerCounts).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);"
);

fs.writeFileSync('src/components/admin/SurfCallsAnalytics.tsx', content);

let widget = fs.readFileSync('src/components/SurfCallsWidget.tsx', 'utf8');
widget = widget.replace(
  "call.participantsJoined.some(p => p.id === currentUser.id)",
  "call.participantsJoined.some((p: any) => p.id === currentUser.id)"
);
widget = widget.replace(
  "call.participantsJoined.slice(0, 3).map((p, i) => (",
  "call.participantsJoined.slice(0, 3).map((p: any, i: number) => ("
);
widget = widget.replace(
  "{(call.comments || []).map(comment => (",
  "{(call.comments || []).map((comment: any) => ("
);
fs.writeFileSync('src/components/SurfCallsWidget.tsx', widget);
