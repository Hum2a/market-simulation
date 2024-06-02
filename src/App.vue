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
        { name: 'AbbVie', symbol: 'ABBV' },
        { name: 'Activision Blizzard', symbol: 'ATVI' },
        { name: 'Adobe', symbol: 'ADBE' },
        { name: 'Amazon', symbol: 'AMZN' },
        { name: 'American Tower Corporation', symbol: 'AMT' },
        { name: 'Apple', symbol: 'AAPL' },
        { name: 'Astra Zeneca', symbol: 'AZN' },
        { name: 'AT&T', symbol: 'T' },
        { name: 'Axon Enterprise', symbol: 'AXON' },
        { name: 'Barclays', symbol: 'BCS' },
        { name: 'Berkshire Hathaway', symbol: 'BRK.B' },
        { name: 'Blackrock', symbol: 'BLK' },
        { name: 'Boeing', symbol: 'BA' },
        { name: 'BP', symbol: 'BP' },
        { name: 'BYD', symbol: 'BYDDY' },
        { name: 'Cisco', symbol: 'CSCO' },
        { name: 'Coca-Cola', symbol: 'KO' },
        { name: 'Comcast', symbol: 'CMCSA' },
        { name: 'Costco', symbol: 'COST' },
        { name: 'Curries', symbol: 'DC.L' },
        { name: 'Disney', symbol: 'DIS' },
        { name: 'EA', symbol: 'EA' },
        { name: 'ExxonMobil', symbol: 'XOM' },
        { name: 'Goldman Sachs', symbol: 'GS' },
        { name: 'Google', symbol: 'GOOGL' },
        { name: 'Home Depot', symbol: 'HD' },
        { name: 'IBM', symbol: 'IBM' },
        { name: 'Intel', symbol: 'INTC' },
        { name: 'Johnson & Johnson', symbol: 'JNJ' },
        { name: 'JPMorgan Chase', symbol: 'JPM' },
        { name: 'LG', symbol: '066570.KS' },
        { name: 'Lockheed Martin', symbol: 'LMT' },
        { name: 'Man United', symbol: 'MANU' },
        { name: 'Mastercard', symbol: 'MA' },
        { name: 'Meta', symbol: 'META' },
        { name: 'Microsoft', symbol: 'MSFT' },
        { name: 'Netflix', symbol: 'NFLX' },
        { name: 'NIO', symbol: 'NIO' },
        { name: 'Nike', symbol: 'NKE' },
        { name: 'NVIDIA', symbol: 'NVDA' },
        { name: 'Open AI', symbol: 'Not Listed' }, // Open AI is not a publicly traded company
        { name: 'Pandora', symbol: 'P' },
        { name: 'PayPal', symbol: 'PYPL' },
        { name: 'Pfizer', symbol: 'PFE' },
        { name: 'PepsiCo', symbol: 'PEP' },
        { name: 'Procter & Gamble', symbol: 'PG' },
        { name: 'Roblox', symbol: 'RBLX' },
        { name: 'Rolls Royce', symbol: 'RR.L' },
        { name: 'Shell', symbol: 'SHEL' },
        { name: 'Spotify', symbol: 'SPOT' },
        { name: 'Tesla', symbol: 'TSLA' },
        { name: 'Tesco', symbol: 'TSCO.L' },
        { name: 'UnitedHealth', symbol: 'UNH' },
        { name: 'Verizon', symbol: 'VZ' },
        { name: 'Visa', symbol: 'V' },
        { name: 'Walmart', symbol: 'WMT' }
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
