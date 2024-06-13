const { searchPDFLinks, checkGoogleAPIStatus } = require('../services/googleSearchService');
const { emitLog } = require('../utils/logger');
const debug = require('debug')('app:googleSearchController');

const handleSearchPDFLinks = async (req, res) => {
  const { domain, limit = 10, startDate, endDate } = req.body;
  const io = req.app.get('io');

  try {
    emitLog(io, 'info', `Searching for PDF links on domain: ${domain} with limit: ${limit}.`);
    const searchResults = await searchPDFLinks(domain, limit, startDate, endDate);
    res.json(searchResults);
  } catch (error) {
    debug('Error in handleSearchPDFLinks: %O', error);
    emitLog(io, 'error', `Error in handleSearchPDFLinks: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const handleCheckGoogleAPIStatus = async (req, res) => {
  const io = req.app.get('io');

  try {
    emitLog(io, 'info', 'Checking Google Custom Search API status.');
    const status = await checkGoogleAPIStatus();
    res.json({ status });
  } catch (error) {
    debug('Error in handleCheckGoogleAPIStatus: %O', error);
    emitLog(io, 'error', `Error in handleCheckGoogleAPIStatus: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  handleSearchPDFLinks,
  handleCheckGoogleAPIStatus
};
