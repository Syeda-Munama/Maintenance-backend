const express = require("express");
const router = express.Router();
const db = require("../config/db.cjs"); // Assuming a db.cjs file that handles DB connection
const { body, validationResult } = require("express-validator");

// Route to handle Breakdown Log creation and parts usage
router.post(
  "/",
  [
    body("date").not().isEmpty().withMessage("Date is required"),
    body("department").not().isEmpty().withMessage("Department is required"),
    body("machineNo").not().isEmpty().withMessage("Machine number is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      date,
      department,
      operatorName,
      machineNo,
      faultDescription,
      faultTime,
      startTime,
      endTime,
      repairTime,
      breakdownTime,
      partDetails = [], // Ensure partDetails is an array or defaults to an empty array
      remarks,
    } = req.body;

    // Convert date to the format YYYY-MM-DD
    const formattedDate = formatDate(date);

    try {
      // Start a transaction
      await db.promise().query('START TRANSACTION');

      // Insert into Breakdown_Log table
      const [breakdownLogResult] = await db.promise().query(
        `
        INSERT INTO Breakdown_Log (
          date, department, operator_name, machine_no, fault_description, 
          fault_time, start_time, end_time, repair_time, breakdown_time, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          formattedDate, // Use the formatted date
          department,
          operatorName,
          machineNo,
          faultDescription,
          faultTime,
          startTime,
          endTime,
          repairTime,
          breakdownTime,
          remarks,
        ]
      );

      const logId = breakdownLogResult.insertId; // Retrieve the new log_id

      // Insert parts used for this breakdown log (if any)
      if (Array.isArray(partDetails) && partDetails.length > 0) {
        for (const part of partDetails) {
          const { partCode, partName, quantity, issuedTo, issuedBy, partStatus } = part;

          // Insert part usage into Parts_Used table
          await db.promise().query(
            `
            INSERT INTO Parts_Used (
              log_id, part_code, part_name, quantity, issued_to, issued_by, part_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
            [logId, partCode, partName, quantity, issuedTo, issuedBy, partStatus]
          );

          // Subtract the quantity from the Parts table (open_balance)
          if (partStatus === "Replaced" && quantity > 0) {
            await db.promise().query(
              `
              UPDATE Parts 
              SET open_balance = open_balance - ?
              WHERE part_code = ?
            `,
              [quantity, partCode]
            );
          }
        }
      }

      // Commit transaction
      await db.promise().query('COMMIT');

      return res.json({ message: "Breakdown log and parts details saved successfully" });
    } catch (error) {
      // Rollback in case of any error
      await db.promise().query('ROLLBACK');
      console.error("Error saving breakdown log:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Utility function to format dates as YYYY-MM-DD
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


// Route to fetch all breakdown logs
router.get("/", async (req, res) => {
  const { department, machineNo, startDate, endDate } = req.query;

  // SQL query with optional filters
  let sql = `
    SELECT * FROM Breakdown_Log
    WHERE 1=1
  `;

  const queryParams = [];

  // Apply filters if provided
  if (department) {
    sql += " AND department = ?";
    queryParams.push(department);
  }
  if (machineNo) {
    sql += " AND machine_no = ?";
    queryParams.push(machineNo);
  }
  if (startDate && endDate) {
    sql += " AND date BETWEEN ? AND ?";
    queryParams.push(startDate, endDate);
  }

  try {
    const [results] = await db.promise().query(sql, queryParams);
    res.json(results);
  } catch (error) {
    console.error("Error fetching breakdown logs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to fetch breakdown log by ID along with used parts
router.get("/:log_id", async (req, res) => {
  const { log_id } = req.params;

  try {
    // Fetch the breakdown log by its ID
    const [breakdownLogResult] = await db.promise().query(
      `SELECT * FROM Breakdown_Log WHERE log_id = ?`,
      [log_id]
    );

    if (breakdownLogResult.length === 0) {
      return res.status(404).json({ message: "Breakdown log not found" });
    }

    const breakdownLog = breakdownLogResult[0];

    // Fetch the parts used in this breakdown log
    const [partsUsedResult] = await db.promise().query(
      `SELECT * FROM Parts_Used WHERE log_id = ?`,
      [log_id]
    );

    return res.json({
      breakdownLog,
      partsUsed: partsUsedResult,
    });
  } catch (error) {
    console.error("Error fetching breakdown log or parts used:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;






