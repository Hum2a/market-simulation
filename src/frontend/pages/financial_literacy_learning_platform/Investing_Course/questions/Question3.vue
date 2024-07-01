<template>
  <QuestionTemplate :question="question" @answered="selectAnswer" />
</template>

<script>
import QuestionTemplate from '../components/QuestionTemplate.vue';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default {
  name: 'CourseQuestion3',
  components: {
    QuestionTemplate
  },
  data() {
    return {
      question: {
        text: 'What is a bond?',
        options: [
          'A) A share of ownership in a company',
          'B) A type of debt investment',
          'C) A form of currency',
          'D) A type of real estate'
        ]
      }
    };
  },
  methods: {
    async selectAnswer(option) {
      console.log(`selectAnswer called with option: ${option}`);
      const answerLetter = option.charAt(0); // Extract the letter
      await this.saveAnswer(3, answerLetter); // Save the answer to Firestore
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
