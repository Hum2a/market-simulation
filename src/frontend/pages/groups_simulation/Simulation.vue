<template>
  <div>
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo">
    </header>

    <div class="sim-chart-container">
      <asset-changes-chart />
    </div>
    <div class="sim-chart-container">
      <canvas ref="assetGrowthChart" height="100"></canvas>
      <button @click="updateValuesForNextQuarter" class="modern-button">Next Quarter</button>
      <button @click="runFullSimulation" class="modern-button">Run Full Simulation</button>
      <button @click="pauseSimulation" class="modern-button" v-if="isSimulating">Pause Simulation</button>
      <button @click="resumeSimulation" class="modern-button" v-else>Resume Simulation</button>

      <input type="number" v-model="simulationSpeed" min="100" step="100" title="Simulation Speed (ms)">
    </div>
    <button @click="finishSimulation" class="modern-button">Finish Simulation</button>
  </div>
</template>

<script>
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AssetChangesChart from '../../components/charts/AssetChangesChart.vue';
import { Chart, registerables } from 'chart.js';
import { useRouter } from 'vue-router';

Chart.register(...registerables);

export default {
  name: 'SimulationPage',
  components: {
    AssetChangesChart,
  },
  setup() {
    const router = useRouter();
    return { router };
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
      colorPalette: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FAA74B', '#9D56F7', '#5A6FFA', '#56D9FA', '#FAB256'],
      assetGrowthChartInstance: null,
      simulationSpeed: 750,
      isSimulating: false,
      simulationInterval: null,
    };
  },
  async created() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.userUID = user.uid;
        this.latestSimulationIndex = await this.fetchLatestSimulationIndex();
        if (this.latestSimulationIndex) {
          await this.initializeData();
          this.$nextTick(() => {
            this.initializeAssetGrowthChart();
          });
        }
      } else {
        console.log("No user is signed in.");
      }
    });
  },
  methods: {
    async fetchLatestSimulationIndex() {
      const db = getFirestore();
      console.log(`UserUID: ${this.userUID}`);
      const simulationsRef = collection(db, this.userUID, 'Asset Market Simulations', 'Simulations');
      const querySnapshot = await getDocs(simulationsRef);
      if (querySnapshot.empty) {
        console.log("No simulations found. Initializing first simulation.");
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
      console.log(`Simulation ${this.latestSimulationIndex}`);
      const querySnapshot = await getDocs(collection(db, this.userUID, 'Asset Market Simulations', 'Simulations', `Simulation ${this.latestSimulationIndex}`, "Groups"));
      this.groups = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          futureEquity: data.equity,
          futureBonds: data.bonds,
          futureRealEstate: data.realestate,
          futureCommodities: data.commodities,
          futureOther: data.other,
        };
      });

      this.groups.forEach(group => {
        const groupName = group.name;
        const initialTotal = ['equity', 'bonds', 'realestate', 'commodities', 'other']
          .reduce((total, key) => total + parseFloat(group[key] || 0), 0);

        this.totalPortfolioValues[groupName] = [initialTotal]; // Store initial total as the first entry
      });
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
        this.initializeDetailedGrowth();
      } else {
        console.log("Fetch Asset Change: No such document!");
      }
    },
    initializeDetailedGrowth() {
      this.groups.forEach(group => {
        if (!this.detailedGrowth[group.name]) {
          this.detailedGrowth[group.name] = {};
        }
        ['Equity', 'Bonds', 'RealEstate', 'Commodities', 'Other'].forEach(asset => {
          if (!this.detailedGrowth[group.name][asset]) {
            this.detailedGrowth[group.name][asset] = [parseFloat(group[asset.toLowerCase()]) || 0]; // Initial value
          }
        });
      });
    },
    startSimulation() {
      this.currentQuarterIndex = 0;
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
          this.updateValuesForNextQuarter();
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
    applyAssetChanges() {
      const quarters = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'];

      for (let year = 0; year < this.simulationYears; year++) {
        quarters.forEach(quarter => {
          this.groups.forEach(group => {
            ['Equity', 'Bonds', 'RealEstate', 'Commodities', 'Other'].forEach(asset => {
              const lastValueIndex = this.detailedGrowth[group.name][asset].length - 1;
              let lastValue = this.detailedGrowth[group.name][asset][lastValueIndex];
              const growthRate = this.assetChanges[year][quarter][asset] / 100;
              const newValue = lastValue * (1 + growthRate);
              this.detailedGrowth[group.name][asset].push(newValue);
            });
          });
        });
      }
    },
    updateValuesForNextQuarter() {
      const totalQuarters = this.simulationYears * 4;
      if (this.currentQuarterIndex >= totalQuarters) {
        console.warn("No more quarters left to simulate.");
        return;
      }

      const year = Math.floor(this.currentQuarterIndex / 4);
      const quarterIndex = this.currentQuarterIndex % 4;
      const quarters = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'];
      const currentQuarter = quarters[quarterIndex];
      const assetChangesForQuarter = this.assetChanges[year] ? this.assetChanges[year][currentQuarter] : null;

      if (!assetChangesForQuarter) {
        console.warn(`No data available for year ${year + 1}, quarter ${currentQuarter}`);
        return;
      }

      this.groups.forEach((group, groupIndex) => {
        let totalValue = 0;

        Object.keys(assetChangesForQuarter).forEach(assetType => {
          const growthRate = assetChangesForQuarter[assetType] / 100;
          const assetKey = assetType.toLowerCase();
          const currentValue = group[assetKey];
          const newValue = currentValue * (1 + growthRate);
          group[assetKey] = newValue;

          totalValue += newValue;

          if (!this.detailedGrowth[group.name][assetType]) {
            this.detailedGrowth[group.name][assetType] = [];
          }
          this.detailedGrowth[group.name][assetType].push(newValue);
        });

        if (!this.totalPortfolioValues[group.name]) {
          this.totalPortfolioValues[group.name] = [];
        }
        this.totalPortfolioValues[group.name].push(totalValue);

        if (this.assetGrowthChartInstance.data.datasets[groupIndex].data.length > this.currentQuarterIndex + 1) {
          this.assetGrowthChartInstance.data.datasets[groupIndex].data[this.currentQuarterIndex + 1] = totalValue;
        } else {
          this.assetGrowthChartInstance.data.datasets[groupIndex].data.push(totalValue);
        }
      });

      console.log("Updated dataset:", this.assetGrowthChartInstance.data.datasets);
      this.currentQuarterIndex++;
      this.updateChart();
    },
    initializeAssetGrowthChart() {
      const ctx = this.$refs.assetGrowthChart.getContext('2d');
      const totalQuarters = this.simulationYears * 4;
      const datasets = this.groups.map(group => ({
        label: group.name,
        data: new Array(totalQuarters + 1).fill(null),
        fill: false,
        borderColor: this.colorPalette[this.groups.indexOf(group) % this.colorPalette.length],
        borderWidth: 5
      }));

      this.groups.forEach((group, index) => {
        const initialTotal = ['equity', 'bonds', 'realestate', 'commodities', 'other']
          .reduce((total, key) => total + parseFloat(group[key] || 0), 0);
        datasets[index].data[0] = initialTotal;
      });

      this.assetGrowthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Initial'].concat(Array.from({ length: totalQuarters }, (_, i) => `Q${i + 1}`)),
          datasets: datasets
        },
        options: {
          plugins: {
            legend: {
              display: true,
              labels: {
                fontSize: 18,
                color: '#333',
                fontStyle: 'bold'
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
            },
            y: { beginAtZero: true },
          },
          responsive: true,
          maintainAspectRatio: true,
          animation: {
            duration: 500,
            easing: 'linear'
          },
        }
      });

      this.assetGrowthChartInstance.update();
    },
    updateChart() {
      this.assetGrowthChartInstance.data.datasets.forEach((dataset, datasetIndex) => {
        dataset.data = this.totalPortfolioValues[this.groups[datasetIndex].name];
      });
      this.assetGrowthChartInstance.update('none');
    },
    updateAssetGrowthChart() {
      this.assetGrowthChartInstance.data = this.generateTotalPortfolioChartData();
      this.assetGrowthChartInstance.update();
    },
    generateTotalPortfolioChartData() {
      const labels = ['Initial'].concat(Array.from({ length: this.simulationYears * 4 }, (_, i) => `Q${i + 1}`));
      let colorIndex = 0;

      const datasets = Object.keys(this.totalPortfolioValues).map(groupName => {
        const values = this.totalPortfolioValues[groupName];
        const adjustedValues = [values[0]].concat(values.slice(1, this.currentQuarterIndex + 1));

        while (adjustedValues.length < this.simulationYears * 4 + 1) {
          adjustedValues.push(null);
        }

        return {
          label: groupName,
          data: adjustedValues,
          fill: false,
          borderColor: this.colorPalette[colorIndex++ % this.colorPalette.length],
          tension: 0.1
        };
      });

      return { labels, datasets };
    },
    generateAssetChangesChartData() {
      const assetTypes = ['Equity', 'Bonds', 'RealEstate', 'Commodities', 'Other'];
      const labels = ['Initial Value'].concat(
        Array.from({ length: this.simulationYears * 4 }, (_, i) => `Q${i + 1}`)
      );
      const lineColors = ['#268F8F', '#5D81FF', '#5DD0FD', '#69FDB6', '#82DF96'];

      const datasets = assetTypes.map((type, index) => {
        const data = [0];

        for (let year = 0; year < this.simulationYears; year++) {
          for (const quarter of ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec']) {
            const change = this.assetChanges[year]?.[quarter]?.[type] || 0;
            data.push(change);
          }
        }

        return {
          label: type,
          data,
          fill: false,
          borderColor: lineColors[index],
          tension: 0.5
        };
      });

      return { labels, datasets };
    },
    finalValues() {
      const finalValues = Object.keys(this.detailedGrowth).map(groupName => {
        const groupFinalValues = {
          name: groupName,
          equity: 0,
          bonds: 0,
          realestate: 0,
          commodities: 0,
          other: 0,
        };

        const assetTypes = Object.keys(this.detailedGrowth[groupName]);
        assetTypes.forEach(assetType => {
          const values = this.detailedGrowth[groupName][assetType];
          const finalValue = values[values.length - 1];
          switch (assetType) {
            case 'Equity':
              groupFinalValues.equity = finalValue;
              break;
            case 'Bonds':
              groupFinalValues.bonds = finalValue;
              break;
            case 'RealEstate':
              groupFinalValues.realestate = finalValue;
              break;
            case 'Commodities':
              groupFinalValues.commodities = finalValue;
              break;
            case 'Other':
              groupFinalValues.other = finalValue;
              break;
          }
        });

        return groupFinalValues;
      });

      const db = getFirestore();
      const docRef = doc(db, this.userUID, 'Asset Market Simulations', 'Simulations', `Simulation ${this.latestSimulationIndex}`, "Results", "Final");

      setDoc(docRef, { finalValues })
        .then(() => {
          console.log("Document successfully written with final simulation results!");
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    },
    quarterValues() {
      const quarterResults = [];

      Object.keys(this.detailedGrowth).forEach(groupName => {
        const groupData = this.detailedGrowth[groupName];
        Object.keys(groupData).forEach(assetType => {
          const quarterlyValues = groupData[assetType];
          quarterlyValues.forEach((value, quarterIndex) => {
            let label = quarterIndex === 0 ? "Initial Value" : `Q${quarterIndex}`;
            
            if (!quarterResults[quarterIndex]) {
              quarterResults[quarterIndex] = { quarter: label, groups: {} };
            }
            if (!quarterResults[quarterIndex].groups[groupName]) {
              quarterResults[quarterIndex].groups[groupName] = {};
            }
            quarterResults[quarterIndex].groups[groupName][assetType] = value;
          });
        });
      });

      const db = getFirestore();
      const docRef = doc(db, this.userUID, 'Asset Market Simulations', 'Simulations', `Simulation ${this.latestSimulationIndex}`, "Results", "Quarters");

      setDoc(docRef, { quarterResults })
        .then(() => {
          console.log("Quarterly results successfully written to Firestore!");
        })
        .catch((error) => {
          console.error("Error writing quarterly results to Firestore: ", error);
        });
    },
    finishSimulation() {
      this.finalValues();
      this.quarterValues();
      this.router.push({ name: 'ResultsScreen' });
    }
  },
};
</script>

<style>
@import url('../../styles/SimulationStyles.css');
</style>
