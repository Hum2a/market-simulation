<template>
  <div>
    <h1>Simulation Page</h1>
    <div class="chart-grid">
      <div class="chart-row">
        <canvas id="combinedChartCanvas"></canvas>
      </div>
    </div>
    <div class="month-picker">
      <label for="monthPicker">Select Month:</label>
      <input type="month" id="monthPicker" v-model="selectedMonth" @change="updateCharts">
    </div>
    <button @click="generateAndRenderCharts" class="generate-charts-btn">Generate and Render Charts</button>
    <button @click="toggleCalculator" class="calculator-toggle">
      <i class="fas fa-calculator"></i>
    </button>
    <InvestmentCalculator v-if="showCalculator" />
  </div>
</template>

<script>
import Chart from 'chart.js';
import InvestmentCalculator from '../components/InvestmentCalculator/InvestmentCalculator.vue';

export default {
  name: 'SecondPage',
  props: ['groups'],
  components: {
    InvestmentCalculator
  },
  data() {
    return {
      showCalculator: false,
      animationDuration: 5000,
      equityData: [],
      bondsData: [],
      realEstateData: [],
      banksData: [],
      otherData: [],
      selectedMonth: null // Track the selected month
    };
  },
  methods: {
    generateAndRenderCharts() {
      this.generateMockData();
      this.renderCombinedChart();
    },
    generateMockData() {
      // Generate random data for each asset type
      this.equityData = this.generateDataArray();
      this.bondsData = this.generateDataArray();
      this.realEstateData = this.generateDataArray();
      this.banksData = this.generateDataArray();
      this.otherData = this.generateDataArray();
    },
    generateDataArray() {
      const dataArray = [];
      for (let i = 0; i < 12; i++) {
        dataArray.push(Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000);
      }
      return dataArray;
    },
    renderCombinedChart() {
      const ctx = document.getElementById('combinedChartCanvas').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.generateLabels(),
          datasets: [
            {
              label: 'Equity',
              data: this.equityData,
              borderColor: this.generateRandomColor(),
              backgroundColor: this.generateRandomColor(0.2),
              borderWidth: 1,
              fill: false
            },
            {
              label: 'Bonds',
              data: this.bondsData,
              borderColor: this.generateRandomColor(),
              backgroundColor: this.generateRandomColor(0.2),
              borderWidth: 1,
              fill: false
            },
            {
              label: 'Real Estate',
              data: this.realEstateData,
              borderColor: this.generateRandomColor(),
              backgroundColor: this.generateRandomColor(0.2),
              borderWidth: 1,
              fill: false
            },
            {
              label: 'Banks',
              data: this.banksData,
              borderColor: this.generateRandomColor(),
              backgroundColor: this.generateRandomColor(0.2),
              borderWidth: 1,
              fill: false
            },
            {
              label: 'Other',
              data: this.otherData,
              borderColor: this.generateRandomColor(),
              backgroundColor: this.generateRandomColor(0.2),
              borderWidth: 1,
              fill: false
            }
          ]
        },
        options: {
          scales: {
            xAxes: [{
              type: 'time',
              time: {
                unit: 'month',
                displayFormats: {
                  month: 'MMM YYYY'
                }
              },
              ticks: {
                source: 'labels'
              }
            }],
            yAxes: [{
              ticks: {
                beginAtZero: false
              }
            }]
          },
          animation: {
            duration: this.animationDuration,
            easing: 'linear'
          }
        }
      });
    },

    generateLabels() {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // Set end date to a year in the future

      const labels = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        labels.push(currentDate.toLocaleDateString());
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      return labels;
    },
    generateRandomColor(alpha = 1) {
      return `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${alpha})`;
    },
    toggleCalculator() {
      this.showCalculator = !this.showCalculator;
    }
  }
};
</script>

<style scoped>
h1 {
  text-align: center;
  margin-bottom: 20px;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  grid-gap: 20px;
}

.chart-row {
  width: 80%;
  transition: transform 0.3s ease;
  justify-content: center;
  align-items: center;
}

.chart-row:hover {
  transform: scale(1.0);
}

.calculator-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #007bff;
}

.calculator-toggle i {
  transition: transform 0.3s ease;
}

.calculator-toggle:hover i {
  transform: scale(1.1);
}
</style>
