import { createRouter, createWebHistory } from 'vue-router';
import GroupCreation from '../../frontend/pages/groups_simulation/GroupCreation.vue';
import SimulationPage from '../../frontend/pages/groups_simulation/Simulation.vue';
import SimulationControls from '../../frontend/pages/groups_simulation/SimulationControls.vue';
import ResultsScreen from '../../frontend/pages/groups_simulation/ResultsScreen.vue';
import InvestmentCalculator from '../../frontend/pages/groups_simulation/InvestmentCalculator.vue';
import SimulationDetails from '../../frontend/pages/groups_simulation/SimulationDetails.vue';
import HomePage from '../../frontend/pages/HomePage.vue';
import PortfolioCreation from '../../frontend/pages/stock_trading_platform/PortfolioCreation';
import PortfolioDisplay from '../../frontend/pages/stock_trading_platform/PortfolioDisplay';
import StockTradingSelect from '../../frontend/pages/stock_trading_platform/StockTradingSelect.vue';
import StockMarketToday from '../../frontend/pages/stock_trading_platform/StockMarketToday.vue';

const routes = [
  {
    path: '/',
    redirect: '/homepage'
  },
  {
    path: '/homepage',
    name: 'HomePage',
    component: HomePage,
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
  },
  {
    path: '/portfolio-creation',
    name: "PortfolioCreation",
    component: PortfolioCreation,
  },
  {
    path: '/portfolio-display',
    name: "PortfolioDisplay",
    component: PortfolioDisplay,
  },
  {
    path: '/stock-trading-select',
    name: 'StockTradingSelect',
    component: StockTradingSelect,
  },
  {
    path: '/stock-market-today',
    name: 'StockMarketToday',
    component: StockMarketToday,
  }
];

// Create a router instance using createRouter and createWebHistory
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
