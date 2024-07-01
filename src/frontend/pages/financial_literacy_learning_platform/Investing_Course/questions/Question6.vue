<template>
  <QuestionTemplate :question="question" @answered="selectAnswer" />
</template>

<script>
import QuestionTemplate from '../components/QuestionTemplate.vue';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default {
  name: 'CourseQuestion6',
  components: {
    QuestionTemplate
  },
  data() {
    return {
      question: {
        text: 'What does "liquidity" mean in investing?',
        options: [
          'A) How quickly and easily an investment can be converted to cash',
          'B) The amount of dividends an investment pays',
          'C) The stability of an investment’s value',
          'D) The fees associated with an investment'
        ]
      }
    };
  },
  methods: {
    async selectAnswer(option) {
      console.log(`selectAnswer called with option: ${option}`);
      const answerLetter = option.charAt(0); // Extract the letter
      await this.saveAnswer(6, answerLetter); // Save the answer to Firestore
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
