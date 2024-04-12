<template>
    <div class="past-simulations">
      <h1>Past Simulations</h1>
      <div class="simulation-cards-container">
        <div v-for="(simulation, index) in simulations" :key="simulation.id" class="simulation-card">
          <h2>Simulation {{ index + 1 }}</h2>
          <p><strong>Date Created:</strong> {{ simulation.dateCreated }}</p>
          <p><strong>Number of Quarters:</strong> {{ simulation.numberOfQuarters }}</p>
          <p><strong>Total Asset Changes:</strong> {{ simulation.totalAssetChanges }}</p>
          <button @click="emitDetails(simulation.id)">View Details</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { getFirestore, collection, getDocs } from 'firebase/firestore';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  
  export default {
    name: 'SimulationHistory',
    data() {
      return {
        userUID: null,
        simulations: []
      };
    },
    async mounted() {
      const auth = getAuth();
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.userUID = user.uid;
          await this.fetchSimulations();
        } else {
          console.log("User is not authenticated.");
        }
      });
    },
    methods: {
      async fetchSimulations() {
        const db = getFirestore();
        const simulationsRef = collection(db, this.userUID);
        const querySnapshot = await getDocs(simulationsRef);
        this.simulations = querySnapshot.docs.map(doc => ({
          id: doc.id,
          dateCreated: doc.data().dateCreated || 'Unknown date',
          numberOfQuarters: doc.data().quarters ? doc.data().quarters.length : 'Unknown',
          totalAssetChanges: doc.data().assetChanges ? Object.keys(doc.data().assetChanges).length : 'Unknown'
        }));
      },
    //   viewDetails(simulationId) {
    //     console.log('Viewing details for simulation:', simulationId);
    //     this.$router.push({ name: 'SimulationDetails', params: { simulationId: simulationId } });
    //   },
      emitDetails(simulationId) {
        this.$emit('viewSimulationDetails', simulationId);
        },
    }
  };
  </script>
  
  <style scoped>
  .past-simulations {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .simulation-cards-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    width: 100%;
  }
  
  .simulation-card {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin: 10px;
    width: 300px;
    border-radius: 10px;
    background-color: #f9f9f9;
    transition: transform 0.3s ease-in-out;
  }
  
  .simulation-card:hover {
    transform: scale(1.05);
  }
  
  .simulation-card h2 {
    color: #333;
    margin-bottom: 10px;
  }
  
  button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    background-color: #4CAF50;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:hover {
    background-color: #45a049;
  }
  </style>
  