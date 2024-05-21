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
        <input type="password" id="password" v-model="password" required>
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

export default {
  name: "LoginPage",
  data() {
    return {
      username: "",  // Now 'username' can be either a username or an email
      password: "",
      errorMessage: "",
      loginSuccess: false
    };
  },
  methods: {
    handleLogin() {
      const auth = getAuth();
      const identifier = this.username;  // This could be an email or username
      const password = this.password;
      signInWithEmailAndPassword(auth, identifier, password)
        .then((userCredential) => {
          // Here the user is successfully logged in
          this.$emit('login-success', userCredential.user);
          this.loginSuccess = true;
        })
        .catch(error => {
          this.errorMessage = error.message; // Handle login errors
          this.loginSuccess = false;
        });
    },
    handleRegister() {
      const auth = getAuth();
      const identifier = this.username;  // Consider validation if username should not be an email
      const password = this.password;
      createUserWithEmailAndPassword(auth, identifier, password)
        .catch(error => {
          this.errorMessage = error.message; // Handle registration errors
        });
    }
  }
};
</script>

<style scoped>
.login-container {
  width: 320px;
  margin: 10px auto;
  padding: 30px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  background-color: #ffffff; /* White background for a clean look */
}

.login-or-register {
  margin: 0;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #333; /* Darker font color for better readability */
  font-weight: bold; /* Bold font for labels */
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 10px;
  line-height: 1.5;
  margin-bottom: 15px;
  border: 2px solid #007bff; /* Blue border matching button color */
  border-radius: 5px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

button {
  width: 80%;
  padding: 12px;
  margin-top: 15px;
  background-image: linear-gradient(to right, #007bff, #0056b3); /* Gradient background for buttons */
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s, transform 0.2s;
}

button:hover {
  background-image: linear-gradient(to right, #0069d9, #004085); /* Darker gradient on hover */
  transform: scale(1.05); /* Slight lift effect on hover */
}

button:active {
  transform: scale(0.9);
}

.login-btn {
  margin-bottom: 10px; /* Space between login and register button */
}

p {
  color: #cc0000; /* Bright red for error messages */
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
