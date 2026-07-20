import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  console.log("Connected to web DB...");
  try {
    // 1. Fetch Members
    console.log("Fetching members...");
    const membersSnap = await getDocs(collection(db, 'members'));
    const members = [];
    membersSnap.forEach(doc => {
      members.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Found ${members.length} members.`);
    
    // Find Bart
    const bart = members.find(m => 
      (m.firstName && m.firstName.toLowerCase().includes('bart')) || 
      (m.lastName && m.lastName.toLowerCase().includes('bart')) || 
      (m.email && m.email.toLowerCase().includes('bart'))
    );
    console.log("BART MEMBER DOC:", bart);

    // 2. Fetch Surf Calls
    console.log("\nFetching surf_calls...");
    const surfCallsSnap = await getDocs(collection(db, 'surf_calls'));
    const surfCalls = [];
    surfCallsSnap.forEach(doc => {
      surfCalls.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Found ${surfCalls.length} surf calls:`, JSON.stringify(surfCalls, null, 2));

    // 3. Fetch recent system logs
    console.log("\nFetching system_logs...");
    const logsSnap = await getDocs(query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(20)));
    const logs = [];
    logsSnap.forEach(doc => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    console.log("RECENT LOGS:", JSON.stringify(logs, null, 2));

  } catch (err) {
    console.error("Error during web DB query:", err);
  }
}

run();
