/**
 * RIFIM ERP - Google Sheets Frontend Utility
 * 
 * Penggunaan:
 * - Read/Write ke Google Sheets
 * - Upload file ke Google Drive
 * - Manage folder dan file
 */

const GAS_URL = "https://script.google.com/macros/s/AKfycbyV8Us4bSqMIVgB8Q0QJVygv6K2oUJVtLRvR8OW0SHPXYPyKIwQ6Xu8fRJB8iAysovM/exec";

// ===== GOOGLE SHEETS OPERATIONS =====

/**
 * Ambil data dari Google Sheets
 * @param {string} action - Aksi: dbstaff, dbtransaksi, dll
 * @returns {Promise<Object>}
 */
export async function getSheetData(action) {
  try {
    const response = await fetch(`${GAS_URL}?action=${action}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.data?.error || "Gagal ambil data");
    }
    
    return result.data;
  } catch (error) {
    console.error(`❌ getSheetData(${action}) error:`, error);
    throw error;
  }
}

/**
 * Tulis data ke Google Sheets
 * @param {string} action - Aksi untuk Apps Script
 * @param {Object} data - Data yang akan ditulis
 * @returns {Promise<Object>}
 */
export async function appendSheetData(action, data) {
  try {
    const url = new URL(GAS_URL);
    url.searchParams.append('action', action);
    
    // Encode data sebagai query params atau body (tergantung size)
    Object.entries(data).forEach(([key, value]) => {
      url.searchParams.append(key, JSON.stringify(value));
    });
    
    const response = await fetch(url.toString());
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.data?.error || "Gagal tulis data");
    }
    
    return result.data;
  } catch (error) {
    console.error(`❌ appendSheetData(${action}) error:`, error);
    throw error;
  }
}

/**
 * Get semua data Staff dari Database
 * @returns {Promise<Array>}
 */
export async function getAllStaff() {
  try {
    const data = await getSheetData('dbstaff');
    return data.data || [];
  } catch (error) {
    console.error("❌ getAllStaff error:", error);
    return [];
  }
}

/**
 * Get semua data Transaksi
 * @param {number} limit - Berapa banyak data terakhir (default 100)
 * @returns {Promise<Array>}
 */
export async function getAllTransactions(limit = 100) {
  try {
    const data = await getSheetData(`dbtransaksi&limit=${limit}`);
    return data.data || [];
  } catch (error) {
    console.error("❌ getAllTransactions error:", error);
    return [];
  }
}

/**
 * Filter data Staff by Cabang
 * @param {Array} staffList - Array of staff data
 * @param {string} cabang - Nama cabang
 * @returns {Array}
 */
export function filterStaffByBranch(staffList, cabang) {
  return staffList.filter(staff => staff.Cabang === cabang);
}

/**
 * Search Staff by nama
 * @param {Array} staffList - Array of staff data
 * @param {string} query - Search query
 * @returns {Array}
 */
export function searchStaff(staffList, query) {
  const q = query.toLowerCase();
  return staffList.filter(staff => 
    staff.Nama?.toLowerCase().includes(q) || 
    staff['ID Staff']?.includes(q)
  );
}

// ===== GOOGLE DRIVE OPERATIONS =====

/**
 * Upload file ke Google Drive
 * @param {string} fileName - Nama file
 * @param {string} content - Isi file (string atau base64)
 * @param {string} mimeType - MIME type (text/plain, application/json, dll)
 * @param {string} folderId - (Optional) Folder ID di Drive
 * @returns {Promise<Object>}
 */
export async function uploadToDrive(fileName, content, mimeType = 'text/plain', folderId = null) {
  try {
    const url = new URL(GAS_URL);
    url.searchParams.append('action', 'upload_file');
    url.searchParams.append('fileName', fileName);
    url.searchParams.append('content', content);
    url.searchParams.append('mimeType', mimeType);
    
    if (folderId) {
      url.searchParams.append('folderId', folderId);
    }
    
    const response = await fetch(url.toString());
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.data?.error || "Upload gagal");
    }
    
    return result.data;
  } catch (error) {
    console.error("❌ uploadToDrive error:", error);
    throw error;
  }
}

/**
 * List files di folder Drive
 * @param {string} folderId - Folder ID
 * @returns {Promise<Array>}
 */
export async function listDriveFiles(folderId) {
  try {
    const response = await fetch(`${GAS_URL}?action=list_files&folderId=${folderId}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.data?.error || "List files gagal");
    }
    
    return result.data.files || [];
  } catch (error) {
    console.error("❌ listDriveFiles error:", error);
    return [];
  }
}

/**
 * Get folder structure di Drive
 * @param {string} folderId - Folder ID
 * @returns {Promise<Object>}
 */
