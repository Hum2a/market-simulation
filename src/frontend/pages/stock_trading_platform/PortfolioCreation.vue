<template>
  <div class="portfolio-creation">
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
      <h1>Create Your Portfolio</h1>
      <p>Divide your chosen amount amongst the top 30 US companies on the stock market.</p>
      <form @submit.prevent="submitPortfolio" class="portfolio-form">
        <div class="funds-input">
          <label for="total-funds">Enter Maximum Portfolio Value (£):</label>
          <input type="number" id="total-funds" v-model.number="userFunds" @input="updateTotalFunds" />
        </div>
        <div class="date-picker">
          <label for="portfolio-date">Select Start Date:</label>
          <Datepicker v-model="selectedDate" />
        </div>
        <div class="view-toggle">
          <button type="button" @click="toggleView">
            {{ viewMode === 'card' ? 'Switch to Spreadsheet View' : 'Switch to Card View' }}
          </button>
        </div>
        <div class="generate-random">
          <button type="button" @click="generateRandomPortfolio">Generate Random Portfolio</button>
        </div>
        <div v-if="viewMode === 'card'">
          <div v-for="company in companies" :key="company.name" class="company">
            <label :for="company.name" class="company-label">{{ company.name }}:</label>
            <input
              type="range"
              :id="company.name"
              v-model.number="company.allocation"
              :max="totalFunds"
              @input="updateTotal"
              step="1"
              class="company-range"
            />
            <input
              type="number"
              v-model.number="company.allocation"
              :max="totalFunds"
              @input="updateTotal"
              class="company-value-input"
            />
          </div>
        </div>
        <div v-else class="spreadsheet-view-container">
          <div class="spreadsheet-view">
            <table>
              <thead>
                <tr>
                  <th v-for="company in companies" :key="company.name">{{ company.name }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td v-for="company in companies" :key="company.name">
                    <input
                      type="number"
                      v-model.number="company.allocation"
                      :max="totalFunds"
                      @input="updateTotal"
                      class="company-value-input"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="total-allocation">
          <strong>Total Allocation: £{{ totalAllocation }}</strong>
        </div>
        <button type="submit" :disabled="totalAllocation > totalFunds || totalAllocation === 0">Submit</button>
      </form>
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
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import LoginPage from '../LoginPage.vue';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import MessageModal from './components/MessageModal.vue';  // Ensure the path to MessageModal.vue is correct

export default {
  name: 'PortfolioCreation',
  components: {
    LoginPage,
    Datepicker,
    MessageModal
  },
  data() {
    return {
      userFunds: 10000,  // Default value for the maximum portfolio value
      totalFunds: 10000,
      viewMode: 'card',  // Default view mode
      companies: [
        { name: 'Apple', allocation: 0 },
        { name: 'Microsoft', allocation: 0 },
        { name: 'Amazon', allocation: 0 },
        { name: 'Google', allocation: 0 },
        { name: 'Facebook', allocation: 0 },
        { name: 'Tesla', allocation: 0 },
        { name: 'Berkshire Hathaway', allocation: 0 },
        { name: 'Johnson & Johnson', allocation: 0 },
        { name: 'JPMorgan Chase', allocation: 0 },
        { name: 'Visa', allocation: 0 },
        { name: 'NVIDIA', allocation: 0 },
        { name: 'Walmart', allocation: 0 },
        { name: 'Mastercard', allocation: 0 },
        { name: 'Procter & Gamble', allocation: 0 },
        { name: 'UnitedHealth', allocation: 0 },
        { name: 'Home Depot', allocation: 0 },
        { name: 'Disney', allocation: 0 },
        { name: 'PayPal', allocation: 0 },
        { name: 'Intel', allocation: 0 },
        { name: 'Verizon', allocation: 0 },
        { name: 'Coca-Cola', allocation: 0 },
        { name: 'Pfizer', allocation: 0 },
        { name: 'PepsiCo', allocation: 0 },
        { name: 'Netflix', allocation: 0 },
        { name: 'Comcast', allocation: 0 },
        { name: 'Cisco', allocation: 0 },
        { name: 'AbbVie', allocation: 0 },
        { name: 'ExxonMobil', allocation: 0 },
        { name: 'Nike', allocation: 0 },
        { name: 'AT&T', allocation: 0 },
      ],
      showLogin: false,
      selectedDate: new Date(),
      isModalVisible: false,
      modalTitle: '',
      modalMessage: ''
    };
  },
  computed: {
    totalAllocation() {
      return this.companies.reduce((total, company) => total + company.allocation, 0);
    },
  },
  watch: {
    selectedDate(newVal, oldVal) {
      console.log('selectedDate changed from', oldVal, 'to', newVal);
    }
  },
  methods: {
    updateTotal() {
      this.$forceUpdate();
    },
    updateTotalFunds() {
      this.totalFunds = this.userFunds;
      this.updateTotal();
    },
    toggleView() {
      this.viewMode = this.viewMode === 'card' ? 'spreadsheet' : 'card';
    },
    generateRandomPortfolio() {
      let remainingFunds = this.totalFunds;
      this.companies.forEach(company => {
        company.allocation = 0;
      });

      // Divide the remaining funds into smaller chunks
      const chunkSize = 100; // Adjust the chunk size as needed for performance
      while (remainingFunds >= chunkSize) {
        const company = this.companies[Math.floor(Math.random() * this.companies.length)];
        const allocation = Math.min(chunkSize, remainingFunds);
        company.allocation += allocation;
        remainingFunds -= allocation;
      }

      // Distribute any remaining funds
      if (remainingFunds > 0) {
        const company = this.companies[Math.floor(Math.random() * this.companies.length)];
        company.allocation += remainingFunds;
      }

      this.updateTotal();
    },

    handleLoginSuccess(user) {
      this.showLogin = false;
      console.log('Logged in user:', user);
    },
    async submitPortfolio() {
      if (this.totalAllocation <= this.totalFunds) {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        const userUID = user.uid;

        if (user) {
          try {
            const docId = new Date().toISOString();

            await setDoc(doc(db, userUID, 'Stock Trading Platform', 'Portfolio', docId), {
              userId: user.uid,
              companies: this.companies,
              totalAllocation: this.totalAllocation,
              date: this.selectedDate,
            });
            this.modalTitle = 'Success';
            this.modalMessage = 'Portfolio Submitted Successfully!';
            this.isModalVisible = true;
          } catch (error) {
            console.error('Error saving portfolio:', error);
            this.modalTitle = 'Error';
            this.modalMessage = 'Error submitting portfolio. Please try again.';
            this.isModalVisible = true;
          }
        } else {
          this.modalTitle = 'Error';
          this.modalMessage = 'You need to be logged in to submit a portfolio.';
          this.isModalVisible = true;
        }
      } else {
        this.modalTitle = 'Error';
        this.modalMessage = 'Total allocation exceeds available funds!';
        this.isModalVisible = true;
      }
    },
  },
};
</script>

<style scoped>
.portfolio-creation {
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

.main-content p {
  font-size: 1.2em;
  color: #333;
  margin-bottom: 1em;
}

.funds-input {
  margin-bottom: 1em;
}

.funds-input label {
  color: #102454;
}

.funds-input input {
  width: 100px;
  margin-left: 10px;
}

.date-picker {
  margin-bottom: 1em;
}

.date-picker label {
  color: #102454;
}

.view-toggle {
  margin-bottom: 1em;
}

.view-toggle button {
  background-color: #102454;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.view-toggle button:hover {
  background-color: #0d1b3f;
}

.generate-random {
  margin-bottom: 1em;
}

.generate-random button {
  background-color: #28a745;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.generate-random button:hover {
  background-color: #218838;
}

.portfolio-form {
  background: #fff;
  padding: 2em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.company {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #e0e7ff;
  padding: 1em;
  border-radius: 8px;
  margin-bottom: 1em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.company-label {
  flex: 1;
  text-align: left;
  font-weight: bold;
  color: #102454;
}

.company-range {
  flex: 2;
  margin: 0 1em;
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  background: #102454;
  border-radius: 5px;
  outline: none;
  transition: opacity 0.2s;
}

.company-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ff9800;
  cursor: pointer;
}

.company-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ff9800;
  cursor: pointer;
}

.company-value-input {
  flex: 1;
  text-align: right;
  font-weight: bold;
  color: #102454;
  border: none;
  background: none;
  width: 80px;
  text-align: center;
}

.spreadsheet-view-container {
  overflow-x: auto;
  width: 100%;
}

.spreadsheet-view table {
  width: 100%;
  border-collapse: collapse;
}

.spreadsheet-view th, .spreadsheet-view td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.spreadsheet-view th {
  background-color: #f2f2f2;
  color: #102454;
}

.total-allocation {
  margin-top: 1em;
  font-size: 1.2em;
  color: #333;
}

button {
  background-color: #102454;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}
</style>
