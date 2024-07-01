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
    name: 'CourseQuestion7',
    components: {
      QuestionTemplate
    },
    data() {
      return {
        question: {
          text: 'What happens when the company you own stocks in does well?',
          options: [
            'You lose your investment.',
            'The value of your stocks generally increases.',
            'The value of your stocks stays the same.',
            'You have to pay more money to the company.'
          ]
        },
        correctAnswer: 'B',
        explanation: 'Right on! If the company you bought stocks in does well, your stocks go up in value. This means your investment grows, and you could make money if you sell them.'
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
  