import { getFirestore, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { format } from 'date-fns';

const db = getFirestore();
let loginInterval;

const trackUserLogin = async (userId) => {
  const userDocRef = doc(db, userId, 'Profile');
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    const currentLogins = userData.logins || 0;
    await updateDoc(userDocRef, {
      logins: currentLogins + 1
    });
  } else {
    await setDoc(userDocRef, {
      logins: 1
    });
  }

  const loginDataRef = doc(db, userId, 'Login Data');
  const now = new Date();
  const formattedDate = format(now, 'yyyy-MM-dd');
  const formattedTime = format(now, 'HH:mm:ss');

  const loginDataSnap = await getDoc(loginDataRef);

  if (loginDataSnap.exists()) {
    await updateDoc(loginDataRef, {
      [`${formattedDate}.${formattedTime}`]: { loginTime: now, timeLoggedIn: 0 }
    });
  } else {
    await setDoc(loginDataRef, {
      [formattedDate]: {
        [formattedTime]: { loginTime: now, timeLoggedIn: 0 }
      }
    });
  }

  // Start the interval to update timeLoggedIn every second
  loginInterval = setInterval(async () => {
    const sessionRef = doc(db, userId, 'Login Data');
    const sessionSnap = await getDoc(sessionRef);
    if (sessionSnap.exists()) {
      const sessionData = sessionSnap.data();
      const currentSession = sessionData[formattedDate][formattedTime];
      const currentLoggedInTime = currentSession.timeLoggedIn || 0;
      await updateDoc(sessionRef, {
        [`${formattedDate}.${formattedTime}.timeLoggedIn`]: currentLoggedInTime + 10
      });
    }
  }, 10000);

  console.log('User login time tracking started.');
};

const stopTrackingUserLogin = async () => {
  clearInterval(loginInterval);
  console.log('User login time tracking stopped.');
};

export { trackUserLogin, stopTrackingUserLogin };
