<template>
    <div>
      <LineChart :chartData="chartData" :options="options" />
    </div>
  </template>
  
  <script>
  import { Line } from 'vue-chartjs';
  import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js';
  
  ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale);
  
  export default {
    name: 'PortfolioChart',
    components: {
      LineChart: Line
    },
    props: {
      chartData: {
        type: Object,
        required: true
      },
      options: {
        type: Object,
        required: false,
        default: () => ({})
      }
    }
  };
  </script>
  
  <style scoped>
  .chart-container {
    position: relative;
    margin: auto;
    height: 40vh;
    width: 80vw;
  }
  </style>
  