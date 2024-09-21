const express = require('express');
const router = express.Router();
const db = require('../config/db.cjs');

// Calculate yearly summary for a specific part
router.post('/:part_id/:year', (req, res) => {
  const { part_id, year } = req.params;

  // SQL query to calculate total used and bought for the year
  const sql = `
    SELECT 
      (SELECT SUM(quantity) FROM Parts_Used_Maintenance pum 
       JOIN Preventive_Maintenance_Log pml ON pum.id = pml.id
       WHERE pum.part_code = (SELECT part_code FROM Parts WHERE part_id = ?) 
       AND YEAR(pml.schedule_date) = ?) AS total_used_from_maintenance,
      (SELECT SUM(quantity) FROM Parts_Used pu 
       JOIN Breakdown_Log bl ON pu.log_id = bl.log_id
       WHERE pu.part_code = (SELECT part_code FROM Parts WHERE part_id = ?) 
       AND YEAR(bl.date) = ?) AS total_used_from_breakdown,
      (SELECT SUM(bought) FROM Monthly_Inventory WHERE part_id = ? AND year = ?) AS total_bought
  `;

  db.query(sql, [part_id, year, part_id, year, part_id, year], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const totalUsedFromMaintenance = Number(results[0].total_used_from_maintenance) || 0;
    const totalUsedFromBreakdown = Number(results[0].total_used_from_breakdown) || 0;
    
    // Sum the total used quantities from maintenance and breakdowns
    const totalUsed = totalUsedFromMaintenance + totalUsedFromBreakdown;
    
    const totalBought = Number(results[0].total_bought) || 0;

    // SQL query to insert or update the yearly summary
    const upsertSql = `
      INSERT INTO Yearly_Summary (part_id, year, total_used, total_bought)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      total_used = VALUES(total_used),
      total_bought = VALUES(total_bought)
    `;

    // Corrected here: use totalUsed and totalBought, not total_used
    db.query(upsertSql, [part_id, year, totalUsed, totalBought], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        message: 'Yearly summary updated successfully',
        total_used: totalUsed,
        total_bought: totalBought
      });
    });
  });
});


module.exports = router;


