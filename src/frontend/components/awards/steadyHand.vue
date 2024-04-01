<template>
    <div class="steady-hand-container">
      <h2>Steady Hand Award</h2>
      <div v-if="steadyHand">
        <p><strong>Group Name:</strong> {{ steadyHand.groupName }}</p>
        <p><strong>Smallest Variance:</strong> ${{ steadyHand.smallestVariance.toFixed(2) }}</p>
      </div>
      <div v-else>
        <p>Loading or no data available...</p>
      </div>
    </div>
  </template>
  
  <script>
  import { getFirestore, doc, getDoc } from 'firebase/firestore';
  
  export default {
    name: 'SteadyHandAward',
    data() {
      return {
        steadyHand: null,
      };
    },
    async created() {
      await this.calculateSteadyHand();
    },
    methods: {
      async fetchQuarterlyResults() {
        const db = getFirestore();
        const docRef = doc(db, "Results", "Quarters");
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return docSnap.data().quarterResults;
          } else {
            console.error("No quarterly results found!");
            return null;
          }
        } catch (error) {
          console.error("Error fetching quarterly results:", error);
          return null;
        }
      },
      async calculateSteadyHand() {
        const quarterResults = await this.fetchQuarterlyResults();
        if (!quarterResults || quarterResults.length === 0) {
            console.error("Insufficient data for calculation.");
            return;
        }

        let smallestVariance = Infinity;
        let groupNameWithSmallestVariance = '';

        // Calculate the total value for each group per quarter
        const groupTotalsPerQuarter = quarterResults.map(quarter =>
            Object.entries(quarter.groups).reduce((acc, [groupName, assets]) => {
            const totalValue = Object.values(assets).reduce((acc, value) => acc + value, 0);
            if (!acc[groupName]) {
                acc[groupName] = [];
            }
            acc[groupName].push(totalValue);
            return acc;
            }, {})
        );

        // Calculate variance for each group
        Object.keys(groupTotalsPerQuarter[0]).forEach(groupName => {
            const groupValues = groupTotalsPerQuarter.map(quarter => quarter[groupName]).flat();
            const mean = groupValues.reduce((acc, value) => acc + value, 0) / groupValues.length;
            const variance = groupValues.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / groupValues.length;

            if (variance < smallestVariance) {
            smallestVariance = variance;
            groupNameWithSmallestVariance = groupName;
            }
        });

        this.steadyHand = {
            groupName: groupNameWithSmallestVariance,
            smallestVariance: smallestVariance,
        };
        },

    },
  };
  </script>
  
  <style scoped>
  .steady-hand-container {
    margin: 20px auto;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background: linear-gradient(145deg, #6a85b6, #bac8e0);
    color: #fff;
    max-width: 300px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  
  .steady-hand-container::after {
    content: '';
    position: absolute;
    top: 0;
    left: -150%;
    width: 300%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.2) 75%, transparent 75%, transparent);
    z-index: 1;
    animation: shimmer 2s infinite;
    background-size: 50% 100%;
  }
  
  @keyframes shimmer {
    0% {
      left: -150%;
    }
    100% {
      left: 150%;
    }
  }
  </style>
  