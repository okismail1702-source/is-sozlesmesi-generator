const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');

// POST - Sözleşme oluştur
router.post('/create-contract', contractController.createContract);

// POST - PDF indir
router.post('/download-pdf', contractController.downloadPDF);

module.exports = router;
