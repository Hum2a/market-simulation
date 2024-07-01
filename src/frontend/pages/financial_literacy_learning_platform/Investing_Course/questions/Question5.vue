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
    name: 'CourseQuestion5',
    components: {
      QuestionTemplate
    },
    data() {
      return {
        question: {
          text: 'Which of the following is considered an asset class?',
          options: [
            'A bank loan',
            'A stock investment',
            'A monthly allowance',
            'A shopping voucher'
          ]
        },
        correctAnswer: 'B',
        explanation: 'Spot on! A stock is an asset class where you buy a small part of a company. If the company does well and makes money, so does your investment!'
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
  