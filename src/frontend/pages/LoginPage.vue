<template>
  <div class="login-container">
    <h1 class="login-or-register">Login or Register</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">Username or Email:</label>
        <input type="text" id="username" v-model="username" required placeholder="Username or Email">
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required placeholder="Password">
      </div>
      <button type="submit" class="login-btn">Login</button>
      <button type="button" @click="handleRegister" class="register-btn">Register</button>

      <!-- Success animation -->
      <transition name="fade">
        <div class="success-animation" v-if="loginSuccess">
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
      </transition>
    </form>
    <p v-if="errorMessage">{{ errorMessage }}</p>
  </div>
</template>

<script>
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { format, differenceInCalendarDays } from "date-fns";
import { trackUserLogin } from '../../backend/utils/loginTracker';

export default {
  name: "LoginPage",
  data() {
    return {
      username: "",
      password: "",
      errorMessage: "",
      loginSuccess: false
    };
  },
  methods: {
    async handleLogin() {
      const auth = getAuth();
      const identifier = this.username;
      const password = this.password;
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
        this.$emit('login-success', userCredential.user);
        await this.updateLoginStreak(userCredential.user.uid);
        await trackUserLogin(userCredential.user.uid);  // Track user login
        this.loginSuccess = true;
        this.$router.push({ name: 'StockTradingSelect' });
      } catch (error) {
        this.errorMessage = error.message;
        this.loginSuccess = false;
      }
    },
    async updateLoginStreak(userId) {
      const db = getFirestore();
      const streakRef = doc(db, userId, 'Login Streak');
      const streakSnap = await getDoc(streakRef);
      const today = new Date();
      const formattedToday = format(today, 'yyyy-MM-dd');
      
      if (streakSnap.exists()) {
        const streakData = streakSnap.data();
        const lastLoginDate = new Date(streakData.lastLogin);
        const daysDifference = differenceInCalendarDays(today, lastLoginDate);

        if (daysDifference === 1) {
          await setDoc(streakRef, {
            streak: streakData.streak + 1,
            lastLogin: formattedToday
          });
        } else if (daysDifference > 1) {
          await setDoc(streakRef, {
            streak: 1,
            lastLogin: formattedToday
          });
        }
      } else {
        await setDoc(streakRef, {
          streak: 1,
          lastLogin: formattedToday
        });
      }
    },
    async handleRegister() {
      const auth = getAuth();
      const identifier = this.username;
      const password = this.password;
      
      try {
        await createUserWithEmailAndPassword(auth, identifier, password);
        this.errorMessage = "";
      } catch (error) {
        this.errorMessage = error.message;
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  width: 360px;
  margin: 40px auto;
  padding: 40px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background-color: #f7f9fc;
}

.login-or-register {
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.5em;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 12px;
  margin-top: 6px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

button {
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  background-color: #007bff;
  border: none;
  color: white;
  font-size: 1em;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s, transform 0.2s;
}

button:hover {
  background-color: #0056b3;
  transform: scale(1.02);
}

button:active {
  transform: scale(0.98);
}

.login-btn {
  margin-bottom: 10px;
}

p {
  color: #cc0000;
  text-align: center;
  font-size: 0.9em;
}

.success-animation {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.checkmark {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: #4CAF50;
  stroke-miterlimit: 10;
  box-shadow: inset 0px 0px 0px #4CAF50;
  animation: fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
}

.checkmark__circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark__check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

@keyframes fill {
  100% {
    box-shadow: inset 0px 0px 0px 30px #4CAF50;
  }
}
</style>

../../backend/utils/loginTracker