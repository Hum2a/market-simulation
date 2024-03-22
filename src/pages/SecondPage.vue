<template>
    <div>
      <h1>Second Page</h1>
      <button @click="toggleCalculator" class="calculator-toggle">
        <i class="fas fa-calculator"></i>
      </button>
      <div class="chart-container">
        <canvas id="myChart"></canvas>
      </div>
      <InvestmentCalculator v-if="showCalculator" />
    </div>
  </template>
  
  <script>
  import Chart from 'chart.js';
  import InvestmentCalculator from '../components/InvestmentCalculator/InvestmentCalculator.vue'; // Import the InvestmentCalculator component
  
  export default {
    name: 'SecondPage',
    components: {
      InvestmentCalculator // Register the InvestmentCalculator component
    },
    data() {
      return {
        showCalculator: false // Initially hide the calculator
      };
    },
    mounted() {
      this.renderChart();
    },
    methods: {
      renderChart() {
        const ctx = document.getElementById('myChart').getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
              label: '# of Votes',
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true
                }
              }]
            }
          }
        });
      },
      toggleCalculator() {
        this.showCalculator = !this.showCalculator; // Toggle the visibility of the calculator
      }
    }
  };
  </script>
  
  <style scoped>
  h1 {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .chart-container {
    width: 80%;
    margin: auto;
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
  