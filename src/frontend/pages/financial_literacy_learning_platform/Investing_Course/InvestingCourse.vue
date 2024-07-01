<template>
  <div class="course-container">
    <header class="header">
      <img src="../../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/stock-trading-select" class="nav-link">Stock Trading Tool</router-link>
      </nav>
    </header>
    <transition name="fade">
      <div v-if="!showContent && !showExam" class="intro-content">
        <h1 class="animate-text">Welcome to the Investing Course</h1>
        <p class="animate-text">This course will guide you through the basics of investing. Click the button below to start learning!</p>
        <div class="buttons">
          <button @click="startCourse" class="animate-button">Course Content</button>
          <button :class="{ disabled: !examEnabled }" :disabled="!examEnabled" @click="startExam">Exam</button>
        </div>
      </div>
    </transition>
    <transition name="slide-fade">
      <div v-if="showContent || showExam">
        <button @click="goBack" class="back-button">Back</button>
      </div>
    </transition>
    <transition name="slide-fade">
      <div v-if="showContent">
        <InvestingCourseContent @complete="checkExamEligibility" />
      </div>
    </transition>
    <transition name="slide-fade">
      <div v-if="showExam">
        <InvestingCourseExam />
      </div>
    </transition>
  </div>
</template>

<script>
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import InvestingCourseContent from './InvestingCourseContent.vue';
import InvestingCourseExam from './InvestingCourseExam.vue';

export default {
  name: 'InvestingCourse',
  components: {
    InvestingCourseContent,
    InvestingCourseExam
  },
  data() {
    return {
      showContent: false,
      showExam: false,
      examEnabled: false
    };
  },
  async mounted() {
    await this.checkExamEligibility();
  },
  methods: {
    startCourse() {
      this.showContent = true;
      this.showExam = false;
    },
    startExam() {
      this.showExam = true;
      this.showContent = false;
    },
    async checkExamEligibility() {
      const db = getFirestore();
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const courseRef = doc(db, user.uid, 'Financial Literacy Courses', 'Basics of Investing', 'Course Content');
        const courseDoc = await getDoc(courseRef);
        if (courseDoc.exists()) {
          this.examEnabled = courseDoc.data().Completed || false;
        }
      }
    },
    goBack() {
      this.showContent = false;
      this.showExam = false;
    }
  }
};
</script>

<style scoped>
/* Keyframes for animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

@keyframes pop-in {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes button-hover {
  0% { background-color: #0056b3; }
  100% { background-color: #007bff; }
}

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  animation: slide-in 0.5s forwards;
}
.slide-fade-leave-active {
  transition: transform 0.5s;
}
.slide-fade-enter, .slide-fade-leave-to {
  transform: translateY(-100%);
}

.course-container {
  background: #f0f4f8;
  border-radius: 8px;
  text-align: center;
  animation: fade-in 1s ease-out;
  font-family: 'Arial, sans-serif';
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em;
  background-color: #2c3e50;
  border-bottom-right-radius: 25px;
  border-bottom-left-radius: 25px;
  width: 100%;
  margin: 0 auto;
  animation: slide-in 1s ease-out;
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
  color: #ecf0f1;
  text-decoration: none;
  font-size: 1em;
  padding: 0.5em 1em;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: #34495e;
  animation: pulse 1s infinite;
}

.intro-content {
  margin: 40px 0;
  animation: fade-in 1s ease-out, pop-in 1s ease-out;
}

h1, p {
  margin-bottom: 20px;
  animation: fade-in 2s ease-out;
  color: #34495e;
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
}

button {
  padding: 10px 20px;
  font-size: 1.1em;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.3s ease;
  animation: pop-in 0.5s ease-out;
  background-color: #3498db;
  color: white;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

button:hover {
  background: #2980b9;
  color: #fff;
  animation: button-hover 0.5s forwards;
}

button:active {
  transform: scale(0.95);
}

button.disabled {
  background: #bdc3c7;
  color: #fff;
  cursor: not-allowed;
}

.back-button {
  padding: 10px 20px;
  font-size: 1em;
  margin-top: 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #e74c3c;
  color: white;
  transition: background 0.3s ease, transform 0.3s ease;
}

.back-button:hover {
  background-color: #c0392b;
}

.back-button:active {
  transform: scale(0.95);
}

.question-content {
  animation: fade-in 1s ease-out;
  background: #ecf0f1;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}
</style>
