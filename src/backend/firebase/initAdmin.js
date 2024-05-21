const admin = require('firebase-admin');
const serviceAccount = require('./market-simulator-f022a-firebase-adminsdk-jnxq3-9954dc796c.json'); // Adjust this path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;
