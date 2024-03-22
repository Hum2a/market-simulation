<template>
  <div>
    <h1>Start Page</h1>
    <div class="groups">
      <div v-for="(group, index) in groups" :key="index" class="group">
        <div class="group-header">
          <h2>
            {{ group.name }}
            <button @click="editGroupName(index)" class="edit-group-btn">✎</button>
            <button @click="removeGroup(index)" class="remove-group-btn">X</button>
          </h2>
        </div>
        <div class="group-content">
          <div class="inputs">
            <div class="input-row">
              <label for="equity">Equity:</label>
              <input type="text" v-model="group.equity" id="equity">
            </div>
            <div class="input-row">
              <label for="bonds">Bonds:</label>
              <input type="text" v-model="group.bonds" id="bonds">
            </div>
            <div class="input-row">
              <label for="realEstate">Real Estate:</label>
              <input type="text" v-model="group.realEstate" id="realEstate">
            </div>
            <div class="input-row">
              <label for="banks">Bank Accounts:</label>
              <input type="text" v-model="group.banks" id="banks">
            </div>
            <div class="input-row">
              <label for="other">Other:</label>
              <input type="text" v-model="group.other" id="other">
            </div>
          </div>
          <button @click="generateRandomValues(index)">Generate Random Values</button>
          <!-- Pie chart -->
          <canvas :id="'pieChart_' + index" class="pie-chart"></canvas>
        </div>
      </div>
    </div>
    <button @click="addGroup" class="add-group-btn">Add Group</button>
    <button @click="goToNextPage" class="go-btn">Go</button>
  </div>
</template>

<script>
import Chart from 'chart.js'; // Import Chart.js

export default {
  name: 'StartPage',
  data() {
    return {
      groups: [
        { name: 'Group 1', equity: '', bonds: '', realEstate: '', banks: '', other: '' },
        { name: 'Group 2', equity: '', bonds: '', realEstate: '', banks: '', other: '' },
        { name: 'Group 3', equity: '', bonds: '', realEstate: '', banks: '', other: '' },
        { name: 'Group 4', equity: '', bonds: '', realEstate: '', banks: '', other: '' }
      ]
    };
  },
  methods: {
    addGroup() {
      const groupName = prompt("Enter group name:");
      if (groupName) {
        this.groups.push({
          name: groupName,
          equity: '',
          bonds: '',
          realEstate: '',
          banks: '',
          other: ''
        });
      }
    },
    editGroupName(index) {
      const newName = prompt("Enter new group name:", this.groups[index].name);
      if (newName && newName.trim() !== '') {
        this.groups[index].name = newName.trim();
      }
    },
    removeGroup(index) {
      this.groups.splice(index, 1);
    },
    goToNextPage() {
      console.log('Navigating to SecondPage...');
      this.$router.push({ name: 'SecondPage', params: { groups: this.groups } });
    },
    generateRandomValues(index) {
      this.groups[index].equity = Math.floor(Math.random() * 1001);
      this.groups[index].bonds = Math.floor(Math.random() * 1001);
      this.groups[index].realEstate = Math.floor(Math.random() * 1001);
      this.groups[index].banks = Math.floor(Math.random() * 1001);
      this.groups[index].other = Math.floor(Math.random() * 1001);
      this.renderPieChart(index);
    },
    renderPieChart(index) {
      const ctx = document.getElementById('pieChart_' + index).getContext('2d');
      const group = this.groups[index];
      const totalValue = this.getTotalValue(group);

      const chartData = {
        labels: ['Equity', 'Bonds', 'Real Estate', 'Bank Accounts', 'Other'],
        datasets: [{
          label: 'Asset Allocation',
          data: [
            (group.equity / totalValue) * 100,
            (group.bonds / totalValue) * 100,
            (group.realEstate / totalValue) * 100,
            (group.banks / totalValue) * 100,
            (group.other / totalValue) * 100
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderWidth: 1
        }]
      };

      const percentagePlugin = {
        id: 'percentagePlugin',
        beforeDraw: function(chart) {
          const width = chart.chart.width;
          const height = chart.chart.height;
          const ctx = chart.chart.ctx;

          ctx.restore();
          const fontSize = (height / 114).toFixed(2);
          ctx.font = fontSize + "em sans-serif";
          ctx.textBaseline = "middle";

          const text = chart.config.data.datasets[0].data.map(val => val.toFixed(2) + '%');
          const data = chart.config.data.datasets[0].data;

          let position = 0;
          data.forEach((value, index) => {
            const textWidth = ctx.measureText(text[index]).width;
            const textX = Math.round((width - textWidth) / 2);
            const textY = height / 2 + position;
            ctx.fillText(text[index], textX, textY);
            position += (height / 5);
          });

          ctx.save();
        }
      };

      new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Asset Allocation'
            },
            percentagePlugin // Include the percentage plugin
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 15,
              usePointStyle: true
            }
          }
        }
      });
    },
    getTotalValue(group) {
      return group.equity + group.bonds + group.realEstate + group.banks + group.other;
    }
  }
};
</script>

<style scoped>
h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #FF0000; /* Red color */
}

.groups {
  display: flex;
  flex-wrap: wrap;
}

.group {
  margin-right: 20px;
  margin-bottom: 20px;
  background-color: #000000; /* Black background */
  padding: 20px;
  border-radius: 10px;
  color: #FFFFFF; /* White text color */
  width: 300px; /* Set a fixed width for each group container */
}

.group-header {
  margin-bottom: 15px;
}

.group-content {
  display: flex;
  flex-direction: column;
}

.inputs {
  display: flex;
  flex-direction: column;
}

.input-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.input-row label {
  flex: 1; /* Take up remaining space */
  margin-right: 10px; /* Add some spacing between label and input */
}

.input-row input {
  flex: 2; /* Take up more space than label */
}

.add-group-btn {
  background-color: #FF0000; /* Red button */
  color: #FFFFFF; /* White text color */
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-group-btn:hover {
  background-color: #990000; /* Darker red on hover */
}

.edit-group-btn {
  background-color: transparent;
  border: none;
  color: #FFFFFF; /* White text color */
  font-size: 1em;
  cursor: pointer;
}

.edit-group-btn:hover {
  color: #FF0000; /* Red color on hover */
}

.remove-group-btn {
  background-color: transparent;
  border: none;
  color: #FFFFFF; /* White text color */
  font-size: 1em;
  cursor: pointer;
}

.remove-group-btn:hover {
  color: #FF0000; /* Red color on hover */
}

.go-btn {
  background-color: #FF0000; /* Red button */
  color: #FFFFFF; /* White text color */
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px; /* Add margin between buttons */
  transition: background-color 0.3s;
}

.go-btn:hover {
  background-color: #990000; /* Darker red on hover */
}

/* Style for pie charts */
.pie-chart {
  width: 300px; /* Set a fixed width */
  height: 300px; /* Set a fixed height */
  margin-top: 2px;
}
</style>
