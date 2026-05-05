// product.routes.js
const express = require("express");
const router = express.Router();
const searchController = require('./search.controller')


router.get("/search", searchController.globalSearch);


module.exports = router;