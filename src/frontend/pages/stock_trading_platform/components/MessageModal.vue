<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      <div class="modal-body">
        <p>{{ message }}</p>
      </div>
      <div class="modal-footer">
        <button @click="closeModal">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessageModal',
  props: {
    isVisible: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      default: 'Modal Title'
    },
    message: {
      type: String,
      default: 'Modal message content goes here.'
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  position: relative;
  display: block;
  background: white;
  padding: 1.5em;
  border-radius: 8px;
  width: 30%;
  height: 30%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.5em;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #333;
}

.modal-body {
  margin-top: 1em;
  color: #555;
  line-height: 1.5;
}

.modal-footer {
  margin-top: 1em;
  text-align: right;
}

.modal-footer button {
  background-color: #102454;
  color: #fff;
  padding: 0.5em 1em;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.modal-footer button:hover {
  background-color: #0d1b3f;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
