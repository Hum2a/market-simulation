<template>
    <div class="course">
      <h1>Basics of Financial Literacy</h1>
      <div v-for="(question, index) in questions" :key="index" class="question">
        <h3>{{ index + 1 }}. {{ question.text }}</h3>
        <div v-for="(option, idx) in question.options" :key="idx" class="option">
          <label :class="{ selected: userAnswers[index] === option }">
            <input type="radio" :name="'question' + index" :value="option" v-model="userAnswers[index]" />
            {{ option }}
          </label>
        </div>
      </div>
      <button @click="submitAnswers" class="submit-button">Submit Answers</button>
      <div v-if="showResults" class="results">
        <h2>Results</h2>
        <div v-for="(result, idx) in results" :key="idx" :class="{ correct: result === 'Correct', incorrect: result === 'Incorrect' }">
          Question {{ idx + 1 }}: {{ result }}
        </div>
      </div>
      <MessageModal
        :isVisible="isModalVisible"
        :title="modalTitle"
        :message="modalMessage"
        @close="handleModalClose"
      />
    </div>
  </template>
  
  <script>
  import { getFirestore, doc, updateDoc, increment } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import MessageModal from '../stock_trading_platform/components/MessageModal.vue';
  
  export default {
    components: {
      MessageModal
    },
    data() {
      return {
        questions: [
          {
            text: 'What is a budget?',
            options: [
              'A plan for saving and spending money',
              'A loan from the bank',
              'An investment portfolio',
              'A credit score'
            ],
            correctAnswer: 'A plan for saving and spending money'
          },
          {
            text: 'What is the purpose of a savings account?',
            options: [
              'To store money with a potential for interest',
              'To keep track of expenses',
              'To manage credit card payments',
              'To invest in the stock market'
            ],
            correctAnswer: 'To store money with a potential for interest'
          }
          // Add more questions as needed
        ],
        userAnswers: [],
        showResults: false,
        results: [],
        isModalVisible: false,
        modalTitle: '',
        modalMessage: ''
      };
    },
    methods: {
      async submitAnswers() {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          this.showModal('Error', 'You need to be logged in to submit answers.');
          return;
        }
  
        this.results = this.questions.map((question, index) => {
          return this.userAnswers[index] === question.correctAnswer ? 'Correct' : 'Incorrect';
        });
        this.showResults = true;
        
        const allCorrect = this.results.every(result => result === 'Correct');
        if (allCorrect) {
          try {
            const uid = user.uid;
            const userRef = doc(db, uid, 'Total Funds');
            await updateDoc(userRef, {
              totalFunds: increment(300)
            });
            this.showModal('Congratulations!', 'You got 100%! £300 has been added to your account.');
          } catch (error) {
            console.error('Error updating totalFunds: ', error);
            this.showModal('Error', 'Error updating totalFunds. Please try again.');
          }
        }
      },
      showModal(title, message) {
        this.modalTitle = title;
        this.modalMessage = message;
        this.isModalVisible = true;
      },
      handleModalClose() {
        this.isModalVisible = false;
        this.$router.push('/stock-trading-select');
      }
    }
  };
  </script>
  
  <style scoped>
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
  
  .course {
    max-width: 700px;
    margin: 50px auto;
    padding: 30px;
    border: 1px solid #ddd;
    border-radius: 10px;
    background-color: #f9f9f9;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    font-family: 'Roboto', sans-serif;
    text-align: left;
    animation: fadeIn 1s ease-in-out;
  }
  
  h1 {
    text-align: center;
    color: #2c3e50;
    font-weight: 700;
  }
  
  .question {
    margin-bottom: 25px;
    padding: 15px;
    border-bottom: 1px solid #ddd;
  }
  
  .question h3 {
    margin-bottom: 15px;
    font-weight: 500;
  }
  
  .option {
    margin: 10px 0;
  }
  
  .option label {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .option label:hover {
    background-color: #f0f0f0;
  }
  
  .option input {
    margin-right: 10px;
  }
  
  .option label.selected {
    background-color: #e0f7fa;
    border-color: #26a69a;
  }
  
  .submit-button {
    display: block;
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 5px;
    background-color: #26a69a;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .submit-button:hover {
    background-color: #00796b;
  }
  
  .results {
    margin-top: 30px;
    padding: 20px;
    border-top: 2px solid #26a69a;
  }
  
  .results h2 {
    color: #26a69a;
    font-weight: 700;
    text-align: center;
  }
  
  .results div {
    margin: 10px 0;
    padding: 10px;
    border-radius: 5px;
    font-weight: 500;
  }
  
  .results div.correct {
    background-color: #e0f7fa;
    border: 1px solid #26a69a;
    color: #00796b;
  }
  
  .results div.incorrect {
    background-color: #ffebee;
    border: 1px solid #e57373;
    color: #c62828;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  </style>
  