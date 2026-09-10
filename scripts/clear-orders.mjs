import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAkXufx8FsFT-HA0vsxxB6TuvOMAKzfwLE",
  authDomain: "two-hearts-cafe-1144c.firebaseapp.com",
  projectId: "two-hearts-cafe-1144c",
  storageBucket: "two-hearts-cafe-1144c.firebasestorage.app",
  messagingSenderId: "753799219299",
  appId: "1:753799219299:web:d65816128b4a9bb92c9056"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearAllOrders() {
  console.log("Fetching all orders from Firestore...");
  const snap = await getDocs(collection(db, "orders"));
  
  if (snap.empty) {
    console.log("No orders found. Collection is already empty.");
    process.exit(0);
  }

  console.log(`Found ${snap.size} orders. Deleting...`);
  const deletions = snap.docs.map((d) => deleteDoc(doc(db, "orders", d.id)));
  await Promise.all(deletions);

  console.log(`✅ Deleted ${snap.size} orders from Firestore.`);
  process.exit(0);
}

clearAllOrders().catch((err) => {
  console.error("❌ Error clearing orders:", err);
  process.exit(1);
});
