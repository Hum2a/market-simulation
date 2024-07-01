<template>
    <div>
      <QuestionTemplate :question="question" @answered="handleAnswer" />
      <p v-if="showAnswer" class="correct-answer">
        Correct Answer: {{ correctAnswer }} - {{ explanation }}
      </p>
    </div>
  </template>
  
  <script>
  import QuestionTemplate from '../components/QuestionTemplate.vue';
  
  export default {
    name: 'CourseQuestion9',
    components: {
      QuestionTemplate
    },
    data() {
      return {
        question: {
          text: 'What is a bond in terms of investing?',
          options: [
            'A promise by a company or government to pay back money borrowed from investors with interest.',
            'A type of digital currency.',
            'A long-term rental agreement.',
            'A guarantee that an investment will be profitable.'
          ]
        },
        correctAnswer: 'A',
        explanation: 'Exactly! A bond is like lending money to a company or government. They promise to pay you back with interest after some time. It\'s a safer kind of investment.'
      };
    },
    methods: {
      handleAnswer(option) {
        this.showAnswer = true;
        this.$emit('answered', option);
      }
    }
  };
  </script>
  
  <style scoped>
  .correct-answer {
    margin-top: 20px;
    color: #2c3e50;
  }
  </style>
  