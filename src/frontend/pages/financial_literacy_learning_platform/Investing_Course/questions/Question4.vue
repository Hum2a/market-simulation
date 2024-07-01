<template>
  <QuestionTemplate :question="question" @answered="selectAnswer" />
</template>

<script>
import QuestionTemplate from '../components/QuestionTemplate.vue';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default {
  name: 'CourseQuestion4',
  components: {
    QuestionTemplate
  },
  data() {
    return {
      question: {
        text: 'What is diversification?',
        options: [
          'A) Investing all your money in one type of asset',
          'B) Spreading your investments across different types of assets',
          'C) Avoiding all risky investments',
          'D) Investing only in real estate'
        ]
      }
    };
  },
  methods: {
    async selectAnswer(option) {
      console.log(`selectAnswer called with option: ${option}`);
      const answerLetter = option.charAt(0); // Extract the letter
      await this.saveAnswer(4, answerLetter); // Save the answer to Firestore
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
