const axios = require('axios');
const debug = require('debug')('app:googleSearchService');
const { mockPDFLinks } = require('../mockData');

const searchPDFLinks = async (domain, limit) => {
  if (process.env.USE_MOCK_DATA === 'true') {
    debug('Using mock data for PDF links');
    return {
      pdfLinks: mockPDFLinks.slice(0, limit),
      totalResults: mockPDFLinks.length
    };
  }

  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX;
    const query = `site:${domain} filetype:pdf`;

    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: cx,
        q: query,
        num: limit
      }
    });

    const pdfLinks = response.data.items.map(item => item.link);
    const totalResults = response.data.searchInformation.totalResults;

    return {
      pdfLinks,
      totalResults
    };
  } catch (error) {
    debug('Error searching PDF links: %O', error);
    console.error('Error searching PDF links:', error.message);
    throw new Error('Failed to search PDF links');
  }
};

const checkGoogleAPIStatus = async () => {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX;
    const query = 'test';

    await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: cx,
        q: query,
        num: 1
      }
    });

    return 'Google Custom Search API is available.';
  } catch (error) {
    debug('Google Custom Search API is unavailable: %O', error);
    console.error('Google Custom Search API is unavailable:', error.message);
    throw new Error('Google Custom Search API is unavailable.');
  }
};

module.exports = {
  searchPDFLinks,
  checkGoogleAPIStatus
};
