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
    name: 'CourseQuestion6',
    components: {
      QuestionTemplate
    },
    data() {
      return {
        question: {
          text: 'What is cryptocurrency?',
          options: [
            'A new type of currency that exists only in digital form and uses cryptography for security.',
            'Traditional money printed by governments.',
            'A reward system for video games.',
            'A special kind of coupon used for online shopping.'
          ]
        },
        correctAnswer: 'A',
        explanation: 'Excellent! Cryptocurrency is digital money that\'s secure because it uses special codes. You can\'t hold it like pounds or dollars—it\'s all online. People invest in it hoping it\'ll be worth more later, just like with stocks.'
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
  