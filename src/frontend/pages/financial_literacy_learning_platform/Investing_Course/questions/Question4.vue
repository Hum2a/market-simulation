f<template>
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
    name: 'CourseQuestion4',
    components: {
      QuestionTemplate
    },
    data() {
      return {
        question: {
          text: 'What is diversification in investing?',
          options: [
            'Investing all your money in one stock',
            'Spreading your investments across different assets',
            'Only investing in high-risk assets',
            'Avoiding investments entirely'
          ]
        },
        correctAnswer: 'B',
        explanation: 'Correct! Diversification is spreading your investments across different assets to reduce risk.'
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
  