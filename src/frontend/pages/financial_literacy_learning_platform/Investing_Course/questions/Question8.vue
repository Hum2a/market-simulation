<template>
  <QuestionTemplate :question="question" @answered="selectAnswer" />
</template>

<script>
import QuestionTemplate from '../components/QuestionTemplate.vue';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default {
  name: 'CourseQuestion8',
  components: {
    QuestionTemplate
  },
  data() {
    return {
      question: {
        text: 'What is a dividend?',
        options: [
          'A) The interest paid on a savings account',
          'B) A portion of a company’s earnings distributed to shareholders',
          'C) The fees associated with buying and selling stocks',
          'D) The total value of all shares of a company’s stock'
        ]
      }
    };
  },
  methods: {
    async selectAnswer(option) {
      console.log(`selectAnswer called with option: ${option}`);
      const answerLetter = option.charAt(0); // Extract the letter
      await this.saveAnswer(8, answerLetter); // Save the answer to Firestore
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
