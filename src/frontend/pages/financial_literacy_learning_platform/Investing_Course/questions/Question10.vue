<template>
    <QuestionTemplate :question="question" @answered="selectAnswer" />
  </template>
  
  <script>
  import QuestionTemplate from '../components/QuestionTemplate.vue';
  import { getFirestore, doc, setDoc } from "firebase/firestore";
  import { getAuth } from "firebase/auth";
  
  export default {
    name: 'CourseQuestion10',
    components: {
      QuestionTemplate
    },
    data() {
      return {
        question: {
          text: 'What is capital gain?',
          options: [
            'A) The original amount of money invested',
            'B) The profit made from selling an asset for more than it was purchased',
            'C) The interest earned on a bond',
            'D) The dividends received from a stock'
          ]
        }
      };
    },
    methods: {
      async selectAnswer(option) {
        console.log(`selectAnswer called with option: ${option}`);
        const answerLetter = option.charAt(0); // Extract the letter
        await this.saveAnswer(10, answerLetter); // Save the answer to Firestore
        console.log(`Emitting answered with: ${answerLetter}`);
        this.$emit('answered', answerLetter);
      },
      async saveAnswer(questionNumber, answer) {
        console.log(`Saving answer for question ${questionNumber}: ${answer}`);
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const examRef = doc(db, user.uid, 'Financial Literacy Courses', 'Basics of Investing', 'Exam Results');
          await setDoc(examRef, {
            [`Question ${questionNumber}`]: answer
          }, { merge: true });
          console.log(`Answer for question ${questionNumber} saved: ${answer}`);
        }
      }
    }
  };
  </script>
  