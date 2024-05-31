<template>
    <div class="start-page">
      <header class="header">
        <img src="../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      </header>
      <main class="main-content">
        <div class="buttons-container">
          <router-link to="/create-account" class="start-button">Register</router-link>
          <router-link to="/login" class="start-button">Login</router-link>
        </div>
      </main>
    </div>
  </template>
  
  <script>
  export default {
    name: 'StartPage',
  };
  </script>
  
  <style scoped>
  .start-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #f0f2f5;
    padding: 0;
    margin: 0;
  }
  
  .header {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.2em;
    background-color: #102454;
    width: 100%;
  }
  
  .logo {
    width: 150px;
    margin: 1em 0;
  }
  
  .main-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    width: 100%;
  }
  
  .buttons-container {
    display: flex;
    gap: 2em;
  }
  
  .start-button {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 200px;
    height: 100px;
    background-color: #007bff;
    color: #fff;
    text-decoration: none;
    font-size: 1.5em;
    border-radius: 10px;
    transition: background-color 0.3s, transform 0.2s;
    cursor: pointer;
  }
  
  .start-button:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }
  
  .start-button:active {
    transform: scale(0.95);
  }
  </style>
  