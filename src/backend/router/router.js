import { createRouter, createWebHistory } from 'vue-router';
import StartPage from '../../frontend/pages/FirstPage.vue'; 
import GroupCreation from '../../frontend/pages/GroupCreation.vue';
import SimulationPage from '../../frontend/pages/Simulation.vue';
import SimulationControls from '../../frontend/pages/SimulationControls.vue';

// Define your routes as before
const routes = [
  {
    path: '/',
    redirect: '/GroupCreation' // Redirect '/' to '/firstpage'
  },
  {
    path: '/firstpage',
    name: 'StartPage',
    component: StartPage,
  },
  {
    path: '/groupcreation',
    name: 'GroupCreation',
    component: GroupCreation,
  },
  {
    path: '/simulation',
    name: 'SimulationPage',
    component: SimulationPage,
  },
  {
    path: '/simulation-controls',
    name: 'SimulationControls',
    component: SimulationControls,
  },
];

// Create a router instance using createRouter and createWebHistory
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
