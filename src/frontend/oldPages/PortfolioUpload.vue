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
      <div class="upload-container">
        <label for="file-upload" class="custom-file-upload">
          <i class="fa fa-cloud-upload"></i> Select CSV File
        </label>
        <input type="file" id="file-upload" @change="handleFileUpload" accept=".csv" />
      </div>
      <div v-if="portfolios.length" class="portfolios-container">
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
import { getFirestore, doc, setDoc } from 'firebase/firestore';
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
      companies: [
        { name: 'Amazon', symbol: 'AMZN', allocation: 0 },
        { name: 'Apple', symbol: 'AAPL', allocation: 0 },
        { name: 'Boeing', symbol: 'BA', allocation: 0 },
        { name: 'Coca-Cola', symbol: 'KO', allocation: 0 },
        { name: 'Disney', symbol: 'DIS', allocation: 0 },
        { name: 'Google', symbol: 'GOOGL', allocation: 0 },
        { name: 'Mastercard', symbol: 'MA', allocation: 0 },
        { name: 'Microsoft', symbol: 'MSFT', allocation: 0 },
        { name: 'Nike', symbol: 'NKE', allocation: 0 },
        { name: 'NVIDIA', symbol: 'NVDA', allocation: 0 },
        { name: 'PayPal', symbol: 'PYPL', allocation: 0 },
        { name: 'Pfizer', symbol: 'PFE', allocation: 0 },
        { name: 'Roblox', symbol: 'RBLX', allocation: 0 },
        { name: 'Shell', symbol: 'SHEL', allocation: 0 },
        { name: 'Spotify', symbol: 'SPOT', allocation: 0 },
        { name: 'Tesla', symbol: 'TSLA', allocation: 0 },
        { name: 'Visa', symbol: 'V', allocation: 0 },
        { name: 'Walmart', symbol: 'WMT', allocation: 0 }
      ],
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
          totalFunds: isNaN(parseFloat(totalFunds)) ? 0 : parseFloat(totalFunds),
          startDate,
          allocations: Object.fromEntries(Object.entries(allocations).map(([key, value]) => [key, isNaN(parseFloat(value)) ? 0 : parseFloat(value)]))
        };
      });
      console.log('Processed Portfolios:', this.portfolios);
    },
    async submitPortfolios() {
      const db = getFirestore();
      for (const portfolio of this.portfolios) {
        const portfolioDoc = {
          userName: portfolio.userName,
          companies: Object.entries(portfolio.allocations).map(([name, allocation]) => {
            const company = this.companies.find(c => c.name.toLowerCase() === name.toLowerCase());
            return {
              name: company ? company.name : name,
              allocation,
              symbol: company ? company.symbol : 'N/A'
            };
          }),
          totalAllocation: portfolio.totalFunds, // Update to use totalFunds from CSV
          date: new Date(portfolio.startDate),
        };
        try {
          await setDoc(doc(db, 'Unassigned Portfolios', portfolio.userName), portfolioDoc);
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
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');

.portfolio-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f9fbfd;
  height: 100vh;
  padding: 0;
  margin: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5em 1em;
  background-color: #204080;
  width: 100%;
}

.logo {
  height: auto;
  width: 150px;
  display: block;
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
  background-color: #102454;
}

.main-content {
  width: 100%;
  max-width: 1200px;
  margin: 2em auto;
  text-align: center;
  padding: 1em;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.upload-container {
  margin-bottom: 2em;
}

.custom-file-upload {
  display: inline-block;
  padding: 0.5em 1em;
  cursor: pointer;
  background-color: #204080;
  color: white;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.custom-file-upload:hover {
  background-color: #102454;
}

input[type="file"] {
  display: none;
}

.portfolios-container {
  margin-top: 2em;
}

.portfolios-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1em;
}

.portfolios-table th,
.portfolios-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: center;
}

.portfolios-table th {
  background-color: #f4f6f8;
  color: #204080;
}

button {
  background-color: #204080;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 1em;
}

button:hover {
  background-color: #102454;
}
</style>
