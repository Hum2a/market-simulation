<template>
    <div class="simulation-controls">
      <h2>Simulation Controls</h2>
      <form @submit.prevent="onSubmit">
        <div class="input-group">
          <label for="years">Years:</label>
          <input type="number" id="years" v-model.number="years" min="1" />
        </div>
        <div class="quarterly-changes">
          <h3>Quarterly Asset Changes</h3>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Quarter</th>
                <th v-for="asset in assets" :key="asset">{{ asset }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="yearIndex in totalYears" :key="'Year ' + yearIndex">
                <tr v-for="(quarter, qIndex) in quarters" :key="`${yearIndex}-${quarter}`"
                    :class="`year-${yearIndex}`"
                    :style="{ backgroundColor: getColorForYear(yearIndex) }">
                  <td v-if="qIndex === 0" :rowspan="quarters.length">{{ yearIndex }}</td>
                  <td>
                    <button type="button" class="quarter-button" @click="quarterClicked(yearIndex, quarter)">
                      {{ quarter }}
                    </button>
                  </td>
                  <td v-for="asset in assets" :key="`${yearIndex}-${quarter}-${asset}`">
                    <input type="number" v-model.number="assetChanges[yearIndex-1][quarter][asset]" step="0.01" />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <button @click="toggleEventList" class="toggle-event-list-button">
            {{ showEventList ? 'Hide Events' : 'Show Events' }}
        </button>
        <button type="submit" class="save-button">Save</button>
        <button type="button" class="generate-random-button" @click="generateRandomValues">Generate Random Values</button>
        <input 
            type="file" 
            @change="handleFileUpload" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            />
      </form>
    </div>

    <div v-if="showEventModal" class="event-modal-overlay" @click.self="closeEventModal">
    <div class="event-modal">
      <h3>Add Event for {{ selectedYear }} - {{ selectedQuarter }}</h3>
      <label for="eventName">Event Name:</label>
      <input type="text" id="eventName" v-model="eventName">
      
      <label for="eventDescription">Description:</label>
      <textarea id="eventDescription" v-model="eventDescription"></textarea>
      
      <button @click="saveEvent">Save Event</button>
      <button @click="closeEventModal">Cancel</button>
    </div>
  </div>

  <div class="event-list-container" v-if="showEventList" >
    <h3>Active Events</h3>
    <ul class="event-list">
      <li v-for="(yearEvents, year) in events" :key="year">
        <h4>Year {{ year }}</h4>
        <ul>
          <li v-for="(event, quarter) in yearEvents" :key="quarter">
            {{ quarter }}: {{ event.name }}
            <span class="event-description"> - {{ event.description }}</span>
          </li>
        </ul>
      </li>
    </ul>
  </div>

</template>

  
<script>
  import { getFirestore, doc, setDoc } from 'firebase/firestore';
  import * as XLSX from 'xlsx';
  
  export default {
    name: 'SimulationControls',
    data() {
      return {
        years: 1,
        assets: ['Equity', 'Bonds', 'Real Estate', 'Bank Accounts', 'Other'],
        quarters: ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec'],
        assetChanges: [],
        showEventModal: false,
        selectedYear: null,
        selectedQuarter: null,
        eventName: '',
        eventDescription: '',
        events: {},
        showEventList: false,
      };
    },
    watch: {
      years(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.initializeAssetChanges(newVal);
        }
      },
    },
    methods: {
      initializeAssetChanges(years) {
        this.assetChanges = Array.from({ length: years }, () => {
          return this.quarters.reduce((acc, quarter) => {
            acc[quarter] = this.assets.reduce((acc, asset) => {
              acc[asset] = 0;
              return acc;
            }, {});
            return acc;
          }, {});
        });
      },
      async onSubmit() {
        const db = getFirestore();
        const docRef = doc(db, 'Simulation Controls', 'Controls');
        await setDoc(docRef, {
          years: this.years,
          assetChanges: this.assetChanges,
        }).then(() => console.log('Controls saved')).catch(console.error);
      },
      getColorForYear(index) {
        // Generate a color based on the year index
        const hue = (index * 137) % 360; // Use a simple algorithm to generate a hue
        return `hsl(${hue}, 70%, 80%)`; // Return a light color with moderate saturation
    },
        handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // Assuming the first sheet is the one you're interested in
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert sheet to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Process jsonData to update the assetChanges data structure
                this.processUploadedData(jsonData);
            };
            reader.readAsBinaryString(file);
        },
        processUploadedData(data) {
            // Reset assetChanges
            this.assetChanges = [];

            // Remove the headers as they are not needed for data processing
            data.shift();

            // Process the rows
            data.forEach((row) => {
                // Extract the year number from the 'Year' column (assumes it's in the format "Year 1", "Year 2", etc.)
                let yearMatch = row[0].match(/\d+/);
                let year = yearMatch ? parseInt(yearMatch[0], 10) - 1 : null;
                
                // Check if the quarter value is among the expected quarters
                let quarter = this.quarters.includes(row[1]) ? row[1] : null;

                // If the year or quarter couldn't be determined, skip this row
                if (year === null || quarter === null) return;

                // Initialize the asset structure for the year if not already done
                if (!this.assetChanges[year]) {
                this.assetChanges[year] = this.quarters.reduce((acc, quarter) => {
                    acc[quarter] = this.assets.reduce((innerAcc, asset) => {
                    innerAcc[asset] = 0;
                    return innerAcc;
                    }, {});
                    return acc;
                }, {});
                }

                // Assign the values for each asset
                this.assets.forEach((asset, index) => {
                // The asset values are expected to start at the 3rd column index (index 2)
                let value = row[index + 2]; // Adjust the +2 if the assets start at a different column
                if (!isNaN(parseFloat(value)) && isFinite(value)) {
                    this.assetChanges[year][quarter][asset] = parseFloat(value);
                }
                });
            });

            // After processing all rows, update the years state variable to match the length of assetChanges
            this.years = this.assetChanges.length;
        },
        quarterClicked(yearIndex, quarter) {
            this.selectedYear = yearIndex;
            this.selectedQuarter = quarter;
            this.eventName = '';
            this.eventDescription = '';
            this.showEventModal = true;
            },

        closeEventModal() {
            this.showEventModal = false;
            },

        async saveEvent() {
            // Update the events object
            if (!this.events[this.selectedYear]) {
                this.events[this.selectedYear] = {};
            }
            this.events[this.selectedYear][this.selectedQuarter] = {
                name: this.eventName,
                description: this.eventDescription
            };

            // Update Firebase
            const db = getFirestore();
            const docRef = doc(db, 'Simulation Controls', 'Controls');
            await setDoc(docRef, {
                years: this.years,
                assetChanges: this.assetChanges,
                events: this.events
            }, { merge: true }).then(() => {
                console.log('Event saved');
                this.closeEventModal();
            }).catch(console.error);
        },
        generateRandomValues() {
            this.assetChanges.forEach(yearData => {
            Object.keys(yearData).forEach(quarter => {
                this.assets.forEach(asset => {
                yearData[quarter][asset] = this.getRandomNumber();
                });
            });
            });
        },

        getRandomNumber() {
            // Generate a random number within a range and fix to 2 decimal places
            return parseFloat((Math.random() * (100 - 1) + 1).toFixed(2));
        },
        toggleEventList() {
            this.showEventList = !this.showEventList;
        },

  },
    computed: {
      totalYears() {
        return Array.from({ length: this.years }, (_, i) => i + 1);
      },
    },
    created() {
      this.initializeAssetChanges(this.years);
    },
  };
</script>
  
<style scoped>
     @import url('../styles/SimulationControlsStyles.css');
</style>