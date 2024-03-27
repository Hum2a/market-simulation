import { createRouter, createWebHistory } from 'vue-router';
import GroupCreation from '../../frontend/pages/GroupCreation.vue';
import SimulationPage from '../../frontend/pages/Simulation.vue';
import SimulationControls from '../../frontend/pages/SimulationControls.vue';
import SimulationTest from '../../frontend/pages/SimulationTest.vue';

// Define your routes as before
const routes = [
  {
    path: '/',
    redirect: '/GroupCreation' // Redirect '/' to '/firstpage'
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
  {
    path: '/simulation-test',
    name: "SimulationTest",
    component: SimulationTest,
  },
];

// Create a router instance using createRouter and createWebHistory
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
