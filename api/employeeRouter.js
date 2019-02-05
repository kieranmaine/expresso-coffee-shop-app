const express = require("express");
const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const employeeRouter = express.Router();

const validateFields = (req, res, next) => {
  const employee = req.body.employee;

  if (!employee.name || !employee.position || !employee.wage) {
    res.status(400).send();    
  } else {
    req.employee = employee;
    next();
  }
};

const getEmployeeById = (id, callback) => {
  db.get("SELECT * FROM employee WHERE id = $id", { $id: id }, callback);
};

employeeRouter.param("id", (req, res, next, id) => {
  getEmployeeById(id, (err, row) => {
    if (row) {
      req.employeeId = id;
      req.employee = row;
      next();
    } else {
      res.status(404).send();
    }
  });
});

employeeRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM employee WHERE is_current_employee = 1", (err, rows) => {
    res.send({ employees: rows });
  })
});

employeeRouter.get("/:id", (req, res, next) => {
  res.send({ employee: req.employee });  
});

employeeRouter.post("/", validateFields, (req, res, next) => {
  const employee = req.employee;

  db.run(
    "INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)",
    { $name: employee.name, $position: employee.position, $wage: employee.wage },
    function(error) {
      getEmployeeById(this.lastID, (error, row) => {
        res.status(201).send({ employee: row });
      });
    });
});

employeeRouter.put("/:id", validateFields, (req, res, next) => {
  const employee = req.employee;

  db.run(
    "UPDATE Employee SET name = $name, position = $position, wage = $wage WHERE id = $id",
    { $id: req.employeeId, $name: employee.name, $position: employee.position, $wage: employee.wage },
    (error) => {
      getEmployeeById(req.employeeId, (error, row) => {
        res.status(200).send({ employee: row });
      });
    });
});    

employeeRouter.delete("/:id", (req, res) => {
  db.run(
    "UPDATE Employee SET is_current_employee = 0 WHERE id = $id",
    { $id: req.employeeId },
    (error) => {
      getEmployeeById(req.employeeId, (error, row) => {
        res.status(200).send({ employee: row });
      });
    });
});

module.exports = employeeRouter;