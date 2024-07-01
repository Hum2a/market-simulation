<template>
    <div class="page-content">
      <h2>Equities</h2>
      <img src="../Investing mini course/4.png" alt="Course Image" class="course-image">
      <p>Click next when you're ready</p>
      <button @click="$emit('next')">Next</button>
    </div>
  </template>
  
  <script>
  export default {
    name: 'CoursePage4'
  };
  </script>
  
  <style scoped>
  .page-content {
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
  
  .course-image {
    width: 100%;
    max-width: 600px;
    height: auto;
    margin-bottom: 20px;
    border-radius: 8px;
    box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
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
  