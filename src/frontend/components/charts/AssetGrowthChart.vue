<template>
    <div>
      <canvas ref="chart" height="500"></canvas>
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
              tension: 0.4 // Adjust this value between 0 and 1 to control curve smoothness
            }))
          },
          options: {
            ...this.options,
            scales: {
              y: {
                beginAtZero: true,
              },
            },
            responsive: true,
            maintainAspectRatio: false,
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
  /* Add styles if needed */
  </style>
  