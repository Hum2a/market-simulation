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
        <p>Divide your chosen amount amongst the top 30 US companies on the stock market.</p>
        <form @submit.prevent="submitPortfolio" class="portfolio-form">
          <div class="user-input">
            <label for="user-name">Student Name:</label>
            <input type="text" id="user-name" v-model="userName" required />
          </div>
          <div class="funds-input">
            <label for="total-funds">Total Funds (£):</label>
            <input type="number" id="total-funds" v-model.number="totalFunds" required />
          </div>
          <div class="date-picker">
            <label for="portfolio-date">Select Start Date:</label>
            <Datepicker v-model="selectedDate" />
          </div>
          <div class="view-toggle">
            <button type="button" @click="toggleView">
              {{ viewMode === 'card' ? 'Switch to Spreadsheet View' : 'Switch to Card View' }}
            </button>
          </div>
          <div class="generate-random">
            <button type="button" @click="generateRandomPortfolio">Generate Random Portfolio</button>
          </div>
          <div v-if="viewMode === 'card'">
            <div v-for="company in companies" :key="company.name" class="company">
              <label :for="company.name" class="company-label">{{ company.name }}:</label>
              <input
                type="range"
                :id="company.name"
                v-model.number="company.allocation"
                :max="totalFunds"
                @input="updateTotal"
                step="1"
                class="company-range"
              />
              <input
                type="number"
                v-model.number="company.allocation"
                :max="totalFunds"
                @input="updateTotal"
                class="company-value-input"
              />
            </div>
          </div>
          <div v-else class="spreadsheet-view-container">
            <div class="spreadsheet-view">
              <table>
                <thead>
                  <tr>
                    <th v-for="company in companies" :key="company.name">{{ company.name }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td v-for="company in companies" :key="company.name">
                      <input
                        type="number"
                        v-model.number="company.allocation"
                        :max="totalFunds"
                        @input="updateTotal"
                        class="company-value-input"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="total-allocation">
            <strong>Total Allocation: £{{ totalAllocation }}</strong>
          </div>
          <div class="form-buttons">
            <button type="submit" :disabled="totalAllocation > totalFunds || totalAllocation === 0">Submit</button>
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
  import Datepicker from '@vuepic/vue-datepicker';
  import '@vuepic/vue-datepicker/dist/main.css';
  import MessageModal from './components/MessageModal.vue';
  
  export default {
    name: 'AdminPortfolioCreation',
    components: {
      Datepicker,
      MessageModal
    },
    data() {
      return {
        userName: '',
        totalFunds: 10000,
        viewMode: 'card',
        companies: [
            { name: 'AbbVie', symbol: 'ABBV', allocation: 0 },
            { name: 'Activision Blizzard', symbol: 'ATVI', allocation: 0 },
            { name: 'Adobe', symbol: 'ADBE', allocation: 0 },
            { name: 'Amazon', symbol: 'AMZN', allocation: 0 },
            { name: 'American Tower Corporation', symbol: 'AMT', allocation: 0 },
            { name: 'Apple', symbol: 'AAPL', allocation: 0 },
            { name: 'Astra Zeneca', symbol: 'AZN', allocation: 0 },
            { name: 'AT&T', symbol: 'T', allocation: 0 },
            { name: 'Axon Enterprise', symbol: 'AXON', allocation: 0 },
            { name: 'Barclays', symbol: 'BCS', allocation: 0 },
            { name: 'Berkshire Hathaway', symbol: 'BRK.B', allocation: 0 },
            { name: 'Blackrock', symbol: 'BLK', allocation: 0 },
            { name: 'Boeing', symbol: 'BA', allocation: 0 },
            { name: 'BP', symbol: 'BP', allocation: 0 },
            { name: 'BYD', symbol: 'BYDDY', allocation: 0 },
            { name: 'Cisco', symbol: 'CSCO', allocation: 0 },
            { name: 'Coca-Cola', symbol: 'KO', allocation: 0 },
            { name: 'Comcast', symbol: 'CMCSA', allocation: 0 },
            { name: 'Costco', symbol: 'COST', allocation: 0 },
            { name: 'Curries', symbol: 'DC.L', allocation: 0 },
            { name: 'Disney', symbol: 'DIS', allocation: 0 },
            { name: 'EA', symbol: 'EA', allocation: 0 },
            { name: 'ExxonMobil', symbol: 'XOM', allocation: 0 },
            { name: 'Goldman Sachs', symbol: 'GS', allocation: 0 },
            { name: 'Google', symbol: 'GOOGL', allocation: 0 },
            { name: 'Home Depot', symbol: 'HD', allocation: 0 },
            { name: 'IBM', symbol: 'IBM', allocation: 0 },
            { name: 'Intel', symbol: 'INTC', allocation: 0 },
            { name: 'Johnson & Johnson', symbol: 'JNJ', allocation: 0 },
            { name: 'JPMorgan Chase', symbol: 'JPM', allocation: 0 },
            { name: 'LG', symbol: '066570.KS', allocation: 0 },
            { name: 'Lockheed Martin', symbol: 'LMT', allocation: 0 },
            { name: 'Man United', symbol: 'MANU', allocation: 0 },
            { name: 'Mastercard', symbol: 'MA', allocation: 0 },
            { name: 'Meta', symbol: 'META', allocation: 0 },
            { name: 'Microsoft', symbol: 'MSFT', allocation: 0 },
            { name: 'Netflix', symbol: 'NFLX', allocation: 0 },
            { name: 'NIO', symbol: 'NIO', allocation: 0 },
            { name: 'Nike', symbol: 'NKE', allocation: 0 },
            { name: 'NVIDIA', symbol: 'NVDA', allocation: 0 },
            { name: 'Open AI', symbol: 'Not Listed', allocation: 0 }, // Open AI is not a publicly traded company
            { name: 'Pandora', symbol: 'P', allocation: 0 },
            { name: 'PayPal', symbol: 'PYPL', allocation: 0 },
            { name: 'Pfizer', symbol: 'PFE', allocation: 0 },
            { name: 'PepsiCo', symbol: 'PEP', allocation: 0 },
            { name: 'Procter & Gamble', symbol: 'PG', allocation: 0 },
            { name: 'Roblox', symbol: 'RBLX', allocation: 0 },
            { name: 'Rolls Royce', symbol: 'RR.L', allocation: 0 },
            { name: 'Shell', symbol: 'SHEL', allocation: 0 },
            { name: 'Spotify', symbol: 'SPOT', allocation: 0 },
            { name: 'Tesla', symbol: 'TSLA', allocation: 0 },
            { name: 'Tesco', symbol: 'TSCO.L', allocation: 0 },
            { name: 'UnitedHealth', symbol: 'UNH', allocation: 0 },
            { name: 'Verizon', symbol: 'VZ', allocation: 0 },
            { name: 'Visa', symbol: 'V', allocation: 0 },
            { name: 'Walmart', symbol: 'WMT', allocation: 0 }
        ],
        selectedDate: new Date(),
        isModalVisible: false,
        modalTitle: '',
        modalMessage: '',
      };
    },
    computed: {
      totalAllocation() {
        return this.companies.reduce((total, company) => total + company.allocation, 0);
      },
    },
    methods: {
      updateTotal() {
        this.$forceUpdate();
      },
      toggleView() {
        this.viewMode = this.viewMode === 'card' ? 'spreadsheet' : 'card';
      },
      generateRandomPortfolio() {
        let remainingFunds = this.totalFunds;
        this.companies.forEach(company => {
          company.allocation = 0;
        });
  
        const chunkSize = 100;
        while (remainingFunds >= chunkSize) {
          const company = this.companies[Math.floor(Math.random() * this.companies.length)];
          const allocation = Math.min(chunkSize, remainingFunds);
          company.allocation += allocation;
          remainingFunds -= allocation;
        }
  
        if (remainingFunds > 0) {
          const company = this.companies[Math.floor(Math.random() * this.companies.length)];
          company.allocation += remainingFunds;
        }
  
        this.updateTotal();
      },
      async submitPortfolio() {
        if (this.totalAllocation > 0 && this.totalAllocation <= this.totalFunds) {
          const db = getFirestore();
          const portfolio = {
            userName: this.userName,
            companies: this.companies.map(company => ({
              name: company.name,
              symbol: company.symbol,
              allocation: company.allocation
            })),
            totalAllocation: this.totalAllocation,
            date: this.selectedDate,
          };
  
          try {
            await addDoc(collection(db, 'Unassigned Portfolios'), portfolio);
            this.modalTitle = 'Success';
            this.modalMessage = 'Portfolio Submitted Successfully!';
            this.isModalVisible = true;
          } catch (error) {
            console.error('Error saving portfolio:', error);
            this.modalTitle = 'Error';
            this.modalMessage = 'Error submitting portfolio. Please try again.';
            this.isModalVisible = true;
          }
        } else {
          this.modalTitle = 'Error';
          this.modalMessage = 'Total allocation exceeds available funds!';
          this.isModalVisible = true;
        }
      },
    },
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
  