import { db } from "../firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";

export async function awardMedalToUser(userDocId: string, medal: any) {
  if (!userDocId || !medal) return;

  try {
    const userRef = doc(db, "User", userDocId);

    await updateDoc(userRef, {
      medals: arrayUnion({
        medalID: medal.medalID,   // Firestore document ID
        name: medal.name,
        emoji: medal.emoji,
        minPoints: medal.minPoints
      })
    });

    console.log("Medal awarded:", medal.name);
  } catch (err) {
    console.error("Failed to award medal:", err);
  }
}
