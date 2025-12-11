import { totalmem } from "os";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export const createUserIfNotExists = async () => {
  const user = auth.currentUser;

  if (!user) {
    console.error("No authenticated user found.");
    return;
  }

  const email = user.email;

  if (!email) {
    console.error("User has no email.");
    return;
  }
  const q = query(collection(db, "User"), where("email", "==", email));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    console.log("User already exists in Firestore.");
    return;
  }

  const medalQuery = query(
    collection(db, "Medal"),
    where("minPoints", "==", 0)
  );

  const medalSnapshot = await getDocs(medalQuery);

  if (medalSnapshot.empty) {
    console.error("Iron medal not found in Medal collection.");
    return;
  }

  const ironMedalDoc = medalSnapshot.docs[0];
  const ironMedalData = ironMedalDoc.data();
  const ironMedalFirestoreID = ironMedalDoc.id;

  const userIdRef = doc(collection(db, "User"));

  await setDoc(userIdRef, {
    userId: userIdRef.id,    
    email: email,
    nim: "Update your NIM",       
    fullName: "Update your name",
    phoneNumber: "Update your phone number",
    createdAt: serverTimestamp(),
    medals: [
      {
        medalID: ironMedalFirestoreID,      // ⭐ Firestore Document ID
        name: ironMedalData.name,
        emoji: ironMedalData.emoji,
        minPoints: ironMedalData.minPoints,
      },
    ],
    history: [],
    totalPoints: 0,
    claimedRewards: [],
  });

  console.log("New user document created:", userIdRef.id);
};
