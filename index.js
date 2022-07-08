const express = require("express");

const app = express();
const port = 3300;

var cors = require("cors");
app.use(cors({
  credentials: true,
  origin: "http://localhost:3000"
}));

var adminRouter = require("./Routes/admin.routes");
var schedulerRouter = require("./Routes/scheduler.routes");
var socialRouter = require("./Routes/social.routes");

app.use('/admin', adminRouter);
app.use('/social', socialRouter);
app.use('/scheduler', schedulerRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


