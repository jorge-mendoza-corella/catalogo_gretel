import admin from 'firebase-admin';

export default defineNuxtPlugin(() => {
  if (!admin.apps.length) {
    const config = useRuntimeConfig();

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.public.FIREBASE_PROJECT_ID,
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
        privateKey: config.FIREBASE_PRIVATE_KEY,
      }),
      databaseURL: config.FIREBASE_DATABASE_URL,
    });
  }

  const auth = admin.auth();
  const db = admin.firestore();

  return {
    provide: {
      adminAuth: auth,
      adminDb: db,
    },
  };
});