<template>
    <div class="exam-container">
      <transition name="fade">
        <div>
          <component :is="currentPageComponent" v-if="!showResults" @answered="nextQuestion" />
          <ExamResults v-if="showResults" @back-to-course="backToCourse" />
        </div>
      </transition>
    </div>
  </template>
  
  <script>
  // Import all question pages
  import CourseQuestion1 from './questions/Question1.vue';
  import CourseQuestion2 from './questions/Question2.vue';
  import CourseQuestion3 from './questions/Question3.vue';
  import CourseQuestion4 from './questions/Question4.vue';
  import CourseQuestion5 from './questions/Question5.vue';
  import CourseQuestion6 from './questions/Question6.vue';
  import CourseQuestion7 from './questions/Question7.vue';
  import CourseQuestion8 from './questions/Question8.vue';
  import CourseQuestion9 from './questions/Question9.vue';
  import CourseQuestion10 from './questions/Question10.vue';
  import ExamResults from './InvestingCourseExamResults.vue';
  
  export default {
    name: 'InvestingCourseExam',
    components: {
      CourseQuestion1,
      CourseQuestion2,
      CourseQuestion3,
      CourseQuestion4,
      CourseQuestion5,
      CourseQuestion6,
      CourseQuestion7,
      CourseQuestion8,
      CourseQuestion9,
      CourseQuestion10,
      ExamResults
    },
    data() {
      return {
        currentPage: 1,
        totalPages: 10,
        showResults: false
      };
    },
    computed: {
      currentPageComponent() {
        return `CourseQuestion${this.currentPage}`;
      }
    },
    methods: {
      async nextQuestion(answer) {
        console.log(`nextQuestion called with answer: ${answer}`);
        console.log(`Current page before increment: ${this.currentPage}`);
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          console.log(`Current page after increment: ${this.currentPage}`);
        } else {
          this.completeExam();
        }
      },
      completeExam() {
        console.log('Exam completed');
        this.showResults = true;
      },
      backToCourse() {
        console.log('Back to course');
        this.$emit('back-to-course');
      }
    }
  };
  </script>
  
  <style scoped>
  /* Keyframes for animations */
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  /* Transitions */
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.5s;
  }
  .fade-enter, .fade-leave-to {
    opacity: 0;
  }
  
  .exam-container {
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
  </style>
  