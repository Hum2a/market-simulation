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
    name: 'CourseQuestion8',
    components: {
      QuestionTemplate
    },
    data() {
      return {
        question: {
          text: 'Why is diversifying your investments important?',
          options: [
            'It ensures you will always make a profit.',
            'It minimizes risk by spreading your investments across various asset types.',
            'It involves investing only in stocks.',
            'It is required by law.'
          ]
        },
        correctAnswer: 'B',
        explanation: 'Well done! Diversifying your investments is like not putting all your eggs in one basket. Spread your money across different types, so if one doesn’t do well, you don’t lose it all. This helps lower risks and keeps your returns steady over time.'
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
  