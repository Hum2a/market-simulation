<template>
  <div class="leaderboard-card">
    <h2>Leaderboard for {{ selectedDateFormatted }}</h2>
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Portfolio Value</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(user, index) in topUsers"
          :key="user.uid"
          :class="{ 'highlighted': user.uid === currentUser?.uid }"
        >
          <td>{{ index + 1 }}</td>
          <td>{{ `${user.firstName} ${user.lastName}` }}</td>
          <td>£{{ roundedValue(user.totalAllocation) }}</td>
          <td>{{ user.portfolioDate }}</td>
        </tr>
        <tr v-if="currentUser && !isTopUser" class="highlighted">
          <td>{{ currentUserRank }}</td>
          <td>{{ `${currentUser.firstName} ${currentUser.lastName}` }}</td>
          <td>£{{ roundedValue(currentUser.totalAllocation) }}</td>
          <td>{{ currentUser.portfolioDate }}</td>
        </tr>
      </tbody>
    </table>
    <div class="request-counter">
      Total Firestore Requests: {{ requestCounter }}
    </div>
  </div>
</template>

<script>
import { getFirestore, getDocs, doc, getDoc, collection } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { format, subDays, differenceInDays } from 'date-fns';

export default {
  name: 'PortfolioLeaderboard',
  data() {
    return {
      topUsers: [],
      currentUser: null,
      currentUserRank: null,
      selectedDate: new Date(),
      requestCounter: 0, // Initialize the request counter
    };
  },
  computed: {
    selectedDateFormatted() {
      return format(this.selectedDate, 'yyyy-MM-dd');
    },
    isTopUser() {
      return this.currentUser && this.topUsers.some(user => user.uid === this.currentUser.uid);
    }
  },
  methods: {
    async fetchPortfolioForDate(uid, date, retries = 10) {
      if (retries <= 0) {
        console.warn(`Max retries reached for user: ${uid}`);
        return { totalAllocation: 0, date: null };
      }

      const db = getFirestore();
      this.requestCounter++; // Increment request counter
      console.log(`Fetching portfolio for user: ${uid} on date: ${date} (Request count: ${this.requestCounter})`);

      const portfolioDocRef = doc(db, uid, 'Stock Trading Platform', 'Portfolio', `${date} Portfolio`);
      const portfolioDoc = await getDoc(portfolioDocRef);

      if (portfolioDoc.exists()) {
        return { totalAllocation: portfolioDoc.data().totalAllocation, date };
      } else {
        const previousDate = subDays(new Date(date), 1);
        if (differenceInDays(this.selectedDate, previousDate) > 30) { // Limit the number of retries
          console.warn(`Exceeded 30 days of retries for user: ${uid}`);
          return { totalAllocation: 0, date: null };
        }
        return await this.fetchPortfolioForDate(uid, format(previousDate, 'yyyy-MM-dd'), retries - 1);
      }
    },
    async fetchLeaderboard() {
      const db = getFirestore();
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error("User is not logged in");
        return;
      }

      this.requestCounter++; // Increment request counter for fetching users
      console.log(`Fetching users collection (Request count: ${this.requestCounter})`);

      const usersSnapshot = await getDocs(collection(db, 'Users'));
      const users = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

      const portfolioPromises = users.map(async (user) => {
        const { totalAllocation, date } = await this.fetchPortfolioForDate(user.uid, this.selectedDateFormatted);
        return { ...user, totalAllocation, portfolioDate: date };
      });

      const userPortfolios = await Promise.all(portfolioPromises);
      const sortedPortfolios = userPortfolios.sort((a, b) => b.totalAllocation - a.totalAllocation);

      this.topUsers = sortedPortfolios.slice(0, 5);

      const currentUserPortfolio = sortedPortfolios.find(user => user.uid === currentUser.uid);
      if (currentUserPortfolio) {
        this.currentUser = currentUserPortfolio;
        this.currentUserRank = sortedPortfolios.indexOf(currentUserPortfolio) + 1;
      }
    },
    roundedValue(value) {
      return isNaN(value) ? '0.00' : parseFloat(value).toFixed(2);
    }
  },
  async created() {
    await this.fetchLeaderboard();
  }
};
</script>

<style scoped>
.leaderboard-card {
  background: #fff;
  padding: 1em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: left;
  margin-top: 20px;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table th, .leaderboard-table td {
  border: 1px solid #ddd;
  padding: 0.75em;
  text-align: left;
}

.leaderboard-table th {
  background-color: #102454;
  color: white;
}

.leaderboard-table td {
  background-color: #f9f9f9;
  color: #333;
}

.leaderboard-table tr:nth-child(even) td {
  background-color: #f2f2f2;
}

.highlighted {
  background-color: #ffeb3b !important;
}

.request-counter {
  margin-top: 20px;
  font-weight: bold;
}
</style>
