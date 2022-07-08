const express = require("express");

const googleController = require("../Controllers/google.controllers");

const router = express.Router();

// registeration, username and password in payload
router.get("/authorizeCallback", googleController.googleAuthorizeCallback);
router.post("/authorize", googleController.googleAuthorize);
router.post("/createCalendar", googleController.googleCreateCalendar);
router.get("/getCalendarId", googleController.googleGetCalendarId);
router.post("/syncEvents", googleController.googleSyncEvents);

module.exports = router;
