<template>
    <div class="past-simulations">
      <h1>Past Simulations</h1>
      <div class="simulation-cards-container">
        <div v-for="(simulation, index) in simulations" :key="simulation.id" class="simulation-card">
          <h2>Simulation {{ index + 1 }}</h2>
          <p><strong>Date Created:</strong> {{ simulation.dateCreated }}</p>
          <p><strong>Number of Quarters:</strong> {{ simulation.numberOfQuarters }}</p>
          <button @click="emitDetails(simulation.id)">View Details</button>
          <button @click="deleteSimulation(simulation.id, index)" class="delete-btn">Delete</button>
        </div>
      </div>
    </div>
</template>

<script>
import { getFirestore, collection, getDocs, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
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
      const simulationsRef = collection(db, this.userUID, 'Asset Market Simulations', 'Simulations');
      const querySnapshot = await getDocs(simulationsRef);
      const simulationsData = [];
      for (const document of querySnapshot.docs) {
        const docData = document.data();
        const createdAt = docData.createdAt ? docData.createdAt.toDate().toLocaleDateString() : 'Unknown date';
        
        // Fetch number of quarters from the Controls subcollection
        const controlsDocRef = doc(db, this.userUID, 'Asset Market Simulations', 'Simulations', `${document.id}/Simulation Controls/Controls`);
        const controlsDoc = await getDoc(controlsDocRef);
        const numberOfQuarters = controlsDoc.exists() && controlsDoc.data().assetChanges ? controlsDoc.data().assetChanges.length * 4 : 'Unknown'; // Assuming every entry in assetChanges contains all four quarters
        
        simulationsData.push({
          id: document.id,
          dateCreated: createdAt,
          numberOfQuarters: numberOfQuarters,
          totalAssetChanges: controlsDoc.exists() ? Object.keys(controlsDoc.data().assetChanges).length * 4 : 'Unknown' // Assuming each quarter can have changes for multiple assets
        });
      }
      this.simulations = simulationsData;
    },
    async deleteSimulation(simulationId, index) {
        await this.deleteSubcollections(simulationId); // Delete subcollections first
        const db = getFirestore();
        await deleteDoc(doc(db, this.userUID, simulationId)); // Then delete the main simulation document
        this.simulations.splice(index, 1); // Remove from the local state
        await this.shiftSimulations(index); // Shift the IDs of remaining simulations
        if (index === this.simulations.length) { // Check if the last simulation needs handling
            await this.deleteSubcollections(`Simulation ${index + 2}`);
        }
    },
    async deleteSubcollections(simulationId) {
      const db = getFirestore();
      const subcollections = ['Groups', 'Results', 'Simulation Controls'];
      for (let subcollection of subcollections) {
        const subcollectionRef = collection(db, this.userUID, simulationId, subcollection);
        const snapshot = await getDocs(subcollectionRef);
        snapshot.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      }
    },
    async shiftSimulations(startIndex) {
        const db = getFirestore();
        for (let i = startIndex; i < this.simulations.length; i++) {
            const oldId = `Simulation ${i + 2}`;
            const newId = `Simulation ${i + 1}`;
            const oldDocRef = doc(db, this.userUID, oldId);
            const newDocRef = doc(db, this.userUID, newId);
            // Fetch and recreate each document and its subcollections
            const docData = await getDoc(oldDocRef);
            if (docData.exists()) {
            await setDoc(newDocRef, docData.data()); // Copy data to new doc
            await this.copySubcollections(db, oldDocRef, newDocRef);
            await deleteDoc(oldDocRef); // Delete the old document after copying
            }
        }
    },
    async copySubcollections(db, oldDocRef, newDocRef) {
        const subcollections = ['Groups', 'Results', 'Simulation Controls'];
        for (let subcollection of subcollections) {
            const oldSubRef = collection(db, oldDocRef.path, subcollection);
            const newSubRef = collection(db, newDocRef.path, subcollection);
            const subDocs = await getDocs(oldSubRef);
            subDocs.forEach(async (subDoc) => {
            const newSubDocRef = doc(newSubRef, subDoc.id);
            await setDoc(newSubDocRef, subDoc.data()); // Copy subcollection doc
            await deleteDoc(doc(oldSubRef, subDoc.id)); // Ensure old subcollection docs are removed
            });
        }
    },
    async copyDocumentWithSubcollections(db, oldDocRef, newDocRef) {
      const docSnap = await getDoc(oldDocRef);
      if (docSnap.exists()) {
        await setDoc(newDocRef, docSnap.data()); // Copy data to new doc
        // Handle subcollections
        const subcollections = ['Groups', 'Results', 'Simulation Controls'];
        for (let subcollection of subcollections) {
          const oldSubRef = collection(db, oldDocRef.path, subcollection);
          const newSubRef = collection(db, newDocRef.path, subcollection);
          const subDocs = await getDocs(oldSubRef);
          subDocs.forEach(async (subDoc) => {
            const newSubDocRef = doc(newSubRef, subDoc.id);
            await setDoc(newSubDocRef, subDoc.data()); // Copy subcollection doc
          });
        }
      }
    }
  }
};
</script>

<style scoped>
.past-simulations {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f0f4f8; /* Light grey-blue background for the whole container */
}

.simulation-cards-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  width: 100%;
}

.simulation-card {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  padding: 20px;
  margin: 10px;
  width: 300px;
  border-radius: 12px;
  background-color: #ffffff;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  border-left: 5px solid #007bff; /* Blue border on the left for a modern look */
}

.simulation-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.simulation-card h2 {
  color: #333;
  font-size: 18px;
  margin-bottom: 8px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 10px;
}

button:hover {
  background-color: #45a049;
}

.delete-btn {
  background-color: #ff4d4d; /* Red color for delete button */
  margin-left: 10px; /* Space between buttons */
}

.delete-btn:hover {
  background-color: #ff1a1a;
}

p {
  font-size: 14px;
  color: #666; /* Dark gray text for better readability */
  line-height: 1.5; /* Improved line spacing */
}
</style>
