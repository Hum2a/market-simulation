<template>
    <div class="biggest-loss-container">
      <h2>Biggest Asset Loss Award</h2>
      <div v-if="biggestLoss">
        <p><strong>Group Name:</strong> {{ biggestLoss.groupName }}</p>
        <p><strong>Asset Type:</strong> {{ biggestLoss.assetType }}</p>
        <p><strong>Loss:</strong> ${{ biggestLoss.loss.toFixed(2) }}</p>
      </div>
      <div v-else>
        <p>Loading or no data available...</p>
      </div>
    </div>
</template>

<script>
import { getFirestore, doc, getDoc } from 'firebase/firestore';

export default {
  name: 'BiggestAssetLoss',
  data() {
    return {
      biggestLoss: null,
    };
  },
  async created() {
    await this.calculateBiggestLoss();
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
    async calculateBiggestLoss() {
      const quarterResults = await this.fetchQuarterlyResults();
      if (!quarterResults || quarterResults.length < 2) {
        console.error("Insufficient data for calculation.");
        return;
      }

      let biggestLoss = {
        groupName: '',
        assetType: '',
        loss: Number.POSITIVE_INFINITY,
      };

      const initialQuarter = quarterResults[0];
      const finalQuarter = quarterResults[quarterResults.length - 1];

      Object.keys(initialQuarter.groups).forEach(groupName => {
        const initialAssets = initialQuarter.groups[groupName];
        const finalAssets = finalQuarter.groups[groupName];
        Object.keys(initialAssets).forEach(assetType => {
          const loss = initialAssets[assetType] - finalAssets[assetType];
          if (loss < biggestLoss.loss) {
            biggestLoss = { groupName, assetType, loss: -loss };
          }
        });
      });

      this.biggestLoss = biggestLoss;
    },
  },
};
</script>

<style scoped>
.biggest-loss-container {
  margin: 20px auto;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #f4a662 0%, #ff1212 100%);
  color: #fff;
  max-width: 300px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.biggest-loss-container::after {
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

.biggest-loss-container h2 {
  margin-top: 0;
  z-index: 2;
  position: relative;
}

.biggest-loss-container p {
  margin: 5px 0;
  z-index: 2;
  position: relative;
}
</style>
