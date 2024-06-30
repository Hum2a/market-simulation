<template>
  <div class="portfolio-creation">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/stock-trading-select" class="nav-link">Stock Market Tool</router-link>
        <router-link to="/" class="nav-link">Home</router-link>
      </nav>
    </header>
    <main class="main-content">
      <h1>Create New Unassigned Portfolio</h1>
      <p>Divide your chosen amount amongst the top 30 US companies on the stock market.</p>
      <form @submit.prevent="submitPortfolio" class="portfolio-form">
        <div class="user-input">
          <label for="user-name">Student Name:</label>
          <input type="text" id="user-name" v-model="userName" required />
        </div>
        <div class="total-funds-display">
          <p>Total Funds: £{{ remainingFunds }}</p>
        </div>
        <div class="date-picker">
          <label for="portfolio-date">Select Start Date:</label>
          <Datepicker v-model="selectedDate" />
        </div>
        <div class="generate-random">
          <button type="button" @click="generateRandomPortfolio">Generate Random Portfolio</button>
        </div>
        <div class="companies-container">
          <div v-for="company in companies" :key="company.name" class="company">
            <label :for="company.name" class="company-label">
              <img :src="getCompanyLogo(company.name)" :alt="company.name" class="company-logo" />
            </label>
            <input
              type="number"
              v-model.number="company.allocation"
              :max="totalFunds"
              @input="updateTotal"
              class="company-value-input"
            />
          </div>
        </div>
        <div class="total-allocation">
          <strong>Total Allocation: £{{ totalAllocation }}</strong>
        </div>
        <div class="form-buttons">
          <button type="submit" :disabled="totalAllocation > totalFunds || totalAllocation === 0">Submit</button>
        </div>
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
import { getFirestore, setDoc, doc } from 'firebase/firestore';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import MessageModal from './components/MessageModal.vue';

export default {
  name: 'AdminPortfolioCreation',
  components: {
    Datepicker,
    MessageModal
  },
  data() {
    return {
      userName: '',
      totalFunds: 10000,
      companies: [
        { name: 'Amazon', symbol: 'AMZN', allocation: 0 },
        { name: 'Apple', symbol: 'AAPL', allocation: 0 },
        { name: 'Boeing', symbol: 'BA', allocation: 0 },
        { name: 'Coca-Cola', symbol: 'KO', allocation: 0 },
        { name: 'Disney', symbol: 'DIS', allocation: 0 },
        { name: 'Google', symbol: 'GOOGL', allocation: 0 },
        { name: 'Mastercard', symbol: 'MA', allocation: 0 },
        { name: 'Microsoft', symbol: 'MSFT', allocation: 0 },
        { name: 'Nike', symbol: 'NKE', allocation: 0 },
        { name: 'NVIDIA', symbol: 'NVDA', allocation: 0 },
        { name: 'PayPal', symbol: 'PYPL', allocation: 0 },
        { name: 'Pfizer', symbol: 'PFE', allocation: 0 },
        { name: 'Roblox', symbol: 'RBLX', allocation: 0 },
        { name: 'Shell', symbol: 'SHEL', allocation: 0 },
        { name: 'Spotify', symbol: 'SPOT', allocation: 0 },
        { name: 'Tesla', symbol: 'TSLA', allocation: 0 },
        { name: 'Visa', symbol: 'V', allocation: 0 },
        { name: 'Walmart', symbol: 'WMT', allocation: 0 }
      ],
      selectedDate: new Date(),
      isModalVisible: false,
      modalTitle: '',
      modalMessage: '',
    };
  },
  computed: {
    totalAllocation() {
      return this.companies.reduce((total, company) => total + company.allocation, 0);
    },
    remainingFunds() {
      return this.totalFunds - this.totalAllocation;
    }
  },
  methods: {
    getCompanyLogo(companyName) {
      return require(`../../assets/StocksLogos/${companyName}.png`);
    },
    updateTotal() {
      this.$forceUpdate();
    },
    generateRandomPortfolio() {
      let remainingFunds = this.totalFunds;
      this.companies.forEach(company => {
        company.allocation = 0;
      });

      const chunkSize = 100;
      while (remainingFunds >= chunkSize) {
        const company = this.companies[Math.floor(Math.random() * this.companies.length)];
        const allocation = Math.min(chunkSize, remainingFunds);
        company.allocation += allocation;
        remainingFunds -= allocation;
      }

      if (remainingFunds > 0) {
        const company = this.companies[Math.floor(Math.random() * this.companies.length)];
        company.allocation += remainingFunds;
      }

      this.updateTotal();
    },
    async submitPortfolio() {
      if (this.totalAllocation > 0 && this.totalAllocation <= this.totalFunds) {
        const db = getFirestore();
        const portfolio = {
          userName: this.userName,
          companies: this.companies.map(company => ({
            name: company.name,
            symbol: company.symbol,
            allocation: company.allocation
          })),
          totalAllocation: this.totalAllocation,
          date: this.selectedDate,
        };

        try {
          await setDoc(doc(db, 'Unassigned Portfolios', this.userName), portfolio);
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
  background-color: #fff;
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

.main-content p {
  font-size: 1.2em;
  color: #333;
  margin-bottom: 1em;
}

.user-input {
  margin-bottom: 1em;
  text-align: left;
}

.user-input label {
  display: block;
  font-weight: bold;
  color: #102454;
  margin-bottom: 0.5em;
}

.user-input input {
  width: 100%;
  padding: 0.75em;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
}

.total-funds-display {
  background-color: #ff9800;
  color: white;
  font-size: 2em;
  font-weight: bold;
  padding: 1em;
  border-radius: 10px;
  margin-bottom: 1em;
}

.date-picker {
  margin-bottom: 1em;
}

.date-picker label {
  color: #102454;
  font-weight: bold;
  display: block;
  margin-bottom: 0.5em;
}

.generate-random {
  margin-bottom: 1em;
}

.generate-random button {
  background-color: #28a745;
  color: #fff;
  padding: 0.75em 1.5em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.generate-random button:hover {
  background-color: #218838;
  transform: scale(1.05);
}

.generate-random button:active {
  transform: scale(0.95);
}

.portfolio-form {
  background: #fff;
  padding: 2em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.companies-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  justify-content: center;
}

.company {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #e0e7ff;
  padding: 1em;
  border-radius: 8px;
  width: 100px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.company-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #102454;
}

.company-logo {
  height: 30px;
  width: auto;
  margin-bottom: 0.5em;
}

.company-value-input {
  text-align: center;
  font-weight: bold;
  color: #102454;
  border: none;
  background: none;
  width: 80px;
}

.total-allocation {
  margin-top: 1em;
  font-size: 1.2em;
  color: #333;
}

.form-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1em;
}

button {
  background-color: #102454;
  color: #fff;
  padding: 0.75em 1.5em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}

button:hover {
  background-color: #0d1b3f;
  transform: scale(1.05);
}

button:active {
  transform: scale(0.95);
}
</style>
