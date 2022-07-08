const express = require("express");

const socialController = require("../Controllers/social.controllers");
const router = express.Router();

// add or remove friend
// social/99/friend/44
router.post("/friend", socialController.newFriend);
router.delete("/friend", socialController.removeFriend);

// get social profile, including all badges
// social/99
router.get("/me", socialController.getProfile);

module.exports = router;
