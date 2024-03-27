<template>
    <div>
      <div v-if="displaySimulation" class="simulation-table">
        <h2>Simulation Data</h2>
        <table>
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Equity</th>
              <th>Bonds</th>
              <th>Real Estate</th>
              <th>Bank Accounts</th>
              <th>Other</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(group, index) in groups" :key="index">
              <td>{{ group.name }}</td>
              <td>{{ group.equity }}</td>
              <td>{{ group.bonds }}</td>
              <td>{{ group.realestate }}</td>
              <td>{{ group.banks }}</td>
              <td>{{ group.other }}</td>
            </tr>
          </tbody>
        </table>
  
        <h2>Asset Changes from Firebase</h2>
          <table>
            <thead>
              <tr>
                <th>Quarter</th>
                <th>Equity Growth (%)</th>
                <th>Bonds Growth (%)</th>
                <th>Real Estate Growth (%)</th>
                <th>Bank Accounts Growth (%)</th>
                <th>Other Growth (%)</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(yearData, yearIndex) in assetChanges" :key="'year-' + yearIndex">
                <template v-for="(change, quarter) in yearData" :key="'quarter-' + quarter">
                  <tr>
                    <td>{{ quarter }}</td>
                    <td>{{ change.Equity }}</td>
                    <td>{{ change.Bonds }}</td>
                    <td>{{ change.RealEstate }}</td>
                    <td>{{ change.Banks }}</td>
                    <td>{{ change.Other }}</td>
                  </tr>
                </template>
              </template>
            </tbody>
          </table>
  
        <h2>Detailed Asset Growth Projections</h2>
          <table>
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Asset Type</th>
                <th>Initial Value</th> <!-- Explicitly add "Initial Value" header -->
                <th v-for="n in simulationYears * 4" :key="'quarter-header-' + n">Q{{ n }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(growthData, groupName) in detailedGrowth" :key="groupName">
                <tr v-for="assetType in Object.keys(growthData)" :key="groupName + '-' + assetType">
                  <td>{{ groupName }}</td>
                  <td>{{ assetType }}</td>
                  <td>{{ growthData[assetType][0].toFixed(2) }}</td>
                  <template v-for="(value, index) in growthData[assetType].slice(1)" :key="groupName + '-' + assetType + '-' + index">
                    <td>{{ value.toFixed(2) }}</td>
                  </template>
                </tr>
              </template>
            </tbody>
          </table>
  
          <asset-growth-chart :chart-data="chartData"></asset-growth-chart>
  
        </div>
        <button v-if="!displaySimulation" @click="startSimulation" class="modern-button">Start Simulation</button>
        <button v-if="displaySimulation" @click="updateValuesForNextQuarter" class="modern-button">Next Quarter</button>

    </div>
  </template>
  
  <script>
  
  import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
  import AssetGrowthChart from '../components/charts/AssetGrowthChart.vue';
  
  export default {
    name: 'SimulationPage',
    components: {
      AssetGrowthChart,
    },
    data() {
        return {
            groups: [],
            displaySimulation: false,
            simulationMonths: 0,
            simulationYears: 1,
            assetChanges: [],
            detailedGrowth: {},
            chartData: {
                labels: [],
                datasets: [],
                },
        };
    },
    async created() {
        await this.fetchGroups();
        await this.fetchAssetChanges();
    },
    mounted() {
        // Apply debounce to updateChart
        this.updateChart = debounce(this.updateChart, 200); // Adjust the 200ms delay as needed

        // Now, this.updateChart will be the debounced version
        // You can safely call it from other methods, like updateValuesForNextQuarter
    },
    methods: {
        async fetchGroups() {
          const db = getFirestore();
          const querySnapshot = await getDocs(collection(db, "groups"));
          this.groups = querySnapshot.docs.map(doc => {
            // Map document data to include future values initialized to current values
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              futureEquity: data.equity,
              futureBonds: data.bonds,
              futureRealEstate: data.realestate,
              futureBanks: data.banks,
              futureOther: data.other,
            };
          });
        },
        async fetchAssetChanges() {
          const db = getFirestore();
          const docRef = doc(db, 'Simulation Controls', 'Controls');
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            this.assetChanges = data.assetChanges;
            this.simulationYears = data.years || 1; // Assuming your document includes a 'years' field
            // Initialize detailedGrowth based on the fetched years
            this.initializeDetailedGrowth();
          } else {
            console.log("No such document!");
          }
        },
        initializeDetailedGrowth() {
          // Prepare detailedGrowth with initial values for each group and asset type
          this.groups.forEach(group => {
            if (!this.detailedGrowth[group.name]) {
              this.detailedGrowth[group.name] = {};
            }
            ['Equity', 'Bonds', 'RealEstate', 'Banks', 'Other'].forEach(asset => {
              if (!this.detailedGrowth[group.name][asset]) {
                this.detailedGrowth[group.name][asset] = [parseFloat(group[asset.toLowerCase()]) || 0]; // Initial value
              }
            });
          });
        },
        startSimulation() {
            this.displaySimulation = true;
        },
        applyAssetChangesForQuarter(quarter) {
            // Apply asset changes for a specific quarter
            this.groups.forEach(group => {
            ['Equity', 'Bonds', 'RealEstate', 'Banks', 'Other'].forEach(assetType => {
                const lastValueIndex = this.detailedGrowth[group.name][assetType].length - 1;
                let lastValue = this.detailedGrowth[group.name][assetType][lastValueIndex];
                const growthRate = this.assetChanges[0][quarter][assetType] / 100; // Example for one year
                const newValue = lastValue * (1 + growthRate);
                this.detailedGrowth[group.name][assetType].push(newValue);
            });
            });

            // Optionally, update the chart here if it depends on `detailedGrowth`
            // this.updateChart();
        },
        updateValuesForNextQuarter() {
            // Increment simulationMonths to keep track of simulation progress
            this.simulationMonths += 3;

            // Calculate which quarter we're updating based on simulationMonths
            const quarters = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'];
            const quarterIndex = Math.floor((this.simulationMonths - 1) / 3) % 4;
            const currentQuarter = quarters[quarterIndex];

            // Apply changes for the current quarter
            this.applyAssetChangesForQuarter(currentQuarter);
            this.$nextTick(() => {
                this.updateChart();
            });
        },
        updateChart() {
            const newChartData = {
                labels: Array.from({ length: this.simulationMonths / 3 }, (_, i) => `Q${i + 1}`),
                datasets: [],
            };

            // Populate datasets for each asset type in each group
            Object.entries(this.detailedGrowth).forEach(([groupName, assets]) => {
            Object.entries(assets).forEach(([assetType, values]) => {
                // Here, you can customize the appearance of each dataset
                const color = this.getRandomColor(); // Assuming you have a method to get random colors
                const dataset = {
                label: `${groupName} - ${assetType}`,
                data: values,
                borderColor: color,
                fill: false,
                };
                newChartData.datasets.push(dataset);
            });
            });

            // Since we're modifying an object, to ensure reactivity, you might need to replace the object entirely:
            this.chartData = newChartData;
        },
  
        applyAssetChanges() {
          const quarters = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'];
  
          for (let year = 0; year < this.simulationYears; year++) {
            quarters.forEach(quarter => {
              this.groups.forEach(group => {
                ['Equity', 'Bonds', 'RealEstate', 'Banks', 'Other'].forEach(asset => {
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
  
        generateChartData() {
          const datasets = [];
          const labels = Array.from({ length: this.simulationYears * 4 }, (_, i) => `Q${i + 1}`);
  
          Object.entries(this.detailedGrowth).forEach(([groupName, assets]) => {
            Object.entries(assets).forEach(([assetType, values]) => {
              const dataset = {
                label: `${groupName} - ${assetType}`,
                data: values,
                fill: false,
                borderColor: this.getRandomColor(), // Define a method to get random colors or set them manually
              };
              datasets.push(dataset);
            });
          });
  
          return {
            labels,
            datasets
          };
        },
  
        getRandomColor() {
          // This is a simple method to generate random colors. You might want to customize this.
          const letters = '0123456789ABCDEF';
          let color = '#';
          for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
          }
          return color;
        }
      },
  };

  // Inside your <script> tag but outside the component's export default definition
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

  </script>
  
  <style>
  @import url('../styles/SimulationStyles.css');
  </style>
  