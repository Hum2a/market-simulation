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
      <Datepicker v-if="showDatePicker" v-model="selectedDate" @change="fetchStockDataForDate" />
      <button @click="retrieveMostRecentData">Retrieve Most Recent Stock Market Data</button>
      <div v-if="loading">Loading...</div>
      <div v-else>
        <p class="display-date">Displaying data for: {{ formattedSelectedDate }}</p>
        <table class="stock-table">
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
            <template v-for="stock in stocks" :key="stock.symbol">
              <tr @click="toggleStock(stock.symbol)">
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
              <tr v-if="expandedStock === stock.symbol" class="expanded-row">
                <td colspan="5">
                  <line-chart :chart-data="chartData" v-if="chartData && expandedStock === stock.symbol"></line-chart>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<script>
import { fetchStockDataFromFirestore, saveStockDataToFirestore, isDataFetchedForToday } from '../../../backend/firebase/initFirebase';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

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
    Datepicker,
    LineChart: Line
  },
  data() {
    return {
      stocks: [],
      loading: true,
      showDatePicker: false,
      selectedDate: new Date(),
      expandedStock: null,
      chartData: null,
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
    };
  },
  computed: {
    formattedSelectedDate() {
      return this.selectedDate.toDateString();
    }
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
            const missingDates = this.getMissingDates(data.data["Time Series (Daily)"]);
            if (missingDates.length > 0) {
              await this.fetchMissingDates(company.symbol, missingDates);
            }
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
    async fetchMissingDates(symbol, missingDates) {
      for (const date of missingDates) {
        const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`);
        const data = await response.json();
        if (data && data["Time Series (Daily)"]) {
          const dateData = data["Time Series (Daily)"][date];
          if (dateData) {
            console.log(`Saving data for ${symbol} on ${date}`);  // Log the date being saved
            await saveStockDataToFirestore(symbol, { [date]: dateData });
          }
        }
      }
    },
    getMissingDates(timeSeries) {
      const dates = Object.keys(timeSeries);
      const currentDate = new Date();
      const missingDates = [];
      while (currentDate > new Date(dates[dates.length - 1])) {
        const dateString = currentDate.toISOString().split('T')[0];
        if (!dates.includes(dateString) && currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          missingDates.push(dateString);
        }
        currentDate.setDate(currentDate.getDate() - 1);
      }
      console.log(`Missing dates for symbol: ${missingDates}`);  // Log the missing dates
      return missingDates;
    },
    async toggleStock(symbol) {
      if (this.expandedStock === symbol) {
        this.expandedStock = null;
        this.chartData = null;
      } else {
        this.expandedStock = symbol;
        const stockData = await fetchStockDataFromFirestore(symbol);
        this.chartData = this.prepareChartData(stockData.data["Time Series (Daily)"]);
      }
    },
    async retrieveMostRecentData() {
      this.loading = true;
      for (const company of this.companies) {
        const data = await fetchStockDataFromFirestore(company.symbol);
        const missingDates = this.getMissingDates(data.data["Time Series (Daily)"]);
        if (missingDates.length > 0) {
          await this.fetchMissingDates(company.symbol, missingDates);
        }
      }
      await this.fetchStockData();
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
    },
    prepareChartData(timeSeries) {
      const labels = [];
      const data = [];
      for (const date in timeSeries) {
        labels.push(date);
        data.push(parseFloat(timeSeries[date]['4. close']));
      }
      labels.reverse();
      data.reverse();
      return {
        labels,
        datasets: [
          {
            label: 'Stock Price',
            data,
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          }
        ]
      };
    }
  }
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

.display-date {
  color: rgb(59, 6, 24);
  font-weight: bold;
  text-align: center;
  justify-content: center;
}

.positive-change {
  color: #4CAF50; /* Green color for positive changes */
}

.negative-change {
  color: #F44336; /* Red color for negative changes */
}

.expanded-row {
  background-color: #f0f2f5;
}
</style>
