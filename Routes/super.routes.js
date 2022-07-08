const express = require("express");

const superController = require("../Controllers/super.controllers");

const router = express.Router();

// registeration, username and password in payload
router.post("/dbExec", superController.superDbExec);

module.exports = router;
