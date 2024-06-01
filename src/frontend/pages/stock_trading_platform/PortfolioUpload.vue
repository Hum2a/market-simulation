<template>
  <div class="portfolio-creation">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/stock-trading-select" class="nav-link">Stock Market Tool</router-link>
        <router-link to="/" class="nav-link">Home</router-link>
      </nav>
    </header>
    <main class="main-content">
      <h1>Create New Unassigned Portfolio</h1>
      <p>Upload a CSV file to create portfolios for each student.</p>
      <div class="file-upload">
        <input type="file" @change="handleFileUpload" accept=".csv" />
      </div>
      <form @submit.prevent="submitPortfolio" class="portfolio-form">
        <div class="form-buttons">
          <button type="submit">Submit Portfolios</button>
        </div>
      </form>
    </main>
    <MessageModal
      :isVisible="isModalVisible"
      :title="modalTitle"
      :message="modalMessage"
      @close="isModalVisible = false"
    />
  </div>
</template>

<script>
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import Papa from 'papaparse';
import MessageModal from './components/MessageModal.vue';

export default {
  name: 'AdminPortfolioCreation',
  components: {
    MessageModal
  },
  data() {
    return {
      portfolios: [],
      isModalVisible: false,
      modalTitle: '',
      modalMessage: ''
    };
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        Papa.parse(file, {
          header: true,
          complete: this.parseCSV
        });
      }
    },
    parseCSV(results) {
      this.portfolios = results.data.map(row => ({
        userName: row['Name'],
        companies: this.getCompanyAllocations(row),
        totalAllocation: this.safeParseFloat(row['TOTAL start']),
        date: new Date(row['Date'])
      }));
    },
    getCompanyAllocations(row) {
      const companies = [
        { name: 'Amazon', symbol: 'AMZN', allocation: this.safeParseFloat(row['Amazon']) },
        { name: 'Apple', symbol: 'AAPL', allocation: this.safeParseFloat(row['Apple']) },
        { name: 'Barclays', symbol: 'BCS', allocation: this.safeParseFloat(row['Barclays']) },
        { name: 'Boeing', symbol: 'BA', allocation: this.safeParseFloat(row['Boeing']) },
        { name: 'BP', symbol: 'BP', allocation: this.safeParseFloat(row['BP']) },
        { name: 'Coca-Cola', symbol: 'KO', allocation: this.safeParseFloat(row['Coca-Cola']) },
        { name: 'Disney', symbol: 'DIS', allocation: this.safeParseFloat(row['Disney']) },
        { name: 'Exxon Mobil', symbol: 'XOM', allocation: this.safeParseFloat(row['Exxon Mobil']) },
        { name: 'Facebook', symbol: 'META', allocation: this.safeParseFloat(row['Facebook']) },
        { name: 'Goldman Sachs', symbol: 'GS', allocation: this.safeParseFloat(row['Goldman Sachs']) },
        { name: 'Google', symbol: 'GOOGL', allocation: this.safeParseFloat(row['Google']) },
        { name: 'Microsoft', symbol: 'MSFT', allocation: this.safeParseFloat(row['Microsoft']) },
        { name: 'Netflix', symbol: 'NFLX', allocation: this.safeParseFloat(row['Netflix']) },
        { name: 'Nike', symbol: 'NKE', allocation: this.safeParseFloat(row['Nike']) },
        { name: 'Pfizer', symbol: 'PFE', allocation: this.safeParseFloat(row['Pfizer']) },
        { name: 'Spotify', symbol: 'SPOT', allocation: this.safeParseFloat(row['Spotify']) },
        { name: 'Tesla', symbol: 'TSLA', allocation: this.safeParseFloat(row['Tesla']) },
        { name: 'Visa', symbol: 'V', allocation: this.safeParseFloat(row['Visa']) },
        { name: 'Walmart', symbol: 'WMT', allocation: this.safeParseFloat(row['Walmart']) },
        // Add more companies as needed
      ];
      return companies.filter(company => company.allocation > 0);
    },
    safeParseFloat(value) {
      return parseFloat(value?.replace(/[^0-9.-]+/g, "") || 0);
    },
    async submitPortfolio() {
      const db = getFirestore();
      const portfolioCollection = collection(db, 'Unassigned Portfolios');

      try {
        for (const portfolio of this.portfolios) {
          await addDoc(portfolioCollection, portfolio);
        }
        this.modalTitle = 'Success';
        this.modalMessage = 'Portfolios Submitted Successfully!';
        this.isModalVisible = true;
      } catch (error) {
        console.error('Error saving portfolios:', error);
        this.modalTitle = 'Error';
        this.modalMessage = 'Error submitting portfolios. Please try again.';
        this.isModalVisible = true;
      }
    }
  }
};
</script>

<style scoped>
.portfolio-creation {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f0f2f5;
  height: 100vh;
  padding: 0;
  margin: 0;
}

.header {
  grid-column: 1 / -1;
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

.main-content p {
  font-size: 1.2em;
  color: #333;
  margin-bottom: 1em;
}

.file-upload {
  margin-bottom: 1em;
}

.file-upload input {
  display: block;
  margin: 0 auto;
}

.funds-input,
.user-input {
  margin-bottom: 1em;
}

.funds-input label,
.user-input label {
  color: #102454;
}

.funds-input input,
.user-input input {
  width: 100%;
  margin-top: 0.5em;
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
}

.date-picker {
  margin-bottom: 1em;
}

.date-picker label {
  color: #102454;
}

.view-toggle {
  margin-bottom: 1em;
}

.view-toggle button {
  background-color: #102454;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.view-toggle button:hover {
  background-color: #0d1b3f;
}

.generate-random {
  margin-bottom: 1em;
}

.generate-random button {
  background-color: #28a745;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.generate-random button:hover {
  background-color: #218838;
}

.portfolio-form {
  background: #fff;
  padding: 2em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.company {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #e0e7ff;
  padding: 1em;
  border-radius: 8px;
  margin-bottom: 1em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.company-label {
  flex: 1;
  text-align: left;
  font-weight: bold;
  color: #102454;
}

.company-range {
  flex: 2;
  margin: 0 1em;
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  background: #102454;
  border-radius: 5px;
  outline: none;
  transition: opacity 0.2s;
}

.company-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ff9800;
  cursor: pointer;
}

.company-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ff9800;
  cursor: pointer;
}

.company-value-input {
  flex: 1;
  text-align: right;
  font-weight: bold;
  color: #102454;
  border: none;
  background: none;
  width: 80px;
  text-align: center;
}

.spreadsheet-view-container {
  overflow-x: auto;
  width: 100%;
}

.spreadsheet-view table {
  width: 100%;
  border-collapse: collapse;
}

.spreadsheet-view th,
.spreadsheet-view td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.spreadsheet-view th {
  background-color: #f2f2f2;
  color: #102454;
}

.total-allocation {
  margin-top: 1em;
  font-size: 1.2em;
  color: #333;
}

.form-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1em;
}

button {
  background-color: #102454;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:disabled {
  background-color: #aaa;
  cursor: not-allowed;
}
</style>
