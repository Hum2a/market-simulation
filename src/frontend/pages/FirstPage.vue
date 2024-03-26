<template>
  <div>
    <h1>Start Page</h1>
    <div class="groups">
      <div v-for="(group, index) in groups" :key="index" class="group">
        <div class="group-header">
          <h2>
            {{ group.name }}
            <button @click="editGroupName(index)" class="edit-group-btn">✎</button>
            <button @click="removeGroup(index)" class="remove-group-btn">X</button>
          </h2>
        </div>
        <div class="group-content">
          <div class="inputs">
            <div class="input-row">
              <label for="equity">Equity:</label>
              <input type="text" v-model="group.equity" id="equity" class="modern-input">
            </div>
            <div class="input-row">
              <label for="bonds">Bonds:</label>
              <input type="text" v-model="group.bonds" id="bonds" class="modern-input">
            </div>
            <div class="input-row">
              <label for="realEstate">Real Estate:</label>
              <input type="text" v-model="group.realEstate" id="realEstate" class="modern-input">
            </div>
            <div class="input-row">
              <label for="banks">Bank Accounts:</label>
              <input type="text" v-model="group.banks" id="banks" class="modern-input">
            </div>
            <div class="input-row">
              <label for="other">Other:</label>
              <input type="text" v-model="group.other" id="other" class="modern-input">
            </div>
          </div>
          <button @click="generateRandomValues(index)" class="modern-button">Generate Random Values</button>
          <!-- Pie chart -->
          <canvas :id="'pieChart_' + index" class="pie-chart"></canvas>
        </div>
      </div>
    </div>
    <button @click="addGroup" class="add-group-btn">Add Group</button>
    <button @click="startSimulation" class="go-btn">Go</button>
  </div>
  <!-- <GroupCreation :groups="groups" @editGroupName="editGroupName" @removeGroup="removeGroup" @addGroup="addGroup" :generateRandomValues="generateRandomValues"></GroupCreation> -->

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
        <tr v-for="(group, index) in savedGroups" :key="index">
          <td>{{ group.name }}</td>
          <td>{{ group.equity }}</td>
          <td>{{ group.bonds }}</td>
          <td>{{ group.realEstate }}</td>
          <td>{{ group.banks }}</td>
          <td>{{ group.other }}</td>
        </tr>
      </tbody>
    </table>

    <h2>Asset Growth Projections</h2>
      <table>
        <thead>
          <tr>
            <th>Group Name</th>
            <th>Asset Type</th>
            <th>Starting Value</th>
            <th v-for="n in simulationMonths" :key="n">After {{ n }} Month(s)</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in preparedGroups" :key="group.name">
            <tr v-for="assetType in ['equity', 'bonds', 'realEstate', 'banks', 'other']" :key="`${group.name}-${assetType}`">
              <td>{{ group.name }}</td>
              <td>{{ assetType.charAt(0).toUpperCase() + assetType.slice(1) }}</td>
              <td>{{ group[assetType] }}</td>
              <template v-for="(value, index) in group.monthlyValues[assetType]" :key="`${group.name}-${assetType}-${index}`">
                <td>{{ value.toFixed(2) }}</td>
              </template>
            </tr>
          </template>
        </tbody>
      </table>
      <div class="input-row">
        <label for="userInterestRate">Interest Rate (% per month):</label>
        <input type="number" v-model="userInterestRate" id="userInterestRate" placeholder="Enter interest rate (e.g., 5 for 5%)" class="modern-input">
        <button v-if="displaySimulation" @click="updateValuesForNextMonth" class="modern-button">Next Month</button>
        <div v-if="displaySimulation" class="simulation-control">
          <select v-model="selectedEvent" class="modern-picker">
            <option value="noEvent">No Event</option>
            <option value="interestHike">Interest Rate Hike</option>
            <option value="technologicalDisruption">Technological Disruption in a Sector</option>
            <option value="politicalInstability">Political Instability</option>
            <option value="centralBankImplementsQuantitativeEasing">Central Bank Implements Quantitative Easing</option>
            <option value="cybersecurityBreachImpactingBanks">Cybersecurity Breach Impacting Banks</option>
            <option value="DiscoveryOfValuableNaturalResources">Discovery of Valuable Natural Resources</option>
            <option value="IncreaseInConsumerConfidence">Increase in Consumer Confidence</option>
            <option value="majorCorporationBankruptcy">Major Corporation Bankruptcy</option>
            <option value="naturalDisaster">Natural Disaster</option>
            <option value="realEstateBoom">Real Estate Boom</option>
            <option value="stringentEnvironmentalRegulations">Stringent Environmental Regulations</option>
            <option value="suddenInflationSpike">Sudden Inflation Spike</option>
            <option value="taxReformFavoringCorporateProfits">Tax Reform Favoring Corporate Profits</option>
            <option value="surgeInGlobalTourism">Surge in Global Tourism</option>
          </select>
          <button @click="applyEventEffect" class="modern-button">Apply Event</button>
          <button @click="showEventCreation = true" class="modern-button">Create Event</button>
          <EventCreationPage v-if="showEventCreation" @close="showEventCreation = false" />
        </div>
      </div>
      <div v-if="displaySimulation" class="chart-container" style="position: relative; height:40vh; width:80vw">
        <canvas id="growthChart"></canvas>
      </div>

  </div>


