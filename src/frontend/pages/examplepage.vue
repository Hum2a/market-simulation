<template>
    <div class="dashboard">
    <header class="header">
        <div class="logo">LOGO</div>
        <div class="settings-icon">⚙️</div>
    </header>
    
    <main class="main-content">
        <h1>Group Management</h1>
        
        <section class="group-cards">
            <!-- Repeat this section for each group -->
            <div class="group-card">
                <header class="group-card-header">
                    <h2>Group 01</h2>
                    <div class="group-card-controls">
                        <button>✏️</button>
                        <button>❌</button>
                    </div>
                </header>
                <ul class="group-details">
                    <li>Equity: 1099</li>
                    <!-- Other items -->
                </ul>
                <button class="generate-button">Generate Random Values</button>
                <figure class="chart-container">
                    <!-- Pie chart here -->
                </figure>
            </div>
            <!-- ... -->
        </section>
        
        <footer class="footer">
            <button class="simulation-button">Go to Simulation</button>
        </footer>
    </main>
    
    <aside class="sidebar">
        <button class="add-group-button">Add Group</button>
    </aside>
</div>

</template>

<script>

export default {
    name: 'examplePage'
}
</script>

<style scoped>
.dashboard {
    display: grid;
    grid-template-columns: auto 200px; /* Main content and sidebar */
    grid-template-rows: auto 1fr auto; /* Header, content, footer */
    height: 100vh;
}

.header {
    grid-column: 1 / -1; /* Full width */
    display: flex;
    justify-content: space-between;
    padding: 1em;
    background-color: #0D1A26;
}

.main-content {
    padding: 2em;
    background-color: #F5F7FA;
}

.group-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); /* Responsive card layout */
    gap: 1em;
}

.group-card {
    background-color: #FFFFFF;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 1em;
}

.group-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.group-details {
    list-style: none;
    padding: 0;
    margin: 1em 0;
}

.generate-button {
    background-color: #4C68D7;
    color: #FFFFFF;
    border: none;
    border-radius: 5px;
    padding: 0.5em 1em;
    margin-bottom: 1em;
}

.chart-container {
    /* Placeholder for chart library output */
}

.footer {
    grid-column: 1 / -1;
    padding: 1em;
    display: flex;
    justify-content: center;
    background-color: #0D1A26;
}

.sidebar {
    background-color: #342D7E;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1em;
}

.add-group-button {
    background-color: #F472B6;
    color: #FFFFFF;
    border: none;
    border-radius: 5px;
    padding: 0.5em 1em;
}

</style>