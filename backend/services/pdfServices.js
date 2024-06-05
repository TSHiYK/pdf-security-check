const { ServicePrincipalCredentials, PDFServices, MimeType, PDFPropertiesParams, PDFPropertiesJob, PDFPropertiesResult } = require("@adobe/pdfservices-node-sdk");
const fs = require("fs");
const debug = require('debug')('app:pdfServices');

const retryCredentials = [
    {
        clientId: process.env.PDF_SERVICES_CLIENT_ID_1,
        clientSecret: process.env.PDF_SERVICES_CLIENT_SECRET_1
    },
    {
        clientId: process.env.PDF_SERVICES_CLIENT_ID_2,
        clientSecret: process.env.PDF_SERVICES_CLIENT_SECRET_2
    }
];

const getPDFProperties = async (filePath) => {
    for (let credentialsData of retryCredentials) {
        try {
            const credentials = new ServicePrincipalCredentials(credentialsData);
            const pdfServices = new PDFServices({ credentials });

            const readStream = fs.createReadStream(filePath);
            const inputAsset = await pdfServices.upload({
                readStream,
                mimeType: MimeType.PDF
            });

            const params = new PDFPropertiesParams({
                includePageLevelProperties: true
            });

            const job = new PDFPropertiesJob({ inputAsset, params });

            const pollingURL = await pdfServices.submit({ job });
            const pdfServicesResponse = await pdfServices.getJobResult({
                pollingURL,
                resultType: PDFPropertiesResult
            });

            const pdfProperties = pdfServicesResponse.result.getPDFPropertiesJson;
            return pdfProperties;
        } catch (error) {
            debug('Error in getPDFProperties with credentials %O: %O', credentialsData, error);
            console.error('Error in getPDFProperties with credentials:', credentialsData, error);
            if (error.response && error.response.status === 429) {
                continue; // Retry with the next credentials
            } else {
                throw error;
            }
        }
    }
    throw new Error("All retries failed with status code 429");
};

const checkPDFServicesAPIStatus = async () => {
    for (let credentialsData of retryCredentials) {
        try {
            const credentials = new ServicePrincipalCredentials(credentialsData);
            const pdfServices = new PDFServices({ credentials });
            await pdfServices.upload({
                readStream: fs.createReadStream(__filename),
                mimeType: MimeType.PDF
            });

            return "PDF Services API is available.";
        } catch (error) {
            debug('PDF Services API is unavailable with credentials %O: %O', credentialsData, error);
            console.error('PDF Services API is unavailable with credentials:', credentialsData, error);
            if (error.response && error.response.status === 429) {
                continue; // Retry with the next credentials
            } else {
                throw error;
            }
        }
    }
    throw new Error("PDF Services API is unavailable with all credentials.");
};

module.exports = {
    getPDFProperties,
    checkPDFServicesAPIStatus
};