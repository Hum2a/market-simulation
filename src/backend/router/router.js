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
import PortfolioSimulation from '../../frontend/pages/stock_trading_platform/PortfolioSimulation';
import StockTradingSelect from '../../frontend/pages/stock_trading_platform/StockTradingSelect.vue';
import StockMarketToday from '../../frontend/pages/stock_trading_platform/StockMarketToday.vue';
import CreateAccount from '../../frontend/pages/CreateAccount.vue';
import LoginPage from '../../frontend/pages/LoginPage.vue';
import StartPage from '../../frontend/pages/StartPage.vue';
import AdminPortfolioCreation from '../../frontend/pages/stock_trading_platform/AdminPortfolioCreation.vue';
import PortfolioUpload from '../../frontend/pages/stock_trading_platform/PortfolioUpload';
import PortfolioAssign from '../../frontend/pages/stock_trading_platform/PortfolioAssign';
import PortfolioOmniView from '../../frontend/pages/stock_trading_platform/PortfolioOmniView.vue';
import AdminPortfolioDisplay from '../../frontend/pages/stock_trading_platform/AdminPortfolioDisplay';
import AdminPortfolioDisplayUID from '../../frontend/pages/stock_trading_platform/AdminPortfolioDisplayUID.vue';
import StickyNoteCreator from '../../frontend/pages/stock_trading_platform/StickyNoteCreator.vue';
import PortfolioDelete from '../../frontend/pages/stock_trading_platform/PortfolioDelete.vue';
import UnassignedPortfolioDisplay from '../../frontend/pages/stock_trading_platform/UnassignedPortfolioDisplay.vue';
import UserManager from '../../frontend/pages/UserManager.vue';

const routes = [
  {
    path: '/',
    redirect: '/startpage'
  },
  {
    path: '/startpage',
    name: 'StartPage',
    component: StartPage
  },
  {
    path: '/homepage',
    name: 'HomePage',
    component: HomePage,
  },
  {
    path: '/create-account',
    name: 'CreateAccount',
    component: CreateAccount,
  },
  {
    path: '/login',
    name: 'LoginPage',
    component: LoginPage
  },
  {
    path: '/user-manager',
    name: 'UserManager',
    component: UserManager,
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
    path: '/admin-portfolio-creation',
    name: 'AdminPortfolioCreation',
    component: AdminPortfolioCreation
  },  
  {
    path: '/portfolio-display',
    name: "PortfolioDisplay",
    component: PortfolioDisplay,
  },
  {
    path: '/portfolio-simulation',
    name: "PortfolioSimulation",
    component: PortfolioSimulation
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
  },
  {
    path: '/portfolio-upload',
    name: 'PortfolioUpload',
    component: PortfolioUpload
  },
  {
    path: '/admin-portfolio-assign',
    name: 'PortfolioAssign',
    component: PortfolioAssign
  },
  {
    path: '/admin-portfolio-view',
    name: 'PortfolioOmniView',
    component: PortfolioOmniView
  },
  {
    path: '/admin-portfolio-display',
    name: 'AdminPortfolioDisplay',
    component: AdminPortfolioDisplay
  },
  {
    path: '/admin-portfolio-display/:userId',
    name: 'AdminPortfolioDisplayUID',
    component: AdminPortfolioDisplayUID,
    props: true
  },
  {
    path: '/sticky-note-creator',
    name: 'StickyNoteCreator',
    component: StickyNoteCreator
  },
  {
    path: '/portfolio-delete',
    name: 'PortfolioDelete',
    component: PortfolioDelete
  },
  {
    path: '/unassigned-portfolio-display',
    name: 'UnassignedPortfolioDisplay',
    component: UnassignedPortfolioDisplay
  }
];

// Create a router instance using createRouter and createWebHistory
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
