<template>
    <div>
      <canvas ref="canvas"></canvas>
    </div>
  </template>
  
  <script>
  import { Line } from 'chart.js';
  
  export default {
    name: 'LineChart',
    props: {
      data: {
        type: Object,
        required: true
      },
      options: {
        type: Object,
        required: true
      }
    },
    mounted() {
      new Line(this.$refs.canvas, {
        type: 'line',
        data: this.data,
        options: this.options
      });
    }
  };
  </script>
  
  <style scoped>
  canvas {
    max-width: 100%;
  }
  </style>
  