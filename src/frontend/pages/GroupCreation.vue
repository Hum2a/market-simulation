<template>
  <div class="dashboard">
    <header class="header">
      <img src="../assets/LifeSmartLogo.png" alt="Logo" class="logo">
      <p v-if="userEmail">Welcome Back, {{ userEmail }}, {{ userUID }}</p>
      <div>
        <button @click="toggleCalculator" class="calculator-toggle">
          <i class="fas fa-calculator"></i>
        </button>
        <button @click="toggleSimulationControls" class="simulation-controls-toggle">
          <img src="../assets/settings (1) 1.png" alt="Controls">
        </button>
        <button @click="toggleSimulationHistory" class="simulation-history-toggle">
          <img src="../assets/calendar 1.png" alt="Calendar">
        </button>
        <button @click="toggleLogin" class ="simulation-login-toggle">
          <img src="../assets/login.png" alt="Login">
        </button>
      </div>
    </header>

    <SimulationControls v-if="showSimulationControls" :userUID="userUID"/>
    <LoginPage v-if="showLoginPage" @login-success="handleUserLogin" />

    <main>
      <h1 class="header-content">
        <img src="../assets/Blue line.png" alt="BlueLine" class="blueline">
        <span>Group Management</span>
      </h1>
      <div class="groups">
        <div v-for="(group, index) in groups" :key="index" class="group">
          <div class="group-header">
            <h2>
              {{ group.name }}
              <button @click="editGroupName(index)" class="edit-group-btn">
                <img src="../assets/pencil 1.png" alt="Pencil">
              </button>
              <button @click="removeGroup(index)" class="remove-group-btn">
                <img src="../assets/remove.png" alt="Remove">
              </button>
            </h2>
          </div>
          <div class="group-content">
            <div class="inputs">
              <div class="input-row">
                <label for="equity">Equity:</label>
                <input type="number" v-model="group.equity" id="equity" class="modern-input">
              </div>
              <div class="input-row">
                <label for="bonds">Bonds:</label>
                <input type="number" v-model="group.bonds" id="bonds" class="modern-input">
              </div>
              <div class="input-row">
                <label for="realestate">Real Estate:</label>
                <input type="number" v-model="group.realestate" id="realestate" class="modern-input">
              </div>
              <!-- <div class="input-row">
                <label for="banks">Bank Accounts:</label>
                <input type="number" v-model="group.banks" id="banks" class="modern-input">
              </div> -->
              <div class="input-row">
                <label for="commodities">Commodities:</label>
                <input type="number" v-model="group.commodities" id="commodities" class="modern-input">
              </div>
              <div class="input-row">
                <label for="other">Other:</label>
                <input type="number" v-model="group.other" id="other" class="modern-input">
              </div>
              <div class="total-value">
                Total Portfolio Value: ${{ getTotalValue(group).toFixed(2) }}
              </div>
            </div>
            <button @click="generateRandomValues(index)" class="modern-button">Generate Random Values</button>
            <div class="pie-chart-container">
                <canvas :id="'pieChart_' + index"></canvas>
            </div>
          </div>
        </div>
        <button @click="addGroup" class="add-group-btn">Add Group</button>
      </div>

      <button @click="startSimulation" class="modern-button">
        Start Simulation
        <img src="../assets/Arrow 17.png" alt="Icon" style="margin-left: 5px;">
      </button>

    </main>
    </div>


    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <span class="close" @click="toggleModal">&times;</span>
        <h3>Add a new group</h3>
        <form @submit.prevent="confirmAddGroup">
          <input type="text" v-model="newGroupName" placeholder="Enter group name" required autofocus>
          <button @click="confirmAddGroup">Confirm</button>
        </form>
      </div>
    </div>
  </template>
  
<script>

