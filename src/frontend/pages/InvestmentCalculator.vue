<template>
  <header class="header">
    <img src="../assets/LifeSmartLogo.png" alt="Logo" class="logo">
    <p v-if="userEmail" class="welcome-message">Welcome Back {{ userEmail }}</p>
    <div>
      <button @click="toggleCalculator" class="calculator-toggle">
        <i class="fas fa-calculator"></i>
      </button>
      <button @click="toggleSimulationControls" class="simulation-controls-toggle">
        <img src="../assets/settings (1) 1.png" alt="Controls">
      </button>
      <button @click="toggleSimulationHistory" class="simulation-history-toggle">
        <img src="../assets/calendar 1.png" alt="Calendar">
      </button>
      <button @click="toggleLogin" class ="simulation-login-toggle">
        <img src="../assets/login.png" alt="Login">
      </button>
    </div>
</header>
  <div class="investment-calculator">
    <div class="calculator-content">
      <div class="calculator-inputs">
        <div class="input-group">
          <label for="initialInvestment">Initial Investment:</label>
          <input type="number" id="initialInvestment" v-model="initialInvestment" class="calculator-input">
        </div>
        <div class="input-group">
          <label for="monthlyContribution">Monthly Contribution:</label>
          <input type="number" id="monthlyContribution" v-model="monthlyContribution" class="calculator-input">
        </div>
        <div class="input-group">
          <label for="investmentPeriod">Investment Period (years):</label>
          <input type="number" id="investmentPeriod" v-model="investmentPeriod" class="calculator-input">
        </div>
        <div class="input-group" v-for="rate in annualReturnRates" :key="rate.id">
          <label :for="'annualReturnRate' + rate.id">Expected Annual Return Rate (%) for {{ rate.id }}:</label>
          <input type="number" :id="'annualReturnRate' + rate.id" v-model="rate.value" class="calculator-input">
        </div>
        <button @click="calculate" class="calculate-button">Calculate</button>
        <div class="result" v-if="futureValue !== null">
          <p class="future-value-display">Future Value of Investments: {{ futureValue }}</p>
        </div>
      </div>
      <div class="right-side">
        <h2 class="investment-calculator-title-container">
          <img src="../assets/Blue line.png" alt="BlueLine" class="blueline">
          <span class="investement-calculator-title">Group Management</span>
          <span v-html="legendHtml" class="chart-legend"></span> <!-- This span will hold the legend -->
        </h2>
        <div class="calculator-chart">
          <canvas id="investmentChart" width="800" height="400"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js';

export default {
  name: 'InvestmentCalculator',
  data() {
    return {
      initialInvestment: null,
      monthlyContribution: null,
      investmentPeriod: null,
      annualReturnRate: null,
      futureValue: null,
      chart: null, // Store chart instance
      annualReturnRates: [
        { id: 'Rate 1', value: null },
        { id: 'Rate 2', value: null },
        { id: 'Rate 3', value: null }
      ],
      legendHtml: ''
    };
  },
  methods: {
    calculate() {
      const principal = parseFloat(this.initialInvestment);
      const monthlyContribution = parseFloat(this.monthlyContribution);
      const years = parseInt(this.investmentPeriod);

      const n = 12; // Compounded monthly
      const t = years;

      // Adjust the labels to display years instead of months
      const labels = Array.from({ length: t + 1 }, (_, i) => i === 0 ? 'Start' : `${i} year${i > 1 ? 's' : ''}`);
      
      const datasets = this.annualReturnRates.map(rate => {
        const r = parseFloat(rate.value) / 100 / n;
        let currentValue = principal;
        const data = [currentValue];
        for (let i = 1; i <= t * n; i++) {
          if (i % n === 0) { // Only push the value at the end of each year
            currentValue = currentValue * (1 + r) + monthlyContribution;
            data.push(currentValue);
          } else {
            // Calculate the value but don't push it, to keep the data points aligned with the yearly labels
            currentValue = currentValue * (1 + r) + monthlyContribution;
          }
        }
        return {
          label: `Investment Growth at ${rate.value}%`,
          data: data,
          fill: false,
          borderColor: this.getRandomColor(),
          tension: 0.1
        };
      });

      const ctx = document.getElementById('investmentChart').getContext('2d');
      if (this.chart) {
        this.chart.destroy(); // Destroy existing chart instance if any
      }
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Time (Years)'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Value'
              }
            }
          }
        }
      });

      this.futureValue = datasets.map(dataset => dataset.data.at(-1).toFixed(2)).join(', ');
      this.legendHtml = this.generateLegend(); 
    },

    getRandomColor() {
    // This is a simple method to generate random colors. You might want to customize this.
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  },
    generateLegend() {
      const legendHtml = this.chart.data.datasets.map((dataset) => {
        return `<span style="display: flex; align-items: center; margin-right: 10px;">
                  <span style="height: 10px; width: 10px; background-color: ${dataset.borderColor}; display: inline-block; margin-right: 5px;"></span>
                  ${dataset.label}
                </span>`;
      }).join("");
      return legendHtml;
    },
  }
};
</script>

