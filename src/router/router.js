import { createRouter, createWebHistory } from 'vue-router';
import StartPage from '../pages/FirstPage.vue'; 
import SecondPage from '../pages/SecondPage.vue';
import Simulation from '../pages/Simulation.vue';

const routes = [
  {
    path: '/',
    redirect: '/firstpage' // Redirect '/' to '/firstpage'
  },
  {
    path: '/firstpage',
    name: 'StartPage',
    component: StartPage,
    props: true
  },
  {
    path: '/secondpage',
    name: 'SecondPage',
    component: SecondPage,
    props: true
  },
  {
    path: '/simulation',
    name: 'Simulation',
    component: Simulation,
    props: true
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
