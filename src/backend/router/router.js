import { createRouter, createWebHistory } from 'vue-router';
import StartPage from '../../frontend/pages/FirstPage.vue'; 
import SecondPage from '../../frontend/pages/SecondPage.vue';
// import AssetGrowthSimulator from '../../frontend/pages/AssetGrowthSimulator.vue';

// Define your routes as before
const routes = [
  {
    path: '/',
    redirect: '/firstpage' // Redirect '/' to '/firstpage'
  },
  {
    path: '/firstpage',
    name: 'StartPage',
    component: StartPage,
  },
  {
    path: '/secondpage',
    name: 'SecondPage',
    component: SecondPage,
    props: true
  },
  // {
  //   path: '/assetgrowth',
  //   name: 'AssetPage',
  //   component: AssetGrowthSimulator,
  // }
];

// Create a router instance using createRouter and createWebHistory
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
