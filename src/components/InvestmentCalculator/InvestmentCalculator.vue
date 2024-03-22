<template>
    <div
      class="investment-calculator"
      :style="{ top: top + 'px', left: left + 'px', zIndex: zIndex }"
      @mousedown="startDragging"
      @mouseup="stopDragging"
      @mousemove="dragging ? handleDrag : null"
    >
      <!-- Draggable handle -->
      <div class="drag-handle" @mousedown.stop="startDragging">
        <i class="fas fa-arrows-alt"></i>
      </div>
      <h2>Investment Calculator</h2>
      <div class="input-group">
        <label for="initialInvestment">Initial Investment:</label>
        <input type="number" id="initialInvestment" v-model="initialInvestment" class="calculator-input">
      </div>
      <div class="input-group">
        <label for="monthlyContribution">Monthly Contribution:</label>
        <input type="number" id="monthlyContribution" v-model="monthlyContribution" class="calculator-input">
      </div>
      <div class="input-group">
        <label for="investmentPeriod">Investment Period (years):</label>
        <input type="number" id="investmentPeriod" v-model="investmentPeriod" class="calculator-input">
      </div>
      <div class="input-group">
        <label for="annualReturnRate">Expected Annual Return Rate (%):</label>
        <input type="number" id="annualReturnRate" v-model="annualReturnRate" class="calculator-input">
      </div>
      <button @click="calculate" class="calculate-button">Calculate</button>
      <div class="result" v-if="futureValue !== null">
        <p>Future Value of Investments: {{ futureValue }}</p>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'InvestmentCalculator',
    data() {
      return {
        dragging: false,
        initialX: 0,
        initialY: 0,
        top: 100, // Initial top position
        left: 100, // Initial left position
        zIndex: 1, // Initial z-index
        initialInvestment: null,
        monthlyContribution: null,
        investmentPeriod: null,
        annualReturnRate: null,
        futureValue: null
      };
    },
    methods: {
      startDragging(event) {
        this.dragging = true;
        this.initialX = event.clientX - this.left;
        this.initialY = event.clientY - this.top;
        this.zIndex = 9999; // Bring the calculator to the front
      },
      stopDragging() {
        this.dragging = false;
      },
      handleDrag(event) {
        if (this.dragging) {
          this.left = event.clientX - this.initialX;
          this.top = event.clientY - this.initialY;
        }
      },
      calculate() {
        const principal = parseFloat(this.initialInvestment);
        const monthlyContribution = parseFloat(this.monthlyContribution);
        const years = parseInt(this.investmentPeriod);
        const rate = parseFloat(this.annualReturnRate) / 100;
  
        const n = 12; // Compounded monthly
        const t = years;
        const r = rate / n;
        const futureValue = principal * Math.pow(1 + r, n * t) +
                            monthlyContribution * (((Math.pow(1 + r, n * t) - 1) / r) * (1 + r));
  
        this.futureValue = futureValue.toFixed(2);
      }
    }
  };
  </script>
  
  <style scoped>
  .investment-calculator {
    position: absolute;
    background-color: black;
    color: red;
    border: 2px solid red;
    border-radius: 10px;
    padding: 20px;
    cursor: move;
    font-family: Arial, sans-serif;
  }
  
  .drag-handle {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 20px;
    cursor: move;
    text-align: center;
  }
  
  .drag-handle i {
    color: red;
  }
  
  .input-group {
    margin-bottom: 15px;
  }
  
  label {
    display: inline-block;
    width: 200px;
    color: red;
  }
  
  .calculator-input {
    width: 150px;
    padding: 5px;
    border-radius: 5px;
  }
  
  .calculate-button {
    padding: 10px 20px;
    background-color: red;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  
  .result {
    margin-top: 20px;
    font-weight: bold;
    color: red;
  }
  </style>
  