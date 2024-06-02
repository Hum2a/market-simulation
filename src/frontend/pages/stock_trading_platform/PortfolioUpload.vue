<template>
  <div class="portfolio-upload">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/stock-trading-select" class="nav-link">Stock Market Tool</router-link>
        <router-link to="/" class="nav-link">Home</router-link>
      </nav>
    </header>
    <main class="main-content">
      <h1>Upload Portfolios</h1>
      <input type="file" @change="handleFileUpload" accept=".csv" />
      <div v-if="portfolios.length">
        <h2>Uploaded Portfolios</h2>
        <table class="portfolios-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Total Funds</th>
              <th>Start Date</th>
              <th>Allocation Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(portfolio, index) in portfolios" :key="index">
              <td>{{ portfolio.userName }}</td>
              <td>£{{ portfolio.totalFunds.toFixed(2) }}</td>
              <td>{{ portfolio.startDate }}</td>
              <td>
                <ul>
                  <li v-for="(allocation, stock) in portfolio.allocations" :key="stock">{{ stock }}: £{{ allocation.toFixed(2) }}</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
        <button @click="submitPortfolios">Submit Portfolios</button>
      </div>
      <MessageModal
        :isVisible="isModalVisible"
        :title="modalTitle"
        :message="modalMessage"
        @close="isModalVisible = false"
      />
    </main>
  </div>
</template>

<script>
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import MessageModal from './components/MessageModal.vue';
import Papa from 'papaparse';

export default {
  name: 'PortfolioUpload',
  components: {
    MessageModal
  },
  data() {
    return {
      portfolios: [],
      isModalVisible: false,
      modalTitle: '',
      modalMessage: '',
    };
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        Papa.parse(file, {
          header: true,
          complete: this.processCSVData,
          skipEmptyLines: true,
          error: (error) => {
            console.error('CSV Parsing Error:', error);
            this.modalTitle = 'Error';
            this.modalMessage = 'There was an error processing the CSV file.';
            this.isModalVisible = true;
          }
        });
      }
    },
    processCSVData(result) {
      const data = result.data;
      console.log('CSV Data:', data);
      this.portfolios = data.map(row => {
        const { "Student Name": userName, "Total Funds": totalFunds, "Start Date": startDate, ...allocations } = row;
        return {
          userName,
          totalFunds: parseFloat(totalFunds),
          startDate,
          allocations: Object.fromEntries(Object.entries(allocations).map(([key, value]) => [key, parseFloat(value)]))
        };
      });
      console.log('Processed Portfolios:', this.portfolios);
    },
    async submitPortfolios() {
      const db = getFirestore();
      for (const portfolio of this.portfolios) {
        const portfolioDoc = {
          userName: portfolio.userName,
          companies: Object.entries(portfolio.allocations).map(([name, allocation]) => ({ name, allocation })),
          totalAllocation: Object.values(portfolio.allocations).reduce((a, b) => a + b, 0),
          date: new Date(portfolio.startDate),
        };
        try {
          await addDoc(collection(db, 'Unassigned Portfolios'), portfolioDoc);
        } catch (error) {
          console.error('Error saving portfolio:', error);
          this.modalTitle = 'Error';
          this.modalMessage = 'Error submitting portfolios. Please try again.';
          this.isModalVisible = true;
          return;
        }
      }
      this.modalTitle = 'Success';
      this.modalMessage = 'Portfolios Submitted Successfully!';
      this.isModalVisible = true;
      this.portfolios = [];
    }
  }
};
</script>

<style scoped>
.portfolio-upload {
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

input[type="file"] {
  display: inline;
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

button {
  background-color: #102454;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 1em;
}

button:hover {
  background-color: #0d1b3f;
}
</style>
