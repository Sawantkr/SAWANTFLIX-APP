import admin from "firebase-admin";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  "./my-project-33e6d-firebase-adminsdk-fbsvc-a87bcc2405.json";

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log(
  " Firebase Admin Project:",
  serviceAccount.project_id
);

const db = admin.firestore();

export { admin, db };