</template>

<script>
import Chart from 'chart.js'; // Import Chart.js
import { adjustGrowthRatesForInterestRateHike } from '../../backend/simulation/events/interestRateHike.js';
import { TechnologicalDisruptionInASectorEffects } from '../../backend/simulation/events/TechnologicalDisruptionInASector.js';
import { PoliticalInstabilityEffects } from '../../backend/simulation/events/PoliticalInstability.js';
import { CentralBankImplementsQuantitativeEasingEffects } from '../../backend/simulation/events/CentralBankImplementsQuantitativeEasing.js';
import { CybersecurityBreachImpactingBanksEffects } from '../../backend/simulation/events/CybersecurityBreachImpactingBanks.js';
import { DiscoveryOfValuableNaturalResourcesEffects } from '../../backend/simulation/events/DiscoveryOfValuableNaturalResources.js';
import { IncreaseInConsumerConfidenceEffects } from '../../backend/simulation/events/IncreaseInConsumerConfidence.js';
import { MajorCorporationBankruptcyEffects } from '../../backend/simulation/events/MajorCorporationBankruptcy.js';
import { NaturalDisasterEffects } from '../../backend/simulation/events/NaturalDisaster.js'
import { RealEstateBoomEffects }from '../../backend/simulation/events/RealEstateBoom.js';
import { StringentEnvironmentalRegulationsEffects } from '../../backend/simulation/events/StringentEnvironmentalRegulations.js'; 
import { SuddenInflationSpikeEffects } from '../../backend/simulation/events/SuddenInflationSpike.js';
import { TaxReformFavoringCorporateProfitsEffects } from '../../backend/simulation/events/TaxReformFavoringCorporateProfits.js';
import { SurgeInGlobalTourismEffects } from '../../backend/simulation/events/SurgeInGlobalTourism.js'
import EventCreationPage from '../components/EventCreator.vue';

