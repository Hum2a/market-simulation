<template>
  <div class="portfolio-simulation">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/homepage" class="nav-link">Home</router-link>
        <router-link to="/groupcreation" class="nav-link">Asset Market Tool</router-link>
        <router-link to="/stock-trading-select" class="nav-link">Stock Market Simulator</router-link>
        <router-link to="/portfolio-creation" class="nav-link">Portfolio Creation</router-link>
        <router-link to="/portfolio-display" class="nav-link">Portfolio Display</router-link>
      </nav>
    </header>
    <main class="main-content">
      <h1>Portfolio Simulation</h1>
      <div v-if="loading">Loading...</div>
      <div v-else>
        <div class="portfolio-selection">
          <label for="portfolio-select">Which portfolio would you like to simulate?</label>
          <select id="portfolio-select" v-model="selectedPortfolioId" @change="selectPortfolio">
            <option v-for="portfolio in portfolios" :key="portfolio.id" :value="portfolio.id">
              Portfolio Created On: {{ formatDate(portfolio.date.toDate()) }}
            </option>
          </select>
        </div>
        <div v-if="portfolio">
          <h2>Portfolio Created On: {{ formatDate(portfolio.date.toDate()) }}</h2>
          <div class="date-picker">
            <label for="start-date">Select Investing Start Date:</label>
            <Datepicker v-model="startDate" />
          </div>
          <button @click="simulatePortfolio">Simulate Portfolio</button>
          <div class="simulation-container">
            <div v-if="tableData" :style="{ maxHeight: tableMaxHeight + 'px' }" class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th v-for="company in portfolio.companies" :key="company.name">{{ company.name }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in tableData" :key="row.date">
                    <td>{{ row.date }}</td>
                    <td>{{ row.day }}</td>
                    <td v-for="company in portfolio.companies" :key="company.name">{{ row[company.name] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="charts-container">
              <div v-if="stockChartData" class="stock-charts">
                <h3>Stock Performance</h3>
                <div class="toggle-buttons">
                  <button v-for="stockData in stockChartData" :key="stockData.name" @click="toggleStockChart(stockData.name)" :class="{ active: stockData.chartVisible }">
                    {{ stockData.name }}
                  </button>
                </div>
                <line-chart :chart-data="mergedChartData" :chart-options="chartOptions"></line-chart>
              </div>
            </div>
          </div>
          <div v-if="portfolioChartData" class="portfolio-chart">
            <h3>Total Portfolio Value Over Time</h3>
            <line-chart :chart-data="portfolioChartData" :chart-options="chartOptions"></line-chart>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

  
<script>
import { getFirestore, collection, query, getDocs, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import LineChart from './components/LineChart.vue';

export default {
  name: 'PortfolioSimulation',
  components: {
    Datepicker,
    LineChart
  },
  data() {
    return {
      portfolios: [],
      loading: true,
      selectedPortfolioId: null,
      portfolio: null,
      startDate: new Date(),
      tableData: null,
      stockChartData: null,
      portfolioChartData: null,
      chartOptions: {
        responsive: true,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Value',
            },
          },
        },
        elements: {
          line: {
            tension: 0.4,
          },
          point: {
            radius: 2,
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
      },
    };
  },
  computed: {
    tableMaxHeight() {
      const rowHeight = 40; // Approximate height of each row in pixels
      const headerHeight = 50; // Approximate height of the table header in pixels
      const padding = 20; // Additional padding
      return (this.tableData ? this.tableData.length * rowHeight + headerHeight + padding : 0);
    },
    mergedChartData() {
      const labels = this.stockChartData ? this.stockChartData[0].chartData.labels : [];
      const datasets = this.stockChartData
        ? this.stockChartData.filter(stock => stock.chartVisible).map(stock => stock.chartData.datasets[0])
        : [];
      return {
        labels,
        datasets
      };
    }
  },
  async created() {
    await this.fetchPortfolios();
    this.loading = false;
  },
  methods: {
    async fetchPortfolios() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const q = query(collection(db, user.uid, 'Stock Trading Platform', 'Portfolio'));
        const querySnapshot = await getDocs(q);
        const portfolios = [];

        querySnapshot.forEach(doc => {
          portfolios.push({ id: doc.id, ...doc.data() });
        });

        this.portfolios = portfolios;
      } else {
        console.error("User is not logged in");
      }
    },
    async selectPortfolio() {
      if (this.selectedPortfolioId) {
        await this.fetchPortfolio(this.selectedPortfolioId);
      }
    },
    async fetchPortfolio(portfolioId) {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const docRef = doc(db, user.uid, 'Stock Trading Platform', 'Portfolio', portfolioId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          this.portfolio = docSnap.data();
        } else {
          console.error("No such portfolio!");
        }
      } else {
        console.error("User is not logged in");
      }
    },
    async simulatePortfolio() {
      if (!this.portfolio || !this.startDate) return;

      const db = getFirestore();
      const stockDataPromises = this.portfolio.companies.map(async company => {
        const companySymbol = this.getCompanySymbol(company.name);
        if (!companySymbol) {
          console.error(`No symbol found for ${company.name}`);
          return null;
        }

        const docRef = doc(db, "Stock Market Data", companySymbol);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            name: company.name,
            allocation: company.allocation,
            data: data.data["Time Series (Daily)"]
          };
        } else {
          console.error(`No data for ${company.name}`);
          return null;
        }
      });

      const stockData = await Promise.all(stockDataPromises);
      const filteredStockData = stockData.filter(data => data !== null);

      this.prepareTableData(filteredStockData);
      this.prepareStockChartData(filteredStockData);
      this.preparePortfolioChartData(filteredStockData);
    },
    getCompanySymbol(companyName) {
      const companySymbols = {
        'Apple': 'AAPL',
        'Microsoft': 'MSFT',
        'Amazon': 'AMZN',
        'Google': 'GOOGL',
        'Meta': 'META',
        'Tesla': 'TSLA',
        'Berkshire Hathaway': 'BRK.B',
        'Johnson & Johnson': 'JNJ',
        'JPMorgan Chase': 'JPM',
        'Visa': 'V',
        'NVIDIA': 'NVDA',
        'Walmart': 'WMT',
        'Mastercard': 'MA',
        'Procter & Gamble': 'PG',
        'UnitedHealth': 'UNH',
        'Home Depot': 'HD',
        'Disney': 'DIS',
        'PayPal': 'PYPL',
        'Intel': 'INTC',
        'Verizon': 'VZ',
        'Coca-Cola': 'KO',
        'Pfizer': 'PFE',
        'PepsiCo': 'PEP',
        'Netflix': 'NFLX',
        'Comcast': 'CMCSA',
        'Cisco': 'CSCO',
        'AbbVie': 'ABBV',
        'ExxonMobil': 'XOM',
        'Nike': 'NKE',
        'AT&T': 'T',
      };

      return companySymbols[companyName] || null;
    },
    prepareTableData(stockData) {
      const startDate = new Date(this.startDate);
      const endDate = new Date();

      const dates = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          dates.push({
            date: currentDate.toISOString().split('T')[0],
            day: currentDate.toLocaleDateString('en-US', { weekday: 'long' })
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const tableData = dates.map((dateObj, index) => {
        const row = { date: dateObj.date, day: dateObj.day };
        stockData.forEach(stock => {
          if (stock.data) {
            if (stock.data[dateObj.date]) {
              if (index === 0) {
                row[stock.name] = parseFloat(stock.data[dateObj.date]["4. close"]) * stock.allocation;
              } else {
                const previousDate = dates[index - 1].date;
                if (stock.data[previousDate]) {
                  const previousClose = parseFloat(stock.data[previousDate]["4. close"]);
                  const currentClose = parseFloat(stock.data[dateObj.date]["4. close"]);
                  const gain = (currentClose - previousClose) / previousClose;
                  row[stock.name] = (row[stock.name] || parseFloat(stock.data[dates[0].date]["4. close"]) * stock.allocation) * (1 + gain);
                } else {
                  row[stock.name] = 'N/A';
                }
              }
            } else {
              row[stock.name] = 'N/A';
            }
          } else {
            row[stock.name] = 'N/A';
          }
        });
        return row;
      });

      this.tableData = tableData;
    },
    prepareStockChartData(stockData) {
      const startDate = new Date(this.startDate);
      const endDate = new Date();

      const dates = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          dates.push(currentDate.toISOString().split('T')[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const stockChartData = stockData.map(stock => {
        const data = dates.map(date => {
          return {
            x: date,
            y: stock.data[date] ? parseFloat(stock.data[date]["4. close"]) * stock.allocation : null
          };
        });
        return {
          name: stock.name,
          chartData: {
            labels: dates,
            datasets: [
              {
                label: stock.name,
                data: data,
                fill: false,
                borderColor: this.getRandomColor(),
                backgroundColor: this.getRandomColor(),
                tension: 0.1
              }
            ]
          },
          chartVisible: false
        };
      });

      this.stockChartData = stockChartData;
    },
    preparePortfolioChartData(stockData) {
      const startDate = new Date(this.startDate);
      const endDate = new Date();

      const dates = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          dates.push(currentDate.toISOString().split('T')[0]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const portfolioData = dates.map(date => {
        let totalValue = 0;
        stockData.forEach(stock => {
          if (stock.data[date]) {
            totalValue += parseFloat(stock.data[date]["4. close"]) * stock.allocation;
          }
        });
        return {
          x: date,
          y: totalValue
        };
      });

      this.portfolioChartData = {
        labels: dates,
        datasets: [
          {
            label: 'Total Portfolio Value',
            data: portfolioData,
            fill: false,
            borderColor: '#3e95cd',
            backgroundColor: '#3e95cd',
            tension: 0.1
          }
        ]
      };
    },
    toggleStockChart(stockName) {
      const stockData = this.stockChartData.find(stock => stock.name === stockName);
      if (stockData) {
        stockData.chartVisible = !stockData.chartVisible;
      }
    },
    getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },
    formatDate(date) {
      return date.toLocaleString();
    }
  }
};
</script>


<style scoped>
.portfolio-simulation {
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
  position: relative;
  width: 100%;
  margin: 0 auto;
}

.logo {
  height: auto;
  width: 150px;
  display: block;
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

.portfolio-selection {
  margin-bottom: 2em;
}

.portfolio-selection label {
  margin-right: 1em;
  font-size: 1.2em;
  color: #333;
}

.date-picker {
  margin: 1em 0;
}

button {
  background-color: #102454;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 1em;
}

button:hover {
  background-color: #0d1b3f;
}

.simulation-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
}

.table-container {
  width: 45%;
  overflow-x: auto;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  padding: 1em;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

th, td {
  border: 1px solid #ddd;
  padding: 0.75em;
  text-align: center;
  font-size: 1em;
}

th {
  background-color: #102454;
  color: white;
  position: sticky;
  top: 0;
}

td {
  background-color: #f9f9f9;
  color: #333;
  font-weight: bold;
}

tr:nth-child(even) td {
  background-color: #f2f2f2;
}

tr:hover td {
  background-color: #e0e0e0;
}

tr:hover td:first-child {
  border-left: 3px solid #102454;
}

.charts-container {
  width: 50%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}

.toggle-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  margin-bottom: 1em;
}

.toggle-buttons button {
  background-color: #ddd;
  color: #333;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.toggle-buttons button.active {
  background-color: #102454;
  color: #fff;
}

.toggle-buttons button:hover {
  background-color: #ccc;
}

.portfolio-chart {
  width: 100%;
  margin-top: 2em;
}
</style>


