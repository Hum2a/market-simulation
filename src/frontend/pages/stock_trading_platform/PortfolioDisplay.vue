<template>
  <div class="portfolio-display">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/portfolio-creation" class="nav-link">Portfolio Creation</router-link>
      </nav>
    </header>
    <main class="main-content">
      <div v-if="loading">Loading...</div>
      <div v-else-if="!portfolio">No portfolio found.</div>
      <div v-else>
        <div class="portfolio-summary">
          <div class="portfolio-summary-card">
            <h2>Portfolio Summary</h2>
            <p>Original Total Value: £{{ originalValue }}</p>
            <p>Current Value: £{{ currentValue }}</p>
            <p>Percentage Gain/Loss: {{ percentageGainLoss }}%</p>
            <p>Best Performing Stock: {{ bestPerformingStock.name }} ({{ bestPerformingStock.percentageChange }}%)</p>
            <p>Worst Performing Stock: {{ worstPerformingStock.name }} ({{ worstPerformingStock.percentageChange }}%)</p>
          </div>
          <div class="portfolio-graph-card">
            <h2>Portfolio Value Over Time</h2>
            <line-chart v-if="portfolioChartData" :chart-data="portfolioChartData" :chart-options="chartOptions"></line-chart>
          </div>
        </div>
        <div class="portfolio-details">
          <div class="portfolio-pie-card">
            <h2>Portfolio Distribution</h2>
            <pie-chart v-if="pieChartData" :chart-data="pieChartData" :chart-options="pieChartOptions" class="pie-chart"></pie-chart>
          </div>
          <div class="portfolio-table-card">
            <h2>Portfolio Details</h2>
            <table class="portfolio-table">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Original Value</th>
                  <th>Current Value</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="company in portfolio.companies" :key="company.name">
                  <tr @click="toggleStock(company.symbol)">
                    <td>{{ company.name }}</td>
                    <td>£{{ company.allocation }}</td>
                    <td>£{{ company.currentValue || company.allocation }}</td>
                  </tr>
                  <tr v-if="expandedStock === company.symbol" class="expanded-row">
                    <td colspan="3">
                      <line-chart :chart-data="chartData" v-if="chartData && expandedStock === company.symbol"></line-chart>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { format } from 'date-fns';
import LineChart from './components/LineChart.vue';
import PieChart from './components/PieChart.vue';

