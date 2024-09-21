// routes/parts.js
const express = require('express');
const router = express.Router();
const db = require('../config/db.cjs');

// Get all parts
router.get('/', (req, res) => {
  const sql = 'SELECT part_id, part_name, part_code FROM Parts';
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    res.json(results);
  });
});

// Get part details by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT part_code, part_cost, open_balance FROM Parts WHERE part_id = ?';
  
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Part not found' });
    
    res.json(results[0]);
  });
});

router.put('/update-balance/:id', (req, res) => {
  const { id } = req.params;
  const { newOpenBalance } = req.body;

  if (!id || newOpenBalance === undefined) {
    return res.status(400).json({ error: "Invalid input data" });
  }

  const sql = 'UPDATE Parts SET open_balance = ? WHERE part_id = ?';

  db.query(sql, [newOpenBalance, id], (err, result) => {
    if (err) {
      console.error("Database error:", err);  // Log the exact error in the server console
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.json({ message: 'Open balance updated successfully' });
  });
  
  
});
router.get('/code/:part_code', (req, res) => {
  const { part_code } = req.params;
  const sql = 'SELECT part_name FROM parts WHERE part_code = ?';
  
  db.query(sql, [part_code], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: 'Failed to retrieve part details' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Part not found' });
    }

    res.json(results[0]);
  });
});


module.exports = router;




