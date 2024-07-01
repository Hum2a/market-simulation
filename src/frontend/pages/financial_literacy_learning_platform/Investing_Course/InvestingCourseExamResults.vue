<template>
    <div class="results-container">
      <h2>Exam Results</h2>
      <p>You have completed the exam!</p>
      <p>Your Score: {{ score }} / 10</p>
      <button @click="goBackToCourse">Back to Course</button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ExamResults',
    props: {
      score: {
        type: Number,
        required: true
      }
    },
    methods: {
      goBackToCourse() {
        this.$emit('back-to-course');
      }
    }
  };
  </script>
  
  <style scoped>
  .results-container {
    padding: 20px;
    background: #ecf0f1;
    border-radius: 8px;
    text-align: center;
    animation: fade-in 1s ease-out;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  h2 {
    color: #34495e;
    margin-bottom: 20px;
  }
  
  button {
    padding: 10px 20px;
    font-size: 1.1em;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s ease, transform 0.3s ease;
    background-color: #3498db;
    color: white;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  button:hover {
    background: #2980b9;
    color: #fff;
  }
  
  button:active {
    transform: scale(0.95);
  }
  </style>
  