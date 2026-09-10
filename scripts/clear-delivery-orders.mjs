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

async function clearDeliveryOrders() {
  console.log("Fetching all orders from Firestore...");
  const snap = await getDocs(collection(db, "orders"));
  
  if (snap.empty) {
    console.log("No orders found.");
    process.exit(0);
  }

  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  // Only delete delivery/pickup online orders (orderType = delivery or pickup, or orderNumber starts with THD-)
  const toDelete = all.filter(o => 
    o.orderType === "delivery" || 
    o.orderType === "pickup" || 
    (o.orderNumber && o.orderNumber.startsWith("THD-"))
  );
  
  const toKeep = all.filter(o => !toDelete.find(d => d.id === o.id));
  
  console.log(`Total orders: ${all.length}`);
  console.log(`Delivery/Pickup orders to DELETE: ${toDelete.length}`);
  console.log(`Table QR orders to KEEP: ${toKeep.length}`);

  if (toDelete.length === 0) {
    console.log("Nothing to delete.");
    process.exit(0);
  }

  const deletions = toDelete.map(o => deleteDoc(doc(db, "orders", o.id)));
  await Promise.all(deletions);

  console.log(`✅ Deleted ${toDelete.length} delivery/pickup orders. Table QR orders preserved.`);
  process.exit(0);
}

clearDeliveryOrders().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
