<template>
  <div class="pie-chart-container">
    <canvas ref="canvas" width="400" height="400"></canvas>
  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
import { defineComponent, ref, onMounted, watch } from 'vue';

Chart.register(...registerables);

export default defineComponent({
  name: 'PieChart',
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
        type: 'pie',
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
.pie-chart-container {
  width: 300px;  /* Fixed width */
  height: 300px; /* Fixed height */
  display: flex;
  justify-content: center;
  align-items: center;
}

canvas {
  display: block;
}
</style>
