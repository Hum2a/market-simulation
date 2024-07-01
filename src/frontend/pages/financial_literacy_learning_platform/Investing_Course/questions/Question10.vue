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
    name: 'CourseQuestion10',
    components: {
      QuestionTemplate
    },
    data() {
      return {
        question: {
          text: 'Why is it important to consider the risk before investing?',
          options: [
            'To ensure you always make a profit.',
            'To understand how much money you could lose.',
            'To make the investment process longer.',
            'To impress your friends with your knowledge.'
          ]
        },
        correctAnswer: 'B',
        explanation: 'Right on! Before you invest, it\'s important to think about the risk. This means figuring out how much you could lose. Knowing this helps you choose investments that you\'re comfortable with and that can help you reach your money goals.'
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
  