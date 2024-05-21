<template>
  <div class="stock-market-today">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/homepage" class="nav-link">Home</router-link>
        <router-link to="/groupcreation" class="nav-link">Asset Market Tool</router-link>
        <router-link to="/portfolio-creation" class="nav-link">Portfolio Creation</router-link>
        <router-link to="/stock-market-today" class="nav-link">Stock Market Today</router-link>
      </nav>
    </header>
    <main class="main-content">
      <h1>Stock Market Today</h1>
      <button @click="showDatePicker = !showDatePicker">
        Pick a Date
      </button>
      <VueDatePicker v-if="showDatePicker" v-model="selectedDate" @input="fetchStockDataForDate"/>
      <div v-if="loading">Loading...</div>
      <table v-else class="stock-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Symbol</th>
            <th>Price</th>
            <th>Change</th>
            <th>Change (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in stocks" :key="stock.symbol">
            <td>{{ stock.name }}</td>
            <td>{{ stock.symbol }}</td>
            <td v-if="stock.price !== null">${{ stock.price.toFixed(2) }}</td>
            <td v-else>N/A</td>
            <td v-if="stock.change !== null" :class="{'positive-change': stock.change > 0, 'negative-change': stock.change < 0}">
              {{ stock.change.toFixed(2) }}
            </td>
            <td v-else>N/A</td>
            <td v-if="stock.changePercent !== null" :class="{'positive-change': stock.changePercent > 0, 'negative-change': stock.changePercent < 0}">
              {{ stock.changePercent.toFixed(2) }}%
            </td>
            <td v-else>N/A</td>
          </tr>
        </tbody>
      </table>
    </main>
  </div>
</template>

<script>
import { fetchStockDataFromFirestore, saveStockDataToFirestore, isDataFetchedForToday } from '../../../backend/firebase/initFirebase';
import VueDatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';

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
  name: 'StockMarketToday',
  components: {
    VueDatePicker
  },
  data() {
    return {
      stocks: [],
      loading: true,
      showDatePicker: false,
      selectedDate: new Date(),
      companies: [
        { name: 'Apple', symbol: 'AAPL' },
        { name: 'Microsoft', symbol: 'MSFT' },
        { name: 'Amazon', symbol: 'AMZN' },
        { name: 'Google', symbol: 'GOOGL' },
        { name: 'Facebook', symbol: 'FB' },
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
    };
  },
  async created() {
    await this.fetchStockData();
  },
  methods: {
    async fetchStockData() {
      const stockDataPromises = this.companies.map(async company => {
        try {
          const dataFetchedForToday = await isDataFetchedForToday(company.symbol);
          if (!dataFetchedForToday) {
            let data = await getStockData(company.symbol);
            await saveStockDataToFirestore(company.symbol, data);
            return this.processStockData(company, data);
          } else {
            const data = await fetchStockDataFromFirestore(company.symbol);
            return this.processStockData(company, data.data);
          }
        } catch (error) {
          console.error(`Error fetching data for ${company.symbol}:`, error);
          return {
            name: company.name,
            symbol: company.symbol,
            price: null,
            change: null,
            changePercent: null,
          };
        }
      });

      this.stocks = await Promise.all(stockDataPromises);
      this.loading = false;
    },
    async fetchStockDataForDate() {
      if (!this.selectedDate) return;
      this.loading = true;
      const date = this.selectedDate.toISOString().split('T')[0];

      const stockDataPromises = this.companies.map(async company => {
        try {
          const data = await fetchStockDataFromFirestore(company.symbol);
          return this.processStockData(company, data.data, date);
        } catch (error) {
          console.error(`Error fetching data for ${company.symbol} on ${date}:`, error);
          return {
            name: company.name,
            symbol: company.symbol,
            price: null,
            change: null,
            changePercent: null,
          };
        }
      });

      this.stocks = await Promise.all(stockDataPromises);
      this.loading = false;
    },
    processStockData(company, data, date = null) {
      const timeSeries = data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error('Time series data not available');
      }
      const targetDate = date || Object.keys(timeSeries)[0];
      const latestData = timeSeries[targetDate];
      const previousDate = Object.keys(timeSeries)[1];
      const previousData = timeSeries[previousDate];

      const price = parseFloat(latestData['4. close']);
      const previousClose = parseFloat(previousData['4. close']);
      const change = price - previousClose;
      const changePercent = (change / previousClose) * 100;

      return {
        name: company.name,
        symbol: company.symbol,
        price,
        change,
        changePercent,
      };
    }
  },
};
</script>

<style scoped>
.stock-market-today {
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
  max-width: 1200px;
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

.stock-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1em;
}

.stock-table th, .stock-table td {
  padding: 0.5em;
  border: 1px solid #ddd;
}

.stock-table th {
  background-color: #102454;
  color: #fff;
}

.positive-change {
  color: #4CAF50; /* Green color for positive changes */
}

.negative-change {
  color: #F44336; /* Red color for negative changes */
}
</style>
