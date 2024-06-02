<template>
  <div class="portfolio-assign">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/stock-trading-select" class="nav-link">Stock Market Tool</router-link>
        <router-link to="/" class="nav-link">Home</router-link>
      </nav>
    </header>
    <main class="main-content">
      <h1>Unassigned Portfolios</h1>
      <div class="filter-options">
        <label for="filter-name">Filter by Name:</label>
        <input type="text" id="filter-name" v-model="filterName" placeholder="Enter student name" />
      </div>
      <div class="sort-options">
        <label for="sort-by">Sort By:</label>
        <select id="sort-by" v-model="sortBy" @change="sortPortfolios">
          <option value="name">Name</option>
          <option value="date">Date</option>
        </select>
      </div>
      <table class="portfolios-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Total Allocation</th>
            <th>Date</th>
            <th>Actions</th>
            <th>Assign</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="portfolio in filteredPortfolios" :key="portfolio.id">
            <tr @click="toggleDetails(portfolio.id)">
              <td>{{ portfolio.userName }}</td>
              <td>£{{ portfolio.totalAllocation }}</td>
              <td>{{ new Date(portfolio.date.seconds * 1000).toLocaleDateString() }}</td>
              <td><button @click.stop="deletePortfolio(portfolio.id)">Delete</button></td>
              <td>
                <select v-model="selectedUser">
                  <option v-for="user in usersWithoutPortfolios" :key="user.id" :value="user">{{`${user.firstName} ${user.lastName}`}}</option>
                </select>
                <button @click.stop="assignPortfolio(portfolio)">Assign</button>
              </td>
            </tr>
            <tr v-if="expandedPortfolioId === portfolio.id" class="portfolio-details">
              <td colspan="5">
                <table class="details-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Symbol</th>
                      <th>Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(company) in portfolio.companies" :key="company.symbol">
                      <td>{{ company.name }}</td>
                      <td>{{ company.symbol }}</td>
                      <td>
                        <input type="number" v-model.number="company.allocation" @input="updateTotalAllocation(portfolio)" />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <input type="text" v-model="newCompanyName" placeholder="New Company Name" />
                      </td>
                      <td>
                        <input type="text" v-model="newCompanySymbol" placeholder="New Company Symbol" />
                      </td>
                      <td>
                        <input type="number" v-model.number="newCompanyAllocation" placeholder="Allocation" />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="edit-actions">
                  <button @click="addCompany(portfolio)">Add Company</button>
                  <button @click="savePortfolio(portfolio)">Save</button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-if="usersWithoutPortfolios.length > 0" class="users-without-portfolios">
        <h2>Users Without Portfolios</h2>
        <ul>
          <li v-for="user in usersWithoutPortfolios" :key="user.id" @click="selectUser(user)">
            {{`${user.firstName} ${user.lastName}`}}
          </li>
        </ul>
      </div>
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
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import MessageModal from './components/MessageModal.vue';

