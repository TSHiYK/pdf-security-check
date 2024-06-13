const express = require('express');
const multer = require('multer');
const router = express.Router();
const { checkPDFProperties, uploadPDFProperties, checkAPIStatus } = require('./controllers/pdfController');

const tmp = multer({ dest: 'tmp/' });

router.post('/check-pdf-properties', checkPDFProperties);
router.post('/upload-pdf-properties', tmp.array('files'), uploadPDFProperties);
router.get('/check-api-status', checkAPIStatus);

module.exports = router;
