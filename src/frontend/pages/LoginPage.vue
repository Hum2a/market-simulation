<template>
  <div class="login-container">
    <h1>Login or Register</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="email" required>
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required>
      </div>
      <button type="submit" class="login-btn">Login</button>
      <button type="button" @click="handleRegister" class="register-btn">Register</button>
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
        email: "",
        password: "",
        errorMessage: ""
      };
    },
    methods: {
      handleLogin() {
        const auth = getAuth();
        signInWithEmailAndPassword(auth, this.email, this.password)
            .then((userCredential) => {
                // Here the user is successfully logged in
                // You might want to store the user's info in Vuex or the component's state
                this.$emit('login-success', userCredential.user);
                this.$router.push({ name: 'GroupCreation' }); // Redirect after login
            })
          .catch(error => {
            this.errorMessage = error.message; // Handle login errors
          });
      },
      handleRegister() {
        const auth = getAuth();
        createUserWithEmailAndPassword(auth, this.email, this.password)
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
    margin: 80px auto;
    padding: 30px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    background-color: #ffffff; /* White background for a clean look */
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
  
  input[type="email"],
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
    width: 100%;
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
    transform: translateY(-2px); /* Slight lift effect on hover */
  }
  
  .login-btn {
    margin-bottom: 10px; /* Space between login and register button */
  }
  
  p {
    color: #cc0000; /* Bright red for error messages */
    text-align: center;
    font-size: 0.9em;
  }
  </style>
  
  