export default {
  name: 'PortfolioAssign',
  components: {
    MessageModal
  },
  data() {
    return {
      portfolios: [],
      expandedPortfolioId: null,
      isModalVisible: false,
      modalTitle: '',
      modalMessage: '',
      newCompanyName: '',
      newCompanySymbol: '',
      newCompanyAllocation: 0,
      filterName: '',
      sortBy: 'name',
      usersWithoutPortfolios: [],
      selectedUser: null
    };
  },
  computed: {
    filteredPortfolios() {
      return this.portfolios
        .filter(portfolio => portfolio.userName.toLowerCase().includes(this.filterName.toLowerCase()))
        .sort((a, b) => {
          if (this.sortBy === 'name') {
            return a.userName.localeCompare(b.userName);
          } else if (this.sortBy === 'date') {
            return new Date(a.date.seconds * 1000) - new Date(b.date.seconds * 1000);
          }
          return 0;
        });
    }
  },
  async created() {
    const db = getFirestore();
    const portfolioCollection = collection(db, 'Unassigned Portfolios');
    const portfolioSnapshot = await getDocs(portfolioCollection);
    this.portfolios = portfolioSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const usersCollection = collection(db, 'Users');
    const usersSnapshot = await getDocs(usersCollection);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    for (const user of users) {
      if (user.userUID) {
        const stockTradingPlatformDoc = doc(db, `${user.userUID}/Stock Trading Platform`);
        const docSnap = await getDoc(stockTradingPlatformDoc);
        if (!docSnap.exists()) {
          this.usersWithoutPortfolios.push(user);
        }
      }
    }
  },
  methods: {
    toggleDetails(portfolioId) {
      if (this.expandedPortfolioId === portfolioId) {
        this.expandedPortfolioId = null;
      } else {
        this.expandedPortfolioId = portfolioId;
      }
    },
    addCompany(portfolio) {
      if (this.newCompanyName && this.newCompanySymbol && this.newCompanyAllocation > 0) {
        portfolio.companies.push({
          name: this.newCompanyName,
          symbol: this.newCompanySymbol,
          allocation: this.newCompanyAllocation
        });
        this.updateTotalAllocation(portfolio);
        this.newCompanyName = '';
        this.newCompanySymbol = '';
        this.newCompanyAllocation = 0;
      }
    },
    async savePortfolio(portfolio) {
      const db = getFirestore();
      const portfolioRef = doc(db, 'Unassigned Portfolios', portfolio.id);
      try {
        await updateDoc(portfolioRef, {
          companies: portfolio.companies,
          totalFunds: portfolio.totalFunds,
          totalAllocation: portfolio.totalAllocation,
          date: portfolio.date
        });
        this.modalTitle = 'Success';
        this.modalMessage = 'Portfolio updated successfully!';
        this.isModalVisible = true;
      } catch (error) {
        console.error('Error updating portfolio:', error);
        this.modalTitle = 'Error';
        this.modalMessage = 'Error updating portfolio. Please try again.';
        this.isModalVisible = true;
      }
    },
    updateTotalAllocation(portfolio) {
      portfolio.totalAllocation = portfolio.companies.reduce((total, company) => total + company.allocation, 0);
    },
    async assignPortfolio(portfolio) {
      if (this.selectedUser) {
        const db = getFirestore();
        const stockTradingPlatformDocRef = doc(db, `${this.selectedUser.userUID}/Stock Trading Platform`);

        try {
          // Ensure Stock Trading Platform document exists
          await setDoc(stockTradingPlatformDocRef, { exists: true });

          const portfolioRef = doc(db, `${this.selectedUser.userUID}/Stock Trading Platform/Portfolio`, 'Initial Portfolio');
          await setDoc(portfolioRef, {
            ...portfolio,
            date: new Date() // Assign current date as the creation date for the portfolio
          });

          // Update total funds
          const totalFundsDocRef = doc(db, 'Users', this.selectedUser.userUID, 'Total Funds');
          const totalFundsDoc = await getDoc(totalFundsDocRef);
          if (totalFundsDoc.exists()) {
            const currentTotalFunds = totalFundsDoc.data().totalFunds || 0;
            const newTotalFunds = currentTotalFunds - portfolio.totalAllocation;
            await updateDoc(totalFundsDocRef, { totalFunds: newTotalFunds });
          }

          // Remove the assigned portfolio from the unassigned collection
          await deleteDoc(doc(db, 'Unassigned Portfolios', portfolio.id));

          this.modalTitle = 'Success';
          this.modalMessage = `Portfolio assigned to ${this.selectedUser.firstName} ${this.selectedUser.lastName} successfully!`;
          this.isModalVisible = true;

          // Remove assigned portfolio from local list
          this.portfolios = this.portfolios.filter(p => p.id !== portfolio.id);

          // Optionally update UI or clear selections
          this.selectedUser = null;
        } catch (error) {
          console.error('Error assigning portfolio:', error);
          this.modalTitle = 'Error';
          this.modalMessage = 'Error assigning the portfolio. Please try again.';
          this.isModalVisible = true;
        }
      } else {
        this.modalTitle = 'Selection Error';
        this.modalMessage = 'Please select a user before assigning.';
        this.isModalVisible = true;
      }
    },
    async deletePortfolio(portfolioId) {
      const db = getFirestore();
      try {
        await deleteDoc(doc(db, 'Unassigned Portfolios', portfolioId));

        this.modalTitle = 'Success';
        this.modalMessage = 'Portfolio deleted successfully!';
        this.isModalVisible = true;

        // Remove deleted portfolio from local list
        this.portfolios = this.portfolios.filter(p => p.id !== portfolioId);
      } catch (error) {
        console.error('Error deleting portfolio:', error);
        this.modalTitle = 'Error';
        this.modalMessage = 'Error deleting the portfolio. Please try again.';
        this.isModalVisible = true;
      }
    },
    sortPortfolios() {
      this.filteredPortfolios = this.filteredPortfolios.slice();
    }
  }
};
</script>

<style scoped>
.portfolio-assign {
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

.main-content h1,
.main-content h2 {
  font-size: 2em;
  color: #102454;
  margin-bottom: 0.5em;
}

.filter-options,
.sort-options {
  margin-bottom: 1em;
  display: flex;
  justify-content: center;
  align-items: center;
}

.filter-options label,
sort-options label {
  margin-right: 0.5em;
  font-size: 1.2em;
  color: #102454;
}

.filter-options input,
.sort-options select {
  padding: 0.5em;
  font-size: 1em;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.portfolios-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1em;
}

.portfolios-table th,
.portfolios-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.portfolios-table th {
  background-color: #f2f2f2;
  color: #102454;
}

.portfolios-table td button {
  background-color: #dc3545;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.portfolios-table td button:hover {
  background-color: #c82333;
}

.portfolios-table td select {
  margin-right: 0.5em;
  padding: 0.5em;
  font-size: 1em;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.portfolios-table td button {
  background-color: #007bff;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.portfolios-table td button:hover {
  background-color: #0056b3;
}

.portfolio-details {
  background-color: #e9ecef;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1em;
}

.details-table th,
.details-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.details-table th {
  background-color: #f2f2f2;
  color: #102454;
}

.edit-actions {
  margin-top: 1em;
  text-align: right;
}

.edit-actions button {
  background-color: #28a745;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.edit-actions button:hover {
  background-color: #218838;
}

.assign-user {
  display: flex;
  align-items: center;
  margin-top: 1em;
}

.assign-user label {
  margin-right: 0.5em;
  font-size: 1em;
  color: #102454;
}

.assign-user select {
  margin-right: 0.5em;
  padding: 0.5em;
  font-size: 1em;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.assign-user button {
  background-color: #007bff;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.assign-user button:hover {
  background-color: #0056b3;
}

.users-without-portfolios {
  margin-top: 2em;
}

.users-without-portfolios h2 {
  font-size: 1.5em;
  color: #102454;
  margin-bottom: 0.5em;
}

.users-without-portfolios ul {
  list-style: none;
  padding: 0;
}

.users-without-portfolios li {
  font-size: 1.2em;
  color: #333;
  padding: 0.5em 0;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
}

.users-without-portfolios li:last-child {
  border-bottom: none;
}

.users-without-portfolios li:hover {
  background-color: #f0f2f5;
}

.users-without-portfolios button {
  background-color: #007bff;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.users-without-portfolios button:hover {
  background-color: #0056b3;
}
</style>
