const express = require("express");

const schedulerControllers = require("../Controllers/scheduler.controllers");

const router = express.Router();

// event management
// payload with event json and jwt payload
<<<<<<< Updated upstream
router.post("/event", schedulerControllers.schedulerNewEvent);
router.delete("/event", schedulerControllers.schedulerRemoveEvent);
router.put("/event", schedulerControllers.schedulerUpdateEvent);
=======
router.get("/events", schedulerControllers.schedulerGetEvents);
router.post("/events", schedulerControllers.schedulerNewEvents);
router.delete("/events", schedulerControllers.schedulerRemoveEvents);
router.put("/events", schedulerControllers.schedulerUpdateEvents);

router.post("/createPlan", schedulerControllers.schedulerCreatePlan);
>>>>>>> Stashed changes

module.exports = router;
