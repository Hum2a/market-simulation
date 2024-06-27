<template>
  <div class="portfolio-display">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/stock-trading-select" class="nav-link">Stock Trading Tool</router-link>
        <button @click="refreshData" class="refresh-button">Refresh Data</button>
      </nav>
    </header>
    <main class="main-content">
      <div class="wallet-card" v-if="totalFunds !== null">
        Wallet = £{{ totalFunds }}
      </div>
      <div class="streak-div">
        <div class="streak-card" v-if="loginStreak !== null">
          <h2>Login Streak</h2>
          <p>{{ loginStreak }} {{ loginStreak === 1 ? 'day' : 'days' }}</p>
        </div>
      </div>
      <div class="request-counter-card">
        Firestore Requests: {{ firestoreRequestCount }}
      </div>
      <div v-if="loading">
        <p>Loading...</p>
        <progress :value="loadingProgress" max="100"></progress>
      </div>
      <div v-else-if="!portfolio">No portfolio found.</div>
      <div v-else>
        <div class="portfolio-summary">
          <div class="summary-leaderboard">
            <div class="portfolio-summary-card">
              <h2>Portfolio Summary</h2>
              <p>Amount Invested: £{{ roundedValue(originalValue) }}</p>
              <p>Current Value: £{{ roundedValue(currentValue) }}</p>
              <p>Percentage Gain/Loss: {{ roundedValue(percentageGainLoss) }}%</p>
              <p>Best Performing Stock: {{ bestPerformingStock.name }} ({{ roundedValue(bestPerformingStock.percentageChange) }}%)</p>
              <p>Worst Performing Stock: {{ worstPerformingStock.name }} ({{ roundedValue(worstPerformingStock.percentageChange) }}%)</p>
              <p>Time Invested: {{ timeInvested }} days</p>
            </div>
            <portfolio-leaderboard />
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
                  <th>Initial Stock Price</th>
                  <th>Current Value</th>
                  <th>Current Stock Price (Real Time)</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="company in filteredCompanies" :key="company.name">
                  <tr @click="toggleStock(company)">
                    <td>{{ company.name }}</td>
                    <td>£{{ roundedValue(company.allocation) }}</td>
                    <td>${{ company.initialStockPrice }}</td>
                    <td>£{{ roundedValue(company.currentValue || 0) }}</td>
                    <td>${{ roundedValue(company.currentStockPrice) }}</td>
                  </tr>
                  <tr v-if="expandedStock === company.symbol" class="expanded-row">
                    <td colspan="5">
                      <line-chart ref="lineChart" :chart-data="officialChartData" v-if="officialChartData && expandedStock === company.symbol"></line-chart>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
        <div class="additional-info">
          <div class="notice-board-card">
            <h2>Notice Board</h2>
            <div class="sticky-notes">
              <li v-for="note in stickyNotes" :key="note.id" class="sticky-note">
                <h3>{{ note.title }}</h3>
                <p>{{ note.content }}</p>
                <p v-if="note.date">Date: {{ formatDate(note.date) }}</p>
                <a v-if="note.links" :href="note.links" target="_blank">{{ note.linkName || note.links }}</a>
              </li>
            </div>
          </div>
          <router-link to="/basics-of-financial-literacy" class="financial-courses-card">
            <div class="card-content">
              <h3>Basics of Financial Literacy</h3>
              <p>15 minutes</p>
              <p>Gain £300</p>
            </div>
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { getFirestore, doc, getDocs, collection, query, orderBy, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { format, differenceInDays } from 'date-fns';
import LineChart from './components/LineChart.vue';
import PieChart from './components/PieChart.vue';
import PortfolioLeaderboard from './PortfolioLeaderboard.vue';

export default {
  name: 'PortfolioDisplay',
  components: {
    LineChart,
    PieChart,
    PortfolioLeaderboard,
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
      officialChartData: null,
      expandedStock: null,
      cacheKey: '',
      stickyNotes: [],
      totalFunds: null,
      firestoreRequestCount: 0, // Counter for Firestore requests
      loginStreak: null, // Added data property for login streak
      companies: [
        { name: 'Amazon', symbol: 'AMZN', allocation: 0, initialStockPrice: 0 },
        { name: 'Apple', symbol: 'AAPL', allocation: 0, initialStockPrice: 0 },
        { name: 'Boeing', symbol: 'BA', allocation: 0, initialStockPrice: 0 },
        { name: 'Coca-Cola', symbol: 'KO', allocation: 0, initialStockPrice: 0 },
        { name: 'Disney', symbol: 'DIS', allocation: 0, initialStockPrice: 0 },
        { name: 'Google', symbol: 'GOOGL', allocation: 0, initialStockPrice: 0 },
        { name: 'Microsoft', symbol: 'MSFT', allocation: 0, initialStockPrice: 0 },
        { name: 'Nike', symbol: 'NKE', allocation: 0, initialStockPrice: 0 },
        { name: 'NVIDIA', symbol: 'NVDA', allocation: 0, initialStockPrice: 0 },
        { name: 'PayPal', symbol: 'PYPL', allocation: 0, initialStockPrice: 0 },
        { name: 'Pfizer', symbol: 'PFE', allocation: 0, initialStockPrice: 0 },
        { name: 'Roblox', symbol: 'RBLX', allocation: 0, initialStockPrice: 0 },
        { name: 'Shell', symbol: 'SHEL', allocation: 0, initialStockPrice: 0 },
        { name: 'Spotify', symbol: 'SPOT', allocation: 0, initialStockPrice: 0 },
        { name: 'Tesla', symbol: 'TSLA', allocation: 0, initialStockPrice: 0 },
        { name: 'Visa', symbol: 'V', allocation: 0, initialStockPrice: 0 },
        { name: 'Walmart', symbol: 'WMT', allocation: 0, initialStockPrice: 0 }
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
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      this.$router.push('/stock-trading-select');
      return;
    }
    await this.setupCacheKey();
    const cachedData = this.getCachedData();
    if (cachedData) {
      this.loadFromCache(cachedData);
    } else {
      await this.fetchAndProcessData();
    }
    await this.updateStockPrices();
    await this.fetchStickyNotes();
    await this.fetchTotalFunds();
    await this.fetchLoginStreak(); // Fetch login streak
    this.adjustStickyNotesHeight();
  },
  computed: {
    originalValue() {
      return this.portfolio ? this.portfolio.companies.filter(c => c.invested).reduce((sum, company) => sum + company.allocation, 0) : 0;
    },
    currentValue() {
      return this.portfolioHistory.length ? this.portfolioHistory[this.portfolioHistory.length - 1].companies.filter(c => c.invested).reduce((sum, company) => sum + (company.currentValue || 0), 0) : 0;
    },
    percentageGainLoss() {
      if (!this.portfolio) return 0;
      const original = this.originalValue;
      const current = this.currentValue;
      return original ? ((current - original) / original * 100).toFixed(2) : 0;
    },
    bestPerformingStock() {
      if (!this.portfolio) return { name: 'N/A', percentageChange: 0 };
      return this.portfolio.companies.filter(c => c.invested).reduce((best, company) => {
        const allocation = company.allocation || 1; // Avoid division by zero
        const change = ((company.currentValue || 0) - allocation) / allocation * 100;
        return change > best.percentageChange ? { name: company.name, percentageChange: change.toFixed(2) } : best;
      }, { name: 'N/A', percentageChange: -Infinity });
    },
    worstPerformingStock() {
      if (!this.portfolio) return { name: 'N/A', percentageChange: 0 };
      return this.portfolio.companies.filter(c => c.invested).reduce((worst, company) => {
        if (company.allocation === 0) return worst; // Skip companies with zero initial allocation
        const allocation = company.allocation || 1; // Avoid division by zero
        const change = ((company.currentValue || 0) - allocation) / allocation * 100;
        return change < worst.percentageChange ? { name: company.name, percentageChange: change.toFixed(2) } : worst;
      }, { name: 'N/A', percentageChange: Infinity });
    },
    filteredCompanies() {
      return this.portfolio ? this.portfolio.companies.filter(company => company.allocation > 0 && company.invested) : [];
    },
    timeInvested() {
      if (!this.portfolio || !this.portfolioHistory.length) return 0;
      const initialDate = new Date(this.portfolio.date.seconds * 1000);
      const latestDate = new Date(this.portfolioHistory[this.portfolioHistory.length - 1].date.seconds * 1000);
      return differenceInDays(latestDate, initialDate);
    }
  },
  methods: {
    async fetchExchangeRate() {
      const db = getFirestore();
      const docRef = doc(db, 'Currency Rates', 'USD-GBP');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().rate;
      }
      return 1; // Default to 1 if the rate is not found
    },
    async fetchLoginStreak() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const streakRef = doc(db, user.uid, 'Login Streak');
        const streakSnap = await getDoc(streakRef);
        if (streakSnap.exists()) {
          const streakData = streakSnap.data();
          this.loginStreak = streakData.streak || 0;
        } else {
          this.loginStreak = 0;
        }
      }
    },
    incrementRequestCount() {
      this.firestoreRequestCount++;
    },
    roundedValue(value) {
      return isNaN(value) ? '0.00' : parseFloat(value).toFixed(2);
    },
    async setupCacheKey() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const today = format(new Date(), 'yyyy-MM-dd');
        this.cacheKey = `${user.uid}-${today}`;
      }
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
    async fetchAndProcessData() {
      this.loading = true;
      await this.fetchPortfolio();
      if (this.portfolio) {
        await this.initializeData();
        await this.fillMissingDates();
        await this.fetchAllPortfolioDocs();
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
      localStorage.removeItem(this.cacheKey);
      await this.fetchAndProcessData();
      await this.updateStockPrices();
    },
    async fetchPortfolio() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const docRef = doc(db, user.uid, 'Stock Trading Platform', 'Portfolio', 'Initial Portfolio');
        this.incrementRequestCount();
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log('Fetched initial portfolio:', docSnap.data());
          this.portfolio = docSnap.data();
        }
      } else {
        console.error("User is not logged in");
      }
    },
    async initializeData() {
      if (this.portfolio && this.portfolio.companies) {
        const stockDataPromises = this.portfolio.companies.map(company => {
          const companyInfo = this.companies.find(c => c.name === company.name);
          if (company.invested) {
            return this.fetchStockData(companyInfo.symbol);
          }
          return null;
        });

        const stockDataArray = await Promise.all(stockDataPromises);
        const exchangeRate = await this.fetchExchangeRate();

        this.portfolio.companies = this.portfolio.companies.map((company, index) => {
          const stockData = stockDataArray[index];
          if (stockData && stockData.data['Time Series (Daily)']) {
            const buyDate = new Date(this.portfolio.date.seconds * 1000);
            let formattedBuyDate = format(buyDate, 'yyyy-MM-dd');
            let buyDailyData = stockData.data['Time Series (Daily)'][formattedBuyDate];

            // If no data for formattedBuyDate, go back until data is found
            while (!buyDailyData && buyDate <= new Date(stockData.data['Meta Data']['3. Last Refreshed'])) {
              buyDate.setDate(buyDate.getDate() - 1);
              formattedBuyDate = format(buyDate, 'yyyy-MM-dd');
              buyDailyData = stockData.data['Time Series (Daily)'][formattedBuyDate];
            }

            if (buyDailyData) {
              company.initialStockPrice = parseFloat(buyDailyData['4. close']) * exchangeRate;
            } else {
              company.initialStockPrice = 0;
            }

          } else {
            company.initialStockPrice = 0;
          }
          return company;
        });
      }
    },
    async fetchAllPortfolioDocs() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const portfolioCollection = collection(db, user.uid, 'Stock Trading Platform', 'Portfolio');
        const portfolioQuery = query(portfolioCollection, orderBy('date', 'asc'));
        this.incrementRequestCount();
        const querySnapshot = await getDocs(portfolioQuery);

        this.portfolioHistory = [];
        querySnapshot.forEach((doc) => {
          if (doc.id !== 'Initial Portfolio') {
            this.portfolioHistory.push(doc.data());
          }
        });

        console.log('Fetched all portfolio documents:', this.portfolioHistory);
      } else {
        console.error("User is not logged in");
      }
    },
    async fetchStockData(symbol) {
      const db = getFirestore();
      const docRef = doc(db, 'Stock Market Data', symbol);
      this.incrementRequestCount();
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    },
    async fetchRealTimeStockData(symbol) {
      const db = getFirestore();
      const docRef = doc(db, 'Real Time Stock Market Data', symbol);
      this.incrementRequestCount();
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    },
    async updateStockPrices() {
      const exchangeRate = await this.fetchExchangeRate();
      const today = format(new Date(), 'yyyy-MM-dd');
      
      if (this.portfolio) {
        const stockDataPromises = this.portfolio.companies.map(async company => {
          if (company.invested) {
            const companyInfo = this.companies.find(c => c.name === company.name);
            const stockData = await this.fetchStockData(companyInfo.symbol); // Fetch data from Stock Market Data
            const realTimeData = await this.fetchRealTimeStockData(companyInfo.symbol); // Fetch data from Real Time Stock Market Data
            return { stockData, realTimeData };
          }
          return null;
        });

        const stockDataArray = await Promise.all(stockDataPromises);

        this.portfolio.companies = this.portfolio.companies.map((company, index) => {
          const data = stockDataArray[index];
          if (!data) {
            return company; // Skip if no data available
          }
          const { stockData, realTimeData } = data;
          let currentStockPrice = null;

          if (stockData && stockData.data['Time Series (Daily)']) {
            const dailyData = stockData.data['Time Series (Daily)'][today];
            if (dailyData) {
              currentStockPrice = parseFloat(dailyData['4. close']) * exchangeRate;
            }
          }

          if (!currentStockPrice && realTimeData && realTimeData.days) {
            const mostRecentDay = Object.keys(realTimeData.days).sort().pop();
            const mostRecentTime = Object.keys(realTimeData.days[mostRecentDay]).sort().pop();
            if (mostRecentDay === today) {
              currentStockPrice = realTimeData.days[mostRecentDay][mostRecentTime].currentPrice;
            }
          }

          if (!currentStockPrice) {
            currentStockPrice = (company.currentValue / company.allocation) * exchangeRate;
          }

          company.currentStockPrice = currentStockPrice;
          return company;
        });
      }
    },

    async fillMissingDates() {
      console.log("Fill Missing Dates Called");
      if (!this.portfolio) {
        console.error("Portfolio not found");
        return;
      }

      const initialDate = new Date(this.portfolio.date.seconds * 1000);
      const today = new Date();
      let currentDate = new Date(initialDate);
      const totalDays = (today - initialDate) / (1000 * 60 * 60 * 24);
      let processedDays = 0;

      const db = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;

      let previousDayValues = this.portfolio.companies.map(company => company.allocation); // Start with initial allocation

      while (currentDate <= today) {
        let formattedDate = format(currentDate, 'yyyy-MM-dd');
        console.log(`Processing date: ${formattedDate}`);
        const docRef = doc(db, user.uid, 'Stock Trading Platform', 'Portfolio', `${formattedDate} Portfolio`);
        this.incrementRequestCount();
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          console.log(`No portfolio data for ${formattedDate}, creating new entry.`);
          const stockDataPromises = this.portfolio.companies.map(async company => {
            if (company.invested) {
              const companyInfo = this.companies.find(c => c.name === company.name);
              const stockData = await this.fetchStockData(companyInfo.symbol);
              const realTimeData = await this.fetchRealTimeStockData(companyInfo.symbol);
              return { stockData, realTimeData };
            }
            return null;
          });
          const stockDataArray = await Promise.all(stockDataPromises);
          console.log(`Stock Data Array: ${JSON.stringify(stockDataArray)}`);
          const exchangeRate = await this.fetchExchangeRate();

          const updatedCompanies = this.portfolio.companies.map((company, index) => {
            if (!company.invested) {
              return company;
            }
            const data = stockDataArray[index];
            if (!data) {
              return company;
            }
            const { stockData, realTimeData } = data;
            console.log(`Stock Data for ${company.name}: ${JSON.stringify(stockData)}`);
            let currentValue = previousDayValues[index]; // Use the previous day's value as the starting point

            let previousDate = new Date(currentDate);
            previousDate.setDate(previousDate.getDate() - 1);
            let formattedPreviousDate = format(previousDate, 'yyyy-MM-dd');
            let previousClosePrice = null;

            while (!previousClosePrice && previousDate >= initialDate) {
              previousClosePrice = stockData?.data['Time Series (Daily)']?.[formattedPreviousDate]?.['4. close'];
              if (!previousClosePrice) {
                previousDate.setDate(previousDate.getDate() - 1);
                formattedPreviousDate = format(previousDate, 'yyyy-MM-dd');
              }
            }

            console.log(`Previous Close Price for ${company.name} on ${formattedPreviousDate}: ${previousClosePrice}`);

            let effectiveFormattedDate = formattedDate;
            let closePrice = stockData?.data['Time Series (Daily)']?.[formattedDate]?.['4. close'];

            if (!closePrice && realTimeData && realTimeData.days) {
              const mostRecentDay = Object.keys(realTimeData.days).sort().pop();
              const mostRecentTime = Object.keys(realTimeData.days[mostRecentDay]).sort().pop();
              if (mostRecentDay === formattedDate) {
                closePrice = realTimeData.days[mostRecentDay][mostRecentTime].currentPrice;
              }
            }

            if (!closePrice) {
              let closestPreviousDate = new Date(currentDate);
              effectiveFormattedDate = formattedDate;
              while (!closePrice && closestPreviousDate >= initialDate) {
                closestPreviousDate.setDate(closestPreviousDate.getDate() - 1);
                effectiveFormattedDate = format(closestPreviousDate, 'yyyy-MM-dd');
                closePrice = stockData?.data['Time Series (Daily)']?.[effectiveFormattedDate]?.['4. close'];
              }
            }

            if (previousClosePrice) {
              if (closePrice) {
                console.log(`Close Price for ${company.name} on ${effectiveFormattedDate}: ${closePrice}`);
                const percentageChange = (parseFloat(closePrice) - parseFloat(previousClosePrice)) / parseFloat(previousClosePrice);
                console.log(`Percentage Change for ${company.name} on ${effectiveFormattedDate}: ${percentageChange}`);
                currentValue = previousDayValues[index] * (1 + percentageChange);
                console.log(`New Current Value for ${company.name} on ${effectiveFormattedDate}: ${currentValue}`);
              } else {
                console.log(`No close price available for ${company.name} on ${effectiveFormattedDate}, using previous currentValue.`);
              }
            } else {
              console.log(`No previous close price available for ${company.name}, using previous currentValue.`);
            }

            return {
              ...company,
              currentValue: isNaN(currentValue) ? 0 : currentValue,
              currentStockPrice: (stockData?.data['Time Series (Daily)']?.[effectiveFormattedDate]?.['1. open'] || previousClosePrice) * exchangeRate
            };
          });

          previousDayValues = updatedCompanies.map(company => company.currentValue);

          const updatedPortfolio = {
            ...this.portfolio,
            date: currentDate,
            companies: updatedCompanies,
            totalAllocation: updatedCompanies.filter(c => c.invested).reduce((sum, company) => sum + company.currentValue, 0),
          };

          console.log('Updated portfolio for', formattedDate, updatedPortfolio);
          this.incrementRequestCount();
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
        values.push(parseFloat(portfolio.companies.filter(c => c.invested).reduce((sum, company) => sum + company.currentValue, 0)).toFixed(2));
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

      const labels = this.portfolio.companies.filter(c => c.invested).map(company => company.name);
      console.log(`Pie Chart Labels Made: ${labels}`);
      const data = this.portfolio.companies.filter(c => c.invested).map(company => parseFloat(company.currentValue || company.allocation).toFixed(2));
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
    async toggleStock(company) {
      const symbol = company.symbol;
      if (this.expandedStock === symbol) {
        this.expandedStock = null;
        this.chartData = null;
        this.officialChartData = null;
      } else {
        this.expandedStock = symbol;
        this.officialChartData = await this.prepareOfficialStockChartData(symbol);
      }
    },
    async prepareOfficialStockChartData(symbol) {
      const stockData = await this.fetchStockData(symbol);
      const realTimeData = await this.fetchRealTimeStockData(symbol); // Fetch real-time data
      const initialDate = format(new Date(this.portfolio.date.seconds * 1000), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');
      const exchangeRate = await this.fetchExchangeRate();

      if (stockData && stockData.data['Time Series (Daily)']) {
        const dates = [];
        const values = [];

        // Historical Data Handling
        let currentDate = new Date(initialDate);
        while (currentDate < new Date(today)) {
          let formattedDate = format(currentDate, 'yyyy-MM-dd');
          let dailyData = stockData.data['Time Series (Daily)'][formattedDate];

          // If no data for formattedDate, go back until data is found
          while (!dailyData && new Date(formattedDate) >= new Date(stockData.data['Meta Data']['3. Last Refreshed'])) {
            let date = new Date(formattedDate);
            date.setDate(date.getDate() - 1);
            formattedDate = format(date, 'yyyy-MM-dd');
            dailyData = stockData.data['Time Series (Daily)'][formattedDate];
          }

          if (dailyData && dailyData['1. open']) {
            dates.push(formattedDate);
            values.push((parseFloat(dailyData['1. open']) * exchangeRate).toFixed(2));
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Real-Time Data Handling for Today
        if (realTimeData && realTimeData.days) {
          const mostRecentDay = Object.keys(realTimeData.days).sort().pop();
          const mostRecentTime = Object.keys(realTimeData.days[mostRecentDay]).sort().pop();
          if (mostRecentDay === today) {
            const openPrice = realTimeData.days[mostRecentDay][mostRecentTime].openPrice;
            if (openPrice) {
              dates.push(today);
              values.push((openPrice * exchangeRate).toFixed(2));
            }
          }
        }

        // Remove duplicate dates if any
        const uniqueDates = [];
        const uniqueValues = [];
        dates.forEach((date, index) => {
          if (!uniqueDates.includes(date)) {
            uniqueDates.push(date);
            uniqueValues.push(values[index]);
          }
        });

        return {
          labels: uniqueDates,
          datasets: [
            {
              label: 'Official Stock Value',
              data: uniqueValues,
              fill: true,
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.1
            }
          ]
        };
      }
      return null;
    },



    getRandomColors(numColors) {
      const colors = [];
      for (let i = 0; i < numColors; i++) {
        colors.push(`#${Math.floor(Math.random() * 16777215).toString(16)}`);
      }
      return colors;
    },
    async fetchStickyNotes() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const notesCollection = collection(db, 'Sticky Notes');
        this.incrementRequestCount();
        const notesSnapshot = await getDocs(notesCollection);

        this.stickyNotes = notesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            content: data.content,
            date: data.date || null,
            links: data.links || null,
            linkName: data.linkName || null, // Added link name
            showForAllUsers: data.showForAllUsers,
            selectedUsers: data.selectedUsers || [],
            selectedStocks: data.selectedStocks || [],
            portfolioValueThreshold: data.portfolioValueThreshold || null,
          };
        }).filter(note => {
          return this.shouldShowNote(note);
        });
      } else {
        console.error("User is not logged in");
      }
      this.adjustStickyNotesHeight(); // Ensure the heights are adjusted after fetching notes
    },
    shouldShowNote(note) {
      if (note.showForAllUsers) {
        return true;
      }
      if (note.portfolioValueThreshold && this.currentValue > note.portfolioValueThreshold) {
        return true;
      }
      if (note.selectedStocks && note.selectedStocks.length) {
        const userStocks = this.portfolio ? this.portfolio.companies.filter(c => c.invested).map(company => company.symbol) : [];
        const hasMatchingStock = note.selectedStocks.some(stock => userStocks.includes(stock));
        if (hasMatchingStock) {
          return true;
        }
      }
      return false;
    },
    adjustStickyNotesHeight() {
      this.$nextTick(() => {
        const stickyNotes = this.$el.querySelectorAll('.sticky-note');
        stickyNotes.forEach(note => {
          const contentHeight = note.scrollHeight;
          note.style.height = `${contentHeight + 20}px`; // Add some padding
        });
      });
    },
    formatDate(date) {
      return date ? format(new Date(date.seconds * 1000), 'PP') : '';
    },
    async fetchTotalFunds() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const docRef = doc(db, user.uid, 'Total Funds');
        this.incrementRequestCount();
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          this.totalFunds = docSnap.data().totalFunds;
        } else {
          console.error("No such document for Total Funds!");
        }
      } else {
        console.error("User is not logged in");
      }
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
  position: relative;
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

