const express = require("express");

const adminControllers = require("../Controllers/admin.controllers");

const router = express.Router();

// registeration, username and password in payload
router.post("/register", adminControllers.adminRegister);
router.post("/login", adminControllers.adminLogin);

module.exports = router;
