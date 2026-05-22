const express = require("express");
const router = express.Router();
const { analyzeCompetitor } = require("../controllers/analyzeController.js");

router.post("/", analyzeCompetitor);

module.exports = router;