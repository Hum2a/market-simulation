<template>
    <div>
      <div class="asset-changes-chart-container">
        <canvas ref="assetChangesChart" height="100"></canvas>
      </div>
      
      <div class="buttons-container">
        <button v-for="asset in assetTypes" :key="asset" @click="updateAssetData(asset)">
            Update {{ asset }} Next Quarter
        </button>
        </div>

      </div>
  </template>
  
  <script>
  import { getFirestore, doc, getDoc } from 'firebase/firestore';
  import Chart from 'chart.js';
  
  export default {
    name: 'AssetChangesChart',
    data() {
      return {
        assetChanges: [],
        assetChangesChart: null,
        assetTypes: ['Equity', 'Bonds', 'RealEstate', 'Banks', 'Other'],
        currentQuarters: {
            Equity: 0,
            Bonds: 0,
            RealEstate: 0,
            Banks: 0,
            Other: 0,
            },
      };
    },
    methods: {
      async fetchAssetChanges() {
        const db = getFirestore();
        const docRef = doc(db, 'Simulation Controls', 'Controls');
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          this.assetChanges = docSnap.data().assetChanges;
          this.generateChart();
        } else {
          console.log("No such document!");
        }
      },
      generateChart() {
        const totalQuarters = this.assetChanges.length * 4;
        const labels = ['Initial Value'].concat(Array.from({ length: totalQuarters }, (_, i) => `Q${i + 1}`));
  
        const datasets = this.assetTypes.map((type) => {
          const data = new Array(totalQuarters + 1).fill(null);
          data[0] = 0; // Initial value
          
          return {
            label: type,
            data,
            fill: false,
            borderColor: this.getRandomColor(),
          };
        });
  
        const chartData = { labels, datasets };
  
        const ctx = this.$refs.assetChangesChart.getContext('2d');
        this.assetChangesChart = new Chart(ctx, {
          type: 'line',
          data: chartData,
          options: {
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      },
      updateAssetData(assetType) {
        const quarterIndex = this.currentQuarters[assetType];
        if (quarterIndex >= this.assetChanges.length * 4) return; // No more data to update for this asset type

        const yearIndex = Math.floor(quarterIndex / 4);
        const quarterPhase = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'][quarterIndex % 4];
        const yearData = this.assetChanges[yearIndex];
        const quarterData = yearData ? yearData[quarterPhase][assetType] : null;

        // Update the specific dataset for the asset type
        const dataset = this.assetChangesChart.data.datasets.find(d => d.label === assetType);
        if (dataset) {
            dataset.data[quarterIndex + 1] = quarterData; // +1 to account for the 'Initial Value'
            this.currentQuarters[assetType]++; // Increment the quarter counter for this asset type
            this.assetChangesChart.update();
        }
        },

      getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      },
    },
    mounted() {
      this.fetchAssetChanges();
    },
  };
  </script>
  
  <style scoped>
  .asset-changes-chart-container {
    width: 100%;
    height: auto;
  }

  .buttons-container {
  display: flex;
  justify-content: space-around; /* This will evenly space the buttons */
  flex-wrap: wrap; /* Allows buttons to wrap to the next line on small screens */
  margin-top: 20px;
}
  button {
    display: block;
    margin-top: 10px;
    padding: 10px 20px;
    font-size: 16px;
    background-color: yellow; /* Yellow background */
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease; /* Smooth transition for hover effects */
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); /* Soft shadow for depth */
    color: black; /* Text color */
  }
  
  button:hover {
    background-color: #ffcc00; /* A slightly darker yellow for hover */
    transform: translateY(-2px); /* Slightly raise the button */
    box-shadow: 0px 6px 8px rgba(0, 0, 0, 0.2); /* Increase shadow for lifted effect */
  }
  
  button:active {
    transform: translateY(1px); /* Push down on click */
    box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.2); /* Decrease shadow for pressed effect */
  }
  </style>
  
  