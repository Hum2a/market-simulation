import { createApp } from 'vue';
import App from './App.vue'; // Assuming your main component is App.vue
import router from './backend/router/router'; // Adjust the path as necessary

createApp(App)
  .use(router)
  .mount('#app');
