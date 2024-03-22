<template>
    <div>
      <h1>Simulation Page</h1>
      <div class="groups">
        <div v-for="(group, index) in groups" :key="index" class="group">
          <div class="group-header">
            <h2>
              {{ group.name }}
            </h2>
          </div>
          <div class="group-content">
            <div class="inputs">
              <div class="input-row">
                <label for="equity">Equity:</label>
                <input type="text" v-model="group.equity" id="equity">
              </div>
              <div class="input-row">
                <label for="bonds">Bonds:</label>
                <input type="text" v-model="group.bonds" id="bonds">
              </div>
              <div class="input-row">
                <label for="realEstate">Real Estate:</label>
                <input type="text" v-model="group.realEstate" id="realEstate">
              </div>
              <div class="input-row">
                <label for="banks">Bank Accounts:</label>
                <input type="text" v-model="group.banks" id="banks">
              </div>
              <div class="input-row">
                <label for="other">Other:</label>
                <input type="text" v-model="group.other" id="other">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'SimulationPage',
    props: {
      groupsData: {
        type: Array,
        required: true
      }
    },
    data() {
      return {
        groups: []
      };
    },
    created() {
      this.groups = this.groupsData;
    }
  };
  </script>
  
  <style scoped>
  h1 {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .groups {
    display: flex;
    flex-wrap: wrap;
  }
  
  .group {
    margin-right: 20px;
    margin-bottom: 20px;
    background-color: #000000; /* Black background */
    padding: 20px;
    border-radius: 10px;
    color: #FFFFFF; /* White text color */
    width: 300px; /* Set a fixed width for each group container */
  }
  
  .group-header {
    margin-bottom: 15px;
  }
  
  .group-content {
    display: flex;
    flex-direction: column;
  }
  
  .inputs {
    display: flex;
    flex-direction: column;
  }
  
  .input-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  
  .input-row label {
    flex: 1; /* Take up remaining space */
    margin-right: 10px; /* Add some spacing between label and input */
  }
  
  .input-row input {
    flex: 2; /* Take up more space than label */
  }
  </style>
  