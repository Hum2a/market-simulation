<template>
  <header class="header">
    <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo">
    <div>
      <button @click="toggleCalculator" class="calculator-toggle">
        <i class="fas fa-calculator"></i>
      </button>
    </div>
  </header>
  <div class="results-screen" v-if="dataReady">
    <h1 class="title">
      <img src="../../assets/Blue line.png" alt="BlueLine" class="blueline">
      Investment Results
    </h1>
    <div class="results-container">
      <div v-for="(result, index) in rankedResults" :key="index" class="result-group"
           :class="{'gold': index === 0, 'silver': index === 1, 'bronze': index === 2}"
           @click="toggleGroup(index)">
        <h2>{{ index + 1 }}. {{ result.name }} (${{ result.totalWorth.toFixed(2) }})</h2>
        <div v-if="expandedGroups[index]" class="details">
          <div class="result-details">
            <ul class="asset-list">
              <li v-for="(value, key) in result.assets" :key="key">
                {{ key }}: ${{ value.final.toFixed(2) }} ({{ value.change }})
              </li>
              <li>Final Portfolio Value: ${{ result.totalWorth.toFixed(2) }}</li>
              <li>Total Portfolio Gains: ${{ result.totalGains.toFixed(2) }}</li>
              <li v-if="result.mostGainsAsset">
                Most Gains in Asset Class: {{ result.mostGainsAsset.assetType }} (${{ result.mostGainsAsset.gain }})
              </li>
              <li>ROI: {{ result.roi.toFixed(2) }}%</li>
              <li>Annualized Return: {{ result.annualizedReturn.toFixed(2) }}%</li>
            </ul>
            <div class="chart-area">
              <div class="line-chart-container">
                <canvas :id="'lineChart-' + index" :ref="'lineChart' + index" height="300"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <button @click="restartSimulation" class="restart-button">Restart Simulation</button>
  </div>
</template>

<script>
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import Chart from 'chart.js/auto';