.wallet-card {
  top: 1em;
  left: 1em;
  background: #ffffff;
  padding: 0.5em 1em;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-weight: bold;
  color: #102454;
}

.request-counter-card {
  top: 2em;
  left: 1em;
  background: #ffffff;
  padding: 0.5em 1em;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-weight: bold;
  color: #102454;
  position: fixed;
}

.portfolio-summary {
  display: flex;
  gap: 2em;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
}

.portfolio-summary-card,
.portfolio-graph-card,
.portfolio-pie-card,
.portfolio-table-card,
.notice-board-card,
.financial-courses-card {
  background: #fff;
  padding: 1em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: left;
}

.portfolio-summary-card h2,
.portfolio-graph-card h2,
.portfolio-pie-card h2,
.portfolio-table-card h2,
.notice-board-card h2 {
  color: #102454;
  margin-bottom: 1em;
}

.portfolio-summary-card p,
.notice-board-card p {
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

.portfolio-pie-card,
.portfolio-table-card {
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

.portfolio-table th,
.portfolio-table td {
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

.additional-info {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 2em;
  margin-top: 20px;
}

.notice-board-card {
  width: 45%;
  background-color: #e17858;
  padding: 1em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: left;
  overflow: hidden; /* Add this to ensure content is contained */
}

.sticky-notes {
  display: flex;
  flex-direction: column; /* Change to column layout */
  gap: 1em;
  justify-content: flex-start; /* Align items at the top */
  align-items: center;
}

.sticky-notes li {
  background: #ffeb3b;
  padding: 1em;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  font-family: 'Comic Sans MS', cursive, sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  white-space: normal;
  overflow-wrap: break-word;
  width: auto; /* Changed to auto to fit content */
  height: auto; /* Changed to auto to fit content */
}

.sticky-notes li h3 {
  margin: 0;
  font-size: 1.2em;
  color: #333;
}

.sticky-notes li p,
.sticky-notes li a {
  margin: 0.5em 0 0;
  font-size: 1em;
  color: #333;
}

.financial-courses-card {
  text-align: center;
  color: #333;
  transition: transform 0.2s;
}

.financial-courses-card:hover {
  transform: scale(1.05);
}

.card-content h3 {
  margin: 0;
  font-size: 1.2em;
}

.card-content p {
  margin: 0.5em 0;
  font-size: 1em;
}

.streak-div {
  display: flex;
  justify-content: center;
  align-items: center;
}

.streak-card {
  background-color: #ff903b;
  border-radius: 10px;
  padding: 1em;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-bottom: 1em;
}

</style>
