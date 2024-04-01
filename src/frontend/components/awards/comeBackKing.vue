<template>
    <div class="comeback-king-container">
      <h2>{{ awardTitle }}</h2>
      <div v-if="comebackKing">
        <p><strong>Group Name:</strong> {{ comebackKing.groupName }}</p>
        <p><strong>Lowest Value:</strong> ${{ comebackKing.lowestValue.toFixed(2) }}</p>
        <p><strong>Final Value:</strong> ${{ comebackKing.finalValue.toFixed(2) }}</p>
        <p><strong>Recovery:</strong> ${{ comebackKing.recovery.toFixed(2) }}</p>
      </div>
      <div v-else>
        <p>Loading or no data available...</p>
      </div>
    </div>
  </template>  
  
  <script>
  import { getFirestore, doc, getDoc } from 'firebase/firestore';
  
  export default {
    name: 'ComebackKingAward',
    data() {
      return {
        comebackKing: null,
      };
    },
    async created() {
      await this.calculateComebackKing();
    },
    computed: {
        awardTitle() {
            return this.comebackKing && this.comebackKing.recovery >= 0 ? 'Comeback King Award' : 'Smallest Loss Award';
        }
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
      async calculateComebackKing() {
        const quarterResults = await this.fetchQuarterlyResults();
        if (!quarterResults || quarterResults.length < 2) { // Ensure there's at least two quarters to compare
            console.error("Insufficient data for calculation.");
            return;
        }

        let comebackKing = {
            groupName: '',
            lowestValue: Infinity,
            finalValue: 0,
            recovery: 0,
        };

        // Loop through each quarter except the last one to find the lowest total value for each group
        for (let i = 0; i < quarterResults.length - 1; i++) {
            const quarter = quarterResults[i];
            Object.entries(quarter.groups).forEach(([groupName, assets]) => {
            const totalValue = Object.values(assets).reduce((sum, value) => sum + value, 0);
            if (totalValue < comebackKing.lowestValue) {
                comebackKing = {
                groupName,
                lowestValue: totalValue,
                finalValue: 0, // This will be updated after finding the lowest value
                recovery: 0, // This will be calculated after setting the final value
                };
            }
            });
        }

        // Now that we have the group with the lowest value, find its final value in the last quarter
        const finalQuarter = quarterResults[quarterResults.length - 1];
        const finalAssets = finalQuarter.groups[comebackKing.groupName];
        comebackKing.finalValue = Object.values(finalAssets).reduce((sum, value) => sum + value, 0);

        // Calculate recovery
        comebackKing.recovery = comebackKing.finalValue - comebackKing.lowestValue;

        this.comebackKing = comebackKing;
        },
    },
  };
  </script>
  
  <style scoped>
  .comeback-king-container {
    margin: 20px auto;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background: linear-gradient(145deg, #007991, #78ffd6);
    color: #fff;
    max-width: 300px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  
  .comeback-king-container::after {
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
  