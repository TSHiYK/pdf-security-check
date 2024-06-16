require('dotenv').config();
const fs = require('fs');
const { getPDFProperties, checkPDFServicesAPIStatus } = require('./pdfServices');
const { PDFServices } = require("@adobe/pdfservices-node-sdk");

// モジュールのモック
jest.mock('fs');
jest.mock('@adobe/pdfservices-node-sdk');

describe('pdfServices', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // 各テストごとにモックをクリア
    });

    describe('getPDFProperties', () => {
        test('正常にPDFプロパティを取得できる', async () => {
            const mockReadStream = {};
            const mockInputAsset = 'mockInputAsset';
            const mockPollingURL = 'mockPollingURL';
            const mockPDFPropertiesJson = { title: 'Mock PDF' };
            
            fs.createReadStream.mockReturnValue(mockReadStream);
            PDFServices.prototype.upload.mockResolvedValue(mockInputAsset);
            PDFServices.prototype.submit.mockResolvedValue(mockPollingURL);
            PDFServices.prototype.getJobResult.mockResolvedValue({
                result: {
                    getPDFPropertiesJson: mockPDFPropertiesJson
                }
            });

            const result = await getPDFProperties('path/to/mockPdf.pdf');
            expect(result).toEqual(mockPDFPropertiesJson);
        });

        test('すべての認証情報が429ステータスコードで失敗した場合にエラーを投げる', async () => {
            fs.createReadStream.mockReturnValue({});
            const error429 = {
                response: {
                    status: 429
                }
            };
            PDFServices.prototype.upload.mockRejectedValue(error429);

            await expect(getPDFProperties('path/to/mockPdf.pdf')).rejects.toThrow("All retries failed with status code 429");
        });

        test('その他のエラーの場合にエラーを投げる', async () => {
            fs.createReadStream.mockReturnValue({});
            PDFServices.prototype.upload.mockRejectedValue(new Error('Other error'));

            await expect(getPDFProperties('path/to/mockPdf.pdf')).rejects.toThrow('Other error');
        });
    });

    describe('checkPDFServicesAPIStatus', () => {
        test('PDF Services API が利用可能な場合にメッセージを返す', async () => {
            const mockReadStream = {};
            fs.createReadStream.mockReturnValue(mockReadStream);
            PDFServices.prototype.upload.mockResolvedValue({});

            const result = await checkPDFServicesAPIStatus();
            expect(result).toBe("PDF Services API is available.");
        });

        test('すべての認証情報が429ステータスコードで失敗した場合にエラーを投げる', async () => {
            const mockReadStream = {};
            fs.createReadStream.mockReturnValue(mockReadStream);
            const error429 = {
                response: {
                    status: 429
                }
            };
            PDFServices.prototype.upload.mockRejectedValue(error429);

            await expect(checkPDFServicesAPIStatus()).rejects.toThrow("PDF Services API is unavailable with all credentials.");
        });

        test('その他のエラーの場合にエラーを投げる', async () => {
            const mockReadStream = {};
            fs.createReadStream.mockReturnValue(mockReadStream);
            PDFServices.prototype.upload.mockRejectedValue(new Error('Other error'));

            await expect(checkPDFServicesAPIStatus()).rejects.toThrow('Other error');
        });
    });
});
