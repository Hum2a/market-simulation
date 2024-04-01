<template>
  <div class="results-screen">
    <h1 class="title">Simulation Results</h1>
    <div class="results-container">
      <div v-for="(result, index) in rankedResults" :key="index" class="result-group"
           :class="{'gold': index === 0, 'silver': index === 1, 'bronze': index === 2}"
           @click="toggleGroup(index)">
        <h2>{{ index + 1 }}. {{ result.name }} (Total Worth: ${{ result.totalWorth.toFixed(2) }})</h2>
        <div v-if="expandedGroups[index]" class="details">
          <div class="chart-area">
            <div class="pie-chart-container">
              <canvas :id="'pieChart-' + index" :ref="'pieChart' + index"></canvas>
            </div>
            <div class="line-chart-container">
              <canvas :id="'lineChart-' + index" :ref="'lineChart' + index"></canvas>
            </div>
          </div>
          <ul class="asset-list">
            <li v-for="(value, key) in result.assets" :key="key">
              {{ key }}: ${{ value.final.toFixed(2) }} ({{ value.change }})
            </li>
            <li>Equity: ${{ result.equity }}</li>
            <li>Bonds: ${{ result.bonds }}</li>
            <li>Real Estate: ${{ result.realestate }}</li>
            <li>Bank Accounts: ${{ result.banks }}</li>
            <li>Other: ${{ result.other }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  <div class="awards-container">
    <BiggestAssetGain />
    <BiggestAssetLoss />
    <HighestPortfolioAtAnyTime />
    <ComebackKing />
    <!-- <SteadyHandAward /> -->
  </div>
</template>

<script>
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import Chart from 'chart.js';
import BiggestAssetGain from '../components/awards/biggestAssetGain.vue';
import BiggestAssetLoss from '../components/awards/biggestAssetLoss.vue';
import HighestPortfolioAtAnyTime from '../components/awards/highestPortfolioAnyTime.vue'
import ComebackKing from '../components/awards/comeBackKing.vue';
// import SteadyHandAward from '../components/awards/steadyHand.vue';

export default {
  name: 'ResultsScreen',
  components: {
    BiggestAssetGain,
    BiggestAssetLoss,
    HighestPortfolioAtAnyTime,
    ComebackKing,
    // SteadyHandAward
  },
  data() {
    return {
      finalResults: [],
      quarterResults: [],
      visibleDetails: [],
      expandedGroups: {},
      charts: [],
    };
  },
  async created() {
    await this.fetchFinalResults();
    await this.fetchQuarterlyResults(); // Fetch quarterly results
  },
  computed: {
      rankedResults() {
          const resultsWithTotal = this.finalResults.map(result => ({
              ...result,
              totalWorth: [
              result.equity,
              result.bonds,
              result.realestate,
              result.banks,
              result.other
              ].reduce((acc, value) => acc + Number(value), 0),
          }));
          return resultsWithTotal.sort((a, b) => b.totalWorth - a.totalWorth);
      }
  },  
  methods: {
      async fetchFinalResults() {
          const db = getFirestore();
          const docRef = doc(db, "Results", "Final");

          try {
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
              this.finalResults = docSnap.data().finalValues;
              } else {
              console.log("No such document!");
              }
          } catch (error) {
              console.error("Error fetching document:", error);
          }
      },
      async fetchQuarterlyResults() {
        const db = getFirestore();
        const docRef = doc(db, "Results", "Quarters");
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log("Quarterly results found:", docSnap.data().quarterResults);
            this.quarterResults = docSnap.data().quarterResults;
          } else {
            console.error("No quarterly results found!");
          }
        } catch (error) {
          console.error("Error fetching quarterly results:", error);
        }
      },
      generateAllCharts() {
          this.rankedResults.forEach((result, index) => {
              // Use Vue refs to access the canvas elements
              const canvas = this.$refs.pieChart[index];
              if (canvas) {
                  const ctx = canvas.getContext('2d');
                  new Chart(ctx, {
                      type: 'pie',
                      data: {
                          labels: ['Equity', 'Bonds', 'Real Estate', 'Bank Accounts', 'Other'],
                          datasets: [{
                          data: [result.equity, result.bonds, result.realestate, result.banks, result.other],
                          backgroundColor: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'],
                          hoverBackgroundColor: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f']
                          }]
                      }
                  });
              }
          });
      },
      toggleDetailVisibility(index) {
        const detailIndex = this.visibleDetails.indexOf(index);
        if (detailIndex === -1) {
            this.visibleDetails.push(index); // Show details
        } else {
            this.visibleDetails.splice(detailIndex, 1); // Hide details
        }
        },
      toggleGroup(index) {
        // Toggle group details and ensure charts are generated after the DOM updates
        this.expandedGroups[index] = !this.expandedGroups[index];
        this.$nextTick(() => {
          if (this.expandedGroups[index]) {
            this.generatePieChartForGroup(index);
            this.generateLineChartForGroup(index);
          }
        });
      },
      generateLineChartForGroup(index) {
        const groupName = this.rankedResults[index].name;
        const canvasRef = `lineChart${index}`;
        this.$nextTick(() => {
          const canvas = this.$refs[canvasRef] ? this.$refs[canvasRef][0] : null;
          if (!canvas) {
            console.error("Canvas element not found for index:", index);
            return;
          }
          const ctx = canvas.getContext('2d');

          // Clear existing chart if one is present
          if (this.charts[index]) {
            this.charts[index].destroy();
          }

          // Ensure data is ready and has the expected structure
          if (!this.quarterResults || !this.quarterResults.length) {
            console.error("Quarterly results data not ready or empty");
            return;
          }

          const labels = this.quarterResults.map(q => q.quarter);
          const datasets = [];

          // Assuming 'groups' within 'quarterResults' has detailed values for each asset type per group
          const assetTypes = ['Equity', 'Bonds', 'RealEstate', 'Banks', 'Other'];

          assetTypes.forEach(assetType => {
            const assetData = this.quarterResults.map(quarter => {
              const groupData = quarter.groups[groupName];
              return groupData ? groupData[assetType] || 0 : 0;
            });

            datasets.push({
              label: assetType,
              data: assetData,
              fill: false,
              borderColor: this.getRandomColor(),
              borderWidth: 1,
              tension: 0.4
            });
          });

          // Generate the line chart with detailed quarterly asset values
          this.charts[index] = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
              scales: {
                y: {
                  beginAtZero: true
                }
              },
              responsive: true,
              maintainAspectRatio: false
            }
          });
        });
      },

      prepareChartDataForGroup(groupName) {
        // Labels for the X-axis of the chart (each quarter)
        const labels = this.quarterResults.map(result => result.quarter);

        // Initialize the dataset for the line chart
        const dataset = {
          label: groupName,
          data: [],
          borderColor: 'rgba(54, 162, 235, 0.5)',
          borderWidth: 2,
          fill: false,
        };

        // Iterate through each quarter
        this.quarterResults.forEach(quarterResult => {
          // If the group exists in this quarter
          if (quarterResult.groups && quarterResult.groups[groupName]) {
            const groupAssets = quarterResult.groups[groupName];
            // Calculate the sum of all assets
            const totalWorth = Object.values(groupAssets).reduce((sum, value) => sum + value, 0);
            dataset.data.push(totalWorth);
          } else {
            // If no data for this group in the quarter, push a 0 (or you might choose to push `null`)
            dataset.data.push(0);
          }
        });

        return {
          labels: labels,
          datasets: [dataset],
        };
      },

      generatePieChartForGroup(index) {
        const result = this.rankedResults[index];
        const canvasRef = `pieChart${index}`;
        const canvas = this.$refs[canvasRef] ? this.$refs[canvasRef][0] : null;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          new Chart(ctx, {
            type: 'pie',
            data: {
              labels: ['Equity', 'Bonds', 'Real Estate', 'Bank Accounts', 'Other'],
              datasets: [{
                data: [result.equity, result.bonds, result.realestate, result.banks, result.other],
                backgroundColor: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'],
                hoverBackgroundColor: ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f']
              }]
            }
          });
        } else {
          console.error('Pie chart canvas not found for index:', index);
        }
      },
      getRandomColor() {
        // Generate and return a random hex color
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      },
  }
};

