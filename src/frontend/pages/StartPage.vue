<template>
  <div class="start-page">
    <header class="header">
      <img src="../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
    </header>
    <main class="main-content">
      <h1>Welcome to LifeSmart</h1>
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
@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}

.start-page {
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  width: 100%;
}

.main-content h1 {
  font-size: 3em;
  margin-bottom: 1.5em;
  letter-spacing: 1px;
}

.buttons-container {
  display: flex;
  gap: 2em;
  flex-wrap: wrap; /* Allow buttons to wrap to the next line on smaller screens */
}

.start-button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 200px;
  height: 70px;
  background: #ff9800;
  color: #fff;
  text-decoration: none;
  font-size: 1.5em;
  border-radius: 10px;
  transition: transform 0.3s;
  position: relative;
  overflow: hidden;
}

.start-button:hover {
  transform: scale(1.05);
}

.start-button:active {
  transform: scale(0.95);
}

.start-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 100%);
  transition: all 0.5s;
}

.start-button:hover::before {
  left: 100%;
  transition: all 0.5s;
  animation: shimmer 1.5s infinite;
}

/* Media query for mobile devices */
@media (max-width: 600px) {
  .main-content h1 {
    font-size: 2em;
    margin-bottom: 1em;
  }

  .buttons-container {
    flex-direction: column; /* Stack buttons vertically */
    gap: 1em;
  }

  .start-button {
    font-size: 1.2em;
  }
}
</style>
