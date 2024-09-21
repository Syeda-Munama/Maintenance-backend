
// const express = require('express');
// // import express from 'express';
// const router = express.Router();
// const db = require('../config/db.cjs');
// const moment = require('moment');

// // Route to handle Preventive Maintenance Log form submission
// router.post('/submit-log', (req, res) => {
//     const {
//         department,
//         operator_name,
//         machine_no,
//         maintenance_type,
//         schedule_date,
//         start_date_time,
//         end_date_time,
//         total_time,
//         pms_package,
//         issued_to,
//         issued_by,
//         remarks,
//     } = req.body;

//     const formattedScheduleDate = moment(schedule_date, "D-MMM-YYYY").format("YYYY-MM-DD");

//     const sql = `
//       INSERT INTO Preventive_Maintenance_Log (
//         department, 
//         operator_name, 
//         machine_no, 
//         maintenance_type, 
//         schedule_date, 
//         start_date_time, 
//         end_date_time, 
//         total_time, 
//         pms_package, 
//         issued_to, 
//         issued_by, 
//         remarks
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//     db.query(
//         sql,
//         [
//             department,
//             operator_name,
//             machine_no,
//             maintenance_type,
//             formattedScheduleDate, 
//             start_date_time,
//             end_date_time,
//             total_time,
//             pms_package,
//             issued_to,
//             issued_by,
//             remarks,
//         ],
//         (err, result) => {
//             if (err) {
//                 console.error("Error inserting data:", err);
//                 res.status(500).json({ error: "Failed to submit data" });
//             } else {
//                 console.log("Data inserted successfully:", result);
//                 res.json({ success: true });
//             }
//         }
//     );
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../config/db.cjs');
const moment = require('moment');

// Route to handle Preventive Maintenance Log form submission with Parts Used
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
        partsUsed // New field to handle parts used in the maintenance
    } = req.body;

    const formattedScheduleDate = moment(schedule_date, "D-MMM-YYYY").format("YYYY-MM-DD");

    // Insert Preventive Maintenance Log data into the table
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
                const id = result.insertId; // Get the inserted log_id

                // Now handle the parts used
                if (partsUsed && partsUsed.length > 0) {
                    const insertPartsSQL = `
                      INSERT INTO Parts_Used_Maintenance (id, part_code, part_name, quantity) 
                      VALUES ?`;

                    const partValues = partsUsed.map(part => [id, part.partCode, part.partName, part.quantity]);

                    db.query(insertPartsSQL, [partValues], (err, result) => {
                        if (err) {
                            console.error("Error inserting parts used:", err);
                            return res.status(500).json({ error: "Failed to insert parts used" });
                        }

                        // Update open_balance in the Parts table
                        const updatePartBalancePromises = partsUsed.map(part => {
                            return new Promise((resolve, reject) => {
                                const updatePartBalanceSQL = `UPDATE Parts SET open_balance = open_balance - ? WHERE part_code = ?`;
                                db.query(updatePartBalanceSQL, [part.quantity, part.partCode], (err, result) => {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve(result);
                                });
                            });
                        });

                        // Once all part balances are updated
                        Promise.all(updatePartBalancePromises)
                            .then(() => {
                                res.json({ success: true, message: "Preventive Maintenance Log and parts used recorded successfully." });
                            })
                            .catch((err) => {
                                console.error("Error updating part balances:", err);
                                res.status(500).json({ error: "Failed to update part balances" });
                            });
                    });
                } else {
                    // No parts used, return success for maintenance log only
                    res.json({ success: true, message: "Preventive Maintenance Log recorded successfully without parts." });
                }
            }
        }
    );
});

module.exports = router;