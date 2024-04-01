<template>
    <div class="biggest-gain-container">
      <h2>Biggest Asset Gain Award</h2>
      <div v-if="biggestGain">
        <p><strong>Group Name:</strong> {{ biggestGain.groupName }}</p>
        <p><strong>Asset Type:</strong> {{ biggestGain.assetType }}</p>
        <p><strong>Gain:</strong> ${{ biggestGain.gain.toFixed(2) }}</p>
      </div>
      <div v-else>
        <p>Loading or no data available...</p>
      </div>
    </div>
  </template>
  
  <script>
  import { getFirestore, doc, getDoc } from 'firebase/firestore';
  
  export default {
    name: 'BiggestAssetGain',
    data() {
      return {
        biggestGain: null,
      };
    },
    async created() {
      await this.calculateBiggestGain();
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
      async calculateBiggestGain() {
        const quarterResults = await this.fetchQuarterlyResults();
        if (!quarterResults || quarterResults.length < 2) {
          console.error("Insufficient data for calculation.");
          return;
        }
  
        let biggestGain = {
          groupName: '',
          assetType: '',
          gain: 0,
        };
  
        const initialQuarter = quarterResults[0];
        const finalQuarter = quarterResults[quarterResults.length - 1];
  
        Object.keys(initialQuarter.groups).forEach(groupName => {
          const initialAssets = initialQuarter.groups[groupName];
          const finalAssets = finalQuarter.groups[groupName];
          Object.keys(initialAssets).forEach(assetType => {
            const gain = finalAssets[assetType] - initialAssets[assetType];
            if (gain > biggestGain.gain) {
              biggestGain = { groupName, assetType, gain };
            }
          });
        });
  
        this.biggestGain = biggestGain;
      },
    },
  };
  </script>
  
  <style scoped>
  .biggest-gain-container {
    margin: 20px auto;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
    color: #fff;
    max-width: 300px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  
  .biggest-gain-container::after {
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
  
  .biggest-gain-container h2 {
    margin-top: 0;
    z-index: 2;
    position: relative;
  }
  
  .biggest-gain-container p {
    margin: 5px 0;
    z-index: 2;
    position: relative;
  }
  </style>
  