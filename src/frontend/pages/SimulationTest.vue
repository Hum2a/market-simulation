<template>
    <div>
      <header class="header">
        <img src="../assets/LifeSmartLogo.png" alt="Logo" class="logo">
      </header>
  
      <div class="sim-chart-container">
        <asset-changes-chart />
      </div>
      <div class="sim-chart-container">
        <canvas ref="assetGrowthChart" height="100"></canvas>
        <button @click="updateValuesForNextQuarter" class="modern-button">Next Quarter</button>
        <button @click="runFullSimulation" class="modern-button">Run Full Simulation</button>
      </div>
        <div class="simulation-table">
        <h2>Simulation Data</h2>
        <table>
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Equity</th>
              <th>Bonds</th>
              <th>Real Estate</th>
              <th>Commodities</th>
              <th>Other</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(group, index) in groups" :key="index">
              <td>{{ group.name }}</td>
              <td>{{ group.equity }}</td>
              <td>{{ group.bonds }}</td>
              <td>{{ group.realestate }}</td>
              <td>{{ group.commodities }}</td>
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
        
      </div>
      <button @click="finishSimulation" class="modern-button">Finish Simulation</button>
    </div>
  </template>
  
  <script>
  
  import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  import AssetChangesChart from '../components/charts/AssetChangesChart.vue';
  import Chart from 'chart.js';
  import { useRouter } from 'vue-router';
  
  export default {
    name: 'SimulationPage',
    components: {

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
                if (this.groups.length > 0) {
                this.renderAllPieCharts();
                }
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
        const simulationsRef = collection(db, this.userUID);
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
        this.$nextTick(() => {
          if (this.groups.length > 0) {
            this.renderAllPieCharts();
          }
        });
      },
        async fetchGroups() {
          if (!this.userUID || !this.latestSimulationIndex) {
            console.error("User UID not set or simulation index not found.");
            return;
          }
          const db = getFirestore();
          console.log(`Simulation ${this.latestSimulationIndex}`);
          const querySnapshot = await getDocs(collection(db, this.userUID, `Simulation ${this.latestSimulationIndex}`, "Groups"));
          this.groups = querySnapshot.docs.map(doc => {
            // Map document data to include future values initialized to current values
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
          const docRef = doc(db, this.userUID, `Simulation ${this.latestSimulationIndex}`, 'Simulation Controls', 'Controls');
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            this.assetChanges = data.assetChanges;
            this.simulationYears = data.years || 1; // Assuming your document includes a 'years' field
            // Initialize detailedGrowth based on the fetched years
            this.initializeDetailedGrowth();
          } else {
            console.log("Fetch Asset Change: No such document!");
          }
        },
        initializeDetailedGrowth() {
          // Prepare detailedGrowth with initial values for each group and asset type
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
            const totalQuarters = this.simulationYears * 4;
            let quarterCount = 0;

            const runQuarter = () => {
            if (quarterCount < totalQuarters && this.currentQuarterIndex < totalQuarters) {
                this.updateValuesForNextQuarter();
                quarterCount++;
                setTimeout(runQuarter, 2000); // 500 milliseconds delay between quarters
            }
            };

            runQuarter();
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

                    totalValue += newValue;  // Accumulate the total value of all assets

                    // Update the detailed growth projections
                    if (!this.detailedGrowth[group.name][assetType]) {
                        this.detailedGrowth[group.name][assetType] = [];
                    }
                    this.detailedGrowth[group.name][assetType].push(newValue);
                });

                // Update the total portfolio value for the current quarter
                if (!this.totalPortfolioValues[group.name]) {
                    this.totalPortfolioValues[group.name] = [];
                }
                this.totalPortfolioValues[group.name].push(totalValue);

                // Update the chart dataset for total values
                if (this.assetGrowthChartInstance.data.datasets[groupIndex].data.length > this.currentQuarterIndex + 1) {
                    // Update existing data point if it exists
                    this.assetGrowthChartInstance.data.datasets[groupIndex].data[this.currentQuarterIndex + 1] = totalValue;
                } else {
                    // Add a new data point if it does not exist
                    this.assetGrowthChartInstance.data.datasets[groupIndex].data.push(totalValue);
                }
            });

            console.log("Updated dataset:", this.assetGrowthChartInstance.data.datasets);
            this.currentQuarterIndex++;
            this.assetGrowthChartInstance.options.animation = {
                duration: 2000,  // Adjust the duration as needed
                easing: 'linear'
            };
            this.assetGrowthChartInstance.update();
        },


        initializeAssetGrowthChart() {
            const ctx = this.$refs.assetGrowthChart.getContext('2d');
            const totalQuarters = this.simulationYears * 4;  // Calculate total number of quarters
            const datasets = this.groups.map(group => ({
                label: group.name,
                data: new Array(totalQuarters + 1).fill(null),  // +1 for the initial value
                fill: false,
                borderColor: this.colorPalette[this.groups.indexOf(group) % this.colorPalette.length],
            }));

            const smoothLineDrawPlugin = {
                id: 'smoothLineDraw',
                beforeDatasetsDraw: function(chart, easing) {
                    const ctx = chart.ctx;
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        if (!meta.hidden) {
                            meta.data.forEach((point, index) => {
                                if (index === 0) return; // skip the first point
                                const previousPoint = meta.data[index - 1];
                                const currentLineProgress = easing * (point._model.x - previousPoint._model.x);

                                // Draw line from previous point to current point based on easing
                                ctx.beginPath();
                                ctx.moveTo(previousPoint._model.x, previousPoint._model.y);
                                ctx.lineTo(previousPoint._model.x + currentLineProgress, point._model.y);
                                ctx.strokeStyle = dataset.borderColor;
                                ctx.lineWidth = dataset.borderWidth;
                                ctx.stroke();
                            });
                        }
                    });
                }
            };


            // Populate initial data
            this.groups.forEach((group, index) => {
                const initialTotal = ['equity', 'bonds', 'realestate', 'commodities', 'other']
                .reduce((total, key) => total + parseFloat(group[key] || 0), 0);
                datasets[index].data[0] = initialTotal;  // Set initial value correctly
            });

            this.assetGrowthChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                labels: ['Initial'].concat(Array.from({ length: totalQuarters }, (_, i) => `Q${i + 1}`)),
                datasets: datasets
                },
                options: {
                scales: {
                    y: { beginAtZero: true },
                },
                responsive: true,
                maintainAspectRatio: true,
                animation: {
                    duration: 500,  // Duration in milliseconds for the entire dataset to animate
                    easing: 'linear'  // Ensure the animation is smooth
                },
                plugins: [smoothLineDrawPlugin]
                },
            });

            this.assetGrowthChartInstance.update();
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
          const assetTypes = ['Equity', 'Bonds', 'RealEstate', 'Commodities', 'Other']; // Define asset types directly
          const labels = ['Initial Value'].concat(
            Array.from({ length: this.simulationYears * 4 }, (_, i) => `Q${i + 1}`)
          );
          const lineColors = ['#268F8F', '#5D81FF', '#5DD0FD', '#69FDB6', '#82DF96'];
  
          const datasets = assetTypes.map((type, index) => {
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
              borderColor: lineColors[index],
              tension: 0.5
            };
          });
  
          return { labels, datasets };
        },
  
        // generateTotalPortfolioChartData() {
        //   const labels = ['Initial'].concat(Array.from({ length: this.simulationYears * 4 }, (_, i) => `Q${i + 1}`));
        //   let colorIndex = 0; // Start with the first color in the palette
  
        //   const datasets = Object.keys(this.totalPortfolioValues).map(groupName => {
        //     // Ensure the values array only extends up to the current quarter index + 1 for the initial value
        //     const values = this.totalPortfolioValues[groupName];
        //     const adjustedValues = [values[0]].concat(values.slice(1, this.currentQuarterIndex + 1));
  
        //     // Fill the rest of the array with nulls up to the total number of quarters + initial value
        //     while (adjustedValues.length < this.simulationYears * 4 + 1) {
        //       adjustedValues.push(null);
        //     }
  
        //     const dataset = {
        //       label: groupName,
        //       data: adjustedValues,
        //       fill: false,
        //       borderColor: this.colorPalette[colorIndex % this.colorPalette.length], // Use the color from the palette
        //       tension: 0.1 // Adds a slight curve to lines
        //     };
  
        //     colorIndex++; // Move to the next color in the palette for the next group
        //     return dataset;
        //   });
  
        //   return { labels, datasets };
        // },
  
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
          labels: ['Equity', 'Bonds', 'Real Estate', 'Commodities', 'Other'],
          datasets: [{
            data: [group.equity, group.bonds, group.realestate, group.other],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#FAA74B', '#9966FF'],
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
            commodities: 0,
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
  
        // Now, finalValues is ready with the actual final values from the simulation
        // Reference to the Firestore service
        const db = getFirestore();
  
        // Reference to the "Results" collection and "Final" document
        const docRef = doc(db, this.userUID, `Simulation ${this.latestSimulationIndex}`, "Results", "Final");
  
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
        const docRef = doc(db, this.userUID, `Simulation ${this.latestSimulationIndex}`, "Results", "Quarters");
  
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