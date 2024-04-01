<template>
    <div class="highest-portfolio-container">
      <h2>Strongest Portfolio At Any Time Award</h2>
      <div v-if="highestPortfolio">
        <p><strong>Group Name:</strong> {{ highestPortfolio.groupName }}</p>
        <p><strong>Quarter:</strong> {{ highestPortfolio.quarter }}</p>
        <p><strong>Value:</strong> ${{ highestPortfolio.value.toFixed(2) }}</p>
      </div>
      <div v-else>
        <p>Loading or no data available...</p>
      </div>
    </div>
  </template>
  
  <script>
  import { getFirestore, doc, getDoc } from 'firebase/firestore';
  
  export default {
    name: 'HighestPortfolioAtAnyTime',
    data() {
      return {
        highestPortfolio: null,
      };
    },
    async created() {
      await this.calculateHighestPortfolio();
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
      async calculateHighestPortfolio() {
        const quarterResults = await this.fetchQuarterlyResults();
        if (!quarterResults) {
          console.error("Insufficient data for calculation.");
          return;
        }
  
        let highestPortfolio = {
          groupName: '',
          quarter: '',
          value: 0,
        };
  
        // Iterate through each quarter result
        quarterResults.forEach((quarter) => {
          // Iterate through each group in the quarter
          Object.entries(quarter.groups).forEach(([groupName, assets]) => {
            // Calculate the total value of the portfolio for the group in this quarter
            const totalValue = Object.values(assets).reduce((acc, value) => acc + value, 0);
            // Check if this is the highest value seen so far
            if (totalValue > highestPortfolio.value) {
              highestPortfolio = {
                groupName,
                quarter: quarter.quarter,
                value: totalValue,
              };
            }
          });
        });
  
        this.highestPortfolio = highestPortfolio;
      },
    },
  };
  </script>
  
  <style scoped>
  .highest-portfolio-container {
    margin: 20px auto;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background: linear-gradient(135deg, #76b852 0%, #8DC26F 100%);
    color: #fff;
    max-width: 300px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  
  .highest-portfolio-container::after {
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
  
  .highest-portfolio-container h2 {
    margin-top: 0;
    z-index: 2;
    position: relative;
  }
  
  .highest-portfolio-container p {
    margin: 5px 0;
    z-index: 2;
    position: relative;
  }
  </style>
  