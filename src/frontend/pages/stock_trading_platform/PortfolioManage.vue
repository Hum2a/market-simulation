<template>
    <div class="portfolio-manage">
      <header class="header">
        <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
        <nav class="header-links">
          <router-link to="/stock-trading-select" class="nav-link">Stock Market Tool</router-link>
          <router-link to="/" class="nav-link">Home</router-link>
        </nav>
      </header>
      <main class="main-content">
        <h1>Manage Portfolios</h1>
        <div class="filter-options">
          <label for="filter-name">Filter by Name:</label>
          <input type="text" id="filter-name" v-model="filterName" placeholder="Enter student name" />
        </div>
        <div class="sort-options">
          <label for="sort-by">Sort By:</label>
          <select id="sort-by" v-model="sortBy" @change="sortPortfolios">
            <option value="value">Portfolio Value</option>
            <option value="name">Name</option>
          </select>
        </div>
        <table class="portfolios-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Total Portfolio Value</th>
              <th>Date</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="portfolio in filteredPortfolios" :key="portfolio.id">
              <td>{{ portfolio.userName }}</td>
              <td>£{{ portfolio.totalValue.toFixed(2) }}</td>
              <td>{{ new Date(portfolio.date.seconds * 1000).toLocaleDateString() }}</td>
              <td>
                <portfolio-chart :chart-data="portfolio.chartData" />
              </td>
            </tr>
          </tbody>
        </table>
      </main>
    </div>
  </template>
  
  <script>
  import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
  import PortfolioChart from './components/PortfolioChart.vue';
  
  export default {
    name: 'PortfolioManage',
    components: {
      PortfolioChart
    },
    data() {
      return {
        portfolios: [],
        filterName: '',
        sortBy: 'value'
      };
    },
    computed: {
      filteredPortfolios() {
        return this.portfolios
          .filter(portfolio => portfolio.userName.toLowerCase().includes(this.filterName.toLowerCase()))
          .sort((a, b) => {
            if (this.sortBy === 'name') {
              return a.userName.localeCompare(b.userName);
            } else {
              return b.totalValue - a.totalValue;
            }
          });
      }
    },
    async created() {
      await this.fetchPortfolios();
      this.sortPortfolios();
    },
    methods: {
      async fetchPortfolios() {
        const db = getFirestore();
        const usersCollection = collection(db, 'Users');
        const usersSnapshot = await getDocs(usersCollection);
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
        for (const user of users) {
          const portfolioCollection = collection(db, `${user.id}/Stock Trading Platform/Portfolio`);
          const portfolioQuery = query(portfolioCollection, orderBy('date', 'desc'), limit(1));
          const portfolioSnapshot = await getDocs(portfolioQuery);
  
          portfolioSnapshot.forEach(doc => {
            const data = doc.data();
            this.portfolios.push({
              id: doc.id,
              userName: `${user.firstName} ${user.lastName}`,
              totalValue: data.companies.reduce((sum, company) => sum + company.currentValue, 0),
              date: data.date,
              chartData: this.getChartData(data.companies) // Get the chart data for the user
            });
          });
        }
      },
      getChartData(companies) {
        const dates = companies.map(company => company.name);
        const values = companies.map(company => company.currentValue);
  
        return {
          labels: dates,
          datasets: [
            {
              label: 'Portfolio Value Over Time',
              backgroundColor: '#42A5F5',
              data: values
            }
          ]
        };
      },
      sortPortfolios() {
        this.portfolios = this.filteredPortfolios.slice();
      }
    }
  };
  </script>
  
  <style scoped>
  .portfolio-manage {
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
    border-top-left-radius: 0;
    border-top-right-radius: 0;
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
    cursor: pointer;
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
  
  .filter-options,
  .sort-options {
    margin-bottom: 1em;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .filter-options label,
  sort-options label {
    margin-right: 0.5em;
    font-size: 1.2em;
    color: #102454;
  }
  
  .filter-options input,
  .sort-options select {
    padding: 0.5em;
    font-size: 1em;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  
  .portfolios-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1em;
  }
  
  .portfolios-table th,
  .portfolios-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }
  
  .portfolios-table th {
    background-color: #f2f2f2;
    color: #102454;
  }
  </style>
  