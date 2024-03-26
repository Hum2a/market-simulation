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
              <td>{{ group.futureEquity }}</td>
              <td>{{ group.futureBonds }}</td>
              <td>{{ group.futureRealEstate }}</td>
              <td>{{ group.futureBanks }}</td>
              <td>{{ group.futureOther }}</td>
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
                <th v-for="n in simulationMonths" :key="'month-header-' + n">After {{ n }} Month(s)</th>
            </tr>
            </thead>
            <tbody>
                <template v-for="(group, index) in groups" :key="'group-' + index">
                    <tr v-for="assetType in ['equity', 'bonds', 'realEstate', 'banks', 'other']" :key="`${group.name}-${assetType}`">
                    <td>{{ group.name }}</td>
                    <td>{{ assetType.charAt(0).toUpperCase() + assetType.slice(1) }}</td>
                    <td>{{ group[assetType] }}</td>
                    <td v-for="n in simulationMonths" :key="`${group.name}-${assetType}-${n}`">{{ calculateFutureValue(group[assetType], n) }}</td>
                    </tr>
                </template>
            </tbody>
        </table>
        </div>
        <button v-if="!displaySimulation" @click="startSimulation" class="modern-button">Start Simulation</button>
        <button v-if="displaySimulation" @click="updateValuesForNextMonth" class="modern-button">Next Month</button>
        <button v-if="displaySimulation" @click="updateValuesForNextQuarter" class="modern-button">Next Quarter</button>
        <div class="interest-rate-input">
            <label for="interestRate">Change Interest Rate (%):</label>
            <input type="number" id="interestRate" v-model="interestRateComputed" step="1" class="modern-input" />
        </div>
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
            </div>
    </div>
</template>
  
<script>

import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

export default {
    name: 'SimulationPage',
  data() {
    return {
      groups: [],
      displaySimulation: false,
      simulationMonths: 0,
      interestRate: 0.05,
      selectedEvent: 'noEvent', // Tracks the selected event
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
    };
  },
  async created() {
    await this.fetchGroups();
  },
  computed: {
    // Adjusted computed property with getter and setter for interestRate
    interestRateComputed: {
        get() {
        // When getting the value, convert it back to a percentage for display
        return this.interestRate * 100;
        },
        set(value) {
        // When setting the value, convert the input percentage to a decimal
        this.interestRate = Number(value) / 100;
        }
    }
},
  methods: {
    async fetchGroups() {
      const db = getFirestore();
      const querySnapshot = await getDocs(collection(db, "groups"));
      this.groups = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    },

    startSimulation() {
        this.simulationMonths += 1;
        this.groups = this.groups.map(group => {
            if (!group.monthlyValues) { // Initialize monthlyValues if not present
            group.monthlyValues = {};
            }

            const assetTypes = ['equity', 'bonds', 'realEstate', 'banks', 'other'];
            assetTypes.forEach(assetType => {
            if (!group.monthlyValues[assetType]) {
                group.monthlyValues[assetType] = [group[assetType]]; // Initialize with starting value
            } else {
                // Assuming calculateFutureValue can calculate the next month value based on the last month
                const lastValue = group.monthlyValues[assetType].slice(-1)[0]; // Get last month value
                group.monthlyValues[assetType].push(this.calculateFutureValue(lastValue, 1)); // Calculate & push new value
            }
            });

            return group;
        });

        this.displaySimulation = true;
        },

    calculateFutureValue(currentValue, months) {
        return currentValue * Math.pow((1 + this.interestRate), months);
  },

    updateValuesForNextMonth() {
        this.simulationMonths += 1;
        this.groups = this.groups.map(group => {
            const assetTypes = ['equity', 'bonds', 'realEstate', 'banks', 'other'];

            assetTypes.forEach(assetType => {
            const lastValue = group.monthlyValues[assetType].slice(-1)[0]; // Get last month value
            group.monthlyValues[assetType].push(this.calculateFutureValue(lastValue, 1)); // Push new value
            });

            return group;
        });
    },

    updateValuesForNextQuarter() {
    // Advance the simulation by three months
    for (let i = 0; i < 3; i++) {
        this.simulationMonths++;
        this.groups.forEach(group => {
            const assetTypes = ['equity', 'bonds', 'realEstate', 'banks', 'other'];
            assetTypes.forEach(assetType => {
                const lastValueIndex = group.monthlyValues[assetType]?.length - 1;
                let lastValue = group.monthlyValues[assetType]?.[lastValueIndex] || parseFloat(group[assetType]);
                
                const futureValue = this.calculateFutureValue(assetType, lastValue);
                if (!group.monthlyValues[assetType]) {
                    group.monthlyValues[assetType] = [lastValue]; // Initialize with starting value if not present
                }
                group.monthlyValues[assetType].push(futureValue);
            });
        });
    }
},

    applyEventEffect() {
        if (this.eventEffects[this.selectedEvent]) {
        this.currentEffect = this.eventEffects[this.selectedEvent];
        } else {
        console.error("Selected event effect is not defined.");
        }
    },
    
  },
};
</script>
  
  <style>
    @import url('../styles/SimulationStyles.css');
  </style>
  