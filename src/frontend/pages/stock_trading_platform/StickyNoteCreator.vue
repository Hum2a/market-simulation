<template>
    <div class="sticky-note-creator">
      <header class="header">
        <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
        <nav class="header-links">
          <router-link to="/admin-dashboard" class="nav-link">Admin Dashboard</router-link>
          <router-link to="/" class="nav-link">Home</router-link>
        </nav>
      </header>
      <main class="main-content">
        <h1>{{ editingNoteId ? 'Edit Sticky Note' : 'Create Sticky Note' }}</h1>
        <div class="form-container">
          <div class="note-content-card">
            <h2>Note Content</h2>
            <form @submit.prevent="createOrUpdateStickyNote">
              <div class="form-group">
                <label for="note-title">Note Title:</label>
                <input type="text" id="note-title" v-model="noteTitle" required />
              </div>
              <div class="form-group">
                <label for="note-content">Note Content:</label>
                <textarea id="note-content" v-model="noteContent" required></textarea>
              </div>
              <button type="submit">{{ editingNoteId ? 'Update Note' : 'Create Note' }}</button>
            </form>
          </div>
          <div class="options-card">
            <h2>Options</h2>
            <form>
              <div class="form-group">
                <label for="show-for-all">Show for All Users:</label>
                <input type="checkbox" id="show-for-all" v-model="showForAllUsers" />
              </div>
              <div class="form-group">
                <label for="users">Show for Specific Users:</label>
                <div class="user-buttons">
                  <button
                    v-for="user in users"
                    :key="user.uid"
                    :class="{'selected': selectedUsers.includes(user.uid)}"
                    @click.prevent="toggleUserSelection(user.uid)"
                  >
                    {{ user.firstName|| user.email }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label for="stocks">Show for Specific Stocks:</label>
                <div class="stock-buttons">
                  <button
                    v-for="stock in stocks"
                    :key="stock.symbol"
                    :class="{'selected': selectedStocks.includes(stock.symbol)}"
                    @click.prevent="toggleStockSelection(stock.symbol)"
                  >
                    {{ stock.name }}
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label for="portfolio-value">Show if Portfolio Value is Above:</label>
                <input type="number" id="portfolio-value" v-model.number="portfolioValueThreshold" />
              </div>
            </form>
          </div>
        </div>
        <div class="position-selector-card">
          <h2>Sticky Note Position</h2>
          <div class="position-selector" ref="positionSelector">
            <div
              class="sticky-note-box"
              :style="{ left: `${stickyNotePosition.x}%`, top: `${stickyNotePosition.y}%` }"
              @mousedown="startDrag"
            ></div>
          </div>
        </div>
        <div class="existing-notes">
          <h2>Existing Notes</h2>
          <ul>
            <li v-for="note in existingNotes" :key="note.id">
              <span @click="selectNoteForEditing(note)">{{ note.title }}</span>
              <button @click="deleteNote(note.id)">Delete</button>
            </li>
          </ul>
        </div>
      </main>
    </div>
  </template>
  
  <script>
  import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc, serverTimestamp } from 'firebase/firestore';
  
  export default {
    name: 'StickyNoteCreator',
    data() {
      return {
        noteTitle: '',
        noteContent: '',
        showForAllUsers: false,
        selectedUsers: [],
        selectedStocks: [],
        portfolioValueThreshold: null,
        editingNoteId: null,
        existingNotes: [],
        users: [],
        stocks: [
          { name: 'AbbVie', symbol: 'ABBV' },
          { name: 'Activision Blizzard', symbol: 'ATVI' },
          { name: 'Adobe', symbol: 'ADBE' },
          { name: 'Amazon', symbol: 'AMZN' },
          { name: 'American Tower Corporation', symbol: 'AMT' },
          { name: 'Apple', symbol: 'AAPL' },
          { name: 'Astra Zeneca', symbol: 'AZN' },
          { name: 'AT&T', symbol: 'T' },
          { name: 'Axon Enterprise', symbol: 'AXON' },
          { name: 'Barclays', symbol: 'BCS' },
          { name: 'Berkshire Hathaway', symbol: 'BRK.B' },
          { name: 'Blackrock', symbol: 'BLK' },
          { name: 'Boeing', symbol: 'BA' },
          { name: 'BP', symbol: 'BP' },
          { name: 'BYD', symbol: 'BYDDY' },
          { name: 'Cisco', symbol: 'CSCO' },
          { name: 'Coca-Cola', symbol: 'KO' },
          { name: 'Comcast', symbol: 'CMCSA' },
          { name: 'Costco', symbol: 'COST' },
          { name: 'Curries', symbol: 'DC.L' },
          { name: 'Disney', symbol: 'DIS' },
          { name: 'EA', symbol: 'EA' },
          { name: 'ExxonMobil', symbol: 'XOM' },
          { name: 'Goldman Sachs', symbol: 'GS' },
          { name: 'Google', symbol: 'GOOGL' },
          { name: 'Home Depot', symbol: 'HD' },
          { name: 'IBM', symbol: 'IBM' },
          { name: 'Intel', symbol: 'INTC' },
          { name: 'Johnson & Johnson', symbol: 'JNJ' },
          { name: 'JPMorgan Chase', symbol: 'JPM' },
          { name: 'LG', symbol: '066570.KS' },
          { name: 'Lockheed Martin', symbol: 'LMT' },
          { name: 'Man United', symbol: 'MANU' },
          { name: 'Mastercard', symbol: 'MA' },
          { name: 'Meta', symbol: 'META' },
          { name: 'Microsoft', symbol: 'MSFT' },
          { name: 'Netflix', symbol: 'NFLX' },
          { name: 'NIO', symbol: 'NIO' },
          { name: 'Nike', symbol: 'NKE' },
          { name: 'NVIDIA', symbol: 'NVDA' },
          { name: 'Open AI', symbol: 'Not Listed' },
          { name: 'Pandora', symbol: 'P' },
          { name: 'PayPal', symbol: 'PYPL' },
          { name: 'Pfizer', symbol: 'PFE' },
          { name: 'PepsiCo', symbol: 'PEP' },
          { name: 'Procter & Gamble', symbol: 'PG' },
          { name: 'Roblox', symbol: 'RBLX' },
          { name: 'Rolls Royce', symbol: 'RR.L' },
          { name: 'Shell', symbol: 'SHEL' },
          { name: 'Spotify', symbol: 'SPOT' },
          { name: 'Tesla', symbol: 'TSLA' },
          { name: 'Tesco', symbol: 'TSCO.L' },
          { name: 'UnitedHealth', symbol: 'UNH' },
          { name: 'Verizon', symbol: 'VZ' },
          { name: 'Visa', symbol: 'V' },
          { name: 'Walmart', symbol: 'WMT' }
        ],
        stickyNotePosition: { x: 0, y: 0 },
        isDragging: false,
      };
    },
    async created() {
      await this.fetchExistingNotes();
      await this.fetchUsers();
    },
    methods: {
      async fetchExistingNotes() {
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, 'Sticky Notes'));
        this.existingNotes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      },
      async fetchUsers() {
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, 'Users'));
        this.users = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      },
      async createOrUpdateStickyNote() {
        const db = getFirestore();
        const note = {
          title: this.noteTitle,
          content: this.noteContent,
          showForAllUsers: this.showForAllUsers,
          selectedUsers: this.selectedUsers,
          selectedStocks: this.selectedStocks,
          portfolioValueThreshold: this.portfolioValueThreshold,
          position: this.stickyNotePosition,
          createdAt: serverTimestamp(),
        };
        try {
          await setDoc(doc(db, 'Sticky Notes', this.noteTitle), note);
          await this.fetchExistingNotes(); // Refresh the list of existing         notes
        this.resetForm();
      } catch (error) {
        console.error('Error creating or updating sticky note:', error);
      }
    },
    selectNoteForEditing(note) {
      this.noteTitle = note.title;
      this.noteContent = note.content;
      this.showForAllUsers = note.showForAllUsers;
      this.selectedUsers = note.selectedUsers || [];
      this.selectedStocks = note.selectedStocks;
      this.portfolioValueThreshold = note.portfolioValueThreshold;
      this.stickyNotePosition = note.position || { x: 0, y: 0 };
      this.editingNoteId = note.id;
    },
    async deleteNote(noteId) {
      const db = getFirestore();
      try {
        await deleteDoc(doc(db, 'Sticky Notes', noteId));
        await this.fetchExistingNotes(); // Refresh the list of existing notes
      } catch (error) {
        console.error('Error deleting sticky note:', error);
      }
    },
    toggleUserSelection(userId) {
      const index = this.selectedUsers.indexOf(userId);
      if (index > -1) {
        this.selectedUsers.splice(index, 1);
      } else {
        this.selectedUsers.push(userId);
      }
    },
    toggleStockSelection(stock) {
      const index = this.selectedStocks.indexOf(stock);
      if (index > -1) {
        this.selectedStocks.splice(index, 1);
      } else {
        this.selectedStocks.push(stock);
      }
    },
    resetForm() {
      this.noteTitle = '';
      this.noteContent = '';
      this.showForAllUsers = false;
      this.selectedUsers = [];
      this.selectedStocks = [];
      this.portfolioValueThreshold = null;
      this.stickyNotePosition = { x: 0, y: 0 };
      this.editingNoteId = null;
    },
    startDrag(event) {
      this.isDragging = true;
      const container = this.$refs.positionSelector.getBoundingClientRect();
      this.initialX = event.clientX - (this.stickyNotePosition.x / 100) * container.width;
      this.initialY = event.clientY - (this.stickyNotePosition.y / 100) * container.height;
      document.addEventListener('mousemove', this.drag);
      document.addEventListener('mouseup', this.stopDrag);
    },
    drag(event) {
      if (this.isDragging) {
        const container = this.$refs.positionSelector.getBoundingClientRect();
        const x = event.clientX - this.initialX;
        const y = event.clientY - this.initialY;
        this.stickyNotePosition.x = Math.min(Math.max((x / container.width) * 100, 0), 100);
        this.stickyNotePosition.y = Math.min(Math.max((y / container.height) * 100, 0), 100);
      }
    },
    stopDrag() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.drag);
      document.removeEventListener('mouseup', this.stopDrag);
    }
  }
};
</script>

