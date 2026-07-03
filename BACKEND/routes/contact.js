const express = require("express");
const { submitSupportTicket } = require("../controllers/contactController");

const router = express.Router();

router.post("/support", submitSupportTicket);

module.exports = router;
