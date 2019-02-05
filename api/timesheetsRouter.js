const express = require("express");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const timesheetsRouter = express.Router({ mergeParams: true });

const validateFields = (req, res, next) => {
  const timesheet = req.body.timesheet;

  if (!timesheet.hours || !timesheet.rate || !timesheet.date) {
    res.status(400).send();    
  } else {
    req.timesheet = timesheet;
    next();
  }
};

const getTimesheetById = (id, callback) => {
  db.get("SELECT * FROM Timesheet WHERE id = $id", { $id: id }, callback);
};

timesheetsRouter.param("timesheetId", (req, res, next, id) => {
  getTimesheetById(id, (error, row) => {
    if (row) {
      req.timesheetId = id;
      req.timesheet = row;
      next();
    } else {
      res.status(404).send();
    }
  });
});

timesheetsRouter.get("/", (req, res) => {
  db.all(
    "SELECT * FROM Timesheet WHERE employee_id = $id", 
    { $id: req.employeeId }, 
    (error, rows) => {
      res.send({ timesheets: rows });
    });
});

timesheetsRouter.post("/", validateFields, (req, res) => {
  const timesheet = req.timesheet;

  db.run(
    "INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)",
    { $hours: timesheet.hours, $rate: timesheet.rate, $date: timesheet.date, $employeeId: req.employeeId },
    function(error) {
      if (error) {
        next(error);
        return;
      }
      getTimesheetById(this.lastID, (error, row) => {        
        res.status(201).send({ timesheet: row });
      });      
    });
});

timesheetsRouter.put("/:timesheetId", validateFields, (req, res, next) => {
  const timesheet = req.timesheet;

  db.run(
    "UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date WHERE id = $id",
    { $id: req.timesheetId, $hours: timesheet.hours, $rate: timesheet.rate, $date: timesheet.date },
    function(error) {
      if (error) {
        next(error);
        return;
      }
      getTimesheetById(req.timesheetId, (error, row) => {        
        res.status(200).send({ timesheet: row });
      });      
    });
});

timesheetsRouter.delete("/:timesheetId", (req, res, next) => {
  db.run(
    "DELETE FROM Timesheet WHERE id = $id",
    { $id: req.timesheetId },
    function(error) {
      if (error) {
        next(error);
        return;
      }      
      res.sendStatus(204);
    });
});


module.exports = timesheetsRouter;