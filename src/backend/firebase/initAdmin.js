const admin = require('firebase-admin');
const serviceAccount = require('./lifesmart-investing-tool-firebase-adminsdk-1drpe-a51af996cf.json'); // Adjust this path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;
