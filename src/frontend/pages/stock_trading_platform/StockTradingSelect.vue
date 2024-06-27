<template>
  <div class="stock-trading-select">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <a @click="logout" class="nav-link">Log Out</a>
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
      <div class="streak-div">
        <div v-if="streak !== null" class="streak-card">
          <h2>Login Streak</h2>
          <p>{{ streak }} days</p>
        </div>
      </div>
      <div class="options">
        <router-link to="/portfolio-creation" :class="['option', 'user']">Create Your Portfolio</router-link>
        <router-link to="/portfolio-append" :class="['option', 'user']"> Append Portfolio</router-link>
        <router-link to="/portfolio-display" :class="['option', 'user']">View Your Portfolio</router-link>
      </div>
      <div class="options">
        <template v-if="profile && profile.role === 'admin'">
          <router-link to="/admin-portfolio-creation" :class="['option', 'admin']">Admin Portfolio Creation</router-link>
          <router-link to="/admin-portfolio-assign" :class="['option', 'admin']">Assign Portfolios</router-link>
          <router-link to="/sticky-note-creator" :class="['option', 'admin']">Sticky Note Creator</router-link>
          <router-link to="/stock-market-today" :class="['option', 'admin']">Stock Market Today</router-link>
        </template>
      </div>
      <div class="options">
        <template v-if="profile && profile.role === 'admin'">
          <router-link to="/code-manager" :class="['option', 'settings']">Code Manager</router-link>
          <router-link to="/user-manager" :class="['option', 'settings']">User Manager</router-link>
        </template>
      </div>
      <!-- <div class="options">
        <template v-if="profile && profile.role === 'admin'">
          <router-link to="/portfolio-delete" :class="['option', 'delete']">Delete A Portfolio</router-link>
        </template>
      </div> -->
      <button v-if="profile && profile.role === 'admin'" @click="deletePortfolio" class="delete-button">Delete Your Portfolio</button>
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
import { getFirestore, collection, query, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { addDays, isSameDay } from 'date-fns';
import { trackUserLogout } from '../../../backend/utils/logoutTracker';

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
      profile: null,
      streak: null
    };
  },
  async created() {
    await this.fetchUserProfile();
    await this.fetchUserFunds();
    await this.fetchLoginStreak();
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
    async fetchLoginStreak() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const streakRef = doc(db, 'Login Streak', user.uid);
        const streakSnap = await getDoc(streakRef);

        if (streakSnap.exists()) {
          const streakData = streakSnap.data();
          const today = new Date();
          const lastLoginDate = streakData.lastLogin.toDate();
          if (isSameDay(today, lastLoginDate)) {
            this.streak = streakData.streak;
          } else if (isSameDay(today, addDays(lastLoginDate, 1))) {
            this.streak = streakData.streak + 1;
            await setDoc(streakRef, { streak: this.streak, lastLogin: today }, { merge: true });
          } else {
            this.streak = 1;
            await setDoc(streakRef, { streak: this.streak, lastLogin: today }, { merge: true });
          }
        } else {
          this.streak = 1;
          await setDoc(streakRef, { streak: this.streak, lastLogin: new Date() });
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
          if (profile.role === 'user') {
            const portfolioDocRef = doc(db, user.uid, 'Stock Trading Platform', 'Portfolio', 'Initial Portfolio');
            const portfolioDocSnap = await getDoc(portfolioDocRef);

            if (portfolioDocSnap.exists()) {
              next('/portfolio-display');
            } else {
              next('/portfolio-creation');
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
  background-color: #f0f2f5;
  height: 100vh;
  padding: 0;
  margin: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.2em;
  background-color: #102454;
  border-bottom-right-radius: 25px;
  border-bottom-left-radius: 25px;
  width: 100%;
  margin: 0 auto;
}

.logo {
  height: auto;
  width: 150px;
  display: block;
  margin-left: 0;
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

.streak-div {
  display: flex;
  justify-content: center;
  align-items: center;
}

.streak-card {
  background-color: #ff903b;
  border-radius: 10px;
  width: 20%;
  padding: 1em;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-bottom: 1em;
}

.streak-card h2 {
  margin: 0;
  color: #333;
  font-size: 1.2em;
}

.streak-card p {
  margin: 0.5em 0 0;
  font-size: 1.5em;
  color: #333;
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
  background-color: #7062c0;
}

.admin {
  background-color: rgb(45, 118, 40);
}

.settings {
  background-color: #727272;
}

.delete {
  background-color: #dc3545;
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