<style scoped>
.investment-calculator {
  margin: 20px auto;
  padding: 20px;
  background-color: #f0f2f5;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 95%;
}

.calculator-content {
  display: flex;
  flex-direction: row; /* Ensures children are side-by-side */
  justify-content: space-between; /* Spaces children appropriately */
  align-items: stretch; /* Ensures children stretch to fill the height */
  width: 100%; /* Full width */
  border-radius: 20px;
}


.calculator-inputs {
  flex: 1; /* Adjust this flex grow ratio if necessary */
  display: block; /* Changed from inline-block to block */
  align-items: center;
  padding:  0 10 10 0;
  background-color: #FAEDE4;
  border: 1px solid rgba(0, 0, 0, 0.207);
  width: auto; /* Changed to auto for natural width or set a specific percentage */
  border-radius: 50px 0 0 50px; /* Top-left, top-right, bottom-right, bottom-left */
}

.input-group {
  margin: 20px 20px 0 20px;
  width: 80%;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-size: 16px;
}

.calculator-input {
  width: auto; /* Make inputs take the full width of their container */
  padding: 10px;
  border-radius: 5px;
  color: white;
  background-color: #482ebd;
  border: 1px solid #ccc;
  transition: 0.4s ease-in;
}


.calculator-input:focus {
  outline: none;
  border-color: #2707b4;
}

.calculate-button {
  width: 50%;
  padding: 10 10 10 10;
  margin-top: 10px;
  background-color: #CB0E38;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: 0.4s ease-in;
}

.calculate-button:hover {
  background-color: #f95d5d;
}

.result {
  margin-top: 20px;
  font-size: 18px;
  color: #28a745;
}

.future-value-display {
  font-size: 24px; /* Larger font size for better visibility */
  font-weight: bold; /* Make the text bold */
  color: #4CAF50; /* Bright green color for positive outlook */
  background: rgba(255, 255, 255, 0.8); /* Semi-transparent white background */
  padding: 15px 20px; /* Padding around the text */
  border-radius: 10px; /* Rounded corners */
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2); /* Subtle shadow for 3D effect */
  text-align: center; /* Center the text */
  margin: 20px auto; /* Center the element horizontally and give some space */
  max-width: 80%; /* Max width for better control */
  transition: transform 0.3s ease-in-out, background-color 0.3s ease; /* Smooth transition for hover effects */

  display: block; /* Block display to take full width */
  position: relative; /* Relative positioning for further positioning inside container */
  z-index: 10; /* Higher index so it's above other content */
}

.future-value-display:hover {
  transform: scale(1.05); /* Slightly increase size on hover for interaction feedback */
  background-color: #F8F8F8; /* Lighter background on hover to draw attention */
}

/* Optionally add a subtle entry animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.future-value-display {
  animation: fadeIn 0.5s ease-out forwards; /* Apply the animation */
}

.calculator-chart {
  flex: 2;
  background-color: #FAEDE4;
  border: 1px solid rgba(0, 0, 0, 0.207);
  width: 100%;
  height: 88%;
}

.right-side {
  display: block;
  width: 80%;
  height: auto;
}

.investment-calculator-title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  margin-top: 20px;
  margin-bottom: 20px;
  color: #000000; /* Sets the text color to black */
  height: 5%;
  gap: 10px;
}

.investment-calculator-title {
  text-align: left;
}

.chart-legend {
  display: flex;
  align-items: center; /* Vertically align the legend icons and text */
  text-align: right;
  justify-content: flex-end; /* Align the legend content to the right */
  font-size: 12px; /* Smaller text size; adjust as needed */
  white-space: nowrap; /* Ensures it stays in a single line */
}
</style>

