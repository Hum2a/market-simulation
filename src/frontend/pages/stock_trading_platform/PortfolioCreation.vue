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
        <form @submit.prevent="submitPortfolio" class="portfolio-form">
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
            <button type="submit" :disabled="totalAllocation > totalFunds || totalAllocation === 0">Submit and View Portfolio</button>
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
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import LoginPage from '../LoginPage.vue';
import MessageModal from './components/MessageModal.vue';

export default {
  name: 'PortfolioCreation',
  components: {
    LoginPage,
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
    async submitPortfolio() {
      if (this.totalAllocation <= this.totalFunds) {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        const userUID = user.uid;

        if (user) {
          try {
            const portfolioDocRef = doc(db, userUID, 'Stock Trading Platform', 'Portfolio', 'Initial Portfolio');
            const platformDocRef = doc(db, userUID, 'Stock Trading Platform');

            const portfolioDocSnap = await getDoc(portfolioDocRef);
            const platformDocSnap = await getDoc(platformDocRef);

            let updatedCompanies = this.companies.map(company => ({
              name: company.name,
              symbol: company.symbol,
              allocation: company.allocation,
              invested: company.allocation > 0 // Set invested to true if allocation is greater than 0
            }));

            if (portfolioDocSnap.exists()) {
              const existingPortfolio = portfolioDocSnap.data();
              updatedCompanies = existingPortfolio.companies.map(existingCompany => {
                const newCompany = this.companies.find(company => company.name === existingCompany.name);
                if (newCompany) {
                  return { ...existingCompany, allocation: existingCompany.allocation + newCompany.allocation, invested: true };
                }
                return existingCompany;
              });
            }

            await setDoc(portfolioDocRef, {
              userId: user.uid,
              companies: updatedCompanies,
              totalAllocation: this.totalAllocation,
              date: serverTimestamp(),
            });

            // Ensure the "Stock Trading Platform" document has the "exists" field set to true
            if (!platformDocSnap.exists()) {
              await setDoc(platformDocRef, { exists: true });
            }

            await setDoc(doc(db, userUID, 'Total Funds'), {
              totalFunds: this.totalFunds - this.totalAllocation,
            }, { merge: true });

            this.navigateToPortfolioDisplay();
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
  margin: 2em auto;
  text-align: center;
  padding: 1em;
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

.main-content h1 {
  font-size: 2em;
  color: #102454;
  margin-bottom: 0.5em;
}

.main-content h2 {
  font-size: 1em;
  color: #102454;
  margin-bottom: 0.5em;
}

.main-content p {
  font-size: 1.2em;
  color: #333;
  margin-bottom: 1em;
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
  max-width: 99px;
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
