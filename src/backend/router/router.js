import { createRouter, createWebHistory } from 'vue-router';
import GroupCreation from '../../frontend/pages/groups_simulation/GroupCreation.vue';
import SimulationPage from '../../frontend/pages/groups_simulation/Simulation.vue';
import SimulationControls from '../../frontend/pages/groups_simulation/SimulationControls.vue';
import ResultsScreen from '../../frontend/pages/groups_simulation/ResultsScreen.vue';
import InvestmentCalculator from '../../frontend/pages/groups_simulation/InvestmentCalculator.vue';
import SimulationDetails from '../../frontend/pages/groups_simulation/SimulationDetails.vue';
import HomePage from '../../frontend/pages/HomePage.vue';
import PortfolioCreation from '../../frontend/pages/stock_trading_platform/PortfolioCreation';
import PortfolioCreationMobile from '../../frontend/pages/stock_trading_platform/PortfolioCreationMobile.vue';
import PortfolioDisplay from '../../frontend/pages/stock_trading_platform/PortfolioDisplay';
import PortfolioDisplayMobile from '../../frontend/pages/stock_trading_platform/PortfolioDisplayMobile';
import PortfolioAppend from '../../frontend/pages/stock_trading_platform/PortfolioAppend';
import PortfolioAppendMobile from '../../frontend/pages/stock_trading_platform/PortfolioAppendMobile';
import StockTradingSelect from '../../frontend/pages/stock_trading_platform/StockTradingSelect.vue';
import CreateAccount from '../../frontend/pages/CreateAccount.vue';
import LoginPage from '../../frontend/pages/LoginPage.vue';
import StartPage from '../../frontend/pages/StartPage.vue';
import AdminPortfolioCreation from '../../frontend/pages/stock_trading_platform/AdminPortfolioCreation.vue';
// import PortfolioUpload from '../../frontend/pages/stock_trading_platform/PortfolioUpload';
import PortfolioAssign from '../../frontend/pages/stock_trading_platform/PortfolioAssign';
// import PortfolioOmniView from '../../frontend/pages/stock_trading_platform/PortfolioOmniView.vue';
// import AdminPortfolioDisplay from '../../frontend/pages/stock_trading_platform/AdminPortfolioDisplay';
// import AdminPortfolioDisplayUID from '../../frontend/pages/stock_trading_platform/AdminPortfolioDisplayUID.vue';
import StickyNoteCreator from '../../frontend/pages/stock_trading_platform/StickyNoteCreator.vue';
import PortfolioDelete from '../../frontend/pages/stock_trading_platform/PortfolioDelete.vue';
// import UnassignedPortfolioDisplay from '../../frontend/pages/stock_trading_platform/UnassignedPortfolioDisplay.vue';
import UserManager from '../../frontend/pages/UserManager.vue';
import CodeManager from '../../frontend/pages/CodeManager.vue';
import BasicOfFinancialLiteracy from '../../frontend/pages/financial_literacy_learning_platform/BasicOfFinancialLiteracy.vue';
import BasicsOfInvesting from '../../frontend/pages/financial_literacy_learning_platform/Investing_Course/InvestingCourse.vue';
import StockMarketToday from '../../frontend/pages/stock_trading_platform/StockMarketToday.vue';

