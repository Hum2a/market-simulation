<template>
  <div class="portfolio-display">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/portfolio-creation" class="nav-link">Portfolio Creation</router-link>
        <button @click="refreshData" class="refresh-button" :disabled="loading">Refresh Data</button>
      </nav>
    </header>
    <main class="main-content">
      <div class="portfolio-selector">
        <label for="portfolio-picker">Select Portfolio:</label>
        <select id="portfolio-picker" v-model="selectedPortfolio" @change="onPortfolioChange" :disabled="loading">
          <option v-for="portfolio in unassignedPortfolios" :key="portfolio" :value="portfolio">{{ portfolio }}</option>
        </select>
      </div>
      <button @click="downloadImage" class="download-button" :disabled="loading">Download Image</button>
      <div ref="contentToCapture">
        <div class="sticky-notes-container">
          <div class="sticky-notes">
            <li v-for="note in stickyNotes" :key="note.id" class="sticky-note" :style="{ top: note.position.y + '%', left: note.position.x + '%' }">
              <h3>{{ note.title }}</h3>
              <p>{{ note.content }}</p>
            </li>
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
                <p>Time Invested: {{ timeInvested }} days</p>
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
import html2canvas from 'html2canvas';

export default {
  name: 'UnassignedPortfolioDisplay',
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
      stickyNotes: [],
      unassignedPortfolios: [],
      selectedPortfolio: '',
      companies: [
        { name: 'Amazon', symbol: 'AMZN'},
        { name: 'Apple', symbol: 'AAPL'},
        { name: 'Boeing', symbol: 'BA'},
        { name: 'Coca-Cola', symbol: 'KO'},
        { name: 'Disney', symbol: 'DIS'},
        { name: 'Google', symbol: 'GOOGL'},
        { name: 'Mastercard', symbol: 'MA'},
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
    await this.fetchUnassignedPortfolios();
  },
  watch: {
    selectedPortfolio: 'onPortfolioChange'
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
        if (company.allocation === 0) return worst; // Skip companies with zero initial allocation
        const change = ((company.currentValue || company.allocation) - company.allocation) / company.allocation * 100;
        return change < worst.percentageChange ? { name: company.name, percentageChange: change.toFixed(2) } : worst;
      }, { name: 'N/A', percentageChange: Infinity });
    },
    filteredCompanies() {
      return this.portfolio ? this.portfolio.companies.filter(company => company.allocation > 0) : [];
    },
    timeInvested() {
      if (!this.portfolio || !this.portfolioHistory.length) return 0;
      const initialDate = new Date(this.portfolio.date.seconds * 1000);
      const latestDate = new Date(this.portfolioHistory[this.portfolioHistory.length - 1].date.seconds * 1000);
      return differenceInDays(latestDate, initialDate);
    }
  },
  methods: {
    roundedValue(value) {
      return parseFloat(value).toFixed(2);
    },
    async fetchUnassignedPortfolios() {
      const db = getFirestore();
      const portfolioCollection = collection(db, 'Unassigned Portfolios');
      const portfolioSnapshot = await getDocs(portfolioCollection);
      this.unassignedPortfolios = portfolioSnapshot.docs.map(doc => doc.id);
      if (this.unassignedPortfolios.length > 0) {
        this.selectedPortfolio = this.unassignedPortfolios[0];
      }
    },
    onPortfolioChange() {
      this.loading = true;
      this.portfolio = null;
      this.portfolioHistory = [];
      this.fetchAndProcessData();
    },
    async fetchAndProcessData() {
      if (!this.selectedPortfolio) return;
      await this.fetchPortfolio();
      if (this.portfolio) {
        await this.initializeInitialPrices();
        await this.fillMissingDates();
        await this.fetchAllPortfolioDocs();
        this.preparePortfolioChartData();
        this.preparePieChartData();
        this.updatePortfolioValues();
      }
      this.loading = false;
    },
    async refreshData() {
      await this.fetchAndProcessData();
    },
    async fetchPortfolio() {
      const db = getFirestore();
      const docRef = doc(db, 'Unassigned Portfolios', this.selectedPortfolio);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log('Fetched initial portfolio:', docSnap.data());
        this.portfolio = docSnap.data();
      }
    },
    async fetchAllPortfolioDocs() {
      const db = getFirestore();
      const portfolioCollection = collection(db, 'Unassigned Portfolios', this.selectedPortfolio, 'Portfolios');
      const portfolioQuery = query(portfolioCollection, orderBy('date', 'asc'));
      const querySnapshot = await getDocs(portfolioQuery);

      this.portfolioHistory = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== 'Initial Portfolio') {
          this.portfolioHistory.push(doc.data());
        }
      });

      console.log('Fetched all portfolio documents:', this.portfolioHistory);
    },
    async fetchStockData(symbol) {
      const db = getFirestore();
      const docRef = doc(db, 'Stock Market Data', symbol);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    },
    async initializeInitialPrices() {
      if (!this.portfolio.initialPrices) {
        console.log("Initializing initial prices...");
        const initialPrices = [];

        const stockDataPromises = this.portfolio.companies.map(company => {
          const companyInfo = this.companies.find(c => c.name === company.name);
          if (companyInfo) {
            return this.fetchStockData(companyInfo.symbol);
          } else {
            console.error(`No company info found for ${company.name}`);
            return null;
          }
        });
        const stockDataArray = await Promise.all(stockDataPromises);

        stockDataArray.forEach((stockData, index) => {
          if (stockData && stockData.data['Time Series (Daily)']) {
            const initialDate = format(new Date(this.portfolio.date.seconds * 1000), 'yyyy-MM-dd');
            const dailyData = stockData.data['Time Series (Daily)'][initialDate];
            if (dailyData && dailyData['4. close']) {
              initialPrices[index] = parseFloat(dailyData['4. close']);
            } else {
              initialPrices[index] = this.portfolio.companies[index].allocation;
            }
          } else {
            initialPrices[index] = this.portfolio.companies[index].allocation;
          }
        });

        this.portfolio.initialPrices = initialPrices;

        // Initialize currentValue to allocation for the initial portfolio
        this.portfolio.companies = this.portfolio.companies.map((company) => ({
          ...company,
          currentValue: company.allocation
        }));

        const db = getFirestore();
        const docRef = doc(db, 'Unassigned Portfolios', this.selectedPortfolio);
        await setDoc(docRef, this.portfolio);
        console.log('Updated portfolio with initial prices:', this.portfolio);
      }
    },
    async fillMissingDates() {
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

      // Fetch all existing portfolio documents
      const portfolioCollection = collection(db, 'Unassigned Portfolios', this.selectedPortfolio, 'Portfolios');
      const portfolioQuery = query(portfolioCollection, orderBy('date', 'asc'));
      const querySnapshot = await getDocs(portfolioQuery);

      // Collect all existing dates
      const existingDates = new Set();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = new Date(data.date.seconds * 1000);
        const formattedDate = format(date, 'yyyy-MM-dd');
        existingDates.add(formattedDate);
      });

      let previousDayValues = this.portfolio.companies.map(company => company.allocation); // Start with initial allocation

      while (currentDate <= today) {
        const formattedDate = format(currentDate, 'yyyy-MM-dd');
        
        // Only process if the date is missing
        if (!existingDates.has(formattedDate)) {
          console.log(`No portfolio data for ${formattedDate}, creating new entry.`);
          console.log('1');
          const stockDataPromises = this.portfolio.companies.map(company => {
          console.log('2');
            const companyInfo = this.companies.find(c => c.name === company.name);
            console.log('3');
            return this.fetchStockData(companyInfo.symbol);
          });
          const stockDataArray = await Promise.all(stockDataPromises);
          console.log('4');
          console.log(`Stock Data Array: ${JSON.stringify(stockDataArray)}`);

          const updatedCompanies = this.portfolio.companies.map((company, index) => {
            const stockData = stockDataArray[index];
            console.log(`Stock Data for ${company.name}: ${JSON.stringify(stockData)}`);
            let currentValue = previousDayValues[index]; // Use the previous day's value as the starting point

            // Calculate the previous date
            let previousDate = new Date(currentDate);
            previousDate.setDate(previousDate.getDate() - 1);
            let formattedPreviousDate = format(previousDate, 'yyyy-MM-dd');
            let previousClosePrice = null;

            // Keep going back day by day until a previous close price is found
            while (!previousClosePrice && previousDate >= initialDate) {
              previousClosePrice = stockData?.data['Time Series (Daily)']?.[formattedPreviousDate]?.['4. close'];
              if (!previousClosePrice) {
                previousDate.setDate(previousDate.getDate() - 1);
                formattedPreviousDate = format(previousDate, 'yyyy-MM-dd');
              }
            }

            console.log(`Previous Close Price for ${company.name} on ${formattedPreviousDate}: ${previousClosePrice}`);

            if (previousClosePrice) {
              const closePrice = stockData?.data['Time Series (Daily)']?.[formattedDate]?.['4. close'];
              if (closePrice) {
                console.log(`Close Price for ${company.name} on ${formattedDate}: ${closePrice}`);
                const percentageChange = (parseFloat(closePrice) - parseFloat(previousClosePrice)) / parseFloat(previousClosePrice);
                console.log(`Percentage Change for ${company.name} on ${formattedDate}: ${percentageChange}`);
                currentValue = previousDayValues[index] * (1 + percentageChange);
                console.log(`New Current Value for ${company.name} on ${formattedDate}: ${currentValue}`);
              } else {
                // If there's no close price for the current date, use the previous day's currentValue
                console.log(`No close price available for ${company.name} on ${formattedDate}, using previous currentValue.`);
              }
            } else {
              console.log(`No previous close price available for ${company.name}, using previous currentValue.`);
            }

            return {
              ...company,
              currentValue: isNaN(currentValue) ? 0 : currentValue, // Ensure currentValue is a number
            };
          });

          previousDayValues = updatedCompanies.map(company => company.currentValue); // Update the previous day values

          const updatedPortfolio = {
            ...this.portfolio,
            date: currentDate,
            companies: updatedCompanies,
            totalAllocation: updatedCompanies.reduce((sum, company) => sum + company.currentValue, 0),
          };

          console.log('Updated portfolio for', formattedDate, updatedPortfolio);
          await setDoc(doc(db, 'Unassigned Portfolios', this.selectedPortfolio, 'Portfolios', `${formattedDate} Portfolio`), updatedPortfolio);
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
        this.chartData = this.prepareStockChartData(symbol);
      }
    },
    prepareStockChartData(symbol) {
      const history = this.portfolioHistory.map(entry => {
        const company = entry.companies.find(c => c.symbol === symbol);
        return {
          date: new Date(entry.date.seconds * 1000),
          value: company ? company.currentValue : 0
        };
      });

      const labels = history.map(entry => format(entry.date, 'yyyy-MM-dd'));
      const data = history.map(entry => parseFloat(entry.value).toFixed(2));

      return {
        labels,
        datasets: [
          {
            label: 'Stock Value',
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
    },
    async fetchStickyNotes() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const notesCollection = collection(db, 'Sticky Notes');
        const notesSnapshot = await getDocs(notesCollection);

        this.stickyNotes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(note => {
          return this.shouldShowNote(note);
        });
      } else {
        console.error("User is not logged in");
      }
    },
    shouldShowNote(note) {
      if (note.showForAllUsers) {
        return true;
      }
      if (note.portfolioValueThreshold && this.currentValue > note.portfolioValueThreshold) {
        return true;
      }
      if (note.selectedStocks && note.selectedStocks.length) {
        const userStocks = this.portfolio ? this.portfolio.companies.map(company => company.symbol) : [];
        const hasMatchingStock = note.selectedStocks.some(stock => userStocks.includes(stock));
        if (hasMatchingStock) {
          return true;
        }
      }
      return false;
    },
    async downloadImage() {
      const element = this.$refs.contentToCapture;
      try {
        const canvas = await html2canvas(element);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `portfolio-${this.selectedPortfolio}.png`;
        link.click();
      } catch (error) {
        console.error('Error capturing image:', error);
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
  position: relative; /* Added for sticky note positioning */
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

.portfolio-selector {
  display: flex;
  align-items: center;
  margin-bottom: 1em;
}

.portfolio-selector label {
  margin-right: 0.5em;
}

.main-content {
  width: 100%;
  margin: 2em auto;
  text-align: center;
  padding: 1em;
  display: flex;
  flex-direction: column;
  gap: 2em;
  position: relative; /* Added for sticky note positioning */
}

.download-button {
  margin-bottom: 1em;
  background-color: #28a745;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.download-button:hover {
  background-color: #218838;
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
  border: 1px solid     #ddd;
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

.sticky-notes-container {
  width: 100%;
  height: 100%;
}

.sticky-notes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Prevent sticky notes from blocking other interactions */
}

.sticky-notes li {
  background: #ffeb3b; /* Yellow background to resemble sticky notes */
  padding: 1em;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  position: absolute; /* Position absolute to place at specific coordinates */
  font-family: 'Comic Sans MS', cursive, sans-serif;
  width: 150px; /* Adjust width to maintain square shape */
  height: 150px; /* Adjust height to maintain square shape */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  pointer-events: auto; /* Allow interaction with sticky notes */
}

.sticky-notes li h3 {
  margin: 0;
  font-size: 1.2em;
  color: #333;
}

.sticky-notes li p {
  margin: 0.5em 0 0;
  font-size: 1em;
  color: #333;
}
</style>
