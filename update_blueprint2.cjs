const fs = require('fs');
let content = fs.readFileSync('firebase-blueprint.json', 'utf8');
const blueprint = JSON.parse(content);

blueprint.entities.SurfCall = {
  "title": "SurfCall",
  "description": "User-generated impromptu surf calls",
  "type": "object",
  "properties": {
    "creatorId": { "type": "string" },
    "creatorName": { "type": "string" },
    "createdAt": { "type": "string" },
    "targetBeach": { "type": "string" },
    "targetDate": { "type": "string" },
    "targetTime": { "type": "string" },
    "text": { "type": "string" },
    "participantsJoined": { "type": "array" },
    "participantsCancelled": { "type": "array" },
    "isArchived": { "type": "boolean" }
  }
};

blueprint.firestore.surf_calls = {
  "schema": "SurfCall",
  "description": "User-generated impromptu surf calls"
};

fs.writeFileSync('firebase-blueprint.json', JSON.stringify(blueprint, null, 2));