export async function getFolderStructure(folderId) {
  try {
    const response = await fetch(`${GAS_URL}?action=folder_structure&folderId=${folderId}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.data?.error || "Get struktur folder gagal");
    }
    
    return result.data.structure;
  } catch (error) {
    console.error("❌ getFolderStructure error:", error);
    return null;
  }
}

/**
 * Search files di Drive
 * @param {string} query - Search query
 * @param {string} folderId - (Optional) Folder ID untuk filter
 * @returns {Promise<Array>}
 */
export async function searchDriveFiles(query, folderId = null) {
  try {
    let url = `${GAS_URL}?action=search_files&query=${encodeURIComponent(query)}`;
    if (folderId) url += `&folderId=${folderId}`;
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.data?.error || "Search gagal");
    }
    
    return result.data.results || [];
  } catch (error) {
    console.error("❌ searchDriveFiles error:", error);
    return [];
  }
}

// ===== BACKUP & EXPORT =====

/**
 * Backup Sheet ke CSV di Drive
 * @param {string} spreadsheetId - ID Spreadsheet
 * @param {string} sheetName - Nama sheet
 * @returns {Promise<Object>}
 */
export async function backupSheetToCSV(spreadsheetId, sheetName) {
  try {
    const url = new URL(GAS_URL);
    url.searchParams.append('action', 'backup_to_csv');
    url.searchParams.append('spreadsheetId', spreadsheetId);
    url.searchParams.append('sheetName', sheetName);
    
    const response = await fetch(url.toString());
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.data?.error || "Backup gagal");
    }
    
    return result.data;
  } catch (error) {
    console.error("❌ backupSheetToCSV error:", error);
    throw error;
  }
}

/**
 * Export data ke JSON
 * @param {Array} data - Data array
 * @param {string} fileName - Nama file output
 * @returns {void} - Download langsung
 */
export function exportToJSON(data, fileName = 'data.json') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadFile(blob, fileName);
}

/**
 * Export data ke CSV
 * @param {Array} data - Data array (array of objects)
 * @param {string} fileName - Nama file output
 * @returns {void} - Download langsung
 */
export function exportToCSV(data, fileName = 'data.csv') {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk di-export');
    return;
  }
  
  // Get headers
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csv = headers.join(',') + '\n';
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes dan wrap in quotes jika ada comma
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csv += values.join(',') + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, fileName);
}

/**
 * Download file helper
 * @param {Blob} blob - File blob
 * @param {string} fileName - Nama file
 */
function downloadFile(blob, fileName) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ===== UTILITIES =====

/**
 * Format data untuk Google Sheets
 * @param {Object} obj - Object data
 * @returns {Array} - Array format untuk Sheets
 */
export function objectToRow(obj) {
  return Object.values(obj);
}

/**
 * Format Google Sheets row ke Object
 * @param {Array} headers - Header array
 * @param {Array} row - Row data array
 * @returns {Object}
 */
export function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((header, i) => {
    obj[header] = row[i];
  });
  return obj;
}

/**
 * Validate Sheets connection
 * @returns {Promise<boolean>}
 */
export async function validateConnection() {
  try {
    const response = await fetch(`${GAS_URL}?action=ping`);
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("❌ validateConnection error:", error);
    return false;
  }
}

/**
 * Get Apps Script connection status
 * @returns {Promise<Object>}
 */
export async function getConnectionStatus() {
  try {
    const response = await fetch(`${GAS_URL}?action=ping`);
    const result = await response.json();
    
    return {
      connected: result.success,
      status: result.status,
      timestamp: result.timestamp,
      message: result.success ? '✅ Connected to Apps Script' : '❌ Connection failed'
    };
  } catch (error) {
    return {
      connected: false,
      status: 'error',
      message: `❌ ${error.message}`
    };
  }
}

/**
 * Generate Jadwal PDF dan simpan ke Drive
 * @param {Object} jadwalData - Data jadwal
 * @param {string} cabang - Nama cabang
 * @param {string} minggu - Tanggal minggu (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
export async function saveJadwalPDF(jadwalData, cabang, minggu) {
  try {
    // Generate HTML dari jadwal
    const html = generateJadwalHTML(jadwalData, cabang, minggu);
    
    const url = new URL(GAS_URL);
    url.searchParams.append('action', 'save_jadwal_pdf');
    url.searchParams.append('cabang', cabang);
    url.searchParams.append('minggu', minggu);
    url.searchParams.append('htmlContent', html);
    
    const response = await fetch(url.toString());
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.data?.error || "Simpan PDF gagal");
    }
    
    return result.data;
  } catch (error) {
    console.error("❌ saveJadwalPDF error:", error);
    throw error;
  }
}

/**
 * Generate HTML dari jadwal untuk PDF
 * @private
 */
function generateJadwalHTML(jadwalData, cabang, minggu) {
  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Jadwal Shift - ${cabang}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Jadwal Shift - ${cabang}</h1>
        <p>Minggu: ${minggu}</p>
        <p>Tanggal: ${new Date(minggu).toLocaleDateString('id-ID')}</p>
        <table>
          <tr>
            <th>No</th>
            <th>Nama</th>
            <th>Senin</th>
            <th>Selasa</th>
            <th>Rabu</th>
            <th>Kamis</th>
            <th>Jumat</th>
            <th>Sabtu</th>
            <th>Minggu</th>
          </tr>
          <!-- Jadwal data akan diisi di sini -->
        </table>
      </body>
    </html>
  `;
}

export default {
  // Sheets
  getSheetData,
  appendSheetData,
  getAllStaff,
  getAllTransactions,
  filterStaffByBranch,
  searchStaff,
  
  // Drive
  uploadToDrive,
  listDriveFiles,
  getFolderStructure,
  searchDriveFiles,
  
  // Export
  backupSheetToCSV,
  exportToJSON,
  exportToCSV,
  
  // Jadwal
  saveJadwalPDF,
  
  // Utils
  validateConnection,
  getConnectionStatus,
  objectToRow,
  rowToObject
};
