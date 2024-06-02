<template>
    <div class="portfolio-display">
      <header class="header">
        <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
        <nav class="header-links">
          <router-link to="/portfolio-creation" class="nav-link">Portfolio Creation</router-link>
          <button @click="refreshData" class="refresh-button">Refresh Data</button>
        </nav>
      </header>
      <main class="main-content">
        <div class="user-selection">
          <label for="user-select">Select User:</label>
          <select id="user-select" v-model="selectedUser" @change="loadUserPortfolio">
            <option v-for="user in users" :key="user.id" :value="user">{{ user.firstName }} {{ user.lastName }}</option>
          </select>
        </div>
        <div v-if="loading">
          <p>Loading...</p>
          <progress :value="loadingProgress" max="100"></progress>
        </div>
        <div v-else-if="!portfolio">No portfolio found.</div>
        <div v-else>
          <div class="portfolio-summary">
            <div class="portfolio-summary-card">
              <h2>Portfolio Summary</h2>
              <p>Original Total Value: £{{ roundedValue(originalValue) }}</p>
              <p>Current Value: £{{ roundedValue(currentValue) }}</p>
              <p>Percentage Gain/Loss: {{ roundedValue(percentageGainLoss) }}%</p>
              <p>Best Performing Stock: {{ bestPerformingStock.name }} ({{ roundedValue(bestPerformingStock.percentageChange) }}%)</p>
              <p>Worst Performing Stock: {{ worstPerformingStock.name }} ({{ roundedValue(worstPerformingStock.percentageChange) }}%)</p>
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
                  <template v-for="company in filteredCompanies" :key="company.name">
                    <tr @click="toggleStock(company.name)">
                      <td>{{ company.name }}</td>
                      <td>£{{ roundedValue(company.allocation) }}</td>
                      <td>£{{ roundedValue(company.currentValue || company.allocation) }}</td>
                    </tr>
                    <tr v-if="expandedStock === company.symbol" class="expanded-row">
                      <td colspan="3">
                        <line-chart ref="lineChart" :chart-data="chartData" v-if="chartData && expandedStock === company.symbol"></line-chart>
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
  import { getFirestore, doc, getDocs, collection, query, orderBy, getDoc, setDoc } from "firebase/firestore";
  import { format } from 'date-fns';
  import LineChart from './components/LineChart.vue';
  import PieChart from './components/PieChart.vue';
  
  export default {
    name: 'AdminPortfolioDisplay',
    components: {
      LineChart,
      PieChart
    },
    data() {
      return {
        portfolio: null,
        portfolioHistory: [],
        loading: true,
        loadingProgress: 0,
        portfolioChartData: null,
        pieChartData: null,
        chartData: null,
        expandedStock: null,
        selectedUser: null,
        users: [],
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
              position: 'center',
            },
          },
        },
      };
    },
    async created() {
      await this.fetchUsers();
    },
    computed: {
      originalValue() {
        return this.portfolio ? this.portfolio.companies.reduce((sum, company) => sum + company.allocation, 0) : 0;
      },
      currentValue() {
        return this.portfolioHistory.length ? this.portfolioHistory[this.portfolioHistory.length - 1].totalAllocation : 0;
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
      filteredCompanies() {
        return this.portfolio ? this.portfolio.companies.filter(company => company.allocation > 0) : [];
      }
    },
    methods: {
      roundedValue(value) {
        return parseFloat(value).toFixed(2);
      },
      async fetchUsers() {
        const db = getFirestore();
        const usersCollection = collection(db, 'Users');
        const usersSnapshot = await getDocs(usersCollection);
        this.users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      },
      async loadUserPortfolio() {
        if (this.selectedUser) {
          await this.setupCacheKey(this.selectedUser.id);
          const cachedData = this.getCachedData();
          if (cachedData) {
            this.loadFromCache(cachedData);
          } else {
            await this.fetchAndProcessData(this.selectedUser.id);
          }
        }
      },
      async setupCacheKey(userId) {
        const today = format(new Date(), 'yyyy-MM-dd');
        this.cacheKey = `${userId}-${today}`;
      },
      getCachedData() {
        return JSON.parse(localStorage.getItem(this.cacheKey));
      },
      setCachedData(data) {
        localStorage.setItem(this.cacheKey, JSON.stringify(data));
      },
      loadFromCache(data) {
        this.portfolio = data.portfolio;
        this.portfolioHistory = data.portfolioHistory;
        this.portfolioChartData = data.portfolioChartData;
        this.pieChartData = data.pieChartData;
        this.loading = false;
      },
      async fetchAndProcessData(userId) {
        this.loading = true;
        await this.fetchPortfolio(userId);
        if (this.portfolio) {
          await this.initializeInitialPrices(userId);
          await this.fillMissingDates(userId);
          await this.fetchAllPortfolioDocs(userId);
          this.preparePortfolioChartData();
          this.preparePieChartData();
          this.updatePortfolioValues();
          this.setCachedData({
            portfolio: this.portfolio,
            portfolioHistory: this.portfolioHistory,
            portfolioChartData: this.portfolioChartData,
            pieChartData: this.pieChartData,
          });
        }
        this.loading = false;
      },
      async refreshData() {
      if (this.selectedUser) {
        localStorage.removeItem(this.cacheKey);
        await this.fetchAndProcessData(this.selectedUser.id);
      }
    },
    async fetchPortfolio(userId) {
      const db = getFirestore();
      const docRef = doc(db, userId, 'Stock Trading Platform', 'Portfolio', 'Initial Portfolio');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log('Fetched initial portfolio:', docSnap.data());
        this.portfolio = docSnap.data();
      }
    },
    async fetchAllPortfolioDocs(userId) {
      const db = getFirestore();
      const portfolioCollection = collection(db, userId, 'Stock Trading Platform', 'Portfolio');
      const portfolioQuery = query(portfolioCollection, orderBy('date', 'asc'));
      const querySnapshot = await getDocs(portfolioQuery);

      this.portfolioHistory = [];
      querySnapshot.forEach((doc) => {
        this.portfolioHistory.push(doc.data());
      });

      console.log('Fetched all portfolio documents:', this.portfolioHistory);
    },
    async fetchStockData(symbol) {
      const db = getFirestore();
      const docRef = doc(db, 'Stock Market Data', symbol);
      console.log('Fetching stock data for symbol:', symbol);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log('Fetched stock data:', docSnap.data());
      } else {
        console.error(`No stock data found for symbol: ${symbol}`);
      }
      return docSnap.exists() ? docSnap.data() : null;
    },
    async initializeInitialPrices(userId) {
      if (!this.portfolio.initialPrices) {
        console.log("Initializing initial prices...");
        const initialPrices = [];

        const stockDataPromises = this.portfolio.companies.map(company => {
          const companyInfo = this.companies.find(c => c.name === company.name);
          return this.fetchStockData(companyInfo.symbol);
        });

        const stockDataArray = await Promise.all(stockDataPromises);

        stockDataArray.forEach((stockData, index) => {
          if (stockData && stockData.data['Time Series (Daily)']) {
            const initialDate = format(new Date(this.portfolio.date.seconds * 1000), 'yyyy-MM-dd');
            const dailyData = stockData.data['Time Series (Daily)'][initialDate];
            if (dailyData && dailyData['4. close']) {
              const initialClosePrice = parseFloat(dailyData['4. close']);
              initialPrices[index] = initialClosePrice;
            } else {
              initialPrices[index] = this.portfolio.companies[index].allocation; // Fallback in case stock data is unavailable
            }
          } else {
            initialPrices[index] = this.portfolio.companies[index].allocation; // Fallback in case stock data is unavailable
          }
        });

        this.portfolio.initialPrices = initialPrices;

        const db = getFirestore();
        const docRef = doc(db, userId, 'Stock Trading Platform', 'Portfolio', 'Initial Portfolio');
        await setDoc(docRef, this.portfolio);
        console.log('Updated portfolio with initial prices:', this.portfolio);
      }
    },
    async fillMissingDates(userId) {
      console.log("Fill Missing Dates Called");
      if (!this.portfolio || !this.portfolio.initialPrices) {
        console.error("Initial prices not found in the portfolio");
        return;
      }

      const initialDate = new Date(this.portfolio.date.seconds * 1000);
      const today = new Date();
      let currentDate = new Date(initialDate);
      const totalDays = (today - initialDate) / (1000 * 60 * 60 * 24);
      let processedDays = 0;

      const db = getFirestore();

      while (currentDate <= today) {
        const formattedDate = format(currentDate, 'yyyy-MM-dd');
        const docRef = doc(db, userId, 'Stock Trading Platform', 'Portfolio', `${formattedDate} Portfolio`);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          console.log(`No portfolio data for ${formattedDate}, creating new entry.`);
          const stockDataPromises = this.portfolio.companies.map(company => {
            const companyInfo = this.companies.find(c => c.name === company.name);
            return this.fetchStockData(companyInfo.symbol);
          });
          const stockDataArray = await Promise.all(stockDataPromises);
          console.log(`Stock Data Array: ${stockDataArray}`);

          const updatedCompanies = this.portfolio.companies.map((company, index) => {
            const stockData = stockDataArray[index];
            console.log(`Stock Data Index: ${stockData}`);
            let currentValue = company.allocation;
            if (stockData && stockData.data['Time Series (Daily)'] && stockData.data['Time Series (Daily)'][formattedDate]) {
              console.log("If statement called");
              const closePrice = parseFloat(stockData.data['Time Series (Daily)'][formattedDate]['4. close']);
              console.log(`Close Price for ${company.name} for ${formattedDate}: ${closePrice}`);
              currentValue = (company.allocation / this.portfolio.initialPrices[index]) * closePrice;
              console.log(`Current Value: ${currentValue}`);
              console.log(`For ${company.name}, on ${formattedDate}: closePrice = ${closePrice}, currentValue = ${currentValue}`);
            } else if (stockData && stockData.data['Time Series (Daily)']) {
              console.log("else if statement called");
              const lastAvailableDate = Object.keys(stockData.data['Time Series (Daily)']).reduce((a, b) => new Date(a) > new Date(b) ? a : b);
              const lastClosePrice = parseFloat(stockData.data['Time Series (Daily)'][lastAvailableDate]['4. close']);
              currentValue = (company.allocation / this.portfolio.initialPrices[index]) * lastClosePrice;
              console.log(`For ${company.name}, using last available data on ${lastAvailableDate}: lastClosePrice = ${lastClosePrice}, currentValue = ${currentValue}`);
            }

            if (isNaN(currentValue)) {
            currentValue = 0;
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

          console.log('Updated portfolio for', formattedDate, updatedPortfolio);
          await setDoc(docRef, updatedPortfolio);
        }

        processedDays++;
        this.loadingProgress = Math.round((processedDays / totalDays) * 100);

        currentDate.setDate(currentDate.getDate() + 1);
      }
    },
    preparePortfolioChartData() {
      if (!this.portfolioHistory) return;

      const dates = [];
      const values = [];

      this.portfolioHistory.forEach(portfolio => {
        const formattedDate = format(new Date(portfolio.date.seconds * 1000), 'yyyy-MM-dd');
        dates.push(formattedDate);
        values.push(parseFloat(portfolio.totalAllocation).toFixed(2));
      });

      this.portfolioChartData = {
        labels: dates,
        datasets: [
          {
            label: 'Total Portfolio Value',
            data: values,
            fill: true,
            borderColor: '#3e95cd',
            backgroundColor: 'rgba(62, 149, 205, 0.2)',
            tension: 0.1
          }
        ]
      };
    },
    preparePieChartData() {
      console.log('Prepare Pie Chart Data Called');
      if (!this.portfolio) return;

      const labels = this.portfolio.companies.map(company => company.name);
      console.log(`Pie Chart Labels Made: ${labels}`);
      const data = this.portfolio.companies.map(company => parseFloat(company.currentValue || company.allocation).toFixed(2));
      console.log(`Pie Chart Data Made: ${data}`);

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
      console.log(`This pie chart data: ${JSON.stringify(this.pieChartData)}`);
    },
    async updatePortfolioValues() {
      if (!this.portfolioHistory.length) return;
      const latestPortfolio = this.portfolioHistory[this.portfolioHistory.length - 1];
      this.portfolio.companies = latestPortfolio.companies;
    },
    async toggleStock(companyName) {
      const company = this.companies.find(c => c.name === companyName);
      if (!company) return;
      const symbol = company.symbol;
      if (this.expandedStock === symbol) {
        this.expandedStock = null;
        this.chartData = null;
      } else {
        this.expandedStock = symbol;
        const stockData = await this.fetchStockData(symbol);
        if (stockData && stockData.data['Time Series (Daily)']) {
          this.chartData = this.prepareChartData(stockData.data['Time Series (Daily)']);
          console.log(`Expanded Stock is: ${this.expandedStock}`);
          console.log('Chart data prepared for', symbol, this.chartData);
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
        data.push(parseFloat(timeSeries[date]['4. close']).toFixed(2));
      }
      labels.sort(); // Ensure dates are sorted in ascending order
      return {
        labels,
        datasets: [
          {
            label: 'Stock Price',
            data,
            fill: true,
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
        colors.push(`#${Math.floor(Math.random() * 16777215).toString(16)}`);
      }
      return colors;
    }
  }
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

.refresh-button {
  background-color: #007bff;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.refresh-button:hover {
  background-color: #0056b3;
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

.user-selection {
  margin-bottom: 1em;
  text-align: center;
}

.user-selection label {
  font-size: 1.2em;
  color: #102454;
  margin-right: 0.5em;
}

.user-selection select {
  padding: 0.5em;
  font-size: 1em;
  border: 1px solid #ccc;
  border-radius: 5px;
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
  width: 40%;
}
.portfolio-table-card {
  width: 60%;
  margin-right: 5%;
}

.pie-chart {
  width: 50%;
  height: 10%;
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


  