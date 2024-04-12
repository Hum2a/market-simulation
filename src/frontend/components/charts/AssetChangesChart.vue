<template>
    <div class="width">
      <div class="asset-changes-chart-container">
        <canvas ref="assetChangesChart" height="100"></canvas>
      </div>

      <div class="event-buttons-container">
        <template v-for="(yearEvents, year) in events" :key="year">
          <button
            v-for="(event, quarter) in yearEvents"
            :key="`${year}-${quarter}`"
            @click="showEventModal(event)"
          >
            Show {{ event.name }} for {{ quarter }} {{ year }}
          </button>
        </template>
      </div>


      <div class="buttons-container">
        <template v-for="asset in assetTypes" :key="asset">
          <!-- <button class="update-next" @click="updateAssetData(asset)">
            Update {{ asset }} Next Quarter
          </button> -->
          <button class="update-all" @click="updateAllQuarters(asset)">
            Show {{ asset }}
          </button>
        </template>
      </div>

        <div v-if="showModal" class="modal" @click="closeEventModal()">
          <div class="modal-content" @click.stop>
            <span class="close" @click="closeEventModal()">&times;</span>
            <p>{{ currentEvent.name }}</p>
            <p>{{ currentEvent.description }}</p>
            <button @click="showModal = false">Close</button>
          </div>
        </div>
        
      </div>
  </template>
  
  <script>
  import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  import Chart from 'chart.js';
  import 'chartjs-plugin-annotation';

  
  export default {
    name: 'AssetChangesChart',
    data() {
      return {
        userUID: null,
        latestSimulationIndex: 0,
        assetChanges: [],
        assetChangesChart: null,
        assetTypes: ['Equity', 'Bonds', 'RealEstate', 'Commodities', 'Other'],
        quarters: ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'],
        currentQuarters: {
          Equity: 0,
          Bonds: 0,
          RealEstate: 0,
          // Banks: 0,
          Commodities: 0,
          Other: 0,
          },
        events: {},
        showModal: false,
        currentEvent: null,
      };
    },
    methods: {
      async fetchLatestSimulationIndex() {
        const db = getFirestore();
        const simulationsRef = collection(db, this.userUID);
        const querySnapshot = await getDocs(simulationsRef);
        this.latestSimulationIndex = querySnapshot.size;  // This sets the index correctly
        console.log(`Latest Simulation Index Chart Version ${this.latestSimulationIndex}`); 
        return this.latestSimulationIndex; // It's good practice to return the value for clarity
    },

      async fetchAssetChanges() {
        if (!this.userUID) {
            console.log("User UID is not available.");
            return;
        }

        // Ensure the simulation index is fetched and wait for it before proceeding
        this.latestSimulationIndex = await this.fetchLatestSimulationIndex();
        if (this.latestSimulationIndex === undefined) {
          console.log("Failed to fetch the latest simulation index");
          return;
      }
        const db = getFirestore();
        
        // Construct the document reference using the latest simulation index
        const docRef = doc(db, this.userUID, `Simulation ${this.latestSimulationIndex}`, 'Simulation Controls', 'Controls');
        console.log(`DocRef: ${docRef.path}, latest index: ${this.latestSimulationIndex}`); // Using .path to show the full path for debugging

        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            this.assetChanges = data.assetChanges;
            this.events = data.events || {}; // Initialize events if undefined
            this.generateChart(); // Assuming generateChart uses this.assetChanges and this.events
        } else {
            console.log("ACC - fAC: No such document!");
        }
    },

      generateChart() {
        const totalQuarters = this.assetChanges.length * 4;
        const labels = ['Initial Value'].concat(Array.from({ length: totalQuarters }, (_, i) => `Q${i + 1}`));
        const lineColors = ['#3C5CCD', '#FF8368', '#444444', '#D6B235', '#FD6969',];

        // const datasets = this.assetTypes.map(type => {
        //   const data = new Array(totalQuarters + 1).fill(null);
        //   data[0] = 0; // Initial value
          
        //   return {
        //     label: type,
        //     data,
        //     fill: false,
        //     borderColor: this.getRandomColor(),
        //   };
        // });

        // Initialize each asset type with a starting value of 1000
        const datasets = this.assetTypes.map((type, index) => {
            const data = [1000]; // Start with £1000 for each asset type
            for (let i = 1; i <= totalQuarters; i++) {
                data.push(null); // Future values are null until updated
            }
            return {
                label: type,
                data,
                fill: false,
                borderColor: lineColors[index],
            };
        });

        console.log(this.quarters);

        // Calculate event annotations
        const annotations = Object.entries(this.events).flatMap(([year, yearEvents]) => {
          return Object.entries(yearEvents).map(([quarter, event]) => {
            const quarterIndex = this.quarters.indexOf(quarter) + 1; // Assuming quarters are ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec']
            const yearIndex = parseInt(year, 10) - 1; // Assuming year starts from 1 in your data
            const labelIndex = yearIndex * 4 + quarterIndex;

            return {
              type: 'line',
              mode: 'vertical',
              scaleID: 'x-axis-0',
              value: labels[labelIndex],
              borderColor: 'rgba(255,53,98,0.5)',
              borderWidth: 24,
              label: {
                enabled: true,
                content: event.name,
                position: "top",
                xAdjust: 40, // Move label 10px to the right
                backgroundColor: 'rgba(114,93,255,1)',
                fontSize: 16,
                fontColor: '#FFF', // Ensuring the text is readable
                padding: 16
              }
            };
          });
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
            annotation: {
              annotations: annotations,
            },
          },
        });
      },

      updateAssetData(assetType) {
        // Get the current quarter index for the asset type
        const quarterIndex = this.currentQuarters[assetType];
        if (quarterIndex >= this.assetChanges.length * 4) {
            console.warn("No more quarters available for updates.");
            return; // Prevents updating beyond available data
        }

        // Calculate the new value based on the percentage change from Firebase
        let newValue = 1000; // Start with the initial value of £1000
        for (let i = 0; i <= quarterIndex; i++) {
            const yearIndex = Math.floor(i / 4);
            const quarterPhase = this.quarters[i % 4];
            const change = this.assetChanges[yearIndex][quarterPhase][assetType];
            if (change !== undefined) {
                newValue *= (1 + change / 100);
            }
        }

        // Update the chart data with the new value for the asset
        const dataset = this.assetChangesChart.data.datasets.find(d => d.label === assetType);
        if (dataset) {
            dataset.data[quarterIndex + 1] = newValue;
            this.assetChangesChart.update();
        }

        // Prepare for the next update
        this.currentQuarters[assetType]++;
    },

    updateAllQuarters(assetType) {
      const totalQuarters = this.assetChanges.length * 4;
      let currentValue = 1000; // Starting value

      for (let quarterIndex = 0; quarterIndex < totalQuarters; quarterIndex++) {
        const yearIndex = Math.floor(quarterIndex / 4);
        const quarterPhase = this.quarters[quarterIndex % 4];
        const change = this.assetChanges[yearIndex] && this.assetChanges[yearIndex][quarterPhase] ? this.assetChanges[yearIndex][quarterPhase][assetType] : null;

        if (change !== null) {
          currentValue *= (1 + change / 100); // Apply the change
        }

        // Find the dataset for the assetType and update the data for the quarter
        const dataset = this.assetChangesChart.data.datasets.find(d => d.label === assetType);
        if (dataset) {
          dataset.data[quarterIndex + 1] = currentValue; // +1 to account for the 'Initial Value'
        }
      }

      // Update the currentQuarterIndex to the last quarter since we've updated all
      this.currentQuarters[assetType] = totalQuarters - 1;

      this.assetChangesChart.update();
    },


      getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      },
      showEventModal(event) {
        this.currentEvent = event;
        this.showModal = true;
      },
      closeEventModal() {
        this.showModal = false; // Assuming showModal is a boolean controlling the modal's visibility
      },
    },
    mounted() {
      const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
          if (user) {
            this.userUID = user.uid;
            this.fetchAssetChanges(); // Now fetches data using the authenticated user's UID
          } else {
            console.log("User is not authenticated.");
          }
        });
      this.$nextTick(() => {
        const canvas = this.$refs.assetChangesChart;
        canvas.addEventListener('click', this.onCanvasClick);
      });
    },
    

  };
  </script>
  
  <style scoped>

  .width {
    width: 100%;
  }
  .asset-changes-chart-container {
    width: 100%;
    height: auto;
  }

  .buttons-container {
  display: flex;
  justify-content: space-around; /* This will evenly space the buttons */
  flex-wrap: wrap; /* Allows buttons to wrap to the next line on small screens */
  margin-top: 20px;
  margin-bottom: 50px;
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

  .events-container {
  margin-top: 20px;
}

.events-container h3 {
  margin-bottom: 10px;
}

.events-container table {
  width: 100%;
  border-collapse: collapse;
}

.events-container th, .events-container td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.events-container th {
  background-color: #f2f2f2;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #ffffff;
  color: #000000;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
}

.event-buttons-container {
  display: flex;
  flex-wrap: wrap; /* Allows buttons to wrap to the next line if they don't fit */
  justify-content: center; /* Center the buttons container */
  gap: 10px; /* Spacing between buttons */
  padding: 20px 0; /* Padding above and below the container */
  margin-top: 20px; /* Space between the chart and the buttons */
  border-top: 1px solid #ccc; /* A line to separate the chart from the buttons */
}

.event-buttons-container button {
  padding: 10px 15px; /* Padding inside the buttons */
  background-color: #CB0E38;
  color: rgb(253, 253, 253); /* Text color */
  border: none; /* Removes the default border */
  border-radius: 5px; /* Rounded corners */
  cursor: pointer; /* Changes the cursor to a pointer on hover */
  transition: background-color 0.3s; /* Smooth transition for background color */
}

.event-buttons-container button:hover {
  background-color: #ff0000; /* Darker shade on hover */
}

.event-buttons-container button:focus {
  outline: none; /* Removes the outline to keep the design clean */
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5); /* Adds a focus state for accessibility */
}

.update-next {
  background-color: #4CAF50; /* Green background */
  color: white;
}

.update-next:hover {
  background-color: #45a049; /* Darker green on hover */
}

.update-all {
  background-color: #082148;
  color: white;
  margin-top: 10px; /* Add space between button types */
}

.update-all:hover {
  background-color: #007B9E; /* Darker blue on hover */
}

  </style>