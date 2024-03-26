// main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './backend/router/router';

// Import the file to ensure Firebase initializes
import './backend/firebase/initFirebase';

createApp(App)
  .use(router)
  .mount('#app');
