const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getPDFProperties, checkPDFServicesAPIStatus } = require('../services/pdfServices');
const { searchPDFLinks, checkGoogleAPIStatus } = require('../services/googleSearch');
const { emitLog } = require('../utils/logger');
const debug = require('debug')('app:pdfController');

const checkPDFProperties = async (req, res) => {
  const { domain, limit = 10 } = req.body;
  const io = req.app.get('io');

  try {
    emitLog(io, 'info', `Starting to check PDF properties for domain: ${domain} with limit: ${limit}.`);
    const pdfLinks = await searchPDFLinks(domain, limit);

    const results = [];
    for (const link of pdfLinks) {
      const pdfUrl = link;
      const fileName = path.basename(pdfUrl);
      const filePath = path.join(__dirname, '../output', fileName);

      try {
        emitLog(io, 'info', `Downloading PDF: ${fileName}`);
        const pdfResponse = await axios.get(pdfUrl, { responseType: 'stream' });
        const writer = fs.createWriteStream(filePath);
        pdfResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        emitLog(io, 'info', `Downloaded PDF: ${fileName}, getting properties.`);
        const pdfProperties = await getPDFProperties(filePath);
        results.push({ pdfUrl, fileName, pdfProperties });
        emitLog(io, 'info', `Processed PDF: ${fileName}`);
      } catch (error) {
        debug('Error processing PDF at %s: %O', pdfUrl, error);
        emitLog(io, 'error', `Error processing PDF at ${pdfUrl}: ${error.message}`);
        results.push({ pdfUrl, fileName, error: 'Failed to process PDF' });
      }
    }
    res.json(results);
  } catch (error) {
    debug('Error in /api/check-pdf-properties: %O', error);
    emitLog(io, 'error', `Error in /api/check-pdf-properties: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const checkAPIStatus = async (io) => {
  try {
    await checkPDFServicesAPIStatus();
    emitLog(io, 'info', 'PDF Services API is available.');
  } catch (error) {
    debug('PDF Services API is unavailable: %O', error);
    emitLog(io, 'error', 'PDF Services API is unavailable.');
  }

  try {
    await checkGoogleAPIStatus();
    emitLog(io, 'info', 'Google Custom Search API is available.');
  } catch (error) {
    debug('Google Custom Search API is unavailable: %O', error);
    emitLog(io, 'error', 'Google Custom Search API is unavailable.');
  }
};

module.exports = {
  checkPDFProperties,
  checkAPIStatus
};
