  // Import the functions you need from the SDKs you need
  import { initializeApp } from 'firebase/app';
  import { getAuth } from 'firebase/auth';

  export default defineNuxtPlugin(() => {
  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional

    const config = useRuntimeConfig();
    const firebaseConfig = {
      apiKey: config.public.FIREBASE_API_KEY,
      authDomain: config.public.FIREBASE_AUTH_DOMAIN,
      projectId: config.public.FIREBASE_PROJECT_ID,
      storageBucket: config.public.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: config.public.FIREBASE_MESSAGING_SENDER_ID,
      appId: config.public.FIREBASE_APP_ID,
    }

    // Initialize Firebase
    const fireApp = initializeApp(firebaseConfig);
    const auth = getAuth(fireApp);
    
    return {
      provide: {
        fireApp,
        auth,
      },
    }
  })