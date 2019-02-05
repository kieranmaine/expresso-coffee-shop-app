const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cors = require('cors')
const apiRouter = require("./api/apiRouter");

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());
//app.use(morgan("tiny"));
app.use(cors());

app.use(express.static('public'))

app.use("/api", apiRouter);

app.listen(port, () => console.log(`X-Press Publishing App listening on port ${port}!`))

module.exports = app;
