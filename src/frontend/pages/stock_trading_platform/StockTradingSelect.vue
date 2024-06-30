<template>
  <div class="stock-trading-select">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <a @click="logout" class="nav-link">Log Out</a>
        <template v-if="profile && profile.admin">
          <router-link to="/groupcreation" class="nav-link">Group Creation</router-link>
        </template>
      </nav>
    </header>
    <main class="main-content">
      <h1>Stock Trading</h1>
      <div v-if="profile" class="welcome-message">
        Welcome back, {{ profile.firstName }}!
      </div>
      <div class="streak-div">
        <LoginStreak />
      </div>
      <div class="options">
        <router-link :to="portfolioCreationRoute" class="option user">Create Your Portfolio</router-link>
        <router-link :to="portfolioAppendRoute" class="option user">Append Portfolio</router-link>
        <router-link :to="portfolioDisplayRoute" class="option user">View Your Portfolio</router-link>
      </div>
      <div class="options">
        <template v-if="profile && profile.admin">
          <!-- <router-link to="/admin-portfolio-creation" class="option admin">Admin Portfolio Creation</router-link> -->
          <!-- <router-link to="/admin-portfolio-assign" class="option admin">Assign Portfolios</router-link> -->
          <router-link to="/sticky-note-creator" class="option admin">Sticky Note Creator</router-link>
          <router-link to="/stock-market-today" class="option admin">Stock Market Today</router-link>
        </template>
      </div>
      <div class="options">
        <template v-if="profile && profile.admin">
          <router-link to="/code-manager" class="option settings">Code Manager</router-link>
          <router-link to="/user-manager" class="option settings">User Manager</router-link>
        </template>
      </div>
      <button v-if="profile && profile.admin" @click="deletePortfolio" class="delete-button">Delete Your Portfolio</button>
    </main>
    <div v-if="userFunds !== null" class="total-funds">
      <p>Total Funds: £{{ userFunds }}</p>
    </div>
    <MessageModal
      v-if="showModal"
      :isVisible="showModal"
      :title="modalTitle"
      :message="modalMessage"
      @close="showModal = false"
    />
  </div>
</template>

<script>
import MessageModal from './components/MessageModal.vue';
import LoginStreak from './components/LoginStreak.vue'; // Import the LoginStreak component
import { getFirestore, collection, query, getDocs, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { trackUserLogout } from '../../../backend/utils/logoutTracker';

export default {
  name: 'StockTradingSelect',
  components: {
    MessageModal,
    LoginStreak // Register the LoginStreak component
  },
  data() {
    return {
      showLogin: false,
      userFunds: null,
      showModal: false,
      modalTitle: '',
      modalMessage: '',
      profile: null,
      isMobile: window.innerWidth <= 600
    };
  },
  methods: {
    async fetchUserProfile() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const profileRef = doc(db, user.uid, 'Profile');
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          this.profile = profileSnap.data();
        }
      }
    },
    async fetchUserFunds() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const totalFundsRef = doc(db, user.uid, 'Total Funds');
        const totalFundsSnap = await getDoc(totalFundsRef);

        if (totalFundsSnap.exists()) {
          this.userFunds = totalFundsSnap.data().totalFunds;
        }
      }
    },
    async deletePortfolio() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const portfolioCollectionRef = collection(db, user.uid, 'Stock Trading Platform', 'Portfolio');
        const portfolioQuery = query(portfolioCollectionRef);
        const portfolioSnapshot = await getDocs(portfolioQuery);

        let initialPortfolioAllocation = 0;

        portfolioSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (docSnap.id === 'Initial Portfolio') {
            initialPortfolioAllocation = data.totalAllocation || 0;
          }
        });

        const deletePromises = portfolioSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
        await Promise.all(deletePromises);

        const totalFundsRef = doc(db, user.uid, 'Total Funds');
        const totalFundsSnap = await getDoc(totalFundsRef);

        if (totalFundsSnap.exists()) {
          const totalFundsData = totalFundsSnap.data();
          const updatedFunds = totalFundsData.totalFunds + initialPortfolioAllocation;
          await updateDoc(totalFundsRef, { totalFunds: updatedFunds });
          this.userFunds = updatedFunds;
        }

        this.modalTitle = 'Success';
        this.modalMessage = 'Portfolio deleted and funds restored successfully!';
        this.showModal = true;
      } else {
        this.modalTitle = 'Error';
        this.modalMessage = 'You need to be logged in to delete a portfolio.';
        this.showModal = true;
      }
    },
    async logout() {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        await trackUserLogout(user.uid);
        await signOut(auth);
        this.$router.push('/startpage');
      }
    },
    handleResize() {
      this.isMobile = window.innerWidth <= 600;
    }
  },
  computed: {
    portfolioCreationRoute() {
      return this.isMobile ? '/portfolio-creation-m' : '/portfolio-creation';
    },
    portfolioAppendRoute() {
      return this.isMobile ? '/portfolio-append-M' : '/portfolio-append';
    },
    portfolioDisplayRoute() {
      return this.isMobile ? '/portfolio-display-M' : '/portfolio-display';
    }
  },
  async created() {
    await this.fetchUserProfile();
    await this.fetchUserFunds();
    window.addEventListener('resize', this.handleResize);

    // Redirect to the appropriate route based on the device type
    if (this.$route.path === '/portfolio-creation' || this.$route.path === '/portfolio-creation-m') {
      const targetRoute = this.isMobile ? '/portfolio-creation-m' : '/portfolio-creation';
      this.$router.replace(targetRoute);
    }
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },
  beforeRouteEnter(to, from, next) {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        next('/startpage');
      } else {
        const db = getFirestore();
        const profileRef = doc(db, user.uid, 'Profile');
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profile = profileSnap.data();
          if (!profile.admin && !profile.developer) {
            const portfolioDocRef = doc(db, user.uid, 'Stock Trading Platform', 'Portfolio', 'Initial Portfolio');
            const portfolioDocSnap = await getDoc(portfolioDocRef);

            if (portfolioDocSnap.exists()) {
              const isMobile = window.innerWidth <= 600;
              next(isMobile ? '/portfolio-display-M' : '/portfolio-display');
            } else {
              const isMobile = window.innerWidth <= 600;
              next(isMobile ? '/portfolio-creation-m' : '/portfolio-creation');
            }
          } else {
            next();
          }
        } else {
          next('/startpage');
        }
      }
    });
  }
};
</script>

