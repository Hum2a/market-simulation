<template>
  <div class="investment-calculator">
    <h2>Investment Calculator</h2>
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
          <p>Future Value of Investments: {{ futureValue }}</p>
        </div>
      </div>
      <div class="calculator-chart">
        <canvas id="investmentChart" width="800" height="400"></canvas>
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
  }
};
</script>

<style scoped>
.investment-calculator {
  background-color: black;
  color: red;
  border: 2px solid red;
  border-radius: 10px;
  padding: 20px;
  font-family: Arial, sans-serif;
  justify-content: center; /* Center the content */
  align-items: center; /* Center items vertically */
  justify-content: space-between; /* Add space between inputs and chart */
  font-family: Arial, sans-serif;
}

.calculator-content {
  display: flex;
  flex-direction: row; /* Align items in a row */
  align-items: flex-start; /* Align items at the start of the cross axis */
  gap: 20px; /* Add some space between the input group and the chart */
}
.calculator-inputs {
  flex: 1;
}

.calculator-chart {
  flex: 12; /* Give more flex-grow ratio to the chart container */
  display: absolute;
  justify-content: center;
  align-items: center;
}

.input-group {
  margin-bottom: 15px;
}

label {
  display: inline-block;
  width: 200px;
  color: red;
}

.calculator-input {
  width: 150px;
  padding: 5px;
  border-radius: 5px;
}

.calculate-button {
  padding: 10px 20px;
  background-color: red;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.result {
  margin-top: 20px;
  font-weight: bold;
  color: red;
}
</style>
