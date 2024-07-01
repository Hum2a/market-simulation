<template>
    <QuestionTemplate :question="question" @answered="selectAnswer" />
  </template>
  
  <script>
  import QuestionTemplate from '../components/QuestionTemplate.vue';
  import { getFirestore, doc, setDoc } from "firebase/firestore";
  import { getAuth } from "firebase/auth";
  
  export default {
    name: 'CourseQuestion1',
    components: {
      QuestionTemplate
    },
    data() {
      return {
        question: {
          text: 'What is a stock?',
          options: [
            'A) A certificate that shows you owe money to a company.',
            'B) A part of a company that you can buy.',
            'C) A type of savings account.',
            'D) A promise to perform a service.'
          ]
        }
      };
    },
    methods: {
      async selectAnswer(option) {
        const answerLetter = option.charAt(0); // Extract the letter
        await this.saveAnswer(1, answerLetter); // Save the answer to Firestore
        this.$emit('answered', answerLetter);
      },
      async saveAnswer(questionNumber, answer) {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const examRef = doc(db, user.uid, 'Financial Literacy Courses', 'Basics of Investing', 'Exam Results');
          await setDoc(examRef, {
            [`Question ${questionNumber}`]: answer
          }, { merge: true });
        }
      }
    }
  };
  </script>
  