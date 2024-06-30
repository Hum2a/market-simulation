<template>
    <div class="user-manager">
      <header class="header">
        <img src="../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
        <nav class="header-links">
          <router-link to="/stock-trading-select" class="nav-link">Stock Trading Tool</router-link>
        </nav>
      </header>
      <div class="content">
        <h1>User Management</h1>
        <div v-if="loading">Loading users...</div>
        <div v-if="!loading && users.length === 0">No users found.</div>
        <div v-if="!loading && users.length > 0">
          <table class="user-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Email</th>
                <!-- <th>Actions</th> -->
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.uid" @click="showUserProfile(user)">
                <td>{{ user.uid }}</td>
                <td>{{ user.email }}</td>
                <!-- <td>
                  <button @click.stop="deleteUser(user.uid)">Delete</button>
                </td> -->
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="selectedUser" class="user-drawer active">
        <div class="drawer-content">
          <button class="close-button" @click="selectedUser = null">Close</button>
          <h2>User Profile</h2>
          <p @click="editProfile('uid', selectedUser.uid)"><strong>User ID:</strong> {{ selectedUser.uid }}</p>
          <p @click="editProfile('email', selectedUser.email)"><strong>Email:</strong> {{ selectedUser.email }}</p>
          <p @click="editProfile('firstName', selectedUser.firstName)"><strong>First Name:</strong> {{ selectedUser.firstName }}</p>
          <p @click="editProfile('lastName', selectedUser.lastName)"><strong>Last Name:</strong> {{ selectedUser.lastName }}</p>
          <p @click="editProfile('school', selectedUser.school)"><strong>School:</strong> {{ selectedUser.school }}</p>
          <p @click="editProfile('class', selectedUser.class)"><strong>Class:</strong> {{ selectedUser.class }}</p>
          <p @click="editProfile('admin', selectedUser.admin)"><strong>Admin:</strong> {{ selectedUser.admin }}</p>
          <p @click="editProfile('developer', selectedUser.developer)"><strong>Developer:</strong> {{ selectedUser.developer }}</p>
        </div>
      </div>
      <div v-if="showModal" class="modal">
        <div class="modal-content">
          <span class="close" @click="showModal = false">&times;</span>
          <h2>Edit {{ editField }}</h2>
          <input v-model="editValue" />
          <button @click="saveEdit">Save</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
  import { getAuth, deleteUser as deleteAuthUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
  
  export default {
    name: "UserManager",
    data() {
      return {
        users: [],
        loading: true,
        selectedUser: null, // For storing the selected user profile
        showModal: false, // For displaying the edit modal
        editField: '', // The field being edited
        editValue: '', // The new value for the field
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
      showUserProfile(user) {
        this.selectedUser = user;
      },
      editProfile(field, value) {
        this.editField = field;
        this.editValue = value;
        this.showModal = true;
      },
      async saveEdit() {
        if (this.selectedUser && this.editField) {
          const db = getFirestore();
          const userDocRef = doc(db, "Users", this.selectedUser.uid);
          await updateDoc(userDocRef, { [this.editField]: this.editValue });
          this.selectedUser[this.editField] = this.editValue;
          this.showModal = false;
        }
      },
    },
  };
  </script>
  
  <style scoped>
  body {
    font-family: 'Roboto', sans-serif;
    background-color: #f0f2f5;
    margin: 0;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1em 2em;
    background-color: #102454;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    position: fixed;
    top: 0;
    left: 0; /* Ensure it is attached to the left */
    width: 100%;
    z-index: 1000;
  }
  
  .logo {
    width: 150px;
    margin: 0;
    clip-path: polygon(0 0, 60% 0, 60% 100%, 0% 100%);
  }
  
  .header-links {
    display: flex;
    gap: 1em;
  }
  
  .nav-link {
    color: #fff;
    text-decoration: none;
    font-size: 1em;
    padding: 0.5em 1em;
    border-radius: 5px;
    transition: background-color 0.3s, transform 0.2s;
  }
  
  .nav-link:hover {
    background-color: #0d1b3f;
    transform: scale(1.05);
  }
  
  .user-manager {
    padding: 2em;
    background-color: #f0f2f5;
    margin-top: 100px; /* Adjust the margin to prevent content overlap with the fixed header */
  }
  
  .content {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    color: #102454;
    font-size: 2.5em;
    text-transform: uppercase;
    letter-spacing: 1px;
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
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .user-table td {
    background-color: #fff;
    color: #333;
  }
  
  .user-table tr {
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .user-table tr:hover {
    background-color: #f1f1f1;
  }
  
  button {
    background-color: #e17858;
    color: white;
    border: none;
    padding: 0.5em 1em;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
  }
  
  button:hover {
    background-color: #c55b45;
    transform: scale(1.05);
  }
  
  .user-drawer {
    position: fixed;
    right: 0;
    top: 0;
    width: 300px;
    height: 100%;
    background-color: #fff;
    box-shadow: -2px 0 5px rgba(0, 0, 0, 0.3);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 1001;
  }
  
  .user-drawer .drawer-content {
    padding: 2em;
  }
  
  .user-drawer .close-button {
    background-color: #e17858;
    color: white;
    border: none;
    padding: 0.5em 1em;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
    margin-bottom: 1em;
  }
  
  .user-drawer .close-button:hover {
    background-color: #c55b45;
    transform: scale(1.05);
  }
  
  .user-drawer.active {
    transform: translateX(0);
  }
  
  h2 {
    color: #102454;
    font-size: 2em;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  p {
    margin: 1em 0;
    color: #333;
    cursor: pointer;
  }
  
  .modal {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    z-index: 1002;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
  }
  
  .modal-content {
    background-color: #fff;
    padding: 2em;
    border-radius: 5px;
    width: 400px;
    text-align: center;
  }
  
  .close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
  }
  
  .close:hover,
  .close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
  }
  
  input {
    width: 100%;
    padding: 0.5em;
    margin: 1em 0;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  
  button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 0.5em 1em;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.2s;
  }
  
  button:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }
  </style>
  