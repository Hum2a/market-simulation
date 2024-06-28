<template>
  <div class="width">
    <div class="asset-changes-chart-container">
      <canvas ref="assetChangesChart" height="100"></canvas>
    </div>

    <div class="event-buttons-container">
      <button @click="toggleAllAnnotations" class="toggle-all-button">Show All Annotations</button>
      <template v-for="(yearEvents, year) in events" :key="year">
        <button
          v-for="(event, quarter) in yearEvents"
          :key="`${year}-${quarter}`"
          @click="toggleEventAnnotation(year, quarter)"
          class="toggle-individual-button"
        >
          Show {{ event.name }}
        </button>
      </template>
    </div>

    <div class="buttons-container">
      <template v-for="asset in assetTypes" :key="asset">
        <button class="update-all" @click="toggleAssetVisibility(asset)">
          Show/Hide {{ asset }}
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
import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';
import { shallowRef, nextTick } from 'vue';

Chart.register(annotationPlugin);

export default {
  name: 'AssetChangesChart',
  setup() {
    const assetChangesChart = shallowRef(null);
    return { assetChangesChart };
  },
  data() {
    return {
      userUID: null,
      latestSimulationIndex: 0,
      assetChanges: [],
      assetTypes: ['Equity', 'Bonds', 'RealEstate', 'Commodities', 'Other'],
      quarters: ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'],
      assetVisibility: {
        Equity: true,
        Bonds: true,
        RealEstate: true,
        Commodities: true,
        Other: true
      },
      events: {},
      showModal: false,
      currentEvent: null,
      eventAnnotationsVisible: {},
    };
  },
  methods: {
    async fetchLatestSimulationIndex() {
      console.log('Asset Changes Chart: Fetching latest simulation index');
      const db = getFirestore();
      const simulationsRef = collection(db, this.userUID, 'Asset Market Simulations', 'Simulations');
      const querySnapshot = await getDocs(simulationsRef);
      this.latestSimulationIndex = querySnapshot.size;
      console.log(`Asset Changes Chart: Latest Simulation Index: ${this.latestSimulationIndex}`);
      return this.latestSimulationIndex;
    },

    async fetchAssetChanges() {
      if (!this.userUID) {
        console.log("Asset Changes Chart: User UID is not available.");
        return;
      }

      console.log('Asset Changes Chart: Fetching asset changes');
      this.latestSimulationIndex = await this.fetchLatestSimulationIndex();
      if (this.latestSimulationIndex === undefined) {
        console.log("Asset Changes Chart: Failed to fetch the latest simulation index");
        return;
      }
      const db = getFirestore();
      const docRef = doc(db, this.userUID, 'Asset Market Simulations', 'Simulations', `Simulation ${this.latestSimulationIndex}`, 'Simulation Controls', 'Controls');
      console.log(`Asset Changes Chart: DocRef: ${docRef.path}, latest index: ${this.latestSimulationIndex}`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        this.assetChanges = data.assetChanges;
        this.events = data.events || {};
        Object.keys(this.events).forEach(year => {
          Object.keys(this.events[year]).forEach(quarter => {
            const key = `${year}-${quarter}`;
            this.eventAnnotationsVisible[key] = true;
          });
        });
        await nextTick();
        this.generateChart();
      } else {
        console.log("Asset Changes Chart: No such document!");
      }
    },

    generateChart() {
      console.log('Asset Changes Chart: Generating chart');
      const totalQuarters = this.assetChanges.length * 4;
      console.log(`Asset Changes Chart: Total Quarters: ${totalQuarters}`);
      const labels = ['Q0'].concat(Array.from({ length: totalQuarters }, (_, i) => `Q${i + 1}`));
      console.log(`Asset Changes Chart: Labels: ${labels}`);
      const lineColors = ['#3C5CCD', '#FF8368', '#444444', '#D6B235', '#FD6969'];

      const datasets = this.assetTypes.map((type, index) => {
        const data = [1000];
        this.assetChanges.forEach(yearData => {
          this.quarters.forEach(quarter => {
            const change = yearData[quarter][type];
            const lastValue = data[data.length - 1];
            const newValue = lastValue * (1 + change / 100);
            data.push(newValue);
          });
        });
        console.log(`Asset Changes Chart: Dataset for ${type}: ${data}`);
        return {
          label: type,
          data,
          fill: false,
          borderColor: lineColors[index],
          hidden: this.assetVisibility[type],
          cubicInterpolationMode: 'monotone',
          tension: 0.4,
        };
      });

      const annotations = Object.entries(this.events).flatMap(([year, yearEvents]) => {
        return Object.entries(yearEvents).map(([quarter, event]) => {
          const quarterIndex = this.quarters.indexOf(quarter) + 1;
          const yearIndex = parseInt(year, 10) - 1;
          const labelIndex = yearIndex * 4 + quarterIndex;
          const key = `${year}-${quarter}`;

          if (!this.eventAnnotationsVisible[key]) {
            return null;
          }

          return {
            type: 'line',
            xMin: labels[labelIndex],
            xMax: labels[labelIndex],
            borderColor: '#DAC2C2',
            borderWidth: 20,
            label: {
              content: event.name,
              enabled: true,
              position: 'end', // Change position to start
              backgroundColor: 'rgba(114,93,255,1)',
              color: '#000',
              font: {
                size: 12,
              },
              padding: 4,
              // yAdjust: 20, // Adjust y position to move the label down
            },
          };
        }).filter(annotation => annotation !== null);
      });

      console.log('Asset Changes Chart: Annotations:', annotations);

      const chartData = { labels, datasets };
      console.log('Asset Changes Chart: Chart Data:', chartData);

      const ctx = this.$refs.assetChangesChart.getContext('2d');
      console.log('Asset Changes Chart: Canvas Context:', ctx);

      if (ctx && this.assetChangesChart) {
        this.assetChangesChart.value = new Chart(ctx, {
          type: 'line',
          data: chartData,
          options: {
            scales: {
              x: {
                grid: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                display: true,
                labels: {
                  font: {
                    size: 12,
                  },
                },
              },
              annotation: {
                annotations: annotations.filter(a => a !== null),
                drawTime: 'afterDatasetsDraw',
              },
            },
          },
        });
        console.log('Asset Changes Chart: Chart created:', this.assetChangesChart.value);
      } else {
        console.error('Asset Changes Chart: Failed to get canvas context or assetChangesChart is null');
      }
    },

    toggleEventAnnotation(year, quarter) {
      const key = `${year}-${quarter}`;
      this.eventAnnotationsVisible[key] = !this.eventAnnotationsVisible[key];
      this.updateChartAnnotations();
      this.assetChangesChart.value.update();
    },

    toggleAllAnnotations() {
      const allVisible = Object.values(this.eventAnnotationsVisible).every(visibility => visibility);
      Object.keys(this.eventAnnotationsVisible).forEach(key => {
        this.eventAnnotationsVisible[key] = !allVisible;
      });
      this.updateChartAnnotations();
      this.assetChangesChart.value.update();
    },

    updateChartAnnotations() {
      const labels = this.assetChangesChart.value.data.labels;

      const annotations = Object.entries(this.events).flatMap(([year, yearEvents]) => {
        return Object.entries(yearEvents).map(([quarter, event]) => {
          const quarterIndex = this.quarters.indexOf(quarter) + 1;
          const yearIndex = parseInt(year, 10) - 1;
          const labelIndex = yearIndex * 4 + quarterIndex;
          const key = `${year}-${quarter}`;

          if (!this.eventAnnotationsVisible[key]) {
            return null;
          }

          return {
            type: 'line',
            xMin: labels[labelIndex],
            xMax: labels[labelIndex],
            borderColor: '#DAC2C2',
            borderWidth: 20,
            label: {
              content: event.name,
              enabled: true,
              position: 'end', // Change position to start
              backgroundColor: 'rgba(114,93,255,1)',
              color: '#000',
              font: {
                size: 12,
              },
              padding: 4,
              // yAdjust: 20, // Adjust y position to move the label down
            },
          };
        }).filter(annotation => annotation !== null);
      });

      console.log('Asset Changes Chart: Updated Annotations:', annotations);

      this.assetChangesChart.value.options.plugins.annotation.annotations = annotations;
    },

    toggleAssetVisibility(assetType) {
      const dataset = this.assetChangesChart.value.data.datasets.find(d => d.label === assetType);
      if (dataset) {
        dataset.hidden = !dataset.hidden; // Toggle the visibility
        this.assetChangesChart.value.update();
      }
    },

    showEventModal(event) {
      this.currentEvent = event;
      this.showModal = true;
    },
    closeEventModal() {
      this.showModal = false;
    },
  },
  mounted() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.userUID = user.uid;
        this.fetchAssetChanges();
      } else {
        console.log("Asset Changes Chart: User is not authenticated.");
      }
    });
    this.$nextTick(() => {
      const canvas = this.$refs.assetChangesChart;
      canvas.addEventListener('click', this.onCanvasClick);
    });
  },
  beforeUnmount() {
    if (this.assetChangesChart.value) {
      this.assetChangesChart.value.destroy();
    }
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
  justify-content: space-around;
  flex-wrap: wrap;
  margin-top: 20px;
  margin-bottom: 50px;
}
button {
  display: block;
  margin-top: 10px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: yellow;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  color: black;
}

button:hover {
  background-color: #ffcc00;
  transform: translateY(-2px);
  box-shadow: 0px 6px 8px rgba(0, 0, 0, 0.2);
}

button:active {
  transform: translateY(1px);
  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.2);
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
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  padding: 20px 0;
  margin-top: 20px;
  border-top: 1px solid #ccc;
}

.event-buttons-container button {
  padding: 10px 15px;
  color: rgb(253, 253, 253);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: smaller;
}

.event-buttons-container button:hover {
  background-color: #ff0000;
}

.event-buttons-container button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5);
}

.toggle-all-button {
  background-color: #d74867;
}

.toggle-individual-button {
  background-color: #CB0E38;
}

.update-all {
  background-color: #082148;
  color: white;
  margin-top: 10px;
}

.update-all:hover {
  background-color: #007B9E;
}
</style>