export default {
  name: 'StartPage',
  components: {EventCreationPage},
  data() {
    return {
      groups: [
        { name: 'Group 1', equity: '', bonds: '', realEstate: '', banks: '', other: '' },
        { name: 'Group 2', equity: '', bonds: '', realEstate: '', banks: '', other: '' },
        { name: 'Group 3', equity: '', bonds: '', realEstate: '', banks: '', other: '' },
        { name: 'Group 4', equity: '', bonds: '', realEstate: '', banks: '', other: '' }
      ],
      savedGroups: [],
      displaySimulation: false,
      simulationMonths: 0,
      userInterestRate: 5,
      growthChart: null, // To store the chart instance
      selectedEvent: 'noEvent', // To track the selected event
      eventEffects: {
        noEvent: { equity: {X: 1, Y: 1}, bonds: {X: 1, Y: 1}, realEstate: {X: 1, Y: 1}, banks: {X: 1, Y: 1}, other: {X: 1, Y: 1} },
        interestHike: adjustGrowthRatesForInterestRateHike(),
        technologicalDisruption: TechnologicalDisruptionInASectorEffects(),
        politicalInstability: PoliticalInstabilityEffects(),
        centralBankImplementsQuantitativeEasing: CentralBankImplementsQuantitativeEasingEffects(),
        cybersecurityBreachImpactingBanks: CybersecurityBreachImpactingBanksEffects(),
        DiscoveryOfValuableNaturalResources: DiscoveryOfValuableNaturalResourcesEffects(),
        IncreaseInConsumerConfidence: IncreaseInConsumerConfidenceEffects(),
        majorCorporationBankruptcy: MajorCorporationBankruptcyEffects(),
        naturalDisaster: NaturalDisasterEffects(),
        realEstateBoom: RealEstateBoomEffects(),
        stringentEnvironmentalRegulations: StringentEnvironmentalRegulationsEffects(),
        suddenInflationSpike: SuddenInflationSpikeEffects(),
        taxReformFavoringCorporateProfits: TaxReformFavoringCorporateProfitsEffects(),
        surgeInGlobalTourism: SurgeInGlobalTourismEffects(),
      },
      currentEffect: { equity: {X: 1, Y: 1}, bonds: {X: 1, Y: 1}, realEstate: {X: 1, Y: 1}, banks: {X: 1, Y: 1}, other: {X: 1, Y: 1} },
      showEventCreation: false, 
    };
  },
  mounted() {
    this.renderGrowthChart(); // Initialize the chart
  },
  methods: {
    addGroup() {
      const groupName = prompt("Enter group name:");
      if (groupName) {
        this.groups.push({
          name: groupName,
          equity: '',
          bonds: '',
          realEstate: '',
          banks: '',
          other: ''
        });
      }
    },
    saveData() {
      this.savedGroups = this.groups.map(group => ({
        ...group,
        monthlyValues: {
          equity: [Number(group.equity)],
          bonds: [Number(group.bonds)],
          realEstate: [Number(group.realEstate)],
          banks: [Number(group.banks)],
          other: [Number(group.other)]
        }
      }));
      this.displaySimulation = true;
    },
    editGroupName(index) {
      const newName = prompt("Enter new group name:", this.groups[index].name);
      if (newName && newName.trim() !== '') {
        this.groups[index].name = newName.trim();
      }
    },
    removeGroup(index) {
      this.groups.splice(index, 1);
    },
    startSimulation() {
      this.saveData(); // Ensure data is saved
      if (this.savedGroups.length > 0) {
        this.displaySimulation = true; // Show the simulation table
        this.calculateAndDisplayFutureValues(); // Calculate future values
      } else {
        alert("Please add and save your data before proceeding.");
      }
    },
    generateRandomValues(index) {
      this.groups[index].equity = Math.floor(Math.random() * 1001);
      this.groups[index].bonds = Math.floor(Math.random() * 1001);
      this.groups[index].realEstate = Math.floor(Math.random() * 1001);
      this.groups[index].banks = Math.floor(Math.random() * 1001);
      this.groups[index].other = Math.floor(Math.random() * 1001);
      this.renderPieChart(index);
    },
    renderPieChart(index) {
      const ctx = document.getElementById('pieChart_' + index).getContext('2d');
      const group = this.groups[index];
      const totalValue = this.getTotalValue(group);

      const chartData = {
        labels: ['Equity', 'Bonds', 'Real Estate', 'Bank Accounts', 'Other'],
        datasets: [{
          label: 'Asset Allocation',
          data: [
            (group.equity / totalValue) * 100,
            (group.bonds / totalValue) * 100,
            (group.realEstate / totalValue) * 100,
            (group.banks / totalValue) * 100,
            (group.other / totalValue) * 100
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
          ],
          borderWidth: 1
        }]
      };

      const percentagePlugin = {
        id: 'percentagePlugin',
        beforeDraw: function(chart) {
          const width = chart.chart.width;
          const height = chart.chart.height;
          const ctx = chart.chart.ctx;

          ctx.restore();
          const fontSize = (height / 114).toFixed(2);
          ctx.font = fontSize + "em sans-serif";
          ctx.textBaseline = "middle";

          const text = chart.config.data.datasets[0].data.map(val => val.toFixed(2) + '%');
          const data = chart.config.data.datasets[0].data;

          let position = 0;
          data.forEach((value, index) => {
            const textWidth = ctx.measureText(text[index]).width;
            const textX = Math.round((width - textWidth) / 2);
            const textY = height / 2 + position;
            ctx.fillText(text[index], textX, textY);
            position += (height / 5);
          });

          ctx.save();
        }
      };

      new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Asset Allocation'
            },
            percentagePlugin // Include the percentage plugin
          },
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 15,
              usePointStyle: true
            }
          }
        }
      });
    },
  getTotalValue(group) {
    return Number(group.equity) + Number(group.bonds) + Number(group.realEstate) + Number(group.banks) + Number(group.other);
  },
  
  calculateFutureValue(assetType, currentValue) {
      const months = 1;
      const rate = this.interestRate;
      const { X, Y } = this.currentEffect[assetType]; // Use currentEffect for X and Y values
      
      return currentValue * Math.pow(1 + rate * X * Y, months);
    },

    calculateAndDisplayFutureValues() {
      this.savedGroups.forEach(group => {
        ['equity', 'bonds', 'realEstate', 'banks', 'other'].forEach(assetType => {
          const futureValueKey = `future${assetType.charAt(0).toUpperCase() + assetType.slice(1)}`;
          group[futureValueKey] = this.calculateFutureValue(assetType, Number(group[assetType]));
        });
      });
    },

    updateValuesForNextMonth() {
      // First, apply the event effect to adjust the multipliers based on the selected event
      this.applyEventEffect();

      this.simulationMonths++;
      this.savedGroups.forEach(group => {
        // Now, loop over each asset type in the group to update its value
        Object.keys(group.monthlyValues).forEach(assetType => {
          if (group.monthlyValues[assetType].length > 0) {
            const lastValue = group.monthlyValues[assetType][group.monthlyValues[assetType].length - 1];
            // Use the currentEffect multipliers directly in the growth rate calculation
            const { X, Y } = this.currentEffect[assetType];
            const rate = this.interestRate * X * Y; // Adjusted growth rate incorporating the event effect
            
            const newValue = lastValue * (1 + rate);
            group.monthlyValues[assetType].push(newValue);
          }
        });
      });

      this.$nextTick(() => {
        this.renderGrowthChart(); // Re-render the chart with new data
      });
    },

  calculateNextMonthValue(currentValue) {
    const rate = 0.05;
    return currentValue * (1 + rate);
  },
  renderGrowthChart() {
    // Ensure there's data to render
    if (!this.savedGroups.length || !this.savedGroups[0].monthlyValues.equity.length) {
      console.warn("No data available to chart.");
      return;
    }

    // Prepare the labels, including the starting point
    const labels = ['Start', ...Array.from({ length: this.simulationMonths }, (_, i) => `Month ${i + 1}`)];

    // Prepare datasets, including the starting values
    const datasets = this.savedGroups.flatMap(group => {
      return Object.keys(group.monthlyValues).map(assetType => {
        // Prepend the starting value for each asset type to its monthly values
        // This assumes that group[assetType] contains the starting value for that asset type
        const startingValue = group[assetType];
        const monthlyValues = group.monthlyValues[assetType];
        const dataWithStartingValue = [startingValue, ...monthlyValues];

        return {
          label: `${group.name} - ${assetType.charAt(0).toUpperCase() + assetType.slice(1)}`,
          data: dataWithStartingValue,
          borderColor: this.getRandomColor(),
          fill: false,
        };
      });
    });

    // Chart configuration
    const chartData = { labels, datasets };

    // Clean up previous chart instance if it exists
    if (this.growthChart) {
      this.growthChart.destroy();
    }

    // Initialize the chart with the new data
    this.growthChart = new Chart(document.getElementById('growthChart'), {
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

    getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },
    applyEventEffect() {
      // Update currentEffect based on the selected event
      this.currentEffect = this.eventEffects[this.selectedEvent];
    },
    resetMultipliers() {
      this.groups.forEach(group => {
        // Reset logic, setting X (and Y if used) back to 1
        group.equityMultiplier = 1;
        // Repeat for other asset types
      });
    },
  },
  computed: {
    preparedGroups() {
      return this.savedGroups.map(group => {
        // Transform monthlyValues to start from the second entry to skip the starting value duplication
        const monthlyValuesTransformed = Object.keys(group.monthlyValues).reduce((acc, assetType) => {
          // Skip the first value (index 0) to avoid showing it twice
          acc[assetType] = group.monthlyValues[assetType].slice(1);
          return acc;
        }, {});

        // Return the transformed group with updated monthlyValues
        return {
          ...group,
          monthlyValues: monthlyValuesTransformed,
        };
      });
    },
    interestRate() {
      return this.userInterestRate/100;
    },
},
};
</script>

<style scoped>
  @import url('../styles/GroupCreationStyles.css');
</style>
