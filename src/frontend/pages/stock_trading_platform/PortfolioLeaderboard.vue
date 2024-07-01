<template>
  <div class="leaderboard-card">
    <h2>Leaderboard</h2>

    <!-- Dropdown Picker for Group Code, visible only to admin or developer users -->
    <div v-if="isAdminOrDeveloper" class="group-code-picker">
      <label for="groupCode">Select Group Code:</label>
      <select id="groupCode" v-model="selectedGroupCode" @change="fetchLeaderboard">
        <option v-for="code in groupCodes" :key="code.code" :value="code.code">
          {{ code.code }} ({{ code.count }} users)
        </option>
      </select>
    </div>

    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Portfolio Value</th>
          <!-- <th>Date</th> -->
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
          <!-- <td>{{ user.portfolioDate }}</td> -->
        </tr>
        <tr v-if="currentUser && !isTopUser" class="highlighted">
          <td>{{ currentUserRank }}</td>
          <td>{{ `${currentUser.firstName} ${currentUser.lastName}` }}</td>
          <td>£{{ roundedValue(currentUser.totalAllocation) }}</td>
          <td>{{ currentUser.portfolioDate }}</td>
        </tr>
      </tbody>
    </table>
    <div v-if="isDeveloper" class="request-counter">
      Total Firestore Requests: {{ requestCounter }}
    </div>
  </div>
</template>

<script>
import { getFirestore, getDocs, doc, getDoc, collection, query, where } from "firebase/firestore";
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
      requestCounter: 0,
      isDeveloper: false,
      isAdmin: false,
      currentUserGroupCode: null,
      selectedGroupCode: null,
      groupCodes: [] // Initialize groupCodes array with counts
    };
  },
  computed: {
    selectedDateFormatted() {
      return format(this.selectedDate, 'yyyy-MM-dd');
    },
    isTopUser() {
      return this.currentUser && this.topUsers.some(user => user.uid === this.currentUser.uid);
    },
    isAdminOrDeveloper() {
      return this.isAdmin || this.isDeveloper;
    }
  },
  methods: {
    async fetchPortfolioForDate(uid, date, retries = 10) {
      if (retries <= 0) {
        console.warn(`Max retries reached for user: ${uid}`);
        return { totalAllocation: 0, date: null };
      }

      const db = getFirestore();
      this.requestCounter++;
      console.log(`Fetching portfolio for user: ${uid} on date: ${date} (Request count: ${this.requestCounter})`);

      const portfolioDocRef = doc(db, uid, 'Stock Trading Platform', 'Portfolio', `${date} Portfolio`);
      const portfolioDoc = await getDoc(portfolioDocRef);

      if (portfolioDoc.exists()) {
        return { totalAllocation: portfolioDoc.data().totalAllocation, date };
      } else {
        const previousDate = subDays(new Date(date), 1);
        if (differenceInDays(this.selectedDate, previousDate) > 30) {
          console.warn(`Exceeded 30 days of retries for user: ${uid}`);
          return { totalAllocation: 0, date: null };
        }
        return await this.fetchPortfolioForDate(uid, format(previousDate, 'yyyy-MM-dd'), retries - 1);
      }
    },
    async fetchGroupCodes() {
      const db = getFirestore();
      const codesSnapshot = await getDocs(collection(db, 'Login Codes'));

      const groupCodes = [];
      for (const doc of codesSnapshot.docs) {
        const groupCode = doc.id;

        const usersQuery = query(collection(db, 'Users'), where('groupCode', '==', groupCode));
        const usersSnapshot = await getDocs(usersQuery);
        const userCount = usersSnapshot.size;

        groupCodes.push({ code: groupCode, count: userCount });
      }

      this.groupCodes = groupCodes;
    },
    async fetchLeaderboard() {
      const db = getFirestore();
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error("User is not logged in");
        return;
      }

      this.requestCounter++;
      console.log(`Fetching current user profile (Request count: ${this.requestCounter})`);

      const currentUserProfileRef = doc(db, 'Users', currentUser.uid);
      const currentUserProfileSnap = await getDoc(currentUserProfileRef);

      if (currentUserProfileSnap.exists()) {
        this.currentUserGroupCode = currentUserProfileSnap.data().groupCode;
        if (!this.selectedGroupCode) {
          this.selectedGroupCode = this.currentUserGroupCode;
        }
      } else {
        console.error("Current user profile not found");
        return;
      }

      this.requestCounter++;
      console.log(`Fetching users collection with groupCode ${this.selectedGroupCode} (Request count: ${this.requestCounter})`);

      const usersQuery = query(collection(db, 'Users'), where('groupCode', '==', this.selectedGroupCode));
      const usersSnapshot = await getDocs(usersQuery);
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

      await this.checkDeveloperStatus();
    },
    async checkDeveloperStatus() {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const db = getFirestore();
        const profileRef = doc(db, 'Users', user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          this.isDeveloper = profileData.role === 'developer';
          this.isAdmin = profileData.role === 'admin';
        }
      }
    },
    roundedValue(value) {
      return isNaN(value) ? '0.00' : parseFloat(value).toFixed(2);
    }
  },
  async created() {
    await this.fetchGroupCodes();
    await this.fetchLeaderboard();
  }
};
</script>

<style scoped>
.leaderboard-card {
  background: #fff;
  padding: 2em;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: left;
  margin-top: 20px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.leaderboard-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.leaderboard-card h2 {
  color: #102454;
  margin-bottom: 1em;
  font-weight: bold;
  border-bottom: 2px solid #102454;
  padding-bottom: 0.5em;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.group-code-picker {
  margin-bottom: 1em;
}

.group-code-picker label {
  margin-right: 1em;
  font-weight: bold;
  color: #102454;
}

.group-code-picker select {
  padding: 0.5em;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1em;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1em;
}

.leaderboard-table th, .leaderboard-table td {
  border: 1px solid #ddd;
  padding: 0.75em;
  text-align: left;
}

.leaderboard-table th {
  background-color: #102454;
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.leaderboard-table td {
  background-color: #f9f9f9;
  color: #333;
  font-size: 1em;
}

.leaderboard-table tr:nth-child(even) td {
  background-color: #f2f2f2;
}

.highlighted {
  background-color: #ffeb3b !important;
  font-weight: bold;
  text-transform: uppercase;
}

.request-counter {
  margin-top: 20px;
  font-weight: bold;
  color: #102454;
  text-align: right;
}
</style>
