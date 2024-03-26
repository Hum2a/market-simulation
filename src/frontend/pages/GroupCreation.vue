<template>
    <div>
    <button @click="toggleCalculator" class="calculator-toggle">
        <i class="fas fa-calculator"></i>
    </button>
    <button @click="toggleSimulationControls" class="simulation-controls-toggle">
        <i class="fas fa-cogs"></i> <!-- Using Font Awesome's cogs icon as an example -->
    </button>
    <InvestmentCalculator v-if="showCalculator" />
    <SimulationControls v-if="showSimulationControls" />

      <h1>Group Management</h1>
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
                <input type="text" v-model="group.equity" id="equity" class="modern-input">
              </div>
              <div class="input-row">
                <label for="bonds">Bonds:</label>
                <input type="text" v-model="group.bonds" id="bonds" class="modern-input">
              </div>
              <div class="input-row">
                <label for="realEstate">Real Estate:</label>
                <input type="text" v-model="group.realEstate" id="realEstate" class="modern-input">
              </div>
              <div class="input-row">
                <label for="banks">Bank Accounts:</label>
                <input type="text" v-model="group.banks" id="banks" class="modern-input">
              </div>
              <div class="input-row">
                <label for="other">Other:</label>
                <input type="text" v-model="group.other" id="other" class="modern-input">
              </div>
            </div>
            <button @click="generateRandomValues(index)" class="modern-button">Generate Random Values</button>
            <div class="pie-chart-container">
                <canvas :id="'pieChart_' + index"></canvas>
            </div>
          </div>
        </div>
      </div>
      <button @click="addGroup" class="add-group-btn">Add Group</button>
      <button @click="saveGroups" class="modern-button">Go to Simulation</button>
    </div>
  </template>
  
<script>

import Chart from 'chart.js';
import { useRouter } from 'vue-router';
import { getFirestore, doc, setDoc  } from 'firebase/firestore';
import InvestmentCalculator from '../components/InvestmentCalculator/InvestmentCalculator.vue';
import SimulationControls from './SimulationControls.vue'; // Adjust the path as necessary

  export default {
    name: 'GroupCreation',
    components: {
    InvestmentCalculator,
    SimulationControls,
    },
    setup() {
        const router = useRouter();

        return {
            router,
        };
    },
    data() {
      return {
        groups: [
          { name: 'Group 1', equity: '', bonds: '', realEstate: '', banks: '', other: '' }
        ],
        showCalculator: false,
        showSimulationControls: false,
      };
    },
    methods: {
      addGroup() {
        const groupName = prompt("Enter group name:");
        if (groupName) {
          this.groups.push({
            name: groupName, equity: '', bonds: '', realEstate: '', banks: '', other: ''
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
      async saveGroups() {
        const db = getFirestore();
        
        try {
            await Promise.all(this.groups.map(group => {
                // Use the group name as the document ID
                const groupDocRef = doc(db, 'groups', group.name);
                return setDoc(groupDocRef, group);
            }));
            alert('Groups saved successfully!');
        } catch (err) {
            console.error('Error saving groups to Firestore: ', err);
            alert('Failed to save groups.');
        }
        
        // Navigate to the simulation page
        this.router.push({ name: 'SimulationPage' });
    },
      generateRandomValues(index) {
        const group = this.groups[index];
        group.equity = Math.floor(Math.random() * 1001).toString();
        group.bonds = Math.floor(Math.random() * 1001).toString();
        group.realEstate = Math.floor(Math.random() * 1001).toString();
        group.banks = Math.floor(Math.random() * 1001).toString();
        group.other = Math.floor(Math.random() * 1001).toString();
      },
      renderPieChart(index) {
      const group = this.groups[index];
      const ctx = document.getElementById('pieChart_' + index).getContext('2d');
      
      const data = {
        labels: ['Equity', 'Bonds', 'Real Estate', 'Bank Accounts', 'Other'],
        datasets: [{
          label: `${group.name} Asset Allocation`,
          data: [group.equity, group.bonds, group.realEstate, group.banks, group.other],
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgba(255,99,132,1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      };

      new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    },
      getTotalValue(group) {
        return Object.keys(group).reduce((total, key) => {
          if (key !== 'name') {
            total += parseFloat(group[key]) || 0;
          }
          return total;
        }, 0);
      },
      toggleCalculator() {
        this.showCalculator = !this.showCalculator;
    },
        toggleSimulationControls() {
            this.showSimulationControls = !this.showSimulationControls;
        },  
    },
    mounted() {
    this.groups.forEach((group, index) => {
      this.$nextTick(() => this.renderPieChart(index));
    });
  },
  watch: {
    groups: {
      handler(groups) {
        groups.forEach((group, index) => {
          if (group.equity || group.bonds || group.realEstate || group.banks || group.other) {
            this.$nextTick(() => this.renderPieChart(index));
          }
        });
      },
      deep: true
    }
  }
};
</script>
  
<style scoped>
    @import url('../styles/GroupCreationStyles.css');
</style>
  