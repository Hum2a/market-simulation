<template>
    <div class="portfolio-delete">
      <header class="header">
        <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
        <nav class="header-links">
          <router-link to="/stock-trading-select" class="nav-link">Stock Market Tool</router-link>
          <router-link to="/" class="nav-link">Home</router-link>
        </nav>
      </header>
      <main class="main-content">
        <h1>Delete Portfolios</h1>
        <table class="users-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in usersWithPortfolios" :key="user.id">
              <td>{{ user.fullName }}</td>
              <td>{{ user.email }}</td>
              <td><button @click="deletePortfolio(user)">Delete Portfolio</button></td>
            </tr>
          </tbody>
        </table>
      </main>
      <MessageModal
        :isVisible="isModalVisible"
        :title="modalTitle"
        :message="modalMessage"
        @close="isModalVisible = false"
      />
    </div>
  </template>
  
  <script>
  import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc, getDoc, query } from "firebase/firestore";
  import MessageModal from './components/MessageModal.vue';
  
  export default {
    name: 'PortfolioDelete',
    components: {
      MessageModal
    },
    data() {
      return {
        usersWithPortfolios: [],
        isModalVisible: false,
        modalTitle: '',
        modalMessage: ''
      };
    },
    async created() {
      const db = getFirestore();
      const usersCollection = collection(db, 'Users');
      const usersSnapshot = await getDocs(usersCollection);
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
      for (const user of users) {
        if (user.userUID) {
          const stockTradingPlatformDoc = doc(db, `${user.userUID}/Stock Trading Platform`);
          const docSnap = await getDoc(stockTradingPlatformDoc);
          if (docSnap.exists()) {
            this.usersWithPortfolios.push({ ...user, fullName: `${user.firstName} ${user.lastName}` });
          }
        }
      }
    },
    methods: {
      async deletePortfolio(user) {
        const db = getFirestore();
        const portfolioCollectionRef = collection(db, user.userUID, 'Stock Trading Platform', 'Portfolio');
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
        const totalFundsRef = doc(db, user.userUID, 'Total Funds');
        const totalFundsSnap = await getDoc(totalFundsRef);
  
        if (totalFundsSnap.exists()) {
          const totalFundsData = totalFundsSnap.data();
          const updatedFunds = totalFundsData.totalFunds + initialPortfolioAllocation;
          await updateDoc(totalFundsRef, { totalFunds: updatedFunds });
        }
  
        this.modalTitle = 'Success';
        this.modalMessage = `Portfolio for ${user.fullName} deleted and funds restored successfully!`;
        this.isModalVisible = true;
  
        // Remove user from the list
        this.usersWithPortfolios = this.usersWithPortfolios.filter(u => u.id !== user.id);
      }
    }
  };
  </script>
  
  <style scoped>
  .portfolio-delete {
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
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 25px;
    border-bottom-left-radius: 25px;
    position: relative;
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
  
  .users-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1em;
  }
  
  .users-table th,
  .users-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }
  
  .users-table th {
    background-color: #f2f2f2;
    color: #102454;
  }
  
  .users-table td button {
    background-color: #dc3545;
    color: #fff;
    padding: 0.5em 1em;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .users-table td button:hover {
    background-color: #c82333;
  }
  </style>
  