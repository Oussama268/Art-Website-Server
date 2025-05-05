const admin = require('firebase-admin');
const dotenv = require("dotenv")



dotenv.config()

const serviceAccountPath = JSON.parse(process.env.FIREBASE_CREDENTIALS);
const firebaseDatabaseUrl = process.env.FIREBASE_DATABASE_URL;
const firebaseStorage = process.env.FIREBASE_STORAGE;


admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    databaseURL: firebaseDatabaseUrl,
    storageBucket: firebaseStorage,
  });
  


const db = admin.database();
const bucket = admin.storage().bucket();

module.exports = {
  db,
  bucket,
};