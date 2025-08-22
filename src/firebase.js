// firebase.js
import { initializeApp } from "firebase/app"
import { 
  getAuth, 
  GoogleAuthProvider, 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Auth instance
export const auth = getAuth(app)

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider()

// Phone Auth utils
export const setUpRecaptcha = (phoneNumber) => {
  const recaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha-container", // 👈 ye ek div id hoga jo UI mai banana hai
    {
      size: "invisible",
      callback: (response) => {
        console.log("reCAPTCHA verified:", response)
      },
    }
  )
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
}
