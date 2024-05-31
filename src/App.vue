<template>
  <div>
    <router-view />
  </div>
</template>

<script>
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { isDataFetchedForToday, saveStockDataToFirestore } from './backend/firebase/initFirebase'; // Ensure paths are correct

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
        { name: 'Apple', symbol: 'AAPL' },
        { name: 'Microsoft', symbol: 'MSFT' },
        { name: 'Amazon', symbol: 'AMZN' },
        { name: 'Google', symbol: 'GOOGL' },
        { name: 'Meta', symbol: 'META' },
        { name: 'Tesla', symbol: 'TSLA' },
        { name: 'Berkshire Hathaway', symbol: 'BRK.B' },
        { name: 'Johnson & Johnson', symbol: 'JNJ' },
        { name: 'JPMorgan Chase', symbol: 'JPM' },
        { name: 'Visa', symbol: 'V' },
        { name: 'NVIDIA', symbol: 'NVDA' },
        { name: 'Walmart', symbol: 'WMT' },
        { name: 'Mastercard', symbol: 'MA' },
        { name: 'Procter & Gamble', symbol: 'PG' },
        { name: 'UnitedHealth', symbol: 'UNH' },
        { name: 'Home Depot', symbol: 'HD' },
        { name: 'Disney', symbol: 'DIS' },
        { name: 'PayPal', symbol: 'PYPL' },
        { name: 'Intel', symbol: 'INTC' },
        { name: 'Verizon', symbol: 'VZ' },
        { name: 'Coca-Cola', symbol: 'KO' },
        { name: 'Pfizer', symbol: 'PFE' },
        { name: 'PepsiCo', symbol: 'PEP' },
        { name: 'Netflix', symbol: 'NFLX' },
        { name: 'Comcast', symbol: 'CMCSA' },
        { name: 'Cisco', symbol: 'CSCO' },
        { name: 'AbbVie', symbol: 'ABBV' },
        { name: 'ExxonMobil', symbol: 'XOM' },
        { name: 'Nike', symbol: 'NKE' },
        { name: 'AT&T', symbol: 'T' },
      ],
      loading: true
    };
  },
  async created() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.user = user;
        await this.checkAndFetchStockData();
        this.$router.push({ name: 'StockTradingSelect' });
      } else {
        this.user = null;
        this.$router.push({ name: 'StartPage' });
      }
      this.loading = false;
    });
  },
  methods: {
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
      // Fetch stock data from API
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