<style scoped>
.stock-trading-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  padding: 0;
  margin: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5em 1em;
  background-color: #102454;
  border-bottom-right-radius: 25px;
  border-bottom-left-radius: 25px;
  width: 100%;
}

.logo {
  height: auto;
  width: 150px;
  display: block;
  clip-path: polygon(0 0, 60% 0, 60% 100%, 0% 100%);
}

.header-links {
  display: flex;
  gap: 1em;
}

.nav-link {
  color: #fff;
  text-decoration: none;
  font-size: 1.2em;
  padding: 0.5em 1em;
  border-radius: 5px;
  transition: background-color 0.3s, transform 0.2s;
  cursor: pointer;
}

.nav-link:hover {
  background-color: #0d1b3f;
  transform: scale(1.05);
}

.main-content {
  width: 100%;
  max-width: 1200px;
  margin: 2em auto;
  text-align: center;
  padding: 2em;
  background-color: #ecf0f1;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.main-content h1 {
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 1em;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.welcome-message {
  font-size: 1.5em;
  color: #2c3e50;
  margin-bottom: 1em;
}

.streak-div {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2em;
}

.streak-card {
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
  border-radius: 10px;
  width: 70%;
  padding: 1.5em;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
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

.streak-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1em 0;
  position: relative;
}

.bubble-container {
  display: flex;
  align-items: center;
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
}

.bubble.filled {
  background-color: #4caf50;
}

.bubble.fiery {
  background-color: orange;
}

.line {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, orange, red);
}

.options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 1.5em;
  margin-bottom: 1.5em;
}

.option {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 220px;
  height: 120px;
  color: #fff;
  text-decoration: none;
  font-size: 1.2em;
  border-radius: 10px;
  transition: background-color 0.3s, transform 0.2s;
  cursor: pointer;
  padding: 1em;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.user {
  background-color: #3498db;
}

.admin {
  background-color: #2ecc71;
}

.settings {
  background-color: #9b59b6;
}

.option:hover {
  transform: scale(1.05);
}

.option:active {
  transform: scale(0.95);
}

.delete-button {
  background-color: #e74c3c;
  color: #fff;
  padding: 1em 2em;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  margin-top: 2em;
}

.delete-button:hover {
  background-color: #c0392b;
  transform: scale(1.05);
}

.delete-button:active {
  transform: scale(0.95);
}

.total-funds {
  position: sticky;
  bottom: 0;
  background-color: #fff;
  padding: 1em;
  border-top: 1px solid #ddd;
  width: 100%;
  text-align: center;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
}

.total-funds p {
  margin: 0;
  font-size: 1.5em;
  color: #2c3e50;
}

body {
  background-color: #ecf0f1;
}

/* Media query for mobile devices */
@media (max-width: 600px) {
  .main-content {
    padding: 1em;
    margin: 1em; /* Add margin to prevent content from touching screen edges */
  }

  .main-content h1 {
    font-size: 2em;
  }

  .options {
    flex-direction: column;
    gap: 1em;
  }

  .option {
    width: 100%;
    height: auto;
    padding: 1em;
  }

  .streak-card {
    width: 100%;
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
