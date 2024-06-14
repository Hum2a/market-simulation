<template>
  <div v-if="isLoading" class="loading-spinner">Loading...</div>
  <div v-else-if="isAdmin" class="dashboard">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo">
      <p v-if="userEmail" class="welcome-message">Welcome Back {{ userEmail }}</p>
      <div class="header-icons">
        <button @click="toggleCalculator" class="calculator-toggle">
          <i class="fas fa-calculator"></i>
        </button>
        <button @click="toggleSimulationControls" class="simulation-controls-toggle">
          <img src="../../assets/settings (1) 1.png" alt="Controls">
        </button>
        <button @click="toggleSimulationHistory" class="simulation-history-toggle">
          <img src="../../assets/calendar 1.png" alt="Calendar">
        </button>
        <button @click="toggleLogin" class ="simulation-login-toggle">
          <img src="../../assets/login.png" alt="Login">
        </button>
      </div>
    </header>

    <LoginPage v-if="showLoginPage" @login-success="handleUserLogin" />
    <SimulationControls v-if="showSimulationControls" :userUID="userUID"/>
    <SimulationHistory v-if="showSimulationHistory" :userUID="userUID" @viewSimulationDetails="handleViewSimulationDetails" />

    <main v-if="!currentSimulationIndex">
      <div class="settings">
        <label for="max-value-input">Max Portfolio Value:</label>
        <input id="max-value-input" type="number" v-model.number="maxPortfolioValue" class="modern-input" step="5000">
        <label for="round-to-input">Round Up To:</label>
        <input id="round-to-input" type="number" v-model.number="roundTo" class="modern-input" step="1000">
      </div>
      <h1 class="header-content">
        <img src="../../assets/Blue line.png" alt="BlueLine" class="blueline">
        <span>Group Management</span>
      </h1>
      <div class="groups">
        <div v-for="(group, index) in groups" :key="index" class="group">
          <div class="group-header">
            <h2>
              {{ group.name }}
              <button @click="editGroupName(index)" class="edit-group-btn">
                <img src="../../assets/pencil 1.png" alt="Pencil">
              </button>
              <button @click="removeGroup(index)" class="remove-group-btn">
                <img src="../../assets/remove.png" alt="Remove">
              </button>
            </h2>
          </div>
          <div class="group-content">
            <div class="inputs">
              <div class="input-row">
                <label for="equity">Equity:</label>
                <input type="number" v-model="group.equity" @input="updatePieChart(index)" id="equity" class="modern-input">
              </div>
              <div class="input-row">
                <label for="bonds">Bonds:</label>
                <input type="number" v-model="group.bonds" @input="updatePieChart(index)" id="bonds" class="modern-input">
              </div>
              <div class="input-row">
                <label for="realestate">Real Estate:</label>
                <input type="number" v-model="group.realestate" @input="updatePieChart(index)" id="realestate" class="modern-input">
              </div>
              <div class="input-row">
                <label for="commodities">Commodities:</label>
                <input type="number" v-model="group.commodities" @input="updatePieChart(index)" id="commodities" class="modern-input">
              </div>
              <div class="input-row">
                <label for="other">Other:</label>
                <input type="number" v-model="group.other" @input="updatePieChart(index)" id="other" class="modern-input">
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
        <img src="../../assets/Arrow 17.png" alt="Icon" style="margin-left: 5px;">
      </button>

    </main>
    </div>

    <div v-else>
      <p>You do not have permission to view this page.</p>
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
import { useRouter } from 'vue-router';
import { getFirestore, doc, getDoc, collection, query, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import SimulationControls from './SimulationControls.vue';
import LoginPage from '../LoginPage.vue';
import SimulationHistory from './PastSimulations.vue';
import { Chart, ArcElement, Tooltip, Legend, Title } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend, Title);

