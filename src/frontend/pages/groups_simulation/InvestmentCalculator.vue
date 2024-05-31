<template>
  <header class="header">
    <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo">
    <p v-if="userEmail" class="welcome-message">Welcome Back {{ userEmail }}</p>
    <div>
      <button @click="toggleBack" class="calculator-toggle">
        <i class="fas fa-calculator"></i>
      </button>
    </div>
  </header>
  <div class="investment-calculator">
    <div class="calculator-content">
      <div class="calculator-inputs">
        <div class="input-group">
          <label for="initialInvestment">Initial Investment:</label>
          <input type="number" placeholder="£" id="initialInvestment" v-model="initialInvestment" class="calculator-input">
        </div>
        <div class="input-group">
          <label for="monthlyContribution">Monthly Contribution:</label>
          <input type="number" placeholder="£" id="monthlyContribution" v-model="monthlyContribution" class="calculator-input">
        </div>
        <div class="input-group">
          <label for="investmentPeriod">Investment Period (years):</label>
          <input type="number" placeholder="£" id="investmentPeriod" v-model="investmentPeriod" class="calculator-input">
        </div>
        <div class="input-group" v-for="rate in annualReturnRates" :key="rate.id">
          <label :for="'annualReturnRate' + rate.id">Expected Annual Return {{ rate.id }}:</label>
          <input type="number" placeholder="£" :id="'annualReturnRate' + rate.id" v-model="rate.value" class="calculator-input">
        </div>
        <button @click="calculate" class="calculate-button">Calculate</button>
      </div>
      <div class="right-side">
        <h2 class="investment-calculator-title-container">
          <div class="title-and-image">
            <img src="../../assets/Blue line.png" alt="BlueLine" class="blueline">
            <span class="investment-calculator-title">InvestmentCalculator</span>
          </div>
          <span v-html="legendHtml" class="chart-legend"></span>
        </h2>
        <div class="calculator-chart">
          <canvas id="investmentChart" width="800" height="400"></canvas>
        </div>
      </div>
    </div>
    <div class="result" v-if="futureValues.length > 0">
      <div v-for="(value, index) in futureValues" :key="'futureValue' + index">
        <p class="future-value-display">Future Value {{ index + 1 }}: <span class="future-value">£{{ value }}</span></p>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart } from 'chart.js/auto';

export default {
  name: 'InvestmentCalculator',
  data() {
    return {
      initialInvestment: null,
      monthlyContribution: null,
      investmentPeriod: null,
      annualReturnRate: null,
      futureValues: [],
      chart: null,
      annualReturnRates: [
        { id: 'Rate 1', value: null },
        { id: 'Rate 2', value: null },
        { id: 'Rate 3', value: null }
      ],
      legendHtml: ''
    };
  },
  mounted() {
    this.renderChart();
  },
  methods: {
    renderChart(datasets = []) {
      const ctx = document.getElementById('investmentChart').getContext('2d');
      if (this.chart) {
        this.chart.destroy();
      }
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array.from({ length: 11 }, (_, i) => (i === 0 ? 'Start' : `${i}`)),
          datasets: datasets
        },
        options: {
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': £';
                  }
                  label += context.parsed.y.toFixed(2);
                  return label;
                }
              }
            },
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Time (Years)'
              },
              grid: {
                display: false
              }
            },
            y: {
              title: {
                display: true,
                text: 'Value'
              },
              grid: {
                display: true
              },
              ticks: {
                callback: function (value) {
                  return '£' + value.toFixed(2);
                }
              }
            }
          }
        }
      });
    },
    calculate() {
      const principal = parseFloat(this.initialInvestment);
      const monthlyContribution = parseFloat(this.monthlyContribution);
      const years = parseInt(this.investmentPeriod);

      const n = 12;
      const t = years;

      const datasets = this.annualReturnRates.map(rate => {
        const r = parseFloat(rate.value) / 100 / n;
        let currentValue = principal;
        const data = [currentValue];
        for (let i = 1; i <= t * n; i++) {
          currentValue = currentValue * (1 + r) + monthlyContribution;
          if (i % 12 === 0) data.push(currentValue);
        }
        return {
          label: `Investment Growth at ${rate.value}%`,
          data: data,
          fill: false,
          borderColor: this.getRandomColor(),
          tension: 0.1
        };
      });

      this.renderChart(datasets);

      this.futureValues = datasets.map(dataset => dataset.data.at(-1).toFixed(2));
      this.legendHtml = this.generateLegend();
    },
    getRandomColor() {
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
    toggleBack() {
      if (window.history.length > 1) {
        this.$router.go(-1);
      } else {
        this.$router.push('/');
      }
    }
  }
};
</script>

<style scoped>
.investment-calculator {
  margin: 20px auto;
  padding: 20px;
  background-color: #ffffff;
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
  /* align-items: stretch; */
  width: 100%; /* Full width */
  border-radius: 20px;
}

.calculator-inputs {
  flex: 1; /* Adjust this flex grow ratio if necessary */
  display: block; /* Changed from inline-block to block */
  align-items: center;
  padding:  0 10 10 0;
  background-color: #FAEDE4;
  border: 1px solid rgba(0, 0, 0, 0.048);
  width: auto; /* Changed to auto for natural width or set a specific percentage */
  border-radius: 50px 0 0 50px; /* Top-left, top-right, bottom-right, bottom-left */
  height: auto;
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
  background-color: #082148;
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
  background-color: #ffffff; /* Light background for the result */
  border-radius: 10px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.1); /* Subtle shadow for depth */
  text-align: center; /* Center-align the text */
  width: 100%; /* Full width for better control in various devices */
}

.future-value-display {
  font-size: 20px; /* Increased font size for better visibility */
  color: #333; /* Dark grey for text, ensuring good readability */
  margin: 0; /* Reset margins for clean spacing */
}

.future-value {
  display: block; /* Block display for the value */
  font-size: 24px; /* Larger font size for the value */
  color: #4CAF50; /* Green color for positive outlook, change as per your branding */
  font-weight: bold; /* Bold for emphasis */
  margin-top: 10px; /* Space between label and value */
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
  border: 1px solid rgba(0, 0, 0, 0.058);
  width: 100%;
  height: 88%;
}

.right-side {
  display: flex;
  flex-direction: column;
  width: 80%; /* Ensure it takes the full width */
  height: auto; /* Adjust height to contain its children or set to 100% if you want it to take full container height */
}


.investment-calculator-title-container {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Keeps items on each end */
  text-align: left;
  margin-top: 20px;
  margin-bottom: 20px;
  color: #000000;
  height: 5%;
}

.title-and-image {
  display: flex;
  align-items: center; /* Aligns the image and text vertically */
}

.investment-calculator-title {
  margin-left: 10px; /* Adds spacing between the image and the title */
}

.chart-legend {
  flex-shrink: 0; /* Prevents the legend from shrinking */
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 12px;
  white-space: nowrap;
}

</style>

