
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const preventiveMaintenanceRoutes = require('./routes/preventiveMaintenance.cjs');
// const inventoryRoutes = require('./routes/inventory.cjs'); // New inventory routes
const partsRoutes = require('./routes/parts.cjs');
const inventoryRoutes = require('./routes/inventory.cjs');
const summaryRoutes = require('./routes/yearly_summary.cjs');
const breakdownRoutes =require('./routes/breakdown.cjs')
const getinventory = require('./routes/fetchInventory.cjs')



const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/maintenance', preventiveMaintenanceRoutes);
// app.use('/api/inventory', inventoryRoutes);  // Integrate the new inventory routes
app.use('/api/parts', partsRoutes);          // All routes for parts
app.use('/api/inventory', inventoryRoutes);  // All routes for inventory
app.use('/api/yearly-summary', summaryRoutes);      // All routes for summary
app.use('/api/breakdown-log', breakdownRoutes);
app.use('/api/get-inventory', getinventory);
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

