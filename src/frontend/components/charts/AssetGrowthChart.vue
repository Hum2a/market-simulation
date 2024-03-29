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
        isPaused: true,
        animationFrameId: null,
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
          data: this.chartData,
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
      pauseAnimation() {
        this.isPaused = true;
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
      },
      resumeAnimation() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.animateChart();
      },
      animateChart() {
        if (this.isPaused) return;
        // Example of updating chart data (you'll need to customize this)
        // Assuming your data structure allows, you might add or update a data point here.
        // this.chartData.datasets[0].data.push(newValue);

        this.chartInstance.update();
        // Call animateChart again using requestAnimationFrame to continue the loop
        this.animationFrameId = requestAnimationFrame(this.animateChart);
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
  