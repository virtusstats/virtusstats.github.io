import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Parses a file (CSV or Excel) and returns data.
 * @param {File} file 
 * @returns {Promise<{headers: string[], data: any[]}>}
 */
export const parseFile = async (file) => {
    return new Promise((resolve, reject) => {
        const extension = file.name.split('.').pop().toLowerCase();

        if (extension === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.data && results.data.length > 0) {
                        resolve({
                            headers: results.meta.fields,
                            data: results.data
                        });
                    } else {
                        reject(new Error("File appears to be empty or invalid CSV."));
                    }
                },
                error: (err) => reject(err),
            });
        } else if (['xlsx', 'xls'].includes(extension)) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (jsonData.length === 0) {
                        reject(new Error("Excel sheet is empty."));
                        return;
                    }

                    const headers = jsonData[0];
                    const rows = jsonData.slice(1).map(row => {
                        let obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index];
                        });
                        return obj;
                    });

                    resolve({ headers, data: rows });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        } else {
            reject(new Error("Unsupported file type. Please upload .csv or .xlsx"));
        }
    });
};
