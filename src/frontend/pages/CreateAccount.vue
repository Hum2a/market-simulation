<template>
  <div class="create-account">
    <header class="header">
      <img src="../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
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
        <button type="submit" class="create-button">Create Account</button>
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
import MessageModal from './stock_trading_platform/components/MessageModal.vue';

export default {
  name: 'CreateAccount',
  components: {
    MessageModal
  },
  data() {
    return {
      firstName: '',
      lastName: '',
      email: '',
      classValue: '',
      school: '',
      code: '',
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
          user: true,
          admin: false,
          developer: false,
          userUID: user.uid,
          groupCode: this.code,
        });

        await setDoc(doc(db, user.uid, "Profile"), {
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          class: this.classValue,
          school: this.school,
          role: 'user',
          userUID: user.uid,
          groupCode: this.code,
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
  },
  mounted() {
    document.body.style.backgroundColor = '#1e3c72'; // Apply the desired background color to the body
  },
  beforeUnmount() {
    document.body.style.backgroundColor = ''; // Reset the background color when the component is destroyed
  }
};
</script>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: -400px 0;
  }
  100% {
    background-position: 400px 0;
  }
}

.create-account {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 0;
  margin: 0;
}

.header {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 1em 0;
  background-color: transparent;
}

.logo {
  width: 200px;
  margin: 0;
}

.main-content {
  width: 100%;
  max-width: 600px;
  margin: 2em auto;
  text-align: center;
  padding: 2em;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.main-content h1 {
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 1.5em;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.form-group-inline {
  display: flex;
  gap: 1em;
  justify-content: space-between;
}

.form-group {
  margin-bottom: 1em;
  width: 100%;
  text-align: left;
}

label {
  display: block;
  margin-bottom: 0.5em;
  color: #333;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.75em;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
  transition: border-color 0.3s;
}

input:focus {
  border-color: #007bff;
  outline: none;
}

.create-button {
  display: inline-block;
  background-color: #102454;
  color: #fff;
  padding: 0.75em 1.5em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.3s;
  position: relative;
  overflow: hidden;
}

.create-button:hover {
  transform: scale(1.05);
}

.create-button:active {
  transform: scale(0.95);
}

.create-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 200%;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 100%);
  transition: all 0.5s;
}

.create-button:hover::before {
  left: 100%;
  transition: all 0.5s;
  animation: shimmer 1.5s infinite;
}
</style>
