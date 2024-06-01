<template>
  <div class="portfolio-creation">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/stock-trading-select" class="nav-link">Stock Market Tool</router-link>
        <button @click="showLogin = !showLogin" class="nav-link login-button">Login</button>
      </nav>
    </header>
    <LoginPage v-if="showLogin" @close="showLogin = false" @login-success="handleLoginSuccess" />
    <main class="main-content">
      <div v-if="totalFunds === 0">
        <h2>You have no funds available to allocate.</h2>
      </div>
      <div v-else>
        <h1>Create or Append to Your Portfolio</h1>
        <p>Divide your chosen amount amongst the top 30 US companies on the stock market.</p>
        <form @submit.prevent="submitPortfolio" class="portfolio-form">
          <div class="funds-input">
            <label for="total-funds">Available Funds (£):</label>
            <input type="number" id="total-funds" v-model.number="totalFunds" disabled />
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
          <div class="form-buttons">
            <button type="submit" :disabled="totalAllocation > totalFunds || totalAllocation === 0">Submit</button>
            <button type="button" @click="navigateToPortfolioDisplay">View Portfolio</button>
          </div>
        </form>
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
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import LoginPage from '../LoginPage.vue';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import MessageModal from './components/MessageModal.vue';

export default {
  name: 'PortfolioCreation',
  components: {
    LoginPage,
    Datepicker,
    MessageModal
  },
  data() {
    return {
      userFunds: 0,
      totalFunds: 0,
      viewMode: 'card',
      companies: [
        { name: 'AbbVie', symbol: 'ABBV', allocation: 0 },
        { name: 'Activision Blizzard', symbol: ', allocation: 0ATVI' },
        { name: 'Adobe', symbol: 'ADBE', allocation: 0 },
        { name: 'Amazon', symbol: 'AMZN', allocation: 0 },
        { name: 'American Tower Corporation', symbol: 'AMT', allocation: 0 },
        { name: 'Apple', symbol: 'AAPL', allocation: 0 },
        { name: 'Astra Zeneca', symbol: 'AZN', allocation: 0 },
        { name: 'AT&T', symbol: 'T', allocation: 0 },
        { name: 'Axon Enterprise', symbol: 'AXON', allocation: 0 },
        { name: 'Barclays', symbol: 'BCS', allocation: 0 },
        { name: 'Berkshire Hathaway', symbol: 'BRK.B', allocation: 0 },
        { name: 'Blackrock', symbol: 'BLK', allocation: 0 },
        { name: 'Boeing', symbol: 'BA', allocation: 0 },
        { name: 'BP', symbol: 'BP', allocation: 0 },
        { name: 'BYD', symbol: 'BYDDY', allocation: 0 },
        { name: 'Cisco', symbol: 'CSCO', allocation: 0 },
        { name: 'Coca-Cola', symbol: 'KO', allocation: 0 },
        { name: 'Comcast', symbol: 'CMCSA', allocation: 0 },
        { name: 'Costco', symbol: 'COST', allocation: 0 },
        { name: 'Curries', symbol: 'DC.L', allocation: 0 },
        { name: 'Disney', symbol: 'DIS', allocation: 0 },
        { name: 'EA', symbol: 'EA', allocation: 0 },
        { name: 'ExxonMobil', symbol: 'XOM', allocation: 0 },
        { name: 'Goldman Sachs', symbol: 'GS', allocation: 0 },
        { name: 'Google', symbol: 'GOOGL', allocation: 0 },
        { name: 'Home Depot', symbol: 'HD', allocation: 0 },
        { name: 'IBM', symbol: 'IBM', allocation: 0 },
        { name: 'Intel', symbol: 'INTC', allocation: 0 },
        { name: 'Johnson & Johnson', symbol: 'JNJ', allocation: 0 },
        { name: 'JPMorgan Chase', symbol: 'JPM', allocation: 0 },
        { name: 'LG', symbol: '066570.KS', allocation: 0 },
        { name: 'Lockheed Martin', symbol: 'LMT', allocation: 0 },
        { name: 'Man United', symbol: 'MANU', allocation: 0 },
        { name: 'Mastercard', symbol: 'MA', allocation: 0 },
        { name: 'Meta', symbol: 'META', allocation: 0 },
        { name: 'Microsoft', symbol: 'MSFT', allocation: 0 },
        { name: 'Netflix', symbol: 'NFLX', allocation: 0 },
        { name: 'NIO', symbol: 'NIO', allocation: 0 },
        { name: 'Nike', symbol: 'NKE', allocation: 0 },
        { name: 'NVIDIA', symbol: 'NVDA', allocation: 0 },
        { name: 'Open AI', symbol: 'Not Listed', allocation: 0 }, // Open AI is not a publicly traded company
        { name: 'Pandora', symbol: 'P', allocation: 0 },
        { name: 'PayPal', symbol: 'PYPL', allocation: 0 },
        { name: 'Pfizer', symbol: 'PFE', allocation: 0 },
        { name: 'PepsiCo', symbol: 'PEP', allocation: 0 },
        { name: 'Procter & Gamble', symbol: 'PG', allocation: 0 },
        { name: 'Roblox', symbol: 'RBLX', allocation: 0 },
        { name: 'Rolls Royce', symbol: 'RR.L', allocation: 0 },
        { name: 'Shell', symbol: 'SHEL', allocation: 0 },
        { name: 'Spotify', symbol: 'SPOT', allocation: 0 },
        { name: 'Tesla', symbol: 'TSLA', allocation: 0 },
        { name: 'Tesco', symbol: 'TSCO.L', allocation: 0 },
        { name: 'UnitedHealth', symbol: 'UNH', allocation: 0 },
        { name: 'Verizon', symbol: 'VZ', allocation: 0 },
        { name: 'Visa', symbol: 'V', allocation: 0 },
        { name: 'Walmart', symbol: 'WMT', allocation: 0 }
      ],
      showLogin: false,
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
  },
  watch: {
    selectedDate(newVal, oldVal) {
      console.log('selectedDate changed from', oldVal, 'to', newVal);
    }
  },
  mounted() {
    this.fetchUserFunds();
  },
  methods: {
    async fetchUserFunds() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const userUID = user.uid;
        const docRef = doc(db, userUID, 'Total Funds');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          this.totalFunds = docSnap.data().totalFunds;
        }
      }
    },
    updateTotal() {
      this.$forceUpdate();
    },
    toggleView() {
      this.viewMode = this.viewMode === 'card' ? 'spreadsheet' : 'card';
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
    handleLoginSuccess(user) {
      this.showLogin = false;
      console.log('Logged in user:', user);
      this.fetchUserFunds();
    },
    async submitPortfolio() {
      if (this.totalAllocation <= this.totalFunds) {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        const userUID = user.uid;

        if (user) {
          try {
            const portfolioDocRef = doc(db, userUID, 'Stock Trading Platform', 'Portfolio', 'Initial Portfolio');
            const portfolioDocSnap = await getDoc(portfolioDocRef);

            let updatedCompanies = this.companies.map(company => ({
              name: company.name,
              symbol: company.symbol,
              allocation: company.allocation
            }));

            if (portfolioDocSnap.exists()) {
              const existingPortfolio = portfolioDocSnap.data();
              updatedCompanies = existingPortfolio.companies.map(existingCompany => {
                const newCompany = this.companies.find(company => company.name === existingCompany.name);
                if (newCompany) {
                  return { ...existingCompany, allocation: existingCompany.allocation + newCompany.allocation };
                }
                return existingCompany;
              });
            }

            await setDoc(portfolioDocRef, {
              userId: user.uid,
              companies: updatedCompanies,
              totalAllocation: this.totalAllocation,
              date: this.selectedDate,
            });

            await setDoc(doc(db, userUID, 'Total Funds'), {
              totalFunds: this.totalFunds - this.totalAllocation,
            }, { merge: true });

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
    navigateToPortfolioDisplay() {
      this.$router.push('/portfolio-display');
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

.main-content h2 {
  font-size: 1em;
  color: #102454;
  margin-bottom: 0.5em
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

.form-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1em;
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
