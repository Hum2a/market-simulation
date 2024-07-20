<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { isDataFetchedForToday, saveStockDataToFirestore } from './backend/firebase/initFirebase';
import { fetchAndSaveConversionRate } from './backend/api/ConversionRateChecker';
import './backend/api/FinnHubAPI'; // Importing the script to ensure it runs
import { trackUserLogin, stopTrackingUserLogin } from './backend/utils/loginTracker';
import { trackUserLogout } from './backend/utils/logoutTracker';
import { useRouter } from 'vue-router';

// Alpha Vantage API key
const API_KEY = 'Z2G35L67NYNFFXHT';

const getStockData = async (symbol) => {
  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stock data', error);
    throw error;
  }
};

export default {
  name: 'App',
  data() {
    return {
      user: null,
      companies: [
        { name: 'Amazon', symbol: 'AMZN' },
        { name: 'Apple', symbol: 'AAPL' },
        { name: 'Barclays', symbol: 'BCS' },
        { name: 'Boeing', symbol: 'BA' },
        { name: 'Coca-Cola', symbol: 'KO' },
        { name: 'Disney', symbol: 'DIS' },
        { name: 'IBM', symbol: 'IBM' },
        { name: 'Microsoft', symbol: 'MSFT' },
        { name: 'Nike', symbol: 'NKE' },
        { name: 'NVIDIA', symbol: 'NVDA' },
        { name: 'Pfizer', symbol: 'PFE' },
        { name: 'Roblox', symbol: 'RBLX' },
        { name: 'Shell', symbol: 'SHEL' },
        { name: 'Spotify', symbol: 'SPOT' },
        { name: 'Tesla', symbol: 'TSLA' },
        { name: 'Visa', symbol: 'V' },
        { name: 'Walmart', symbol: 'WMT' }
      ],
      loading: true
    };
  },
  async created() {
    const auth = getAuth();
    const router = useRouter();

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.user = user;
        await trackUserLogin(user.uid);
        await this.checkAndFetchStockData();
      } else {
        if (this.user) {
          await trackUserLogout(this.user.uid);
          await stopTrackingUserLogin(this.user.uid);
        }
        this.user = null;
        router.push({ name: 'StartPage' });
      }
      this.loading = false;
    });

    // Add beforeunload event listener
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    // Run the conversion rate checker
    await fetchAndSaveConversionRate();

    // Add a global error handler for navigation errors
    router.onError((error) => {
      if (/Loading chunk \d+ failed/.test(error.message)) {
        router.push({ name: 'StartPage' });
      }
    });
  },
  beforeUnmount() {
    // Remove beforeunload event listener
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  },
  methods: {
    async handleBeforeUnload() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        await trackUserLogout(user.uid);
        await stopTrackingUserLogin(user.uid);
        await signOut(auth);
      }
    },
    async checkAndFetchStockData() {
      for (const company of this.companies) {
        const symbol = company.symbol;
        const dataFetched = await isDataFetchedForToday(symbol);
        if (!dataFetched) {
          await this.fetchAndSaveStockData(symbol);
        }
      }
    },
    async fetchAndSaveStockData(symbol) {
      // Fetch stock data from Alpha Vantage API
      const stockData = await getStockData(symbol);
      // Save to Firestore
      await saveStockDataToFirestore(symbol, stockData);
    },
    async refreshData() {
      this.loading = true;
      await this.checkAndFetchStockData();
      this.loading = false;
    }
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
</style>
