const express = require('express');
const { checkPDFProperties, checkAPIStatus } = require('./controllers/pdfController');

const router = express.Router();

router.post('/check-pdf-properties', checkPDFProperties);
router.get('/check-api-status', checkAPIStatus);

module.exports = router;
