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
    name: 'CourseQuestion3',
    components: {
      QuestionTemplate
    },
    data() {
      return {
        question: {
          text: 'What is a bond?',
          options: [
            'A share of ownership in a company',
            'A type of debt investment',
            'A form of currency',
            'A type of real estate'
          ]
        },
        correctAnswer: 'B',
        explanation: 'Correct! A bond is a type of debt investment where you lend money to a company or government, and they promise to pay you back with interest.'
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
  