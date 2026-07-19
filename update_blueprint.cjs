const fs = require('fs');
let content = fs.readFileSync('firebase-blueprint.json', 'utf8');
const blueprint = JSON.parse(content);

if (!blueprint.collections.surf_calls) {
  blueprint.collections.surf_calls = {
    "type": "collection",
    "description": "User-generated impromptu surf calls",
    "documentSchema": {
      "id": { "type": "string" },
      "creatorId": { "type": "string" },
      "creatorName": { "type": "string" },
      "createdAt": { "type": "string" },
      "targetBeach": { "type": "string" },
      "targetDate": { "type": "string" },
      "targetTime": { "type": "string" },
      "text": { "type": "string", "optional": true },
      "participantsJoined": { "type": "array" },
      "participantsCancelled": { "type": "array" },
      "isArchived": { "type": "boolean", "optional": true }
    }
  };
  fs.writeFileSync('firebase-blueprint.json', JSON.stringify(blueprint, null, 2));
}
