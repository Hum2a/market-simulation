import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { format } from 'date-fns';

const db = getFirestore();

const trackUserLogout = async (userId) => {
  const loginDataRef = doc(db, userId, 'Login Data');
  const now = new Date();
  const formattedDate = format(now, 'yyyy-MM-dd');
//   const formattedTime = format(now, 'HH:mm:ss');

  const loginDataSnap = await getDoc(loginDataRef);

  if (loginDataSnap.exists()) {
    const data = loginDataSnap.data();
    const dayData = data[formattedDate];

    if (dayData) {
      const lastSessionTime = Object.keys(dayData).sort().pop();
      await updateDoc(loginDataRef, {
        [`${formattedDate}.${lastSessionTime}.logoutTime`]: now
      });
    }
  } else {
    console.error(`No login data found for ${userId} on ${formattedDate}`);
  }

  console.log('User logout time recorded.');
};

export { trackUserLogout };
