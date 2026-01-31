const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

router.get('/items', publicController.getItemsByIds);

module.exports = router;