export default {
  name: 'ResultsScreen',
  data() {
    return {
      userUID: null,
      latestSimulationIndex: null,
      finalResults: [],
      quarterResults: [],
      visibleDetails: [],
      expandedGroups: {},
      charts: [],
      dataReady: false, // Flag to check if data is ready
      fixedColors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
    };
  },
  mounted() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.userUID = user.uid;
        this.latestSimulationIndex = await this.fetchLatestSimulationIndex();
        await Promise.all([
          this.fetchFinalResults(),
          this.fetchQuarterlyResults()
        ]);
        this.processResults(); // Perform calculations and chart generation
        this.dataReady = true; // Set flag to true after data is processed
      } else {
        console.log("User is not authenticated.");
      }
    });
  },
  computed: {
    rankedResults() {
      if (!this.dataReady) return [];
      return this.finalResults.map((result, index) => {
        const numberOfYears = this.calculateNumberOfYears();
        const initialTotalWorth = this.getInitialTotalWorth(index);
        const finalTotalWorth = [
          result.equity,
          result.bonds,
          result.realestate,
          result.commodities,
          result.other
        ].reduce((acc, value) => acc + Number(value), 0);
        const totalGains = finalTotalWorth - initialTotalWorth;
        const roi = ((finalTotalWorth - initialTotalWorth) / initialTotalWorth) * 100;
        const annualizedReturn = (Math.pow((finalTotalWorth / initialTotalWorth), 1 / numberOfYears) - 1) * 100;

        const mostGainsAsset = this.calculateMostGainsAsset(index);

        return {
          ...result,
          totalWorth: finalTotalWorth,
          totalGains: isNaN(totalGains) ? 0 : totalGains,
          mostGainsAsset,
          roi: isNaN(roi) ? 0 : roi,
          annualizedReturn: isNaN(annualizedReturn) ? 0 : annualizedReturn
        };
      }).sort((a, b) => b.totalWorth - a.totalWorth);
    }
  },
  methods: {
    async fetchLatestSimulationIndex() {
      const db = getFirestore();
      const simulationsRef = collection(db, this.userUID, 'Asset Market Simulations', 'Simulations');
      const querySnapshot = await getDocs(simulationsRef);
      return querySnapshot.size;
    },
    async fetchFinalResults() {
      if (!this.userUID) {
        console.error("User UID not available.");
        return;
      }
      const db = getFirestore();
      const docRef = doc(db, this.userUID, 'Asset Market Simulations', 'Simulations', `Simulation ${this.latestSimulationIndex}`, "Results", "Final");
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          this.finalResults = docSnap.data().finalValues;
          console.log('Final Results:', JSON.stringify(this.finalResults, null, 2)); // Detailed log
          this.finalResults.forEach((_, index) => {
            this.expandedGroups[index] = true;
          });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    },
    async fetchQuarterlyResults() {
      if (!this.userUID) {
        console.error("User UID not available.");
        return;
      }
      const db = getFirestore();
      const docRef = doc(db, this.userUID, 'Asset Market Simulations', 'Simulations', `Simulation ${this.latestSimulationIndex}`, "Results", "Quarters");
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          this.quarterResults = docSnap.data().quarterResults;
          console.log('Quarterly Results:', JSON.stringify(this.quarterResults, null, 2)); // Detailed log
        } else {
          console.error("No quarterly results found!");
        }
      } catch (error) {
        console.error("Error fetching quarterly results:", error);
      }
    },
    processResults() {
      const numberOfQuarters = this.quarterResults[0].bonds.length;
      this.finalResults = this.finalResults.map((result, index) => {
        const initialTotalWorth = this.getInitialTotalWorth(index);
        const finalTotalWorth = [
          result.equity,
          result.bonds,
          result.realestate,
          result.commodities,
          result.other
        ].reduce((acc, value) => acc + Number(value), 0);
        const totalGains = finalTotalWorth - initialTotalWorth;
        const roi = ((finalTotalWorth - initialTotalWorth) / initialTotalWorth) * 100;
        const annualizedReturn = (Math.pow((finalTotalWorth / initialTotalWorth), 4 / numberOfQuarters) - 1) * 100;

        const mostGainsAsset = this.calculateMostGainsAsset(index);

        return {
          ...result,
          totalWorth: finalTotalWorth,
          totalGains: isNaN(totalGains) ? 0 : totalGains,
          mostGainsAsset,
          roi: isNaN(roi) ? 0 : roi,
          annualizedReturn: isNaN(annualizedReturn) ? 0 : annualizedReturn
        };
      }).sort((a, b) => b.totalWorth - a.totalWorth);

      this.generateChartsForAllGroups();
    },
    getInitialTotalWorth(groupIndex) {
      if (!this.quarterResults.length) {
        console.error(`getInitialTotalWorth: No quarter results available.`);
        return 0;
      }

      const initialAssets = this.quarterResults[0];
      const assetTypes = ['equity', 'bonds', 'realestate', 'commodities', 'other'];

      const initialTotalWorth = assetTypes.reduce((sum, assetType) => {
        const assetValues = initialAssets[assetType];
        return assetValues && assetValues[groupIndex] !== undefined ? sum + assetValues[groupIndex] : sum;
      }, 0);

      return initialTotalWorth;
    },
    calculateMostGainsAsset(groupIndex) {
      console.log("calculateMostGainsAsset called for groupIndex:", groupIndex);
      if (!this.quarterResults.length) {
        console.error("calculateMostGainsAsset: No quarter results available.");
        return { assetType: 'N/A', gain: 0 };
      }

      const initialAssets = this.quarterResults[0];
      const finalAssets = this.quarterResults[this.quarterResults.length - 1];

      console.log("initialAssets:", JSON.stringify(initialAssets, null, 2));
      console.log("finalAssets:", JSON.stringify(finalAssets, null, 2));

      const assetTypes = ['equity', 'bonds', 'realestate', 'commodities', 'other'];

      let mostGainsAsset = { assetType: 'N/A', gain: 0 };
      assetTypes.forEach(assetType => {
        const initialValues = initialAssets[assetType];
        const finalValues = finalAssets[assetType];

        if (initialValues && finalValues && initialValues[groupIndex] !== undefined && finalValues[groupIndex] !== undefined) {
          const gain = finalValues[groupIndex] - initialValues[groupIndex];
          if (gain > mostGainsAsset.gain) {
            mostGainsAsset = { assetType, gain };
          }
        }
      });

      return {
        assetType: mostGainsAsset.assetType,
        gain: parseFloat(mostGainsAsset.gain).toFixed(2)
      };
    },
    calculateNumberOfYears() {
      const totalQuarters = this.quarterResults[0].bonds.length;
      return totalQuarters / 4;
    },
    toggleGroup(index) {
      this.expandedGroups[index] = !this.expandedGroups[index];
      this.$nextTick(() => {
        if (this.expandedGroups[index]) {
          this.generateLineChartForGroup(index);
        }
      });
    },
    generateChartsForAllGroups() {
      this.$nextTick(() => {
        this.finalResults.forEach((_, index) => {
          if (this.expandedGroups[index] && this.quarterResults.length > 0) {
            this.generateLineChartForGroup(index);
          }
        });
      });
    },
    generateLineChartForGroup(index) {
      const canvasRef = `lineChart${index}`;
      this.$nextTick(() => {
        const canvas = this.$refs[canvasRef] ? this.$refs[canvasRef][0] : null;
        if (!canvas) {
          console.error("Canvas element not found for index:", index);
          return;
        }
        const ctx = canvas.getContext('2d');
        if (this.charts[index]) {
          this.charts[index].destroy();
        }
        if (!this.quarterResults || !this.quarterResults.length) {
          console.error("Quarterly results data not ready or empty");
          return;
        }
        const numberOfQuarters = this.quarterResults[0].bonds.length;
        const labels = Array.from({ length: numberOfQuarters }, (_, i) => `Q${i}`); // Start from Q0
        const datasets = [];
        const assetTypes = ['equity', 'bonds', 'realestate', 'commodities', 'other'];

        const groupName = this.finalResults[index].name;
        const groupData = this.quarterResults.find(group => group.name === groupName);

        if (!groupData) {
          console.error(`No data found for group: ${groupName}`);
          return;
        }

        assetTypes.forEach((assetType, assetIndex) => {
          const assetData = groupData[assetType];
          if (assetData) {
            datasets.push({
              label: assetType,
              data: assetData,
              fill: false,
              borderColor: this.fixedColors[assetIndex % this.fixedColors.length], // Use fixed colors
              borderWidth: 1,
              tension: 0.4
            });
          }
        });

        const backgroundColorPlugin = {
          id: 'backgroundColorPlugin',
          beforeDraw: (chart) => {
            const ctx = chart.canvas.getContext('2d');
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#f6f2ef'; // Background color
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
          }
        };

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
          },
          plugins: [backgroundColorPlugin]
        });
      });
    },


    getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },
    restartSimulation() {
      this.$router.push({ name: 'GroupCreation' });
    }
  }
};
</script>

