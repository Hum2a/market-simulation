<template>
  <div class="stock-trading-select">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="startpage" class="nav-link">Log Out</router-link>
        <template v-if="profile && profile.role === 'admin'">
          <router-link to="/groupcreation" class="nav-link">Group Creation</router-link>
        </template>
      </nav>
    </header>
    <main class="main-content">
      <h1>Stock Trading</h1>
      <div v-if="profile" class="welcome-message">
        Welcome back, {{ profile.firstName }}!
      </div>
      <div class="options">
        <router-link to="/portfolio-creation" :class="['option', 'user']">Create Your Portfolio</router-link>
        <router-link to="/portfolio-display" :class="['option', 'user']">View Your Portfolio</router-link>
      </div>
      <div class="options">
        <template v-if="profile && profile.role === 'admin'">
          <router-link to="/admin-portfolio-creation" :class="['option', 'admin']">Admin Portfolio Creation</router-link>
          <router-link to="/portfolio-upload" :class="['option', 'admin']">Upload Portfolios</router-link>
          <router-link to="/admin-portfolio-assign" :class="['option', 'admin']">Assign Portfolios</router-link>
          <router-link to="/admin-portfolio-view" :class="['option', 'admin']">View all Portfolios</router-link>
          <router-link to="/admin-portfolio-display" :class="['option', 'admin',]">View Individual Portfolios</router-link>
          <router-link to="/sticky-note-creator" :class="['option', 'admin']">Sticky Note Creator</router-link>
        </template>
      </div>
      <div class="options">
        <template v-if="profile && profile.role === 'admin'">
          <router-link to="/stock-market-today" :class="['option', 'stockmarket']">Stock Market Today</router-link>
          <router-link to="/portfolio-simulation" :class="['option', 'stockmarket']">Simulation</router-link>
        </template>
      </div>
      <button v-if="profile && profile.role === 'admin'" @click="deletePortfolio" class="delete-button">Delete Portfolio</button>
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
import MessageModal from './components/MessageModal.vue'; // Import the MessageModal component
import { getFirestore, collection, query, getDocs, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default {
  name: 'StockTradingSelect',
  components: {
    MessageModal // Register the MessageModal component
  },
  data() {
    return {
      showLogin: false,
      userFunds: null,
      showModal: false,
      modalTitle: '',
      modalMessage: '',
      profile: null
    };
  },
  async created() {
    await this.fetchUserProfile();
    await this.fetchUserFunds();
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

        // Find the "Initial Portfolio" document and get its total allocation
        portfolioSnapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (docSnap.id === 'Initial Portfolio') {
            initialPortfolioAllocation = data.totalAllocation || 0;
          }
        });

        // Delete all portfolio documents
        const deletePromises = portfolioSnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
        await Promise.all(deletePromises);

        // Update the user's total funds
        const totalFundsRef = doc(db, user.uid, 'Total Funds');
        const totalFundsSnap = await getDoc(totalFundsRef);

        if (totalFundsSnap.exists()) {
          const totalFundsData = totalFundsSnap.data();
          const updatedFunds = totalFundsData.totalFunds + initialPortfolioAllocation;
          await updateDoc(totalFundsRef, { totalFunds: updatedFunds });
          this.userFunds = updatedFunds; // Update the displayed total funds
        }

        this.modalTitle = 'Success';
        this.modalMessage = 'Portfolio deleted and funds restored successfully!';
        this.showModal = true;
      } else {
        this.modalTitle = 'Error';
        this.modalMessage = 'You need to be logged in to delete a portfolio.';
        this.showModal = true;
      }
    }
  },
  beforeRouteEnter(to, from, next) {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        next('/startpage');
      } else {
        next();
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

.welcome-message {
  font-size: 1.5em;
  color: #102454;
  margin-bottom: 1em;
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

.user {
  background-color: #007bff;
}

.admin {
  background-color: rgb(45, 118, 40);
}

.stockmarket {
  background-color: #333;
}

.option:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}

.option:active {
  transform: scale(0.95);
}

.delete-button {
  background-color: #dc3545;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  margin-top: 2em;
  width: 200px;
  height: 100px;
}

.delete-button:hover {
  background-color: #c82333;
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
  font-size: 1.2em;
  color: #333;
}
</style>
