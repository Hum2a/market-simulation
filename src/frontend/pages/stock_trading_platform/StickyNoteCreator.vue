<template>
  <div class="sticky-note-creator">
    <header class="header">
      <img src="../../assets/LifeSmartLogo.png" alt="Logo" class="logo" />
      <nav class="header-links">
        <router-link to="/stock-trading-select" class="nav-link">Admin Dashboard</router-link>
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
            <div class="form-group">
              <label for="note-date">Date:</label>
              <vue-datepicker v-model="noteDate" required></vue-datepicker>
            </div>
            <div class="form-group">
              <label for="note-link-name">Link Name:</label>
              <input type="text" id="note-link-name" v-model="noteLinkName" placeholder="Link Name" />
            </div>
            <div class="form-group">
              <label for="note-links">Links:</label>
              <input type="url" id="note-links" v-model="noteLinks" placeholder="https://example.com" />
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
                  {{ user.firstName || user.email }}
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
      <div class="existing-notes">
        <h2>Existing Notes</h2>
        <div class="notice-board">
          <ul>
            <li v-for="note in existingNotes" :key="note.id" class="sticky-note" @click="selectNoteForEditing(note)">
              <div class="note-header">
                <span>{{ note.title }}</span>
                <button @click.stop="deleteNote(note.id)">Delete</button>
              </div>
              <p>{{ note.content }}</p>
              <p v-if="note.date">Date: {{ formatDate(note.date) }}</p>
              <a v-if="note.links" :href="note.links" target="_blank">{{ note.linkName || note.links }}</a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc, serverTimestamp } from 'firebase/firestore';
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

export default {
  name: 'StickyNoteCreator',
  components: {
    'vue-datepicker': Datepicker
  },
  data() {
    return {
      noteTitle: '',
      noteContent: '',
      noteDate: null,
      noteLinkName: '',
      noteLinks: '',
      showForAllUsers: false,
      selectedUsers: [],
      selectedStocks: [],
      portfolioValueThreshold: null,
      editingNoteId: null,
      existingNotes: [],
      users: [],
      stocks: [
        { name: 'Amazon', symbol: 'AMZN'},
        { name: 'Apple', symbol: 'AAPL'},
        { name: 'Boeing', symbol: 'BA'},
        { name: 'Coca-Cola', symbol: 'KO'},
        { name: 'Disney', symbol: 'DIS'},
        { name: 'Google', symbol: 'GOOGL'},
        { name: 'Mastercard', symbol: 'MA'},
        { name: 'Microsoft', symbol: 'MSFT'},
        { name: 'Nike', symbol: 'NKE'},
        { name: 'NVIDIA', symbol: 'NVDA'},
        { name: 'PayPal', symbol: 'PYPL'},
        { name: 'Pfizer', symbol: 'PFE'},
        { name: 'Roblox', symbol: 'RBLX'},
        { name: 'Shell', symbol: 'SHEL'},
        { name: 'Spotify', symbol: 'SPOT'},
        { name: 'Tesla', symbol: 'TSLA'},
        { name: 'Visa', symbol: 'V'},
        { name: 'Walmart', symbol: 'WMT'}
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
      this.existingNotes.sort((a, b) => b.createdAt - a.createdAt);
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
        date: this.noteDate,
        linkName: this.noteLinkName,
        links: this.noteLinks,
        showForAllUsers: this.showForAllUsers,
        selectedUsers: this.selectedUsers,
        selectedStocks: this.selectedStocks,
        portfolioValueThreshold: this.portfolioValueThreshold,
        position: this.stickyNotePosition,
        createdAt: serverTimestamp(),
      };
      try {
        await setDoc(doc(db, 'Sticky Notes', this.noteTitle), note);
        await this.fetchExistingNotes();
        this.resetForm();
      } catch (error) {
        console.error('Error creating or updating sticky note:', error);
      }
    },
    selectNoteForEditing(note) {
      this.noteTitle = note.title;
      this.noteContent = note.content;
      this.noteDate = note.date;
      this.noteLinkName = note.linkName || '';
      this.noteLinks = note.links;
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
        await this.fetchExistingNotes();
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
      this.noteDate = null;
      this.noteLinkName = '';
      this.noteLinks = '';
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
    },
    formatDate(date) {
      if (date && date.toDate) {
        const dateObj = date.toDate();
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return dateObj.toLocaleDateString(undefined, options);
      }
      return date;
    },
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
  background-color: #ecf0f1;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.main-content h1 {
  font-size: 2.5em;
  color: #2c3e50;
  margin-bottom: 1em;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.form-container {
  display: flex;
  gap: 2em;
}

.note-content-card,
.options-card {
  flex: 1;
  background: #fff;
  padding: 2em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.note-content-card h2,
.options-card h2 {
  color: #102454;
  margin-bottom: 1em;
  text-transform: uppercase;
  font-size: 1.5em;
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
  height: 150px;
}

button {
  background-color: #102454;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

button:hover {
  background-color: #0d1b3f;
  transform: scale(1.05);
}

.stock-buttons,
.user-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
}

.stock-buttons button,
.user-buttons button {
  background-color: #3498db;
  border: 1px solid #102454;
  color: #fff;
  padding: 0.5em;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.stock-buttons button.selected,
.user-buttons button.selected {
  background-color: #f0e5d8;
  color: #102454;
}

.stock-buttons button:hover,
.user-buttons button:hover {
  background-color: #0d1b3f;
  color: #fff;
}

.position-selector-card {
  margin-top: 2em;
  background: #fff;
  padding: 2em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.position-selector {
  width: 300px;
  height: 200px;
  border: 1px solid #ccc;
  position: relative;
  margin: 0 auto;
  background: #ecf0f1;
  border-radius: 5px;
}

.sticky-note-box {
  width: 50px;
  height: 50px;
  background-color: #ffeb3b;
  border: 1px solid #ccc;
  position: absolute;
  cursor: move;
  border-radius: 5px;
}

.existing-notes {
  margin-top: 2em;
}

.notice-board {
  background: #fff;
  padding: 1em;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: 5px solid #8b4513;
  position: relative;
}

.notice-board::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid #8b4513;
  border-radius: 10px;
  pointer-events: none;
}

.notice-board ul {
  list-style-type: none;
  padding: 0;
}

.sticky-note {
  background: #ffeb3b;
  padding: 1em;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 0 10px rgba(0, 0, 0, 0.1);
  font-family: 'Comic Sans MS', cursive, sans-serif;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  white-space: normal;
  overflow-wrap: break-word;
  width: auto;
  height: auto;
  position: relative;
  margin-bottom: 1em;
  transition: transform 0.3s, box-shadow 0.3s;
}

.sticky-note:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.sticky-note:active {
  transform: translateY(0);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 0 10px rgba(0, 0, 0, 0.1);
}

.sticky-note::before {
  content: '';
  width: 40px;
  height: 20px;
  background: pink;
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.sticky-note::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 4px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.note-header span {
  cursor: pointer;
  flex-grow: 1;
  text-align: left;
}

.note-header button {
  margin-left: 1em;
  background-color: #e74c3c;
  color: #fff;
  border: none;
  padding: 0.3em 0.5em;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.note-header button:hover {
  background-color: #c0392b;
  transform: scale(1.05);
}

.note-header button:active {
  transform: scale(0.95);
}

.sticky-note p,
.sticky-note a {
  margin: 0.5em 0 0;
  font-size: 1em;
  color: #333;
}
</style>
