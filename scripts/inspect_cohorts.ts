import { initializeApp } from 'firebase/app';
import { getFirestore, getDoc, getDocs, doc, collection } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const ycSnap = await getDoc(doc(db, 'site_data', 'year_config'));
  console.log('--- year_config ---');
  console.log(ycSnap.exists() ? ycSnap.data() : 'NOT FOUND');

  const groupsSnap = await getDocs(collection(db, 'community_groups'));
  console.log('--- community_groups count:', groupsSnap.size);
  groupsSnap.forEach(d => console.log(d.id, d.data()));

  const membersSnap = await getDocs(collection(db, 'members'));
  console.log('--- members count:', membersSnap.size);

  const membershipsSnap = await getDocs(collection(db, 'group_memberships'));
  console.log('--- group_memberships count:', membershipsSnap.size);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
