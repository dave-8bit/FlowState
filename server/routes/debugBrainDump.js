const express = require("express");

const router = express.Router();

router.post("/", (req, res) => {
  // This endpoint exists only to determine whether routing is reaching brain-dump at all.
  return res.json({ ok: true, body: req.body });
});

module.exports = router;

