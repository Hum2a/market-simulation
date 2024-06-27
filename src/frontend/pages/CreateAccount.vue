<template>
  <div class="create-account">
    <header class="header">
      <img src="../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/homepage" class="nav-link">Home</router-link>
        <router-link to="/create-account" class="nav-link">Create Account</router-link>
      </nav>
    </header>
    <main class="main-content">
      <h1>Create Account</h1>
      <form @submit.prevent="createAccount">
        <div class="form-group-inline">
          <div class="form-group">
            <label for="first-name">First Name:</label>
            <input type="text" id="first-name" v-model="firstName" required />
          </div>
          <div class="form-group">
            <label for="last-name">Last Name:</label>
            <input type="text" id="last-name" v-model="lastName" required />
          </div>
        </div>
        <div class="form-group">
          <label for="email">Email:</label>
          <input type="email" id="email" v-model="email" required />
        </div>
        <div class="form-group">
          <label for="class">Class:</label>
          <input type="text" id="class" v-model="classValue" required />
        </div>
        <div class="form-group">
          <label for="school">School:</label>
          <input type="text" id="school" v-model="school" required />
        </div>
        <div class="form-group">
          <label for="code">Code:</label>
          <input type="text" id="code" v-model="code" required />
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input type="password" id="password" v-model="password" required />
        </div>
        <button type="submit">Create Account</button>
      </form>
      <MessageModal
        v-if="showModal"
        :isVisible="showModal"
        :title="modalTitle"
        :message="modalMessage"
        @close="showModal = false"
      />
    </main>
  </div>
</template>

<script>
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import MessageModal from './stock_trading_platform/components/MessageModal.vue'; // Import the MessageModal component

export default {
  name: 'CreateAccount',
  components: {
    MessageModal // Register the MessageModal component
  },
  data() {
    return {
      firstName: '',
      lastName: '',
      email: '',
      classValue: '',
      school: '',
      code: '', // Added code field
      password: '',
      showModal: false,
      modalTitle: '',
      modalMessage: ''
    };
  },
  methods: {
    async createAccount() {
      const auth = getAuth();
      const db = getFirestore();
      try {
        const codeRef = doc(db, 'Login Codes', this.code);
        const codeSnap = await getDoc(codeRef);

        if (!codeSnap.exists() || !codeSnap.data().active) {
          this.modalTitle = 'Error';
          this.modalMessage = 'The code you entered is inactive or does not exist. Please try again with a valid code.';
          this.showModal = true;
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
        const user = userCredential.user;

        await setDoc(doc(db, "Users", user.uid), {
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          class: this.classValue,
          school: this.school,
          role: 'user',
          userUID: user.uid
        });

        await setDoc(doc(db, user.uid, "Profile"), {
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          class: this.classValue,
          school: this.school,
          role: 'user',
          userUID: user.uid
        });

        await setDoc(doc(db, user.uid, "Total Funds"), {
          totalFunds: 10000,
        });

        alert('Account created successfully!');
        this.$router.push('/stock-trading-select');
      } catch (error) {
        console.error("Error creating account:", error);
        this.modalTitle = 'Error';
        this.modalMessage = 'Error creating account. Please try again.';
        this.showModal = true;
      }
    }
  }
};
</script>
  
  <style scoped>
  .create-account {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #f0f2f5;
    height: 100vh;
    padding: 0;
    margin: 0;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.2em;
    background-color: #102454;
    border-bottom-right-radius: 25px;
    border-bottom-left-radius: 25px;
    width: 100%;
    margin: 0 auto;
  }
  
  .logo {
    width: 150px;
    display: block;
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
  }
  
  .nav-link:hover {
    background-color: #0d1b3f;
  }
  
  .main-content {
    width: 100%;
    max-width: 600px;
    margin: 2em auto;
    text-align: center;
    padding: 1em;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  h1 {
    color: #102454;
    margin-bottom: 1em;
  }
  
  .form-group {
    margin-bottom: 1em;
    text-align: left;
  }
  
  .form-group-inline {
    display: flex;
    gap: 1em;
  }
  
  .form-group-inline .form-group {
    flex: 1;
  }
  
  label {
    display: block;
    margin-bottom: 0.5em;
    color: #333;
  }
  
  input {
    width: 100%;
    padding: 0.75em;
    border: 1px solid #ddd;
    border-radius: 5px;
    box-sizing: border-box;
  }
  
  button {
    background-color: #102454;
    color: #fff;
    padding: 0.75em 1.5em;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  button:hover {
    background-color: #0d1b3f;
  }
  </style>
  