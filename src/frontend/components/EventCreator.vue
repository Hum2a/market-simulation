<template>
    <div class="event-creation-page">
      <h1>Create New Event</h1>
      <form @submit.prevent="saveEvent">
        <div class="input-group">
          <label for="eventName">Event Name:</label>
          <input id="eventName" v-model="newEvent.name" required>
        </div>
        
        <div class="input-group" v-for="asset in assets" :key="asset">
          <label :for="asset">{{ asset }} Impact:</label>
          <select :id="asset" v-model="newEvent.effects[asset]">
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        
        <button type="submit" class="modern-button">Save Event</button>
      </form>
    </div>
  </template>
  
  <script>
export default {
  name: 'EventCreationPage',
  data() {
    return {
      newEvent: {
        name: '',
        effects: {
          Equity: 'neutral',
          Bonds: 'neutral',
          RealEstate: 'neutral',
          BankAccounts: 'neutral',
          Other: 'neutral'
        }
      },
      assets: ['Equity', 'Bonds', 'RealEstate', 'BankAccounts', 'Other']
    };
  },
  methods: {
    saveEvent() {
      // Logic to save the event
      // This could involve adding the event to a list in your Vuex store, local storage, or sending it to a backend API.
      console.log('Event saved:', this.newEvent);
      // Reset form after saving
      this.resetForm();
    },
    resetForm() {
      this.newEvent = {
        name: '',
        effects: {
          Equity: 'neutral',
          Bonds: 'neutral',
          RealEstate: 'neutral',
          BankAccounts: 'neutral',
          Other: 'neutral'
        }
      };
    }
  }
};
</script>
