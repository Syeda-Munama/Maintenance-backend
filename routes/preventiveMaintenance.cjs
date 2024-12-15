
const express = require('express');
const router = express.Router();
const db = require('../config/db.cjs');
const moment = require('moment');

router.post('/submit-log', (req, res) => {
  const {
      department,
      operator_name,
      machine_no,
      maintenance_type,
      schedule_date,
      start_date_time,
      end_date_time,
      total_time,
      pms_package,
      issued_to,
      issued_by,
      remarks,
      partsUsed,
  } = req.body;

  // Validate machine_no
  if (!machine_no || isNaN(machine_no)) {
      return res.status(400).json({ error: "Invalid or missing machine number." });
  }

  // Validate other fields (add more as needed)
  if (!department || !operator_name || !maintenance_type) {
      return res.status(400).json({ error: "Missing required fields." });
  }

  const formattedScheduleDate = moment(schedule_date, "D-MMM-YYYY").format("YYYY-MM-DD");

  const insertLogSQL = `
    INSERT INTO Preventive_Maintenance_Log (
      department, 
      operator_name, 
      machine_no, 
      maintenance_type, 
      schedule_date, 
      start_date_time, 
      end_date_time, 
      total_time, 
      pms_package, 
      issued_to, 
      issued_by, 
      remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(
      insertLogSQL,
      [
          department,
          operator_name,
          machine_no,
          maintenance_type,
          formattedScheduleDate,
          start_date_time,
          end_date_time,
          total_time,
          pms_package,
          issued_to,
          issued_by,
          remarks,
      ],
      (err, result) => {
          if (err) {
              console.error("Error inserting maintenance log:", err);
              res.status(500).json({ error: "Failed to submit data" });
          } else {
              const id = result.insertId;
              handlePartsUsed(id, partsUsed, res); // Handle parts used logic separately
          }
      }
  );
});

function handlePartsUsed(logId, partsUsed, res) {
  if (partsUsed && partsUsed.length > 0) {
      const insertPartsSQL = `
        INSERT INTO Parts_Used_Maintenance (id, part_code, part_name, quantity) 
        VALUES ?`;
      const partValues = partsUsed.map((part) => [
          logId,
          part.partCode,
          part.partName,
          part.quantity,
      ]);

      db.query(insertPartsSQL, [partValues], (err) => {
          if (err) {
              console.error("Error inserting parts used:", err);
              return res.status(500).json({ error: "Failed to insert parts used" });
          }

          res.json({ success: true, message: "Log and parts recorded successfully." });
      });
  } else {
      res.json({ success: true, message: "Log recorded successfully without parts." });
  }
}


// Route to fetch Preventive Maintenance Log data
router.get('/logs', (req, res) => {
  const fetchLogsSQL = 'SELECT * FROM preventive_maintenance_log';

  db.query(fetchLogsSQL, (err, results) => {
      if (err) {
          console.error("Error fetching Preventive Maintenance Log data:", err);
          return res.status(500).json({ error: "Failed to retrieve data" });
      }
      res.json(results);
  });
});


module.exports = router;
