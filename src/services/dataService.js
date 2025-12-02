import Papa from 'papaparse';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0KGsk9HAH2ZP9I612PopHCOityrQtkqNAzCTJQkT9B5FqTmbv3ecPODsZJjAN4svMUzi9ILXWc3Oq/pub?gid=2116839656&single=true&output=csv';

export const fetchContracts = async () => {
    return new Promise((resolve, reject) => {
        Papa.parse(CSV_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results.data);
            },
            error: (error) => {
                reject(error);
            },
        });
    });
};

export const searchContracts = (contracts, query) => {
    if (!query) return [];

    const lowerQuery = query.toLowerCase();

    return contracts.filter(contract => {
        const entity = contract['ENTIDADE']?.toLowerCase() || '';
        const contractNumber = contract['Nº DO CONTRATO']?.toLowerCase() || '';

        return entity.includes(lowerQuery) || contractNumber.includes(lowerQuery);
    });
};
