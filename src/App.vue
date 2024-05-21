<template>
  <router-view />
</template>

<script>
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default {
  name: 'App',
  data() {
    return {
      user: null
    };
  },
  created() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        this.user = user;
        // Optionally redirect the user or update the state
        this.$router.push({ name: 'HomePage' });
      } else {
        // User is signed out
        this.user = null;
        this.$router.push({ name: 'Login' });
      }
    });
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: transparent;
}
</style>