<style scoped>
.results-screen {
  margin: 0 auto;
  padding: 40px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background-color: #F6F2EF;
}

.results-screen h1 {
  display: flex;
}

.title {
  text-align: center;
  color: #172b4d;
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
  background-color: #FAEDE4;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
  cursor: pointer;
  width: 100%;
}

.result-group:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.result-group h2 {
  color: #172b4d;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.result-details {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: start;
}

.gold {
  border-color: #ffd700;
  box-shadow: 0 6px 10px #ffd700;
}

.silver {
  border-color: #c0c0c0;
  box-shadow: 0 6px 10px #c0c0c0;
}

.bronze {
  border-color: #cd7f32;
  box-shadow: 0 6px 10px #cd7f32;
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
  border-radius: 8px;
  overflow: hidden;
  margin-right: 20px;
  width: 45%;
}

.asset-list li {
  display: block;
  margin-bottom: 10px;
  padding: 20px;
  font-size: 1.2rem;
  color: #000000;
  background-color: #fafafa;
  border-bottom: 1px solid #000000;
  transition: background-color 0.4s ease-in, box-shadow 0.4s ease-in;
  border-radius: 15px;
  border: none;
  z-index: -1;
}

.asset-list li:last-child {
  border-bottom: none;
}

.asset-list li:before {
  content: "• ";
  color: #FFC107;
  font-weight: bold;
  z-index: -1;
}

.asset-list li:hover {
  background-color: #ecffaf;
  cursor: pointer;
  box-shadow: 0 0 5px #ecffaf, 0 0 10px #ecffaf, 0 0 25px #ecffaf, 0 0 50px #ecffaf;
}

.chart-area {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  flex: 2;
}

.pie-chart-container, .line-chart-container {
  flex: 1;
  padding: 10px;
  width: 100%;
}

.awards-container {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 20px;
}

.restart-button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  color: #fff;
  background: #CB0E38;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.restart-button::after {
  content: "";
  position: absolute;
  top: 0;
  left: -150%;
  width: 100%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  to {
    left: 150%;
  }
}

.restart-button:hover {
  background-color: #0056b3;
}

.chartjs-render-monitor {
  border-color: #172b4d;
}

.chart-legend {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #172b4d;
}

.chart-tooltip {
  background-color: #FFC107;
  color: #172b4d;
  border-radius: 8px;
  padding: 10px;
}

@media (max-width: 768px) {
  .result-details {
    flex-direction: column;
  }

  .asset-list, .chart-area {
    flex-basis: 100%;
  }
}
</style>
