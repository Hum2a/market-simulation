<template>
    <div class="simulation-details">
      <h1>Details for Simulation {{ simulationIndex }}</h1>
      <div v-if="simulationData">
        <h2>Date Created: {{ simulationData.dateCreated }}</h2>
        <div class="details-section">
          <h3>Group Information</h3>
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
              <tr v-for="group in groups" :key="group.id">
                <td>{{ group.name }}</td>
                <td>{{ group.equity }}</td>
                <td>{{ group.bonds }}</td>
                <td>{{ group.realestate }}</td>
                <td>{{ group.commodities }}</td>
                <td>{{ group.other }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button @click="goBack">Go Back</button>
      </div>
      <div v-else>
        <p>Loading simulation details...</p>
      </div>
    </div>
  </template>
  
  <script>
  import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  
  export default {
    name: 'SimulationDetails',
    props: {
      simulationIndex: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        userUID: null,
        simulationData: null,
        groups: []
      };
    },
    mounted() {
      const auth = getAuth();
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.userUID = user.uid;
          this.initializeData();
        } else {
          console.log("User is not authenticated.");
        }
      });
    },
    methods: {
      async initializeData() {
        if (this.userUID) {
          await this.fetchSimulationDetails();
          await this.fetchGroups();
        } else {
          console.log("User UID is not available.");
        }
      },
      async fetchSimulationDetails() {
        const db = getFirestore();
        const docRef = doc(db, this.userUID, `Simulation ${this.simulationIndex}`);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            this.simulationData = docSnap.data();
          } else {
            console.log("No such document!");
            this.simulationData = {}; // Handle no data case
          }
        } catch (error) {
          console.error("Error fetching simulation details:", error);
        }
      },
      async fetchGroups() {
        const db = getFirestore();
        const groupsRef = collection(db, this.userUID, `Simulation ${this.simulationIndex}`, "Groups");
        const querySnapshot = await getDocs(groupsRef);
        this.groups = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      },
      goBack() {
        this.$emit('closeDetails'); // Use an event to close the details or navigate back
      }
    }
  };
  </script>
  
  <style scoped>
  .simulation-details {
    padding: 20px;
    font-family: 'Arial', sans-serif;
    color: #333;
  }
  
  .details-section {
    margin-top: 20px;
    background-color: #f4f4f4;
    padding: 10px;
    border-radius: 5px;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  
  th {
    background-color: #eee;
  }
  
  button {
    margin-top: 20px;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    background-color: #007BFF;
    color: white;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #0056b3;
  }
  </style>
  