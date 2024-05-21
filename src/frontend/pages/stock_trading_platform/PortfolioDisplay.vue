<template>
  <div class="portfolio-display">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/homepage" class="nav-link">Home</router-link>
        <router-link to="/groupcreation" class="nav-link">Asset Market Tool</router-link>
        <router-link to="/portfolio-creation" class="nav-link">Portfolio Creation</router-link>
        <router-link to="/portfolio-display" class="nav-link">Portfolio Display</router-link>
      </nav>
    </header>
    <main class="main-content">
      <h1>Your Portfolios</h1>
      <div v-if="loading">Loading...</div>
      <div v-else-if="portfolios.length === 0">No portfolios found.</div>
      <div v-else class="portfolio">
        <div v-for="portfolio in portfolios" :key="portfolio.id" class="portfolio-card">
          <h2 @click="togglePortfolio(portfolio.id)">
            Portfolio Created On: {{ formatDate(portfolio.timestamp.toDate()) }}
          </h2>
          <div v-if="expandedPortfolio === portfolio.id">
            <div v-for="company in portfolio.companies" :key="company.name" class="stock">
              <h3>{{ company.name }}</h3>
              <p>Allocation: £{{ company.allocation }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { getFirestore, collection, query, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default {
  name: 'PortfolioDisplay',
  data() {
    return {
      portfolios: [],
      loading: true,
      expandedPortfolio: null,
    };
  },
  async created() {
    await this.fetchPortfolios();
  },
  methods: {
    async fetchPortfolios() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const q = query(collection(db, user.uid, 'Stock Trading Platform', 'Portfolio'));
        const querySnapshot = await getDocs(q);
        const portfolios = [];
        
        querySnapshot.forEach(doc => {
          portfolios.push({ id: doc.id, ...doc.data() });
        });

        this.portfolios = portfolios;
        this.loading = false;
      } else {
        console.error("User is not logged in");
        this.loading = false;
      }
    },
    togglePortfolio(portfolioId) {
      if (this.expandedPortfolio === portfolioId) {
        this.expandedPortfolio = null;
      } else {
        this.expandedPortfolio = portfolioId;
      }
    },
    formatDate(date) {
      return date.toLocaleString();
    }
  },
};
</script>

<style scoped>
.portfolio-display {
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
  max-width: 1200px;
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

.portfolio {
  display: flex;
  flex-direction: column;
  gap: 1em;
  justify-content: center;
}

.portfolio-card {
  background: #fff;
  padding: 1em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  cursor: pointer;
}

.portfolio-card h2 {
  color: crimson;
}

.stock {
  background: #f0f2f5;
  padding: 0.5em;
  border-radius: 5px;
  margin: 0.5em 0;
}

.stock h3 {
  color: cornflowerblue;
}

.stock p {
  color: #0d1b3f;
  text-align: center;
}
</style>