export default {
  name: 'PortfolioDisplay',
  components: {
    LineChart,
    PieChart
  },
  data() {
    return {
      portfolio: null,
      loading: true,
      portfolioChartData: null,
      pieChartData: null,
      chartData: null,
      expandedStock: null,
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
      pieChartOptions: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
      },
    };
  },
  async created() {
    await this.fetchPortfolio();
    if (this.portfolio) {
      await this.fillMissingDates();
      this.preparePortfolioChartData();
      this.preparePieChartData();
    }
  },
  computed: {
    originalValue() {
      return this.portfolio ? this.portfolio.companies.reduce((sum, company) => sum + company.allocation, 0) : 0;
    },
    currentValue() {
      return this.portfolio ? this.portfolio.companies.reduce((sum, company) => sum + (company.currentValue || company.allocation), 0) : 0;
    },
    percentageGainLoss() {
      if (!this.portfolio) return 0;
      return ((this.currentValue - this.originalValue) / this.originalValue * 100).toFixed(2);
    },
    bestPerformingStock() {
      if (!this.portfolio) return { name: 'N/A', percentageChange: 0 };
      return this.portfolio.companies.reduce((best, company) => {
        const change = ((company.currentValue || company.allocation) - company.allocation) / company.allocation * 100;
        return change > best.percentageChange ? { name: company.name, percentageChange: change.toFixed(2) } : best;
      }, { name: 'N/A', percentageChange: -Infinity });
    },
    worstPerformingStock() {
      if (!this.portfolio) return { name: 'N/A', percentageChange: 0 };
      return this.portfolio.companies.reduce((worst, company) => {
        const change = ((company.currentValue || company.allocation) - company.allocation) / company.allocation * 100;
        return change < worst.percentageChange ? { name: company.name, percentageChange: change.toFixed(2) } : worst;
      }, { name: 'N/A', percentageChange: Infinity });
    },
  },
  methods: {
    async fetchPortfolio() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const docRef = doc(db, user.uid, 'Stock Trading Platform', 'Portfolio', 'Initial Portfolio');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          this.portfolio = docSnap.data();
        }

        this.loading = false;
      } else {
        console.error("User is not logged in");
        this.loading = false;
      }
    },
    async fetchStockData(symbol) {
      const db = getFirestore();
      const docRef = doc(db, 'Stock Market Data', symbol);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    },
    async fillMissingDates() {
      if (!this.portfolio) return;

      const initialDate = new Date(this.portfolio.date.seconds * 1000);
      const today = new Date();
      let currentDate = new Date(initialDate);

      const db = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;

      console.log('Initial Portfolio Date:', initialDate);
      console.log('Today:', today);

      while (currentDate <= today) {
        const formattedDate = format(currentDate, 'yyyy-MM-dd');
        console.log('Processing date:', formattedDate);

        const docRef = doc(db, user.uid, 'Stock Trading Platform', 'Portfolio', `${formattedDate} Portfolio`);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          const stockDataPromises = this.portfolio.companies.map(company => this.fetchStockData(company.symbol));
          const stockDataArray = await Promise.all(stockDataPromises);

          console.log('Stock data fetched for date:', formattedDate);
          console.log(stockDataArray);

          const updatedCompanies = this.portfolio.companies.map((company, index) => {
            const stockData = stockDataArray[index];
            let currentValue = company.allocation;

            if (stockData && stockData['Time Series (Daily)'] && stockData['Time Series (Daily)'][formattedDate]) {
              const closePrice = parseFloat(stockData['Time Series (Daily)'][formattedDate]['4. close']);
              currentValue = (company.allocation / this.portfolio.initialPrices[index]) * closePrice;
              console.log(`Stock ${company.symbol} updated value for ${formattedDate}:`, currentValue);
            } else if (stockData && stockData['Time Series (Daily)']) {
              // If there's no data for the current date, use the last available close price
              const lastAvailableDate = Object.keys(stockData['Time Series (Daily)']).reduce((a, b) => new Date(a) > new Date(b) ? a : b);
              const lastClosePrice = parseFloat(stockData['Time Series (Daily)'][lastAvailableDate]['4. close']);
              currentValue = (company.allocation / this.portfolio.initialPrices[index]) * lastClosePrice;
              console.log(`Stock ${company.symbol} updated value using last available price for ${formattedDate}:`, currentValue);
            } else {
              console.warn(`No stock data available for ${company.symbol} on ${formattedDate}`);
            }

            return {
              ...company,
              currentValue,
            };
          });

          const updatedPortfolio = {
            ...this.portfolio,
            date: currentDate,
            companies: updatedCompanies,
            totalAllocation: updatedCompanies.reduce((sum, company) => sum + company.currentValue, 0),
          };

          console.log('Updated Portfolio for', formattedDate, updatedPortfolio);

          await setDoc(docRef, updatedPortfolio);
        } else {
          console.log(`Portfolio already exists for ${formattedDate}`);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    },
    preparePortfolioChartData() {
      if (!this.portfolio) return;

      const initialDate = new Date(this.portfolio.date.seconds * 1000);
      const today = new Date();
      let currentDate = new Date(initialDate);

      const dates = [];
      const values = [];

      while (currentDate <= today) {
        const formattedDate = format(currentDate, 'yyyy-MM-dd');
        const dailyValue = this.portfolio.companies.reduce((sum, company) => {
          const stockData = company.stockData;
          if (stockData && stockData[formattedDate]) {
            const closePrice = parseFloat(stockData[formattedDate]['4. close']);
            return sum + (company.allocation / company.allocation) * closePrice;
          }
          return sum + company.allocation;
        }, 0);

        dates.push(formattedDate);
        values.push(dailyValue);

        currentDate.setDate(currentDate.getDate() + 1);
      }

      this.portfolioChartData = {
        labels: dates,
        datasets: [
          {
            label: 'Total Portfolio Value',
            data: values,
            fill: false,
            borderColor: '#3e95cd',
            backgroundColor: '#3e95cd',
            tension: 0.1
          }
        ]
      };
    },
    preparePieChartData() {
      if (!this.portfolio) return;

      const labels = this.portfolio.companies.map(company => company.name);
      const data = this.portfolio.companies.map(company => company.currentValue || company.allocation);

      this.pieChartData = {
        labels,
        datasets: [
          {
            label: 'Stock Distribution',
            data,
            backgroundColor: this.getRandomColors(labels.length),
          },
        ],
      };
    },
    async toggleStock(symbol) {
      if (this.expandedStock === symbol) {
        this.expandedStock = null;
        this.chartData = null;
      } else {
        this.expandedStock = symbol;
        const stockData = await this.fetchStockData(symbol);
        if (stockData && stockData['Time Series (Daily)']) {
          this.chartData = this.prepareChartData(stockData['Time Series (Daily)']);
        } else {
          console.error(`No Time Series (Daily) data found for ${symbol}`);
        }
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
    },
    getRandomColors(numColors) {
      const colors = [];
      for (let i = 0; i < numColors; i++) {
        colors.push(`#${Math.floor(Math.random().toFixed(16) * 16777215).toString(16)}`);
      }
      return colors;
    },
  },
};
</script>

<style scoped>
.portfolio-display {
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
  margin: 0 auto;
}

.logo {
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
  margin: 2em auto;
  text-align: center;
  padding: 1em;
  display: flex;
  flex-direction: column;
  gap: 2em;
}

.portfolio-summary {
  display: flex;
  gap: 2em;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}

.portfolio-summary-card, .portfolio-graph-card, .portfolio-pie-card, .portfolio-table-card {
  background: #fff;
  padding: 1em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: left;
}

.portfolio-summary-card h2, .portfolio-graph-card h2, .portfolio-pie-card h2, .portfolio-table-card h2 {
  color: #102454;
  margin-bottom: 1em;
}

.portfolio-summary-card p {
  color: #333;
  margin-bottom: 0.5em;
}

.portfolio-graph-card {
  width: 60%;
}

.portfolio-details {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 2em;
}

.portfolio-pie-card, .portfolio-table-card {
  flex: 1;
}

.portfolio-pie-card {
  width: 15%;
}
.portfolio-table-card {
  width: 40%;
}

.pie-chart {
  width: 100%;
  height: 300px;
}

.portfolio-table {
  width: 100%;
  border-collapse: collapse;
}

.portfolio-table th, .portfolio-table td {
  border: 1px solid #ddd;
  padding: 0.75em;
  text-align: left;
}

.portfolio-table th {
  background-color: #102454;
  color: white;
}

.portfolio-table td {
  background-color: #f9f9f9;
  color: #333;
}

.portfolio-table tr:nth-child(even) td {
  background-color: #f2f2f2;
}

.expanded-row {
  background-color: #f0f2f5;
}
</style>
