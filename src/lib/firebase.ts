import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: "AIzaSyDHDlAy5QCmRDvUsUDhRZ4yXEGZOCo2Ckw",
//   authDomain: "ciper-quest.firebaseapp.com",
//   projectId: "ciper-quest",
//   storageBucket: "ciper-quest.firebasestorage.app",
//   messagingSenderId: "242649990382",
//   appId: "1:242649990382:web:4fb731763fae8e532e1fff",
//   measurementId: "G-RFZD2RPY6Y",
// };

const firebaseConfig = {
  apiKey: "AIzaSyA06PPozRgCRLmibtieyHeijWvhIppqR6I",
  authDomain: "cipher-fc89b.firebaseapp.com",
  projectId: "cipher-fc89b",
  storageBucket: "cipher-fc89b.firebasestorage.app",
  messagingSenderId: "76426806759",
  appId: "1:76426806759:web:e7b267e10aaac7139b2942",
  measurementId: "G-FVYYZJ4YP9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();






