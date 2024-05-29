<template>
  <div>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
import { defineComponent, ref, onMounted, watch } from 'vue';

Chart.register(...registerables);

export default defineComponent({
  name: 'LineChart',
  props: {
    chartData: {
      type: Object,
      required: true
    },
    chartOptions: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const canvas = ref(null);
    let chartInstance = null;

    const renderChart = () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
      chartInstance = new Chart(canvas.value, {
        type: 'line',
        data: props.chartData,
        options: props.chartOptions
      });
    };

    onMounted(() => {
      renderChart();
    });

    watch(() => props.chartData, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        renderChart();
      }
    }, { deep: true });

    watch(() => props.chartOptions, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        renderChart();
      }
    }, { deep: true });

    return {
      canvas
    };
  }
});
</script>

<style scoped>
canvas {
  width: 100%;
  height: 400px;
}
</style>
