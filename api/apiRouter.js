const express = require("express");
const apiRouter = express.Router();
const employeeRouter = require("./employeeRouter");


apiRouter.use("/employees", employeeRouter);

module.exports = apiRouter;