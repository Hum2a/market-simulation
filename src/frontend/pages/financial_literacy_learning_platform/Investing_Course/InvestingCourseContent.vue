<template>
    <div class="content-container">
      <transition
        name="fade"
        mode="out-in"
      >
        <component :is="currentPageComponent" :key="currentPage" @next="nextPage" @complete="completeCourse" />
      </transition>
    </div>
  </template>
  
  <script>
  // Import all generated pages from the course_content directory
  import CoursePage1 from './course_content/Page1.vue';
  import CoursePage2 from './course_content/Page2.vue';
  import CoursePage3 from './course_content/Page3.vue';
  import CoursePage4 from './course_content/Page4.vue';
  import CoursePage5 from './course_content/Page5.vue';
  import CoursePage6 from './course_content/Page6.vue';
  import CoursePage7 from './course_content/Page7.vue';
  import CoursePage8 from './course_content/Page8.vue';
  import CoursePage9 from './course_content/Page9.vue';
  import CoursePage10 from './course_content/Page10.vue';
  import CoursePage11 from './course_content/Page11.vue';
  
  export default {
    name: 'InvestingCourseContent',
    components: {
      CoursePage1,
      CoursePage2,
      CoursePage3,
      CoursePage4,
      CoursePage5,
      CoursePage6,
      CoursePage7,
      CoursePage8,
      CoursePage9,
      CoursePage10,
      CoursePage11
    },
    data() {
      return {
        currentPage: 1,
        totalPages: 11
      };
    },
    computed: {
      currentPageComponent() {
        return `CoursePage${this.currentPage}`;
      }
    },
    methods: {
      nextPage() {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
        } else {
          this.completeCourse();
        }
      },
      completeCourse() {
        this.$emit('complete');
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
  
  .content-container {
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
  