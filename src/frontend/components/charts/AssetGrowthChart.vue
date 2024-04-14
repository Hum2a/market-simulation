<template>
    <div class="width">
      <canvas ref="chart" height="100"></canvas>
  </div>
  </template>
  
  <script>
  import { Chart } from 'chart.js';
  
  export default {
    name: 'AssetGrowthChart',
    props: {
      chartData: {
        type: Object,
        required: true,
      },
      options: {
        type: Object,
        default: () => ({}),
      },
    },
    data() {
      return {
        chartInstance: null,
      };
    },
    watch: {
      chartData: {
        handler(newData) {
          if (this.chartInstance) {
            this.chartInstance.data = newData;
            this.chartInstance.update();
          }
        },
        deep: true,
      },
    },
    mounted() {
      this.initializeChart();
    },
    methods: {
      initializeChart() {
        const ctx = this.$refs.chart.getContext('2d');
        this.chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            ...this.chartData,
            datasets: this.chartData.datasets.map(dataset => ({
              ...dataset,
              tension: 1 // Adjust this value between 0 and 1 to control curve smoothness
            }))
          },
          options: {
            ...this.options,
            animation: {
              duration: 500, // Match this to the timeout delay
              easing: 'linear'
            },
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true
                }
              }]
            },
            responsive: true,
            maintainAspectRatio: true,
          },
        });
      },
    },
    beforeUnmount() {
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }
    },
  };
  </script>
  
  <style scoped>
  .width {
    width: 100%;
  }
  </style>
  