export default {
  name: 'GroupCreation',
  components: {
    SimulationControls,
    LoginPage,
    SimulationHistory,
  },
  setup() {
    const router = useRouter();

    return {
      router,
      maxPortfolioValue: 100000,
      roundTo: 5000
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
      showSimulationHistory: false,
      showModal: false,
      showLoginPage: false,
      newGroupName: '',
      userEmail: null,
      userUID: null,
      currentSimulationIndex: null,
      charts: [],
      isAdmin: false,
      isLoading: true
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
        this.newGroupName = ''; 
        this.toggleModal();
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
      if (this.charts[index]) {
        this.charts[index].destroy();
        this.charts.splice(index, 1);
      }
    },
    async fetchLatestSimulationIndex() {
      const db = getFirestore();
      const simulationsRef = collection(db, this.userUID, 'Asset Market Simulations', 'Simulations');
      const querySnapshot = await getDocs(simulationsRef);
      return querySnapshot.size;
    },
    async clearGroups() {
      if (!this.userUID) {
        console.error('User UID is undefined or empty.');
        return;
      }
      if (!this.currentSimulationIndex) {
        console.error("No simulation index set.");
        return;
      }
      const db = getFirestore();
      const querySnapshot = await getDocs(query(collection(db, this.userUID, 'Asset Market Simulations', 'Simulations', `Simulation ${this.currentSimulationIndex}`, 'Groups')));
      const batch = writeBatch(db);

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('All groups have been removed from Firestore.');
    },
    async saveGroups() {
      if (!this.currentSimulationIndex) {
        console.error("No simulation index set.");
        return;
      }
      const db = getFirestore();
      
      try {
        await Promise.all(this.groups.map(group => {
          const groupDocRef = doc(db, this.userUID, 'Asset Market Simulations', 'Simulations', `Simulation ${this.currentSimulationIndex}`, 'Groups', group.name);
          return setDoc(groupDocRef, group);
        }));
      } catch (err) {
        console.error('Error saving groups to Firestore: ', err);
        alert('Failed to save groups.');
      }
      
      this.router.push({ name: 'SimulationPage' });
    },
    async startSimulation() {
      const latestIndex = await this.fetchLatestSimulationIndex();
      if (latestIndex === null) {
        console.error("No existing simulations found.");
        alert("No existing simulations found. Please create a new simulation first.");
        return;
      }
      this.currentSimulationIndex = latestIndex;
      await this.clearGroups();
      await this.saveGroups();
    },
    generateRandomValues(index) {
      const group = this.groups[index];
      let remainingValue = this.maxPortfolioValue;
      let roundTo = this.roundTo;

      const keys = ['equity', 'bonds', 'realestate', 'commodities', 'other'];
      keys.forEach((key, i) => {
        if (i === keys.length - 1) {
          group[key] = Math.round(remainingValue / roundTo) * roundTo;
        } else {
          const value = Math.round((Math.random() * remainingValue) / roundTo) * roundTo;
          group[key] = value;
          remainingValue -= value;
        }
      });

      this.$nextTick(() => this.renderPieChart(index));
    },
    renderPieChart(index) {
      const group = this.groups[index];
      this.$nextTick(() => {
        console.log(`Rendering pie chart for group index: ${index}`);
        console.log('Group data:', group);

        const canvasId = 'pieChart_' + index;
        console.log(`Canvas ID: ${canvasId}`);
        const canvas = document.getElementById(canvasId);
        
        if (!canvas) {
          console.error(`Canvas element not found for index: ${index}`);
          return;
        }
        console.log('Canvas element found:', canvas);

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.error(`Unable to get canvas context for index: ${index}`);
          return;
        }
        console.log('Canvas context obtained:', ctx);

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

        if (this.charts[index]) {
          this.charts[index].destroy();
        }

        this.charts[index] = new Chart(ctx, {
          type: 'pie',
          data: data,
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  color: '#000',
                  font: {
                    size: 10,
                    family: 'Helvetica'
                  },
                  boxWidth: 2,
                  usePointStyle: true
                }
              }
            },
            animation: {
              animateRotate: true,
              animateScale: true,
            },
            cutout: '65%'
          }
        });

        console.log(`Chart instance created for index: ${index}`);
      });
    },
    updatePieChart(index) {
      this.renderPieChart(index);
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
    handleViewSimulationDetails(simulationIndex) {
      this.currentSimulationIndex = simulationIndex;
      this.showSimulationHistory = false;
    },
    toggleSimulationHistory() {
      this.showSimulationHistory = !this.showSimulationHistory;
      this.currentSimulationIndex = null;
    },
    toggleLogin() {
      this.showLoginPage = !this.showLoginPage;
    },
    handleUserLogin(user) {
      this.userEmail = user.email;
      this.userUID = user.uid;
      this.checkUserRole();
    },
    async checkUserRole() {
      if (!this.userUID) {
        console.error('User UID is undefined or empty.');
        this.isLoading = false;
        return;
      }

      const db = getFirestore();
      const userDocRef = doc(db, this.userUID, 'Profile');
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          this.isAdmin = userData.role === 'admin';
        } else {
          console.error('No such document!');
        }
      } catch (error) {
        console.error('Error getting document:', error);
      } finally {
        this.isLoading = false;
      }
    }
  },
  async created() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.userEmail = user.email;
        this.userUID = user.uid;
        this.checkUserRole();
      } else {
        this.isLoading = false;
      }
    });
  },
  mounted() {
    this.groups.forEach((group, index) => {
      this.$nextTick(() => this.renderPieChart(index));
    });
  }
};
</script>

<style scoped>
@import url('../../styles/GroupCreationStyles.css');
</style>
