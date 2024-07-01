<template>
    <div class="question-container">
      <h2>{{ question.text }}</h2>
      <ul>
        <li v-for="option in question.options" :key="option">
          <button @click="selectAnswer(option)">{{ option }}</button>
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    name: 'QuestionTemplate',
    props: {
      question: {
        type: Object,
        required: true
      }
    },
    methods: {
      selectAnswer(option) {
        this.$emit('answered', option);
      }
    }
  };
  </script>
  
  <style scoped>
  .question-container {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  button {
    display: block;
    width: 100%;
    margin: 10px 0;
    padding: 10px;
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:hover {
    background: #0056b3;
  }
  </style>
  