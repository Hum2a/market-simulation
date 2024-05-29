<template>
  <div class="dashboard">
    <header class="header">
      <img src="../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/groupcreation" class="nav-link">Asset Market Tool</router-link>
        <router-link to="/stock-trading-select" class="nav-link">Stock Market Tool</router-link>
        <router-link to="#" class="nav-link">Financial Literacy Course</router-link>
        <router-link to="#" class="nav-link">Investment Calculator</router-link>
        <router-link to="/create-account" class="nav-link">Create Account</router-link>
        <button @click="showLogin = !showLogin" class="nav-link login-button">Login</button>
      </nav>
    </header>
    <LoginPage v-if="showLogin" @close="showLogin = false" @login-success="handleLoginSuccess" />
    <main class="main-content">
      <section class="intro">
        <h1>Welcome to Life Smart</h1>
        <p>
          Life Smart is dedicated to helping you make informed financial decisions.
          Our tools and courses are designed to enhance your financial literacy and
          provide you with the knowledge you need to navigate the financial world.
        </p>
        <p>
          Explore our Asset Market Tool, Stock Market Tool, and Financial Literacy Course
          to get started on your journey to financial success.
        </p>
      </section>
    </main>
  </div>
</template>

  
<script>
import LoginPage from './LoginPage.vue';

export default {
  name: 'HomePage',
  components: {
    LoginPage
  },
  data() {
    return {
      userEmail: 'Humzab1711@hotmail.com',
      showLogin: false
    };
  },
  methods: {
    toggleCalculator() {
      console.log('Calculator toggled');
    },
    toggleLogin() {
      console.log('Login toggled');
      this.showLogin = !this.showLogin;
    },
    handleLoginSuccess(user) {
      this.showLogin = false;
      console.log('Logged in user:', user);
    },
  },
};
</script>

  
<style scoped>
  .dashboard {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #f0f2f5;
    height: 100vh;
    padding: 0;
    margin: 0;
  }

  .header {
    grid-column: 1 / -1; /* Full width */
    display: flex;
    justify-content: space-between;
    align-items: center; /* Vertically center the content */
    padding: 0.2em;
    background-color: #102454;
    border-top-left-radius: 0;      /* Top left corner */
    border-top-right-radius: 0;     /* Top right corner */
    border-bottom-right-radius: 25px;  /* Bottom right corner */
    border-bottom-left-radius: 25px;   /* Bottom left corner */
    position: relative;
    width: 100%;
    margin: 0 auto;
  }

  .logo {
    height: auto; /* Maintain aspect ratio */
    width: 150px; /* Example width; adjust as needed */
    display: block; /* To prevent inline default behavior */
    margin-left: 0; /* Align the logo to the left */
    clip-path: polygon(0 0, 60% 0, 60% 100%, 0% 100%);
  }

  .header-links {
    display: flex;
    gap: 1em;
  }

  .nav-link {
    color: #fff;
    text-decoration: none;
    font-size: 1em;
    padding: 0.5em 1em;
    border-radius: 5px;
    transition: background-color 0.3s;
    cursor: pointer;
  }

  .nav-link:hover {
    background-color: #0d1b3f;
  }

  .main-content {
    width: 100%;
    max-width: 1200px;
    margin: 2em auto;
    text-align: center;
    padding: 1em;
  }

  .intro {
    background: #fff;
    padding: 2em;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .intro h1 {
    font-size: 2.5em;
    color: #102454;
    margin-bottom: 0.5em;
  }

  .intro p {
    font-size: 1.2em;
    color: #333;
    margin-bottom: 1em;
  }
</style>
