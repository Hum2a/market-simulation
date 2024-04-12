import { createRouter, createWebHistory } from 'vue-router';
import GroupCreation from '../../frontend/pages/GroupCreation.vue';
import SimulationPage from '../../frontend/pages/Simulation.vue';
import SimulationControls from '../../frontend/pages/SimulationControls.vue';
import ResultsScreen from '../../frontend/pages/ResultsScreen.vue';
import InvestmentCalculator from '../../frontend/pages/InvestmentCalculator.vue';
import SimulationDetails from '../../frontend/pages/SimulationDetails.vue';

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
    path: '/results-screen',
    name: "ResultsScreen",
    component: ResultsScreen,
  },
  {
    path: '/investment-calculator',
    name: "InvestmentCalculator",
    component: InvestmentCalculator,
  },
  {
    path: '/simulation-history',
    name: "SimulationDetails",
    component: SimulationDetails
  }

];

// Create a router instance using createRouter and createWebHistory
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
