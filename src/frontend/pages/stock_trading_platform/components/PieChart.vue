<template>
  <canvas ref="canvas"></canvas>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default {
  name: 'PieChart',
  props: {
    chartData: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const canvasRef = ref(null);
    let chartInstance = null;

    const renderChart = () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
      chartInstance = new Chart(canvasRef.value, {
        type: 'pie',
        data: props.chartData,
      });
    };

    onMounted(() => {
      renderChart();
    });

    watch(
      () => props.chartData,
      () => {
        renderChart();
      },
      { deep: true }
    );

    onBeforeUnmount(() => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    });

    return {
      canvasRef,
    };
  },
};
</script>

<style scoped>
canvas {
  max-width: 100%;
}
</style>
