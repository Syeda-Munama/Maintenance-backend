const express = require('express');
const router = express.Router();
const db = require('../config/db.cjs');

// Combined route to fetch all the necessary data
router.get('/combined-data/:part_id/:year', async (req, res) => {
  const { part_id, year } = req.params;

  try {
    // Fetch parts data
    const [partData] = await db.promise().query('SELECT part_id, part_name, part_code FROM Parts WHERE part_id = ?', [part_id]);
    
    if (!partData.length) {
      return res.status(404).json({ message: "Part not found" });
    }

    // Fetch yearly summary
    const yearlySummarySql = `
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
    const [yearlySummary] = await db.promise().query(yearlySummarySql, [part_id, year, part_id, year, part_id, year]);

    const totalUsedFromMaintenance = Number(yearlySummary[0].total_used_from_maintenance) || 0;
    const totalUsedFromBreakdown = Number(yearlySummary[0].total_used_from_breakdown) || 0;
    const totalUsed = totalUsedFromMaintenance + totalUsedFromBreakdown;
    const totalBought = Number(yearlySummary[0].total_bought) || 0;

    // Fetch monthly inventory data
    const [inventoryData] = await db.promise().query('SELECT * FROM Monthly_Inventory WHERE part_id = ? AND year = ?', [part_id, year]);

    // Combine all the fetched data into one response
    res.json({
      partData: partData[0],
      yearlySummary: {
        totalUsedFromMaintenance,
        totalUsedFromBreakdown,
        totalUsed,
        totalBought
      },
      inventoryData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