<style scoped>
.sticky-note-creator {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f0f2f5;
  height: 100vh;
  padding: 0;
  margin: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.2em;
  background-color: #102454;
  border-bottom-right-radius: 25px;
  border-bottom-left-radius: 25px;
  width: 100%;
  margin: 0 auto;
}

.logo {
  width: 150px;
  display: block;
  margin-left: 0;
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
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: #0d1b3f;
}

.main-content {
  width: 100%;
  max-width: 1200px;
  margin: 2em auto;
  text-align: center;
  padding: 1em;
}

.form-container {
  display: flex;
  gap: 2em;
}

.note-content-card,
.options-card {
  flex: 1;
  background: #fff;
  padding: 1em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.note-content-card h2,
.options-card h2 {
  color: #102454;
  margin-bottom: 1em;
}

.form-group {
  margin-bottom: 1em;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.5em;
  color: #102454;
}

textarea,
input,
select {
  width: 100%;
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 5px;
}

textarea#note-content {
  height: 150px; /* Custom height for the note content textarea */
}

button {
  background-color: #102454;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0d1b3f;
}

.stock-buttons, .user-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
}

.stock-buttons button, .user-buttons button {
  background-color: transparent;
  border: 1px solid #102454;
  color: #102454;
  padding: 0.5em;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.stock-buttons button.selected, .user-buttons button.selected {
  background-color: #f0e5d8;
  color: #102454;
}

.stock-buttons button:hover, .user-buttons button:hover {
  background-color: #0d1b3f;
  color: #fff;
}

.position-selector-card {
  margin-top: 2em;
  background: #fff;
  padding: 1em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.position-selector {
  width: 300px;
  height: 200px;
  border: 1px solid #ccc;
  position: relative;
  margin: 0 auto;
}

.sticky-note-box {
  width: 50px;
  height: 50px;
  background-color: #ffeb3b;
  border: 1px solid #ccc;
  position: absolute;
  cursor: move;
}

.existing-notes {
  margin-top: 2em;
}

.existing-notes ul {
  list-style-type: none;
  padding: 0;
}

.existing-notes li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  margin-bottom: 0.5em;
  padding: 0.5em;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.existing-notes li span {
  cursor: pointer;
  flex-grow: 1;
}

.existing-notes li button {
  margin-left: 1em;
  background-color: #e74c3c;
}

.existing-notes li button:hover {
  background-color: #c0392b;
}
</style>

  