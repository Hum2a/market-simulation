<template>
    <div>
      <h1>Asset Growth Simulator</h1>
      <div class="groups">
        <!-- Asset group input forms -->
        <div v-for="(group, index) in groups" :key="index" class="group">
          <h2>{{ group.name }}</h2>
          <!-- Asset inputs -->
          <div class="input-row" v-for="(value, key) in group.assets" :key="key">
            <label>{{ key }}:</label>
            <input type="number" v-model="group.assets[key]">
          </div>
          <button @click="removeGroup(index)">Remove Group</button>
        </div>
        <button @click="addGroup">Add Group</button>
      </div>
  
      <div class="controls">
        <!-- Interest Rate Input -->
        <div class="input-row">
          <label>Interest Rate (% per month):</label>
          <input type="number" v-model="userInterestRate" placeholder="Enter interest rate (e.g., 5 for 5%)">
        </div>
        <button @click="simulateGrowth">Simulate Growth</button>
      </div>
  
      <!-- Simulation Results Table -->
      <div v-if="displaySimulation" class="simulation-results">
        <h2>Simulation Results</h2>
        <table>
          <thead>
            <tr>
              <th>Group Name</th>
              <th v-for="n in simulationMonths" :key="n">After {{ n }} Month(s)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in savedGroups" :key="group.name">
              <td>{{ group.name }}</td>
              <td v-for="(value, index) in group.monthlyValues.equity" :key="index">{{ value.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Growth Chart -->
      <div v-if="displaySimulation" class="growth-chart">
        <canvas id="growthChart"></canvas>
      </div>
    </div>
  </template>
  
  <script>
  import Chart from 'chart.js';
  
  export default {
    name: 'AssetGrowthSimulator',
    data() {
      return {
        groups: [],
        savedGroups: [],
        displaySimulation: false,
        simulationMonths: 12,
        userInterestRate: 5,
      };
    },
    methods: {
      addGroup() {
        const name = prompt('Enter the name for the new group:');
        if (name) {
          this.groups.push({
            name: name,
            assets: {
              Equity: 0,
              Bonds: 0,
              RealEstate: 0,
              Banks: 0,
              Other: 0,
            },
          });
        }
      },
      removeGroup(index) {
        this.groups.splice(index, 1);
      },
      simulateGrowth() {
        const rate = this.userInterestRate / 100;
        this.savedGroups = this.groups.map(group => {
          const monthlyValues = {
            equity: [Number(group.assets.Equity)],
          };
  
          for (let month = 1; month <= this.simulationMonths; month++) {
            const lastValue = monthlyValues.equity[month - 1];
            monthlyValues.equity.push(lastValue * (1 + rate));
          }
  
          return {
            name: group.name,
            monthlyValues,
          };
        });
  
        this.displaySimulation = true;
        this.$nextTick(() => {
          this.renderGrowthChart();
        });
      },
      renderGrowthChart() {
        const ctx = document.getElementById('growthChart').getContext('2d');
        const labels = Array.from({ length: this.simulationMonths + 1 }, (_, i) => `Month ${i}`);
        const datasets = this.savedGroups.map(group => ({
          label: group.name,
          data: group.monthlyValues.equity,
          borderColor: this.getRandomColor(),
          fill: false,
        }));
  
        new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: {
            scales: {
              yAxes: [{
                ticks: { beginAtZero: true },
              }],
            },
          },
        });
      },
      getRandomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
      },
    },
  };
  </script>
  
  <style>
  .group {
  margin-bottom: 20px;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 8px;
}

.input-row {
  margin: 10px 0;
  display: flex;
  align-items: center;
}

.input-row label {
  margin-right: 10px;
  width: 150px;
}

.input-row input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.controls, .simulation-results, .growth-chart {
  margin-top: 20px;
}

button {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 10px;
}

button:hover {
  background-color: #0056b3;
}

.simulation-results h2, .growth-chart h2 {
  margin-bottom: 15px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table, th, td {
  border: 1px solid #ddd;
}

th, td {
  text-align: left;
  padding: 8px;
}

th {
  background-color: #f2f2f2;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

.canvas-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* Aspect Ratio 16:9 */
  height: 0;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>