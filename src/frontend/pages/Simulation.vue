<template>
  <div>
    <div class="simulation-table">
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

      <div class="pie-charts-row">
        <div class="pie-chart-container" v-for="(group, index) in groups" :key="'pie-chart-container-' + index">
          <h3>{{ group.name }}</h3> <!-- This is the label displaying the group name -->
          <canvas :id="'pieChart-' + index"></canvas>
        </div>
      </div>

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
              <th>Initial Value</th>
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
        <button @click="updateValuesForNextQuarter" class="modern-button">Next Quarter</button>
        <asset-changes-chart />
    </div>
    <button @click="finishSimulation" class="modern-button">Finish Simulation</button>
  </div>
</template>

<script>

import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import AssetGrowthChart from '../components/charts/AssetGrowthChart.vue';
import AssetChangesChart from '../components/charts/AssetChangesChart.vue';
import Chart from 'chart.js';
import { useRouter } from 'vue-router';
// import AssetChangesChart from '../components/charts/newACC.vue';

export default {
  name: 'SimulationPage',
  components: {
    AssetGrowthChart,
    AssetChangesChart,
  },
  setup() {
        const router = useRouter();

        return {
            router,
        };
    },
  data() {
      return {
          groups: [],
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
      this.$nextTick(() => {
      if (this.groups.length > 0) {
        this.renderAllPieCharts();
      }
    });
  },
  methods: {
      async fetchGroups() {
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, "Groups"));
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
      generateAssetChangesChartData() {
        const assetTypes = ['Equity', 'Bonds', 'RealEstate', 'Banks', 'Other']; // Define asset types directly
        const labels = ['Initial Value'].concat(
          Array.from({ length: this.simulationYears * 4 }, (_, i) => `Q${i + 1}`)
        );

        const datasets = assetTypes.map((type) => {
          const data = [0]; // Initial value for the chart (no change at the start)

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
            borderColor: this.getRandomColor(),
          };
        });

        return { labels, datasets };
      },

      getRandomColor() {
        // This is a simple method to generate random colors. You might want to customize this.
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      },
      renderAllPieCharts() {
        this.groups.forEach((group, index) => {
          this.$nextTick(() => {
            this.renderPieChart(group, index);
          });
        });
      },

      renderPieChart(group, index) {
      const canvasId = `pieChart-${index}`;
      this.$nextTick(() => {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
          console.error(`Canvas element for group ${index} not found.`);
          return;
        }
        const ctx = canvas.getContext('2d');
        const chartData = this.prepareChartData(group);
        this.initializeChart(ctx, chartData);
      });
    },

    prepareChartData(group) {
      // Prepares and returns chart data based on the group
      return {
        labels: ['Equity', 'Bonds', 'Real Estate', 'Bank Accounts', 'Other'],
        datasets: [{
          data: [group.equity, group.bonds, group.realestate, group.banks, group.other],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          label: 'Asset Distribution',
        }]
      };
    },

    initializeChart(ctx, chartData) {
      // Initializes a chart on the provided context with the given data
      new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1,
          legend: {
            display: true,
            position: 'right',
            labels: {
              fontColor: '#FFFFFF', // Color of text
              fontSize: 14, // Size of the text
              fontFamily: 'Helvetica', // Font family of the text
              boxWidth: 20, // Width of colored box
              usePointStyle: true, // Use point style instead of box
            },
          },
          tooltips: {
            enabled: true,
            mode: 'nearest',
            intersect: false,
            backgroundColor: 'rgba(0,0,0,0.8)', // Tooltip background color
            titleFontFamily: 'Helvetica', // Font family for tooltip title
            titleFontSize: 20, // Font size for tooltip title
            titleFontStyle: 'bold', // Font style for tooltip title
            bodyFontFamily: 'Arial', // Font family for tooltip body
            bodyFontSize: 15, // Font size for tooltip body
            bodyFontStyle: 'normal', // Font style for tooltip body
            cornerRadius: 30, // Corner radius of tooltip
            xPadding: 10, // Padding inside tooltip (x-axis)
            yPadding: 10, // Padding inside tooltip (y-axis)
            caretSize: 5, // Size of the tooltip arrow
            displayColors: true, // Display color boxes in the tooltip
          },
          animation: {
            animateRotate: true,
            animateScale: true,
          },
          cutoutPercentage: 10,
          rotation: -0.5 * Math.PI,
          circumference: 2 * Math.PI,
        },
      });
    },

    finalValues() {
      // Assuming detailedGrowth has been fully populated during the simulation
      const finalValues = Object.keys(this.detailedGrowth).map(groupName => {
        // Initialize an object to hold the final values for the group
        const groupFinalValues = {
          name: groupName,
          equity: 0,
          bonds: 0,
          realestate: 0,
          banks: 0,
          other: 0,
        };

        // Extract the final values from the detailedGrowth for each asset type
        const assetTypes = Object.keys(this.detailedGrowth[groupName]);
        assetTypes.forEach(assetType => {
          const values = this.detailedGrowth[groupName][assetType];
          const finalValue = values[values.length - 1]; // The last value should be the final value after all simulations
          // Map the detailedGrowth asset types to the groupFinalValues fields
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
            case 'Banks':
              groupFinalValues.banks = finalValue;
              break;
            case 'Other':
              groupFinalValues.other = finalValue;
              break;
          }
        });

        return groupFinalValues;
      });

      // Now, finalValues is ready with the actual final values from the simulation
      // Reference to the Firestore service
      const db = getFirestore();

      // Reference to the "Results" collection and "Final" document
      const docRef = doc(db, "Results", "Final");

      // Set the finalValues in the "Final" document
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

      // Iterate through each group's growth details
      Object.keys(this.detailedGrowth).forEach(groupName => {
        const groupData = this.detailedGrowth[groupName];
        Object.keys(groupData).forEach(assetType => {
          const quarterlyValues = groupData[assetType];
          // Push each quarter's data into the quarterResults array
          quarterlyValues.forEach((value, quarterIndex) => {
            // Adjust index for labeling to account for the "Initial Value"
            let label = quarterIndex === 0 ? "Initial Value" : `Q${quarterIndex}`;
            
            if (!quarterResults[quarterIndex]) {
              quarterResults[quarterIndex] = { quarter: label, groups: {} };
            }
            if (!quarterResults[quarterIndex].groups[groupName]) {
              quarterResults[quarterIndex].groups[groupName] = {};
            }
            // Store each asset type's value under the respective group and quarter
            quarterResults[quarterIndex].groups[groupName][assetType] = value;
          });
        });
      });

      // Reference to the Firestore service
      const db = getFirestore();

      // Reference to the "Results" collection and "Quarters" document
      const docRef = doc(db, "Results", "Quarters");

      // Set the quarterResults in the "Quarters" document
      setDoc(docRef, { quarterResults })
        .then(() => {
          console.log("Quarterly results successfully written to Firestore!");
          // Optional: Navigate to results screen or show a success message
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
@import url('../styles/SimulationStyles.css');
</style>