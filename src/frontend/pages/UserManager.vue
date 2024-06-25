<template>
  <div class="user-manager">
      <h1>User Management</h1>
      <div v-if="loading">Loading users...</div>
      <div v-if="!loading && users.length === 0">No users found.</div>
      <div v-if="!loading && users.length > 0">
          <table class="user-table">
              <thead>
                  <tr>
                      <th>User ID</th>
                      <th>Email</th>
                      <th>Actions</th>
                  </tr>
              </thead>
              <tbody>
                  <tr v-for="user in users" :key="user.uid">
                      <td>{{ user.uid }}</td>
                      <td>{{ user.email }}</td>
                      <td>
                          <button @click="deleteUser(user.uid)">Delete</button>
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
  </div>
</template>

<script>
import { getFirestore, collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { getAuth, deleteUser as deleteAuthUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

export default {
  name: "UserManager",
  data() {
      return {
          users: [],
          loading: true,
      };
  },
  async created() {
      await this.fetchUsers();
  },
  methods: {
      async fetchUsers() {
          const db = getFirestore();
          const usersCollection = collection(db, "Users");
          const usersSnapshot = await getDocs(usersCollection);
          this.users = usersSnapshot.docs.map((doc) => ({
              uid: doc.id,
              ...doc.data(),
          }));
          this.loading = false;
      },
      async deleteUser(uid) {
          try {
              const auth = getAuth();
              
              // Delete user document from Firestore
              await this.deleteUserDocument(uid);

              // Delete user collection from Firestore
              await this.deleteUserCollection(uid);
              
              // Reauthenticate and delete user from Authentication
              await this.reauthenticateAndDeleteUser(auth.currentUser);

              // Refresh the user list
              await this.fetchUsers();
          } catch (error) {
              console.error("Error deleting user:", error);
          }
      },
      async deleteUserDocument(uid) {
          const db = getFirestore();
          const userDocRef = doc(db, "Users", uid);
          try {
              await deleteDoc(userDocRef);
              console.log(`Deleted user document with UID: ${uid}`);
          } catch (error) {
              console.error("Error deleting user document:", error);
          }
      },
      async deleteUserCollection(uid) {
          const db = getFirestore();
          const userCollectionRef = collection(db, uid);
          try {
              const userDocs = await getDocs(userCollectionRef);
              const deletePromises = [];
              userDocs.forEach((doc) => {
                  deletePromises.push(deleteDoc(doc.ref));
              });
              await Promise.all(deletePromises);
              console.log(`Deleted all documents in user collection with UID: ${uid}`);
          } catch (error) {
              console.error("Error deleting user collection:", error);
          }
      },
      async reauthenticateAndDeleteUser(user) {
          try {
              const credential = EmailAuthProvider.credential(user.email, prompt("Enter your password for re-authentication:"));
              await reauthenticateWithCredential(user, credential);
              await deleteAuthUser(user);
              console.log("Deleted user from Firebase Authentication");
          } catch (error) {
              console.error("Error re-authenticating and deleting user:", error);
          }
      },
  },
};
</script>

<style scoped>
.user-manager {
  padding: 2em;
  background-color: #f0f2f5;
}

h1 {
  color: #102454;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1em;
}

.user-table th, .user-table td {
  border: 1px solid #ddd;
  padding: 0.75em;
  text-align: left;
}

.user-table th {
  background-color: #102454;
  color: white;
}

.user-table td {
  background-color: #fff;
  color: #333;
}

button {
  background-color: #e17858;
  color: white;
  border: none;
  padding: 0.5em 1em;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #c55b45;
}
</style>
