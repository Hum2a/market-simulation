<template>
    <div class="stock-trading-select">
      <header class="header">
        <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
        <nav class="header-links">
          <router-link to="/homepage" class="nav-link">Home</router-link>
          <router-link to="/groupcreation" class="nav-link">Asset Market Tool</router-link>
          <router-link to="/stock-trading-select" class="nav-link">Stock Market Tool</router-link>
          <button @click="showLogin = !showLogin" class="nav-link login-button">Login</button>
        </nav>
      </header>
      <LoginPage v-if="showLogin" @close="showLogin = false" @login-success="handleLoginSuccess" />
      <main class="main-content">
        <h1>Stock Trading</h1>
        <div class="options">
          <router-link to="/portfolio-creation" class="option">Create Your Portfolio</router-link>
          <router-link to="/portfolio-display" class="option">View Your Portfolio</router-link>
          <router-link to="/stock-market-today" class="option">Stock Market Today</router-link>
        </div>
        <div class="options">
          <router-link to="/portfolio-simulation" class="option">Simulation</router-link>
        </div>
      </main>
    </div>
  </template>
  
  <script>
  import LoginPage from '../LoginPage.vue';
  
  export default {
    name: 'StockTradingSelect',
    components: {
      LoginPage
    },
    data() {
      return {
        showLogin: false,
      };
    },
    methods: {
      handleLoginSuccess(user) {
        this.showLogin = false;
        console.log('Logged in user:', user);
      },
    },
  };
  </script>
  
  <style scoped>
  .stock-trading-select {
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
  
  .main-content h1 {
    font-size: 2em;
    color: #102454;
    margin-bottom: 0.5em;
  }
  
  .options {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2em;
  }
  
  .option {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 200px;
    height: 100px;
    background-color: #007bff;
    color: #fff;
    text-decoration: none;
    font-size: 1.2em;
    border-radius: 10px;
    transition: background-color 0.3s, transform 0.2s;
    cursor: pointer;
    margin-bottom: 10px;
  }
  
  .option:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }
  
  .option:active {
    transform: scale(0.95);
  }
  </style>
  