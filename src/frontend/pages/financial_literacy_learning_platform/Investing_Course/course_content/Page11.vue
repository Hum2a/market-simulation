<template>
    <div class="page-content">
      <img src="../Investing mini course/11.png" alt="Course Image" class="course-image">
      <p>Click finish when you're ready</p>
      <button @click="finishCourse">Finish</button>
    </div>
  </template>
  
  <script>
  import { getFirestore, doc, updateDoc } from "firebase/firestore";
  import { getAuth } from "firebase/auth";
  
  export default {
    name: 'CoursePage11',
    methods: {
      async finishCourse() {
        const db = getFirestore();
        const auth = getAuth();
        const user = auth.currentUser;
  
        if (user) {
          const courseRef = doc(db, user.uid, 'Financial Literacy Courses', 'Basics of Investing', 'Course Content');
          await updateDoc(courseRef, {
            Completed: true
          });
        }
  
        this.$emit('complete');
      }
    }
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
  