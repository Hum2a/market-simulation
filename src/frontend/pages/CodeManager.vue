<template>
  <div class="code-manager">
    <header class="header">
      <img src="../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/stock-trading-select" class="nav-link">Stock Trading Tool</router-link>
      </nav>
  </header>
    <h1>Code Manager</h1>
    <div class="new-code-section">
      <input type="text" v-model="newCode" placeholder="Enter new code" />
      <button @click="addCode" class="add-button">Add Code</button>
    </div>
    <div v-for="code in codes" :key="code.code" class="code-item">
      <span>{{ code.code }}</span>
      <label class="switch">
        <input type="checkbox" v-model="code.active" @change="toggleCode(code)">
        <span class="slider"></span>
      </label>
      <button @click="deleteCode(code.code)" class="delete-button">Delete</button>
    </div>
  </div>
</template>
  
  <script>
  import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
  
  export default {
    name: 'CodeManager',
    data() {
      return {
        codes: [
          { code: 'EXAMPLE CODE', active: false },
        ],
        newCode: ''
      };
    },
    async created() {
      await this.fetchCodes();
    },
    methods: {
      async fetchCodes() {
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, 'Login Codes'));
        this.codes = querySnapshot.docs.map(doc => ({ code: doc.id, active: doc.data().active }));
      },
      async toggleCode(code) {
        const db = getFirestore();
        const codeRef = doc(db, 'Login Codes', code.code);
        await setDoc(codeRef, { active: code.active }, { merge: true });
      },
      async addCode() {
        if (this.newCode.trim() === '') {
          alert('Code cannot be empty');
          return;
        }
        const db = getFirestore();
        const newCodeEntry = { code: this.newCode, active: true };
        this.codes.push(newCodeEntry);
        await setDoc(doc(db, 'Login Codes', this.newCode), { active: true });
        this.newCode = '';
      },
      async deleteCode(code) {
        const db = getFirestore();
        this.codes = this.codes.filter(c => c.code !== code);
        await deleteDoc(doc(db, 'Login Codes', code));
      }
    }
  };
  </script>
  
  <style scoped>

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.2em;
    background-color: #102454;
    border-bottom-right-radius: 25px;
    border-bottom-left-radius: 25px;
    width: 100%;
  }

  .logo {
    width: 150px;
    margin-left: 0;
    clip-path: polygon(0 0, 60% 0, 60% 100%, 0% 100%);
  }

  .header-links {
    display: flex;
    gap: 1em;
  }

  .nav-link {
    color: #fff;
    text-decoration: none;
    font-size: 1em;
    padding: 0.5em 1em;
    border-radius: 5px;
    transition: background-color 0.3s;
    cursor: pointer;
  }

  .nav-link:hover {
    background-color: #0d1b3f;
  }
  .code-manager {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #f0f2f5;
    height: 100vh;
    padding: 0;
    margin: 0;
  }
  
  .code-item {
    display: flex;
    justify-content: space-between;
    width: 50%;
    margin: 10px 0;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }
  
  .switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
  }
  
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
  }
  
  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  input:checked + .slider {
    background-color: #2196F3;
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
  
  .new-code-section {
    margin-top: 20px;
    display: flex;
    gap: 10px;
  }
  
  .add-button, .delete-button {
    padding: 5px 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  
  .add-button:hover, .delete-button:hover {
    background-color: #0056b3;
  }
  </style>
  