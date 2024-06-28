<template>
  <div class="portfolio-append">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/stock-trading-select" class="nav-link">Stock Market Tool</router-link>
      </nav>
    </header>
    <main class="main-content">
      <div v-if="!portfolioExists">
        <h2>The portfolio does not exist. You cannot add to it.</h2>
      </div>
      <div v-else>
        <h1>Append to Your Portfolio</h1>
        <form @submit.prevent="appendPortfolio" class="portfolio-form">
          <div class="total-funds-display">
            <p>Total Funds: £{{ remainingFunds }}</p>
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
                @blur="checkAllocation(company)"
                class="company-value-input"
              />
            </div>
          </div>
          <div class="total-allocation">
            <strong>Total Allocation: £{{ totalAllocation }}</strong>
          </div>
          <div class="form-buttons">
            <button type="submit" :disabled="totalAllocation > totalFunds || totalAllocation === 0">Submit and Append Portfolio</button>
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
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { format } from 'date-fns';
import MessageModal from './components/MessageModal.vue';

export default {
  name: 'PortfolioAppend',
  components: {
    MessageModal
  },
  data() {
    return {
      userFunds: 0,
      totalFunds: 0,
      companies: [
        { name: 'Amazon', symbol: 'AMZN', allocation: 0, invested: false },
        { name: 'Apple', symbol: 'AAPL', allocation: 0, invested: false },
        { name: 'Boeing', symbol: 'BA', allocation: 0, invested: false },
        { name: 'Coca-Cola', symbol: 'KO', allocation: 0, invested: false },
        { name: 'Disney', symbol: 'DIS', allocation: 0, invested: false },
        { name: 'Microsoft', symbol: 'MSFT', allocation: 0, invested: false },
        { name: 'Nike', symbol: 'NKE', allocation: 0, invested: false },
        { name: 'NVIDIA', symbol: 'NVDA', allocation: 0, invested: false },
        { name: 'PayPal', symbol: 'PYPL', allocation: 0, invested: false },
        { name: 'Pfizer', symbol: 'PFE', allocation: 0, invested: false },
        { name: 'Roblox', symbol: 'RBLX', allocation: 0, invested: false },
        { name: 'Shell', symbol: 'SHEL', allocation: 0, invested: false },
        { name: 'Spotify', symbol: 'SPOT', allocation: 0, invested: false },
        { name: 'Tesla', symbol: 'TSLA', allocation: 0, invested: false },
        { name: 'Visa', symbol: 'V', allocation: 0, invested: false },
        { name: 'Walmart', symbol: 'WMT', allocation: 0, invested: false }
      ],
      portfolioExists: false,
      showLogin: false,
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
  mounted() {
    this.checkPortfolioExists();
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
    async checkPortfolioExists() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const userUID = user.uid;
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const formattedYesterdayDate = yesterday.toISOString().split('T')[0];

        let portfolioDocRef = doc(db, userUID, 'Stock Trading Platform', 'Portfolio', `${formattedDate} Portfolio`);
        let portfolioDocSnap = await getDoc(portfolioDocRef);

        if (!portfolioDocSnap.exists()) {
          portfolioDocRef = doc(db, userUID, 'Stock Trading Platform', 'Portfolio', `${formattedYesterdayDate} Portfolio`);
          portfolioDocSnap = await getDoc(portfolioDocRef);
        }

        if (portfolioDocSnap.exists()) {
          this.portfolioExists = true;
          this.portfolioDocRef = portfolioDocRef;
          this.existingPortfolio = portfolioDocSnap.data();
        }
      }
    },
    getCompanyLogo(companyName) {
      return require(`../../assets/StocksLogos/${companyName}.png`);
    },
    updateTotal() {
      this.$forceUpdate();
    },
    checkAllocation(company) {
      if (company.allocation === '' || company.allocation === null || isNaN(company.allocation)) {
        company.allocation = 0;
      }
    },
    handleLoginSuccess(user) {
      this.showLogin = false;
      console.log('Logged in user:', user);
      this.fetchUserFunds();
    },
    async fetchStockData(symbol) {
      const db = getFirestore();
      const docRef = doc(db, 'Stock Market Data', symbol);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    },
    async fetchExchangeRate() {
      const db = getFirestore();
      const docRef = doc(db, 'Currency Rates', 'USD-GBP');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().rate;
      }
      return 1; // Default to 1 if the rate is not found
    },
    async appendPortfolio() {
      if (this.totalAllocation <= this.totalFunds && this.portfolioExists) {
        try {
          const exchangeRate = await this.fetchExchangeRate();
          const stockDataPromises = this.companies.map(company => {
            if (company.allocation > 0) {
              return this.fetchStockData(company.symbol);
            }
            return null;
          });

          const stockDataArray = await Promise.all(stockDataPromises);

          const updatedCompanies = this.existingPortfolio.companies.map(existingCompany => {
            const newCompany = this.companies.find(company => company.name === existingCompany.name);
            if (newCompany && newCompany.allocation > 0) {
              const stockData = stockDataArray[this.companies.indexOf(newCompany)];
              let initialStockPrice = 0;

              if (stockData && stockData.data['Time Series (Daily)']) {
                const today = new Date();
                let formattedDate = format(today, 'yyyy-MM-dd');
                let dailyData = stockData.data['Time Series (Daily)'][formattedDate];

                // If no data for formattedDate, go back until data is found
                while (!dailyData && today >= new Date(stockData.data['Meta Data']['3. Last Refreshed'])) {
                  today.setDate(today.getDate() - 1);
                  formattedDate = format(today, 'yyyy-MM-dd');
                  dailyData = stockData.data['Time Series (Daily)'][formattedDate];
                }

                if (dailyData) {
                  initialStockPrice = parseFloat(dailyData['4. close']) * exchangeRate;
                }
              }

              const currentValue = existingCompany.currentValue || 0;
              return {
                ...existingCompany,
                allocation: existingCompany.allocation + newCompany.allocation,
                currentValue: currentValue + newCompany.allocation,
                initialStockPrice: initialStockPrice || existingCompany.initialStockPrice || 0,
                invested: true
              };
            }
            return existingCompany;
          });

          await updateDoc(this.portfolioDocRef, {
            companies: updatedCompanies,
            totalAllocation: this.existingPortfolio.totalAllocation + this.totalAllocation,
            date: new Date(),
          });

          await updateDoc(doc(getFirestore(), getAuth().currentUser.uid, 'Total Funds'), {
            totalFunds: this.totalFunds - this.totalAllocation,
          }, { merge: true });

          this.navigateToPortfolioDisplay();
        } catch (error) {
          console.error('Error appending to portfolio:', error);
          this.modalTitle = 'Error';
          this.modalMessage = 'Error appending to portfolio. Please try again.';
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
.portfolio-append {
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
}

.logo {
  width: 150px;
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
  margin: 3em auto;
  text-align: center;
  padding: 2em;
  background-color: #ecf0f1;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.total-funds-display {
  background-color: #3498db;
  color: white;
  font-size: 2em;
  font-weight: bold;
  padding: 1.5em;
  border-radius: 10px;
  margin-bottom: 1.5em;
}

.main-content h1 {
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 1em;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.main-content h2 {
  font-size: 1.2em;
  color: #2c3e50;
  margin-bottom: 0.8em;
}

.main-content p {
  font-size: 1.3em;
  color: #2c3e50;
  margin-bottom: 1.5em;
}

.portfolio-form {
  background: #fff;
  padding: 2.5em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.companies-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5em;
  justify-content: center;
}

.company {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #bdc3c7;
  padding: 1.2em;
  border-radius: 8px;
  width: 110px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.company-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #2c3e50;
}

.company-logo {
  height: 40px;
  width: auto;
  max-width: 100px;
  margin-bottom: 0.8em;
}

.company-value-input {
  text-align: center;
  font-weight: bold;
  color: #2c3e50;
  border: 1px solid #34495e;
  border-radius: 5px;
  background: #ecf0f1;
  width: 90px;
  padding: 0.5em;
  transition: background 0.3s, border-color 0.3s;
}

.company-value-input:focus {
  background: #fff;
  border-color: #3498db;
}

.total-allocation {
  margin-top: 1.5em;
  font-size: 1.4em;
  color: #2c3e50;
}

.form-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.5em;
}

button {
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 0.7em 1.5em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:disabled {
  background-color: #7f8c8d;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #34495e;
}
</style>
