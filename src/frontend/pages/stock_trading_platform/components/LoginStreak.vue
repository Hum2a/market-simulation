<template>
    <div class="streak-card" v-if="streak !== null">
      <h2>Login Streak</h2>
      <div v-if="!isMobile">
        <div class="streak-line">
          <div v-for="day in 5" :key="day" class="bubble-container">
            <div v-if="day > 1" class="line"></div>
            <div :class="['bubble', { filled: dayInRow(1, day) <= streak, fiery: dayInRow(1, day) === streak }]">
              {{ dayInRow(1, day) }}
              <div v-if="day === 5" class="reward-label">Win £100</div>
            </div>
          </div>
        </div>
        <div v-for="row in rows" :key="row" class="streak-line">
          <div v-for="day in 5" :key="day" class="bubble-container">
            <div v-if="day > 1" class="line"></div>
            <div :class="['bubble', { filled: dayInRow(row, day) <= streak, fiery: dayInRow(row, day) === streak }]">
              {{ dayInRow(row, day) }}
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <p>{{ streak }} days</p>
      </div>
    </div>
  </template>
  
  <script>
  import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
  import { getAuth } from "firebase/auth";
  import { addDays, isSameDay } from 'date-fns';
  
  export default {
    name: 'LoginStreak',
    data() {
      return {
        streak: null,
        isMobile: window.innerWidth <= 600
      };
    },
    computed: {
      rows() {
        return Array.from({ length: this.totalRows - 1 }, (_, i) => i + 2);
      },
      totalRows() {
        return Math.ceil(this.streak / 5);
      }
    },
    methods: {
      dayInRow(row, day) {
        return (row - 1) * 5 + day;
      },
      async fetchLoginStreak() {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const db = getFirestore();
          const streakRef = doc(db, 'Login Streak', user.uid);
          const streakSnap = await getDoc(streakRef);
  
          if (streakSnap.exists()) {
            const streakData = streakSnap.data();
            const today = new Date();
            const lastLoginDate = streakData.lastLogin.toDate();
            if (isSameDay(today, lastLoginDate)) {
              this.streak = streakData.streak;
            } else if (isSameDay(today, addDays(lastLoginDate, 1))) {
              this.streak = streakData.streak + 1;
              await setDoc(streakRef, { streak: this.streak, lastLogin: today }, { merge: true });
              await this.checkStreakBonus();
            } else {
              this.streak = 1;
              await setDoc(streakRef, { streak: this.streak, lastLogin: today }, { merge: true });
            }
          } else {
            this.streak = 1;
            await setDoc(streakRef, { streak: this.streak, lastLogin: new Date() });
          }
        }
      },
      async checkStreakBonus() {
        if (this.streak % 5 === 0) {
          const auth = getAuth();
          const user = auth.currentUser;
          if (user) {
            const db = getFirestore();
            const totalFundsRef = doc(db, user.uid, 'Total Funds');
            const totalFundsSnap = await getDoc(totalFundsRef);
  
            const streakBonusKey = `bonus${this.streak}`;
  
            if (!totalFundsSnap.exists()) {
              await setDoc(totalFundsRef, { totalFunds: 0 }, { merge: true });
            }
  
            if (!totalFundsSnap.data()[streakBonusKey]) {
              const currentFunds = totalFundsSnap.data().totalFunds || 0;
              const newTotalFunds = currentFunds + 100;
              const updateData = { totalFunds: newTotalFunds };
              updateData[streakBonusKey] = true;
              await setDoc(totalFundsRef, updateData, { merge: true });
            }
          }
        }
      },
      handleResize() {
        this.isMobile = window.innerWidth <= 600;
      }
    },
    async created() {
      await this.fetchLoginStreak();
      window.addEventListener('resize', this.handleResize);
    },
    beforeUnmount() {
      window.removeEventListener('resize', this.handleResize);
    }
  };
  </script>
  
  <style scoped>
  .streak-card {
    background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
    border-radius: 10px;
    padding: 1.5em;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
    width: 50%; /* Make the card take the full width of its container */
    margin: 0 auto; /* Center the card */
  }
  
  .streak-card h2 {
    margin: 0;
    color: #fff;
    font-size: 1.8em;
  }
  
  .streak-card p {
    margin: 0.5em 0 0;
    font-size: 1.5em;
    color: #fff;
  }
  
  .reward-label-container {
    display: flex;
    justify-content: center;
    margin-bottom: -1em;
  }
  
  .reward-label {
    background-color: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-size: 1em;
    font-weight: bold;
    padding: 0.2em 0.5em;
    border-radius: 5px;
    text-align: center;
    position: absolute;
    top: -3em;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .streak-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 2em 0 1em;
    position: relative;
    flex-wrap: wrap; /* Allow the bubbles to wrap if needed */
  }
  
  .bubble-container {
    display: flex;
    align-items: center;
    flex: 1; /* Ensure the bubbles take equal space */
    position: relative; /* Make the container relative for positioning the reward label */
  }
  
  .bubble {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: bold;
    font-size: 1.2em;
    position: relative;
  }
  
  .bubble.filled {
    background-color: #4caf50;
  }
  
  .bubble.fiery {
    background-color: orange;
  }
  
  .line {
    width: 100%; /* Make the line take the full width */
    height: 2px;
    background: linear-gradient(90deg, orange, red);
  }
  
  @media (max-width: 600px) {
    .streak-card {
      padding: 1em;
    }
  
    .streak-card h2 {
      font-size: 1.5em;
    }
  
    .streak-card p {
      font-size: 1.2em;
    }
  
    .streak-line {
      flex-direction: column;
    }
  }
  </style>
  