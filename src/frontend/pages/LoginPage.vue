<template>
  <div class="login-container">
    <header class="header">
      <img src="../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
    </header>
    <main class="main-content">
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
        <button type="button" @click="showForgotPasswordModal" class="forgot-password-btn">Forgot Password?</button>
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
    </main>

    <!-- Forgot Password Modal -->
    <transition name="fade">
      <div v-if="isForgotPasswordModalVisible" class="modal">
        <div class="modal-content">
          <span @click="hideForgotPasswordModal" class="close-btn">&times;</span>
          <h2>Forgot Password</h2>
          <form @submit.prevent="handleForgotPassword">
            <div class="form-group">
              <label for="reset-email">Enter your email:</label>
              <input type="email" id="reset-email" v-model="resetEmail" required placeholder="Email">
            </div>
            <button type="submit" class="reset-btn">Send Reset Link</button>
          </form>
          <p v-if="resetMessage">{{ resetMessage }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { format, differenceInCalendarDays } from "date-fns";
import { trackUserLogin } from '../../backend/utils/loginTracker';

export default {
  name: "LoginPage",
  data() {
    return {
      username: "",
      password: "",
      resetEmail: "",
      errorMessage: "",
      resetMessage: "",
      loginSuccess: false,
      isForgotPasswordModalVisible: false
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
        await trackUserLogin(userCredential.user.uid);
        this.loginSuccess = true;
        this.$router.push({ name: 'StockTradingSelect' });
      } catch (error) {
        this.errorMessage = error.message;
        this.loginSuccess = false;
      }
    },
    async handleForgotPassword() {
      const auth = getAuth();
      try {
        await sendPasswordResetEmail(auth, this.resetEmail);
        this.resetMessage = "Password reset link sent to your email.";
      } catch (error) {
        this.resetMessage = error.message;
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
    handleRegister() {
      this.$router.push({ name: 'CreateAccount' });
    },
    showForgotPasswordModal() {
      this.isForgotPasswordModalVisible = true;
    },
    hideForgotPasswordModal() {
      this.isForgotPasswordModalVisible = false;
      this.resetEmail = "";
      this.resetMessage = "";
    }
  },
  mounted() {
    document.body.style.backgroundColor = '#1e3c72';
  },
  beforeUnmount() {
    document.body.style.backgroundColor = '';
  }
};
</script>


<style scoped>
@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 0;
  margin: 0;
}

.header {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 1em 0;
  background-color: transparent;
}

.logo {
  width: 200px;
  margin: 0;
}

.main-content {
  width: 100%;
  max-width: 400px;
  margin: 2em auto;
  text-align: center;
  padding: 2em;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.login-or-register {
  font-size: 2em;
  color: #2c3e50;
  margin-bottom: 1.5em;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.form-group {
  margin-bottom: 1em;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.5em;
  color: #333;
  font-weight: bold;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 0.75em;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

input[type="text"]:focus,
input[type="password"]:focus {
  border-color: #007bff;
  outline: none;
}

button {
  width: 100%;
  padding: 0.75em;
  margin-top: 10px;
  background-color: #102454;
  border: none;
  color: white;
  font-size: 1em;
  cursor: pointer;
  border-radius: 5px;
  transition: transform 0.3s, background-color 0.3s;
  position: relative;
  overflow: hidden;
}

button:hover {
  transform: scale(1.05);
  background-color: #0d1b3f; /* Darker shade on hover */
}

button:active {
  transform: scale(0.95);
}

button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0) 100%);
  transition: all 0.5s;
}

button:hover::before {
  left: 100%;
  transition: all 0.5s;
  animation: shimmer 1.5s infinite;
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
.forgot-password-btn {
  background-color: transparent;
  color: #007bff;
  border: none;
  cursor: pointer;
  text-align: center;
  display: block;
  margin: 10px auto;
  font-size: 0.9em;
}

.forgot-password-btn:hover {
  text-decoration: underline;
}

.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 2em;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 20px;
  font-size: 1.5em;
  cursor: pointer;
}

.reset-btn {
  width: 100%;
  padding: 0.75em;
  margin-top: 10px;
  background-color: #102454;
  border: none;
  color: white;
  font-size: 1em;
  cursor: pointer;
  border-radius: 5px;
  transition: transform 0.3s, background-color 0.3s;
  position: relative;
  overflow: hidden;
}

.reset-btn:hover {
  transform: scale(1.05);
  background-color: #0d1b3f; /* Darker shade on hover */
}

.reset-btn:active {
  transform: scale(0.95);
}

.reset-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0) 100%);
  transition: all 0.5s;
}

.reset-btn:hover::before {
  left: 100%;
  transition: all 0.5s;
  animation: shimmer 1.5s infinite;
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

/* Media query for mobile devices */
@media (max-width: 600px) {
  .main-content {
    padding: 1em;
    margin: 1em; /* Add margin to prevent content from touching screen edges */
  }

  .login-or-register {
    font-size: 1.5em;
    margin-bottom: 1em;
  }

  input[type="text"],
  input[type="password"] {
    font-size: 1em; /* Adjust font size for input fields */
  }

  button {
    padding: 1em;
    font-size: 1.2em; /* Adjust font size for the button */
  }

  p {
    font-size: 0.8em; /* Adjust font size for error message */
  }
}
</style>
