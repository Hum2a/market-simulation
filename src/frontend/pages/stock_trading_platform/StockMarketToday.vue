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
      <button @click="retrieveMostRecentData">Retrieve Most Recent Stock Market Data</button>
      <div v-if="loading">Loading...</div>
      <div v-else>
        <p class="display-date">Displaying most recent data</p>
        <table class="stock-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Symbol</th>
              <th>Price</th>
              <th>Change</th>
              <th>Change (%)</th>
              <th>Time</th>
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
                <td>{{ stock.time }}</td>
              </tr>
              <tr v-if="expandedStock === stock.symbol" class="expanded-row">
                <td colspan="6">
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
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

export default {
  name: 'StockMarketToday',
  components: {
    LineChart: Line
  },
  data() {
    return {
      stocks: [],
      loading: true,
      expandedStock: null,
      chartData: null,
      companies: [
        { name: 'Amazon', symbol: 'AMZN'},
        { name: 'Apple', symbol: 'AAPL'},
        { name: 'Boeing', symbol: 'BA'},
        { name: 'Coca-Cola', symbol: 'KO'},
        { name: 'Disney', symbol: 'DIS'},
        { name: 'Microsoft', symbol: 'MSFT'},
        { name: 'Nike', symbol: 'NKE'},
        { name: 'NVIDIA', symbol: 'NVDA'},
        { name: 'PayPal', symbol: 'PYPL'},
        { name: 'Pfizer', symbol: 'PFE'},
        { name: 'Roblox', symbol: 'RBLX'},
        { name: 'Shell', symbol: 'SHEL'},
        { name: 'Spotify', symbol: 'SPOT'},
        { name: 'Tesla', symbol: 'TSLA'},
        { name: 'Visa', symbol: 'V'},
        { name: 'Walmart', symbol: 'WMT'}
      ],
    };
  },
  async created() {
    await this.retrieveMostRecentData();
  },
  methods: {
    async retrieveMostRecentData() {
      this.loading = true;
      const stockDataPromises = this.companies.map(async company => {
        try {
          const mostRecentData = await this.fetchMostRecentStockData(company.symbol);
          return this.processStockData(company, mostRecentData);
        } catch (error) {
          console.error(`Error fetching data for ${company.symbol}:`, error);
          return {
            name: company.name,
            symbol: company.symbol,
            price: null,
            change: null,
            changePercent: null,
            time: null,
          };
        }
      });

      this.stocks = await Promise.all(stockDataPromises);
      this.loading = false;
    },
    async fetchMostRecentStockData(symbol) {
      const db = getFirestore();
      const docRef = doc(db, 'Real Time Stock Market Data', symbol);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const days = data.days;
        const mostRecentDay = Object.keys(days).sort().pop();
        const mostRecentTime = Object.keys(days[mostRecentDay]).sort().pop();
        const time = `${mostRecentDay} ${mostRecentTime}`;
        return { ...days[mostRecentDay][mostRecentTime], time };
      } else {
        throw new Error(`No data found for ${symbol}`);
      }
    },
    processStockData(company, data) {
      const price = parseFloat(data.currentPrice);
      const previousClose = parseFloat(data.previousClosePrice);
      const change = price - previousClose;
      const changePercent = (change / previousClose) * 100;

      return {
        name: company.name,
        symbol: company.symbol,
        price,
        change,
        changePercent,
        time: data.time,
      };
    },
    async toggleStock(symbol) {
      if (this.expandedStock === symbol) {
        this.expandedStock = null;
        this.chartData = null;
      } else {
        this.expandedStock = symbol;
        const stockData = await this.fetchMostRecentStockData(symbol);
        this.chartData = this.prepareChartData(stockData);
      }
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