import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
    meta: { requiresAuth: true } // Require admin or developer access
  },
  {
    path: '/create-account',
    name: 'CreateAccount',
    component: CreateAccount
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
    meta: { requiresAuth: true }
  },
  {
    path: '/code-manager',
    name: 'CodeManager',
    component: CodeManager,
    meta: { requiresAuth: true }
  },
  {
    path: '/groupcreation',
    name: 'GroupCreation',
    component: GroupCreation,
    meta: { requiresAuth: true }
  },
  {
    path: '/simulation',
    name: 'SimulationPage',
    component: SimulationPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/simulation-controls',
    name: 'SimulationControls',
    component: SimulationControls,
    meta: { requiresAuth: true }
  },
  {
    path: '/results-screen',
    name: "ResultsScreen",
    component: ResultsScreen,
    meta: { requiresAuth: true }
  },
  {
    path: '/investment-calculator',
    name: "InvestmentCalculator",
    component: InvestmentCalculator,
    meta: { requiresAuth: true }
  },
  {
    path: '/simulation-history',
    name: "SimulationDetails",
    component: SimulationDetails,
    meta: { requiresAuth: true }
  },
  {
    path: '/portfolio-creation',
    name: "PortfolioCreation",
    component: PortfolioCreation
  },
  {
    path: '/portfolio-creation-M',
    name: "PortfolioCreationMobile",
    component: PortfolioCreationMobile
  },
  {
    path: '/admin-portfolio-creation',
    name: 'AdminPortfolioCreation',
    component: AdminPortfolioCreation,
    meta: { requiresAuth: true }
  },
  {
    path: '/portfolio-display',
    name: "PortfolioDisplay",
    component: PortfolioDisplay
  },
  {
    path: '/portfolio-display-M',
    name: "PortfolioDisplayMobile",
    component: PortfolioDisplayMobile
  },
  {
    path: '/portfolio-append',
    name: "PortfolioAppend",
    component: PortfolioAppend
  },
  {
    path: '/portfolio-append-M',
    name: "PortfolioAppendMobile",
    component: PortfolioAppendMobile,
  },
  {
    path: '/stock-trading-select',
    name: 'StockTradingSelect',
    component: StockTradingSelect
  },
  // {
  //   path: '/portfolio-upload',
  //   name: 'PortfolioUpload',
  //   component: PortfolioUpload,
  //   meta: { requiresAuth: true }
  // },
  {
    path: '/admin-portfolio-assign',
    name: 'PortfolioAssign',
    component: PortfolioAssign,
    meta: { requiresAuth: true }
  },
  // {
  //   path: '/admin-portfolio-view',
  //   name: 'PortfolioOmniView',
  //   component: PortfolioOmniView,
  //   meta: { requiresAuth: true }
  // },
  // {
  //   path: '/admin-portfolio-display',
  //   name: 'AdminPortfolioDisplay',
  //   component: AdminPortfolioDisplay,
  //   meta: { requiresAuth: true }
  // },
  // {
  //   path: '/admin-portfolio-display/:userId',
  //   name: 'AdminPortfolioDisplayUID',
  //   component: AdminPortfolioDisplayUID,
  //   props: true,
  //   meta: { requiresAuth: true }
  // },
  {
    path: '/sticky-note-creator',
    name: 'StickyNoteCreator',
    component: StickyNoteCreator,
    meta: { requiresAuth: true }
  },
  {
    path: '/portfolio-delete',
    name: 'PortfolioDelete',
    component: PortfolioDelete,
    meta: { requiresAuth: true }
  },
  // {
  //   path: '/unassigned-portfolio-display',
  //   name: 'UnassignedPortfolioDisplay',
  //   component: UnassignedPortfolioDisplay,
  //   meta: { requiresAuth: true }
  // },
  {
    path: '/basics-of-financial-literacy',
    name: 'BasicsOfFinancialLiteracy',
    component: BasicOfFinancialLiteracy
  },
  {
    path: '/basics-of-investing',
    name: 'BasicsOfInvesting',
    component: BasicsOfInvesting,
  },
  {
    path: '/stock-market-today',
    name: 'StockMarketToday',
    component: StockMarketToday,
    meta: { requiresAuth: true }
  }
];

// Create a router instance using createRouter and createWebHistory
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (user) {
      const db = getFirestore();
      const profileRef = doc(db, 'Users', user.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        if (profileData.admin || profileData.developer) {
          next();
        } else {
          alert('Access denied. You need to be an admin or developer to view this page.');
          next('/stock-trading-select');
        }
      } else {
        alert('Profile not found.');
        next('/stock-trading-select');
      }
    } else {
      alert('You need to be logged in to view this page.');
      next('/login');
    }
  } else {
    next();
  }
});

export default router;
