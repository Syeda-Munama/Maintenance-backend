
const express = require('express');
const router = express.Router();
const db = require('../config/db.cjs');

// Add a new monthly inventory record (without "used")
router.post('/', (req, res) => {
  const { part_id, month, year, bought, stock } = req.body;
  const sql = `INSERT INTO Monthly_Inventory (part_id, month, year, bought, stock) 
               VALUES (?, ?, ?, ?, ?)`;
  
  db.query(sql, [part_id, month, year, bought, stock], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    res.json({ message: 'Monthly inventory record added successfully', transactionId: result.insertId });
  });
});

module.exports = router;

