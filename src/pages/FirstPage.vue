<template>
  <div>
    <h1>Start Page</h1>
    <div class="groups">
      <div v-for="(group, index) in groups" :key="index" class="group">
        <div class="group-header">
          <h2>
            {{ group.name }}
            <button @click="editGroupName(index)" class="edit-group-btn">✎</button>
          </h2>
        </div>
        <div class="group-content">
          <div class="inputs">
            <div class="input-row">
              <label for="equity">Equity:</label>
              <input type="text" v-model="group.equity" id="equity">
            </div>
            <div class="input-row">
              <label for="banks">Banks:</label>
              <input type="text" v-model="group.banks" id="banks">
            </div>
            <div class="input-row">
              <label for="realEstate">Real Estate:</label>
              <input type="text" v-model="group.realEstate" id="realEstate">
            </div>
            <div class="input-row">
              <label for="bankAccount">Bank A/c:</label>
              <input type="text" v-model="group.bankAccount" id="bankAccount">
            </div>
          </div>
        </div>
      </div>
    </div>
    <button @click="addGroup" class="add-group-btn">Add Group</button>
    <button @click="goToNextPage" class="go-btn">Go</button>
  </div>
</template>

<script>
export default {
  name: 'StartPage',
  data() {
    return {
      groups: []
    };
  },
  methods: {
    addGroup() {
      const groupName = prompt("Enter group name:");
      if (groupName) {
        this.groups.push({
          name: groupName,
          equity: '',
          banks: '',
          realEstate: '',
          bankAccount: ''
        });
      }
    },
    editGroupName(index) {
      const newName = prompt("Enter new group name:", this.groups[index].name);
      if (newName && newName.trim() !== '') {
        this.groups[index].name = newName.trim();
      }
    },
    goToNextPage() {
      console.log('Navigating to SecondPage...');
      this.$router.push({ name: 'SecondPage' });
    }
  }
};
</script>

<style scoped>
h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #FF0000; /* Red color */
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

.add-group-btn {
  background-color: #FF0000; /* Red button */
  color: #FFFFFF; /* White text color */
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-group-btn:hover {
  background-color: #990000; /* Darker red on hover */
}

.edit-group-btn {
  background-color: transparent;
  border: none;
  color: #FFFFFF; /* White text color */
  font-size: 1em;
  cursor: pointer;
}

.edit-group-btn:hover {
  color: #FF0000; /* Red color on hover */
}

.go-btn {
  background-color: #FF0000; /* Red button */
  color: #FFFFFF; /* White text color */
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px; /* Add margin between buttons */
  transition: background-color 0.3s;
}

.go-btn:hover {
  background-color: #990000; /* Darker red on hover */
}
</style>