import Chart from 'chart.js';
import { useRouter } from 'vue-router';
import { getFirestore, doc, setDoc, collection, query, getDocs, writeBatch } from 'firebase/firestore';
import SimulationControls from './SimulationControls.vue'; // Adjust the path as necessary
import LoginPage from './LoginPage.vue';
// import RegisterPage from './RegisterPage.vue';

  export default {
    name: 'GroupCreation',
    components: {
    SimulationControls,
    LoginPage
    },
    setup() {
        const router = useRouter();

        return {
            router,
            maxPortfolioValue: 3000,
        };
    },
    data() {
      return {
        groups: [
          { name: 'Group 1', equity: '', bonds: '', realestate: '', commodities: '', other: '' },
          { name: 'Group 2', equity: '', bonds: '', realestate: '', commodities: '', other: '' },
          { name: 'Group 3', equity: '', bonds: '', realestate: '', commodities: '', other: '' },
          { name: 'Group 4', equity: '', bonds: '', realestate: '', commodities: '', other: '' }
        ],
        showCalculator: false,
        showSimulationControls: false,
        showModal: false,
        showLoginPage: false,
        newGroupName: '',
        userEmail: null,
        userUID: null
      };
    },
    methods: {
      addGroup() {
        this.toggleModal();
      },
      toggleModal() {
        this.showModal = !this.showModal;
      },
      confirmAddGroup() {
        if (this.newGroupName.trim()) {
          this.groups.push({
            name: this.newGroupName.trim(), equity: '', bonds: '', realestate: '', commodities: '', other: ''
          });
          this.newGroupName = ''; // Reset the input value
          this.toggleModal(); // Close the modal
        } else {
          alert('Please enter a group name.');
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
      async clearGroups() {
        if (!this.userUID) {
            console.error('User UID is undefined or empty.');
            return;
        }
        const db = getFirestore();
        const querySnapshot = await getDocs(query(collection(db, this.userUID, 'Simulation', 'Groups')));
        const batch = writeBatch(db);

        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        console.log('All groups have been removed from Firestore.');
    },

      async saveGroups() {
        const db = getFirestore();
        
        try {
            await Promise.all(this.groups.map(group => {
                // Use the group name as the document ID
                const groupDocRef = doc(db, this.userUID, 'Simulation', 'Groups', group.name);
                return setDoc(groupDocRef, group);
            }));
        } catch (err) {
            console.error('Error saving groups to Firestore: ', err);
            alert('Failed to save groups.');
        }
        
        // Navigate to the simulation page
        this.router.push({ name: 'SimulationPage' });
    },
      async startSimulation() {
        await this.clearGroups(); // Make sure all groups are cleared before saving new ones
        await this.saveGroups(); // Proceed to save the current groups in the component's data
      },
      generateRandomValues(index) {
        const group = this.groups[index];
        let remainingValue = this.maxPortfolioValue;

        const keys = ['equity', 'bonds', 'realestate', 'commodities', 'other'];
        keys.forEach((key, i) => {
          if (i === keys.length - 1) {
            // Assign remaining value to the last asset
            group[key] = remainingValue.toString();
          } else {
            // Assign a random portion of the remaining value to the current asset
            const value = Math.floor(Math.random() * (remainingValue + 1));
            group[key] = value.toString();
            remainingValue -= value;
          }
        });

        this.$nextTick(() => this.renderPieChart(index));
      },

      renderPieChart(index) {
        const group = this.groups[index];
        const ctx = document.getElementById('pieChart_' + index).getContext('2d');
        // const totalValue = this.getTotalValue(group).toFixed(2);
        
        const data = {
          labels: ['Equity', 'Bonds', 'Real Estate', 'Commodities', 'Other'],
          datasets: [{
            label: `${group.name} Asset Allocation`,
            data: [group.equity, group.bonds, group.realestate, group.commodities, group.other],
            backgroundColor: [
              'rgba(114, 93, 255, 1)',
              'rgba(230, 96, 131, 1)',
              'rgba(255, 133, 76, 1)',
              'rgba(30, 174, 174, 1)',
              'rgba(54, 48, 82, 1)'
            ],
            borderColor: [
              'rgba(114, 93, 255, 1)',
              'rgba(230, 96, 131, 1)',
              'rgba(255, 133, 76, 1)',
              'rgba(30, 174, 174, 1)',
              'rgba(54, 48, 82, 1)'
            ],
            borderWidth: 1
          }]
        };

        // const centerTextPlugin = {
        //   id: 'centerTextPlugin',
        //   afterDraw: function (chart) {
        //     var width = chart.chart.width,
        //         height = chart.chart.height,
        //         ctx = chart.ctx;

        //     ctx.restore();
        //     var fontSize = (height / 142).toFixed(2);
        //     ctx.font = fontSize + "em sans-serif";
        //     ctx.textBaseline = "middle";

        //     // Use the options property to get the text
        //     var text = chart.options.plugins.centerText.text,
        //         textX = Math.round((width - ctx.measureText(text).width) / 2),
        //         textY = height / 3;

        //     ctx.fillText(text, textX, textY);
        //     ctx.save();
        //   }
        // };

        new Chart(ctx, {
          type: 'pie',
          data: data,
          options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                fontColor: '#000', // Color of text
                fontSize: 10, // Size of the text
                fontFamily: 'Helvetica', // Font family of the text
                boxWidth: 2, // Width of colored box
                usePointStyle: true, // Use point style instead of box
              }
            },
            // tooltips: {
            //   enabled: true,
            //   mode: 'nearest',
            //   intersect: false,
            //   backgroundColor: 'rgba(0,0,0,0.8)', // Tooltip background color
            //   titleFontFamily: 'Helvetica', // Font family for tooltip title
            //   titleFontSize: 20, // Font size for tooltip title
            //   titleFontStyle: 'bold', // Font style for tooltip title
            //   bodyFontFamily: 'Arial', // Font family for tooltip body
            //   bodyFontSize: 15, // Font size for tooltip body
            //   bodyFontStyle: 'normal', // Font style for tooltip body
            //   cornerRadius: 30, // Corner radius of tooltip
            //   xPadding: 10, // Padding inside tooltip (x-axis)
            //   yPadding: 10, // Padding inside tooltip (y-axis)
            //   caretSize: 5, // Size of the tooltip arrow
            //   displayColors: true, // Display color boxes in the tooltip
            // },
            animation: {
              animateRotate: true,
              animateScale: true,
            },
            cutoutPercentage: 65,
            rotation: -0.5 * Math.PI,
            circumference: 2 * Math.PI,
            // plugins: {
            //   centerText: {
            //     text: `${totalValue}`
            //   }
            // }
          },
          // plugins: [centerTextPlugin]
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
        this.router.push({ name: 'InvestmentCalculator' });
    },
      toggleSimulationControls() {
          this.showSimulationControls = !this.showSimulationControls;
      },
      toggleLogin() {
        this.showLoginPage = !this.showLoginPage;
      },
      handleUserLogin(user) {
        this.userEmail = user.email;
        this.userUID = user.uid;
      }
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
          if (group.equity || group.bonds || group.realestate || group.commodities || group.other) {
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
  