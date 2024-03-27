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

        <asset-growth-chart :chart-data="generateChartData()"></asset-growth-chart>

      </div>
      <button v-if="!displaySimulation" @click="startSimulation" class="modern-button">Start Simulation</button>
      <button v-if="displaySimulation" @click="updateValuesForNextMonth" class="modern-button">Next Month</button>
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
          currentQuarterIndex: 0,
      };
  },
  async created() {
      await this.fetchGroups();
      await this.fetchAssetChanges();
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
          this.currentQuarterIndex = 0;
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
      updateValuesForNextMonth() {
          // Implement logic as needed for updating values for the next month
          this.simulationMonths += 1;
      },

      updateValuesForNextQuarter() {
        // Check if the next quarter's data is available
        const totalQuarters = this.simulationYears * 4;
        if (this.currentQuarterIndex >= totalQuarters) {
          console.warn("No more quarters left to simulate.");
          return;
        }

        // Calculate which year and quarter we're working on
        const year = Math.floor(this.currentQuarterIndex / 4);
        const quarterIndex = this.currentQuarterIndex % 4;
        const quarters = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'];
        const currentQuarter = quarters[quarterIndex];

        // Assuming `assetChanges` is structured as [{ "Jan-Mar": {...}, "Apr-Jun": {...}, ... }, { ... }]
        // Where each object represents a year and each key in the object is a quarter with its growth rates
        const assetChangesForQuarter = this.assetChanges[year] ? this.assetChanges[year][currentQuarter] : null;

        if (!assetChangesForQuarter) {
          console.warn(`No data available for year ${year + 1}, quarter ${currentQuarter}`);
          return;
        }

        // Now apply the asset changes for this quarter to each group
        this.groups.forEach(group => {
          Object.keys(assetChangesForQuarter).forEach(assetType => {
            const growthRate = assetChangesForQuarter[assetType] / 100; // Convert percentage to a decimal
            const currentValue = group[assetType.toLowerCase()];
            const newValue = currentValue * (1 + growthRate);
            group[assetType.toLowerCase()] = newValue;

            // Update the detailed growth projections
            if (!this.detailedGrowth[group.name][assetType]) {
              this.detailedGrowth[group.name][assetType] = [];
            }
            this.detailedGrowth[group.name][assetType].push(newValue);
          });
        });

        // Advance to the next quarter for the next button press
        this.currentQuarterIndex++;

        // Optionally, invoke any method to refresh or update dependent UI elements here, if necessary
      },
      generateChartData() {
        const datasets = [];
        // Start with 'Initial Value', followed by the quarters
        const labels = ['Initial Value'].concat(Array.from({ length: this.simulationYears * 4 }, (_, i) => `Q${i + 1}`));

        Object.entries(this.detailedGrowth).forEach(([groupName, assets]) => {
          Object.entries(assets).forEach(([assetType, values]) => {
            // Create a copy of the values array starting from the second element
            const adjustedValues = [values[0]].concat(values.slice(1, this.currentQuarterIndex + 1));

            // Fill the rest of the array with nulls up to the total number of quarters
            while (adjustedValues.length < this.simulationYears * 4 + 1) {
              adjustedValues.push(null);
            }

            const dataset = {
              label: `${groupName} - ${assetType}`,
              data: adjustedValues,
              fill: false,
              borderColor: this.getRandomColor(),
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
</script>

<style>
@import url('../styles/SimulationStyles.css');
</style>
