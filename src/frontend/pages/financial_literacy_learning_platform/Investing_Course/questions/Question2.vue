<template>
  <QuestionTemplate :question="question" @answered="selectAnswer" />
</template>

<script>
import QuestionTemplate from '../components/QuestionTemplate.vue';
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default {
  name: 'CourseQuestion2',
  components: {
    QuestionTemplate
  },
  data() {
    return {
      question: {
        text: 'What does "risk" mean in the context of investing?',
        options: [
          'A) The certainty that you will make money from your investments.',
          'B) The chance that an investment’s value will decrease.',
          'C) The fees associated with buying investments.',
          'D) The advice given by financial experts.'
        ]
      }
    };
  },
  methods: {
    async selectAnswer(option) {
      const answerLetter = option.charAt(0); // Extract the letter
      await this.saveAnswer(2, answerLetter); // Save the answer to Firestore
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
