import { createRouter, createWebHistory } from 'vue-router';
import StartPage from '../pages/FirstPage.vue'; 
import SecondPage from '../pages/SecondPage.vue';

const routes = [
  {
    path: '/',
    redirect: '/firstpage' // Redirect '/' to '/firstpage'
  },
  {
    path: '/firstpage',
    name: 'StartPage',
    component: StartPage
  },
  {
    path: '/secondpage',
    name: 'SecondPage',
    component: SecondPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