</script>

<style scoped>
.results-screen {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #83baf1; /* A light gray background */
}

.title {
  text-align: center;
  color: #172b4d; /* Navy */
  font-size: 2.5rem;
  margin-bottom: 2rem;
}

.results-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.result-group {
  background-color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
  cursor: pointer;
  width: 100%; /* Adjust the width as necessary */
  max-width: 600px; /* You can adjust this value to suit your design */
}

.result-group:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.result-group h2 {
  color: #172b4d; /* Navy */
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.gold {
  background-color: #ffd700; /* Gold */
}

.silver {
  background-color: #c0c0c0; /* Silver */
}

.bronze {
  background-color: #cd7f32; /* Bronze */
}

.chart-container {
  width: 100%;
  height: 250px;
  margin-bottom: 1.5rem;
}

.asset-list {
  list-style-type: none;
  padding: 0;
  margin-top: 20px;
  border-radius: 8px; /* Rounded corners for the list */
  overflow: hidden; /* Ensures the child elements' rounded corners are respected */
}

.asset-list li {
  display: block; /* Ensures the list behaves like a block element */
  margin-bottom: 10px;
  padding: 10px;
  font-size: 1rem;
  color: #333; /* Dark text for better readability */
  background-color: #f9f9f9; /* Light background for each item */
  border-bottom: 1px solid #ddd; /* Adds a subtle separator between items */
  transition: background-color 0.3s ease; /* Smooth transition for hover effect */
  border-radius: 5px; /* Rounded corners */
}

.asset-list li:last-child {
  border-bottom: none; /* Removes the border from the last item */
}

.asset-list li:before {
  content: "• ";
  color: #FFC107; /* Yellow dot before each item */
  font-weight: bold; /* Makes the dot a bit bolder */
}

.asset-list li:hover {
  background-color: #fceb8f; /* Slightly darker background on hover */
  cursor: pointer; /* Changes the cursor to indicate the item is interactive */
}

.chart-area {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.pie-chart-container, .line-chart-container {
  flex: 1;
  padding: 10px; /* Provides some spacing around each chart */
}

.awards-container {
  display: flex;
  justify-content: flex-start; /* Align items to the start of the container */
  align-items: center; /* Align items vertically in the center */
  gap: 20px; /* Creates space between the child elements */
}

/* Additional styling for chart elements if possible */
.chartjs-render-monitor {
  border-color: #172b4d; /* Adding navy border if applicable */
}

/* Customizing the legend and tooltips to fit the navy and yellow theme */
.chart-legend {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #172b4d; /* Navy */
}

.chart-tooltip {
  background-color: #FFC107; /* Yellow */
  color: #172b4d; /* Navy text on yellow background */
  border-radius: 8px;
  padding: 10px;
}
</style>
