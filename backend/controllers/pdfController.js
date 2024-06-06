const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getPDFProperties, checkPDFServicesAPIStatus } = require('../services/pdfServices');
const { searchPDFLinks, checkGoogleAPIStatus } = require('../services/googleSearch');
const { emitLog } = require('../utils/logger');
const debug = require('debug')('app:pdfController');

const processPDF = async (pdfUrl, fileName, filePath, io) => {
  try {
    if (pdfUrl) {
      emitLog(io, 'info', `Downloading PDF: ${fileName}`);
      const pdfResponse = await axios.get(pdfUrl, { responseType: 'stream' });
      const writer = fs.createWriteStream(filePath);
      pdfResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      emitLog(io, 'info', `Downloaded PDF: ${fileName}, getting properties.`);
    } else {
      emitLog(io, 'info', `Processing uploaded PDF: ${fileName}`);
    }

    const pdfProperties = await getPDFProperties(filePath);
    emitLog(io, 'info', `Processed PDF: ${fileName}`);
    return { pdfUrl, fileName, pdfProperties };
  } catch (error) {
    debug('Error processing PDF at %s: %O', pdfUrl || fileName, error);
    emitLog(io, 'error', `Error processing PDF at ${pdfUrl || fileName}: ${error.message}`);
    return { pdfUrl, fileName, error: 'Failed to process PDF' };
  }
};

const checkPDFProperties = async (req, res) => {
  const { domain, limit = 10 } = req.body;
  const io = req.app.get('io');

  try {
    emitLog(io, 'info', `Starting to check PDF properties for domain: ${domain} with limit: ${limit}.`);
    const searchResults = await searchPDFLinks(domain, limit);
    const pdfLinks = searchResults.pdfLinks;
    const totalResults = searchResults.totalResults;

    const results = await Promise.all(pdfLinks.map(async (link) => {
      const fileName = path.basename(link);
      const filePath = path.join(__dirname, '../output', fileName);
      return await processPDF(link, fileName, filePath, io);
    }));

    res.json({ totalResults, documents: results });
  } catch (error) {
    debug('Error in /api/check-pdf-properties: %O', error);
    emitLog(io, 'error', `Error in /api/check-pdf-properties: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const uploadPDFProperties = async (req, res) => {
  const io = req.app.get('io');
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  try {
    const results = await Promise.all(files.map(async (file) => {
      const filePath = file.path;
      const fileName = file.originalname;
      return await processPDF(null, fileName, filePath, io);
    }));

    res.json(results);
  } catch (error) {
    debug('Error in /api/upload-pdf-properties: %O', error);
    emitLog(io, 'error', `Error in /api/upload-pdf-properties: ${error.message}`);
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
  uploadPDFProperties,
  checkAPIStatus
};
