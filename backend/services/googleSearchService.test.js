require('dotenv').config();
const axios = require('axios');
const { searchPDFLinks, checkGoogleAPIStatus } = require('./googleSearchService');

// axios ライブラリをモック
jest.mock('axios');

describe('googleSearchService', () => {
    beforeEach(() => {
        jest.resetModules(); // テスト間でキャッシュをクリア
    });

    describe('searchPDFLinks', () => {
        test('USE_MOCK_DATA が true の場合にモックデータを返す', async () => {
            process.env.USE_MOCK_DATA = 'true';
            const mockData = {
                mockPDFLinks: ['mockLink1.pdf', 'mockLink2.pdf', 'mockLink3.pdf']
            };
            jest.mock('../mockData', () => mockData, { virtual: true });

            const result = await searchPDFLinks('example.com', 2);
            expect(result).toEqual({
                pdfLinks: ['mockLink1.pdf', 'mockLink2.pdf'],
                totalResults: mockData.mockPDFLinks.length
            });
        });

        test('USE_MOCK_DATA が false の場合に API コールを行う', async () => {
            process.env.USE_MOCK_DATA = 'false';
            process.env.GOOGLE_API_KEY = 'fakeApiKey';
            process.env.GOOGLE_CX = 'fakeCx';

            const apiResponse = {
                data: {
                    items: [
                        { link: 'https://example.com/file1.pdf' },
                        { link: 'https://example.com/file2.pdf' }
                    ],
                    searchInformation: {
                        totalResults: '1000'
                    }
                }
            };

            axios.get.mockResolvedValue(apiResponse);

            const result = await searchPDFLinks('example.com', 2, '2020-01-01', '2020-12-31');
            expect(result).toEqual({
                pdfLinks: ['https://example.com/file1.pdf', 'https://example.com/file2.pdf'],
                totalResults: '1000'
            });
        });

        test('API エラーを適切に処理する', async () => {
            process.env.USE_MOCK_DATA = 'false';
            process.env.GOOGLE_API_KEY = 'fakeApiKey';
            process.env.GOOGLE_CX = 'fakeCx';

            axios.get.mockRejectedValue(new Error('API request failed'));

            await expect(searchPDFLinks('example.com', 2, '2020-01-01', '2020-12-31'))
                .rejects
                .toThrow('Failed to search PDF links');
        });
    });

    describe('checkGoogleAPIStatus', () => {
        test('Google Custom Search API が利用可能な場合', async () => {
            process.env.GOOGLE_API_KEY = 'fakeApiKey';
            process.env.GOOGLE_CX = 'fakeCx';

            axios.get.mockResolvedValue({ status: 200 });

            const result = await checkGoogleAPIStatus();
            expect(result).toBe('Google Custom Search API is available.');
        });

        test('Google Custom Search API が利用できない場合', async () => {
            process.env.GOOGLE_API_KEY = 'fakeApiKey';
            process.env.GOOGLE_CX = 'fakeCx';

            axios.get.mockRejectedValue(new Error('API unavailable'));

            await expect(checkGoogleAPIStatus())
                .rejects
                .toThrow('Google Custom Search API is unavailable.');
        });
    });
});
