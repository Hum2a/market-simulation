<template>
    <div class="portfolio-simulation">
      <header class="header">
        <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
        <nav class="header-links">
          <router-link to="/homepage" class="nav-link">Home</router-link>
          <router-link to="/groupcreation" class="nav-link">Asset Market Tool</router-link>
          <router-link to="/portfolio-creation" class="nav-link">Portfolio Creation</router-link>
          <router-link to="/portfolio-display" class="nav-link">Portfolio Display</router-link>
        </nav>
      </header>
      <main class="main-content">
        <h1>Portfolio Simulation</h1>
        <div v-if="loading">Loading...</div>
        <div v-else-if="!portfolio">No portfolio found.</div>
        <div v-else>
          <h2>Portfolio Created On: {{ formatDate(portfolio.date.toDate()) }}</h2>
          <line-chart :data="chartData" :options="chartOptions"></line-chart>
        </div>
      </main>
    </div>
  </template>
  
  <script>
  import { getFirestore, doc, getDoc, collection, query, getDocs } from "firebase/firestore";
  import { getAuth } from "firebase/auth";
  import LineChart from "@/components/LineChart.vue"; // Make sure to create a LineChart component
  
  export default {
    name: 'PortfolioSimulation',
    components: {
      LineChart
    },
    data() {
      return {
        portfolio: null,
        loading: true,
        chartData: null,
        chartOptions: {
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'day'
              }
            }
          }
        }
      };
    },
    async created() {
      const portfolioId = this.$route.params.id; // Assuming the portfolio ID is passed as a route parameter
      await this.fetchPortfolio(portfolioId);
      await this.fetchStockData();
      this.loading = false;
    },
    methods: {
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
      async fetchStockData() {
        if (!this.portfolio) return;
  
        const db = getFirestore();
        const stockDataPromises = this.portfolio.companies.map(async company => {
          const docRef = doc(db, "Stock Market Data", company.name);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return {
              name: company.name,
              allocation: company.allocation,
              data: docSnap.data()["Time Series (Daily)"]
            };
          } else {
            console.error(`No data for ${company.name}`);
            return null;
          }
        });
  
        const stockData = await Promise.all(stockDataPromises);
        this.prepareChartData(stockData.filter(data => data !== null));
      },
      prepareChartData(stockData) {
        const dates = new Set();
        stockData.forEach(stock => {
          Object.keys(stock.data).forEach(date => dates.add(date));
        });
  
        const sortedDates = Array.from(dates).sort();
        const datasets = stockData.map(stock => {
          const data = sortedDates.map(date => {
            const dayData = stock.data[date];
            const closePrice = dayData ? parseFloat(dayData["4. close"]) : null;
            return {
              x: new Date(date),
              y: closePrice ? closePrice * stock.allocation : null
            };
          });
          return {
            label: stock.name,
            data: data,
            fill: false,
            borderColor: this.getRandomColor()
          };
        });
  
        this.chartData = {
          labels: sortedDates,
          datasets: datasets
        };
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
  </style>
  