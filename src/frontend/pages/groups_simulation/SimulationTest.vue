<template>
  <div>
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo">
    </header>

    <div class="sim-chart-container">
      <asset-changes-chart />
    </div>

    <div class="sim-chart-container">
      <canvas id="portfolioChart" ref="portfolioChart"></canvas>
      <button @click="queueUpdate" class="modern-button" :disabled="isUpdating">Next Quarter</button>
      <button @click="runFullSimulation" class="modern-button">Run Full Simulation</button>
      <button @click="pauseSimulation" class="modern-button" v-if="isSimulating">Pause Simulation</button>
      <button @click="resumeSimulation" class="modern-button" v-else>Resume Simulation</button>
      <input type="number" v-model="simulationSpeed" min="100" step="100" title="Simulation Speed (ms)">
    </div>

    <div class="simulation-table">
      <h2>Simulation Data</h2>
      <table>
        <thead>
          <tr>
            <th>Group Name</th>
            <th>Asset</th>
            <th>Initial Value</th>
            <th v-for="n in totalQuarters" :key="n">{{ `Q${n}` }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in groups" :key="group.id">
            <tr>
              <td :rowspan="6">{{ group.name }}</td>
              <td>Equity</td>
              <td>{{ group.initialValues.equity }}</td>
              <td v-for="(value, index) in group.quarterlyValues.equity.slice(1)" :key="index">{{ value !== null ? value : '' }}</td>
            </tr>
            <tr v-for="asset in ['bonds', 'realestate', 'commodities', 'other']" :key="group.id + '-' + asset">
              <td>{{ asset.charAt(0).toUpperCase() + asset.slice(1) }}</td>
              <td>{{ group.initialValues[asset] }}</td>
              <td v-for="(value, index) in group.quarterlyValues[asset].slice(1)" :key="index">{{ value !== null ? value : '' }}</td>
            </tr>
            <tr>
              <td><strong>Total Portfolio</strong></td>
              <td>{{ group.totalPortfolioValues.initial }}</td>
              <td v-for="(value, index) in group.totalPortfolioValues.quarters.slice(1)" :key="index">{{ value !== null ? value : '' }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <button @click="finishSimulation" class="modern-button">Finish Simulation</button>
  </div>
</template>

<script>
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AssetChangesChart from '../../components/charts/AssetChangesChart.vue';
import { useRouter } from 'vue-router';
import Chart from 'chart.js/auto';
import { shallowRef, nextTick } from 'vue';

export default {
  name: 'SimulationPage',
  components: {
    AssetChangesChart,
  },
  setup() {
    const router = useRouter();
    const portfolioChart = shallowRef(null);
    return { router, portfolioChart };
  },
  data() {
    return {
      userUID: null,
      latestSimulationIndex: null,
      groups: [],
      simulationMonths: 0,
      simulationYears: 1,
      assetChanges: [],
      detailedGrowth: {},
      currentQuarterIndex: 0,
      totalPortfolioValues: {},
      simulationSpeed: 750,
      isSimulating: false,
      simulationInterval: null,
      isUpdating: false, // Flag to prevent multiple clicks
      updateQueue: [], // Queue to handle multiple update requests
    };
  },
  computed: {
    totalQuarters() {
      return this.simulationYears * 4;
    }
  },
  async created() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.userUID = user.uid;
        this.latestSimulationIndex = await this.fetchLatestSimulationIndex();
        if (this.latestSimulationIndex) {
          await this.initializeData();
          this.initializeChart();
        }
      } else {
        console.log("No user is signed in.");
      }
    });
  },
  beforeUnmount() {
    if (this.portfolioChart.value) {
      this.portfolioChart.value.destroy();
    }
  },
  methods: {
    async fetchLatestSimulationIndex() {
      const db = getFirestore();
      const simulationsRef = collection(db, this.userUID, 'Asset Market Simulations', 'Simulations');
      const querySnapshot = await getDocs(simulationsRef);
      console.log("fetchLatestSimulationIndex: querySnapshot.size", querySnapshot.size);
      if (querySnapshot.empty) {
        return 1; // Start from 1 if no documents are present
      } else {
        return querySnapshot.size; // Return the size or last index directly
      }
    },
    async initializeData() {
      await this.fetchGroups();
      await this.fetchAssetChanges();
    },
    async fetchGroups() {
      if (!this.userUID || !this.latestSimulationIndex) {
        console.error("User UID not set or simulation index not found.");
        return;
      }
      const db = getFirestore();
      const querySnapshot = await getDocs(collection(db, this.userUID, 'Asset Market Simulations', 'Simulations', `Simulation ${this.latestSimulationIndex}`, "Groups"));
      this.groups = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const initialValues = {
          equity: parseFloat(data.equity) || 0,
          bonds: parseFloat(data.bonds) || 0,
          realestate: parseFloat(data.realestate) || 0,
          commodities: parseFloat(data.commodities) || 0,
          other: parseFloat(data.other) || 0
        };
        const initialTotal = Object.values(initialValues).reduce((acc, val) => acc + val, 0);
        return {
          id: doc.id,
          name: data.name,
          initialValues: initialValues,
          quarterlyValues: {
            equity: [initialValues.equity],
            bonds: [initialValues.bonds],
            realestate: [initialValues.realestate],
            commodities: [initialValues.commodities],
            other: [initialValues.other]
          },
          totalPortfolioValues: {
            initial: initialTotal,
            quarters: [initialTotal]
          }
        };
      });
      console.log("fetchGroups: groups", this.groups);
    },
    async fetchAssetChanges() {
      if (!this.userUID || !this.latestSimulationIndex) {
        console.error("User UID not set or simulation index not found.");
        return;
      }
      const db = getFirestore();
      const docRef = doc(db, this.userUID, 'Asset Market Simulations', 'Simulations', `Simulation ${this.latestSimulationIndex}`, 'Simulation Controls', 'Controls');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.assetChanges = data.assetChanges;
        this.simulationYears = data.years || 1; // Assuming your document includes a 'years' field
        console.log("fetchAssetChanges: assetChanges", this.assetChanges);
      } else {
        console.log("Fetch Asset Change: No such document!");
      }
    },
    async calculateNextQuarter() {
      const totalQuarters = this.simulationYears * 4;
      console.log("calculateNextQuarter: totalQuarters", totalQuarters);

      if (this.currentQuarterIndex >= totalQuarters) {
        console.warn("No more quarters left to simulate.");
        return;
      }

      const quarterIndex = this.currentQuarterIndex;
      const year = Math.floor(quarterIndex / 4);
      const quarter = quarterIndex % 4;
      const quarters = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'];
      const currentQuarter = quarters[quarter];
      const assetChangesForQuarter = this.assetChanges[year] ? this.assetChanges[year][currentQuarter] : null;
      console.log(`calculateNextQuarter: year ${year}, quarter ${currentQuarter}`, assetChangesForQuarter);

      if (!assetChangesForQuarter) {
        console.warn(`No data available for year ${year + 1}, quarter ${currentQuarter}`);
        return;
      }

      this.groups.forEach(group => {
        let totalValue = 0;

        Object.keys(assetChangesForQuarter).forEach(assetType => {
          const growthRate = assetChangesForQuarter[assetType] / 100;
          const assetKey = assetType.toLowerCase();
          const currentValue = group.quarterlyValues[assetKey][quarterIndex];
          const newValue = currentValue * (1 + growthRate);
          group.quarterlyValues[assetKey].push(newValue);

          totalValue += newValue;
        });

        group.totalPortfolioValues.quarters.push(totalValue);
      });

      this.currentQuarterIndex++;
    },
    runFullSimulation() {
      if (this.isSimulating) {
        return; // Prevent multiple simultaneous simulations
      }
      this.isSimulating = true;
      const totalQuarters = this.simulationYears * 4;
      let quarterCount = this.currentQuarterIndex;

      const runQuarter = () => {
        if (quarterCount < totalQuarters && this.currentQuarterIndex < totalQuarters) {
          this.queueUpdate();
          quarterCount++;
          this.simulationInterval = setTimeout(runQuarter, this.simulationSpeed);
        } else {
          this.isSimulating = false; // Stop simulation
        }
      };

      runQuarter();
    },
    pauseSimulation() {
      clearTimeout(this.simulationInterval);
      this.isSimulating = false;
    },
    resumeSimulation() {
      if (!this.isSimulating) {
        this.runFullSimulation();
      }
    },
    async updateValuesForNextQuarter() {
      console.log("updateValuesForNextQuarter: start");

      if (this.isUpdating) {
        console.warn("updateValuesForNextQuarter: update already in progress");
        return;
      }

      this.isUpdating = true; // Set flag to prevent multiple clicks

      await this.calculateNextQuarter();
      await this.updateChart();

      this.isUpdating = false; // Reset flag after update is complete
      console.log("updateValuesForNextQuarter: end");
    },
    finalValues() {
      const finalValues = this.groups.map(group => {
        return {
          name: group.name,
          equity: group.quarterlyValues.equity[group.quarterlyValues.equity.length - 1],
          bonds: group.quarterlyValues.bonds[group.quarterlyValues.bonds.length - 1],
          realestate: group.quarterlyValues.realestate[group.quarterlyValues.realestate.length - 1],
          commodities: group.quarterlyValues.commodities[group.quarterlyValues.commodities.length - 1],
          other: group.quarterlyValues.other[group.quarterlyValues.other.length - 1],
        };
      });

      const db = getFirestore();
      const docRef = doc(db, this.userUID, 'Asset Market Simulations', 'Simulations', `Simulation ${this.latestSimulationIndex}`, "Results", "Final");
      setDoc(docRef, { finalValues })
        .then(() => {
          console.log("finalValues: Document successfully written with final simulation results!");
        })
        .catch((error) => {
          console.error("finalValues: Error writing document: ", error);
        });
    },
    quarterValues() {
      const quarterResults = [];
      this.groups.forEach(group => {
        const groupData = {
          name: group.name,
          equity: group.quarterlyValues.equity,
          bonds: group.quarterlyValues.bonds,
          realestate: group.quarterlyValues.realestate,
          commodities: group.quarterlyValues.commodities,
          other: group.quarterlyValues.other,
        };
        quarterResults.push(groupData);
      });

      const db = getFirestore();
      const docRef = doc(db, this.userUID, 'Asset Market Simulations', 'Simulations', `Simulation ${this.latestSimulationIndex}`, "Results", "Quarters");
      setDoc(docRef, { quarterResults })
        .then(() => {
          console.log("quarterValues: Quarterly results successfully written to Firestore!");
        })
        .catch((error) => {
          console.error("quarterValues: Error writing quarterly results to Firestore: ", error);
        });
    },
    finishSimulation() {
      this.finalValues();
      this.quarterValues();
      this.router.push({ name: 'ResultsScreen' });
    },
    async initializeChart() {
      console.log("initializeChart: start");

      if (this.portfolioChart.value) {
        this.portfolioChart.value.destroy(); // Ensure old chart is destroyed before creating a new one
        console.log("initializeChart: old chart destroyed");
      }

      // Wait for the next tick to ensure the canvas element is rendered
      await nextTick();

      const canvasElement = this.$refs.portfolioChart;
      if (!canvasElement) {
        console.error("initializeChart: Canvas element is not found");
        return;
      }

      const ctx = canvasElement.getContext('2d');
      if (!ctx) {
        console.error("initializeChart: Unable to get canvas context");
        return;
      }

      const labels = ['Initial Value'];
      for (let i = 1; i <= this.simulationYears * 4; i++) {
        labels.push(`Q${i}`);
      }
      console.log("initializeChart: labels", labels);

      const datasets = this.groups.map(group => ({
        label: group.name,
        data: [...group.totalPortfolioValues.quarters], // Clone the data to avoid reactivity issues
        borderColor: this.getRandomColor(),
        fill: false,
      }));

      this.portfolioChart.value = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                font: {
                  size: 18,
                  weight: 'bold',
                },
                color: '#333',
              },
            },
            title: {
              display: true,
              text: 'Total Portfolio Value Over Time',
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
            },
            y: {
              beginAtZero: true,
            },
          },
          maintainAspectRatio: true,
          animation: {
            duration: 500,
            easing: 'linear',
          },
        },
      });

      console.log("initializeChart: chart initialized", this.portfolioChart.value);
    },
    async updateChart() {
      console.log("updateChart: start");

      await nextTick(); // Ensure the canvas is properly rendered

      const canvasElement = this.$refs.portfolioChart;
      if (!canvasElement) {
        console.error("updateChart: Canvas element is not found");
        return;
      }

      const ctx = canvasElement.getContext('2d');
      if (!ctx) {
        console.error("updateChart: Unable to get canvas context");
        return;
      }

      const labels = ['Initial Value'];
      for (let i = 1; i <= this.simulationYears * 4; i++) {
        labels.push(`Q${i}`);
      }
      console.log("updateChart: labels", labels);

      // Clone the data to avoid reactivity issues
      const datasets = this.groups.map(group => ({
        label: group.name,
        data: [...group.totalPortfolioValues.quarters],
        borderColor: this.getRandomColor(),
        fill: false,
      }));

      if (this.portfolioChart.value) {
        this.portfolioChart.value.data.labels = labels;
        this.portfolioChart.value.data.datasets = datasets;
        this.portfolioChart.value.update();
      }

      console.log("updateChart: chart updated", this.portfolioChart.value);
    },
    getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      console.log("getRandomColor: generated color", color);
      return color;
    },
    async processUpdateQueue() {
      if (this.isUpdating) return; // Prevent multiple simultaneous updates

      this.isUpdating = true;

      const processNextUpdate = () => {
        if (this.updateQueue.length === 0) {
          this.isUpdating = false;
          return;
        }

        const nextUpdate = this.updateQueue.shift();
        nextUpdate().then(() => {
          setTimeout(processNextUpdate, 0); // Use setTimeout to prevent call stack overflow
        });
      };

      processNextUpdate();
    },
    queueUpdate() {
      this.updateQueue.push(async () => {
        await this.calculateNextQuarter();
        await this.updateChart();
      });

      this.processUpdateQueue();
    },
  },
};
</script>

<style>
@import url('../../styles/SimulationStyles.css');
</style>
