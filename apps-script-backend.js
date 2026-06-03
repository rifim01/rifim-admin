/**
 * RIFIM ERP - Google Apps Script Backend
 * 
 * Fungsi:
 * 1. Read data dari Google Sheets
 * 2. Write data ke Google Sheets
 * 3. Upload file ke Google Drive
 * 4. Generate PDF dan simpan ke Drive
 * 5. Manage folder di Drive
 * 
 * Deploy as Web App with "Anyone" access
 */

// ===== CONFIG - UPDATE INI DENGAN DATA ANDA =====
const DATABASE_STAFF_ID = "1fcraq3QHqIaD-13Ebzt6stT9aA6j_loTXeAtpNX12kw";
const DATABASE_TRANSAKSI_ID = "1Qhwg1MB4IWqcWZJliGOlxh6q9AFrGyP7EICvFVOIXoY";
const DRIVE_ROOT_FOLDER_ID = "1hSeERvZrHQtBP_9tWqw87fqQfy2wiBS4";

// ===== MAIN HANDLER =====
function doGet(e) {
  try {
    const action = e.parameter.action || "ping";
    
    switch(action) {
      case "ping":
        return contentService({msg: "Pong! Apps Script running."}, "success");
      
      case "dbstaff":
        return contentService(getStaffData(), "success");
      
      case "dbtransaksi":
        return contentService(getTransaksiData(), "success");
      
      case "save_jadwal_pdf":
        return contentService(saveJadwalPDF(e.parameter), "success");
      
      case "upload_file":
        return contentService(uploadFile(e.parameter), "success");
      
      case "list_files":
        return contentService(listDriveFiles(e.parameter.folderId), "success");
      
      case "folder_structure":
        return contentService(getFolderStructure(e.parameter.folderId), "success");
      
      case "search_files":
        return contentService(searchDriveFiles(e.parameter.query, e.parameter.folderId), "success");
      
      case "backup_to_csv":
        return contentService(backupSheetToCSV(e.parameter.spreadsheetId, e.parameter.sheetName), "success");
      
      default:
        return contentService({error: "Action tidak ditemukan: " + action}, "error");
    }
  } catch(err) {
    return contentService({error: err.toString(), stack: err.stack}, "error");
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Format response JSON dengan CORS headers
 */
function contentService(data, status) {
  const output = {
    success: status === "success",
    status: status,
    data: data,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Baca data dari Google Sheets - MASTER STAFF
 */
function getStaffData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(DATABASE_STAFF_ID);
    const sheet = spreadsheet.getSheetByName("MASTER DATA STAFF") || spreadsheet.getSheets()[0];
    
    if (!sheet) {
      return {error: "Sheet tidak ditemukan", sheets: spreadsheet.getSheets().map(s => s.getName())};
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const records = [];
    
    // Skip header row (row 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Skip empty rows
      if (!row[0]) continue;
      
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = row[idx] || "";
      });
      
      records.push(record);
    }
    
    return {
      success: true,
      count: records.length,
      data: records,
      lastUpdate: new Date().toISOString()
    };
  } catch(err) {
    return {error: err.toString()};
  }
}

/**
 * Baca data dari Google Sheets - TRANSAKSI
 */
function getTransaksiData(limit = 100) {
  try {
    const spreadsheet = SpreadsheetApp.openById(DATABASE_TRANSAKSI_ID);
    const sheet = spreadsheet.getSheets()[0];
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const records = [];
    
    // Ambil data dari belakang (data terbaru) sampai limit
    for (let i = Math.max(1, data.length - limit); i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue;
      
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = row[idx] || "";
      });
      
      records.push(record);
    }
    
    return {
      success: true,
      count: records.length,
      data: records.reverse(), // Terbaru di atas
      lastUpdate: new Date().toISOString()
    };
  } catch(err) {
    return {error: err.toString()};
  }
}

/**
 * Tulis data ke Google Sheets
 */
function appendToSheet(spreadsheetId, sheetName, rowData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {error: `Sheet "${sheetName}" tidak ditemukan`};
    }
    
    sheet.appendRow(rowData);
    
    return {
      success: true,
      message: `Data berhasil ditambahkan ke ${sheetName}`,
      appendedAt: new Date().toISOString()
    };
  } catch(err) {
    return {error: err.toString()};
  }
}

/**
 * Generate dan simpan PDF Jadwal Shift ke Drive
 */
function saveJadwalPDF(params) {
  try {
    const folderId = params.folderId || DRIVE_ROOT_FOLDER_ID;
    const cabang = params.cabang || "Admin";
    const minggu = params.minggu || new Date().toISOString().split('T')[0];
    
    // Create document
    const doc = DocumentApp.create(`Jadwal Shift - ${cabang} (${minggu})`);
    const body = doc.getBody();
    
    body.appendParagraph(`Jadwal Kerja ${cabang}`).setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph(`Minggu: ${minggu}`);
    body.appendParagraph(`Tanggal: ${new Date(minggu).toLocaleDateString('id-ID')}`);
    
    // Convert to PDF
    const docId = doc.getId();
    const pdfBlob = Drive.Files.get(docId, {mimeType: 'application/pdf'}).getBlob();
    const pdfName = `Jadwal_${cabang}_${minggu}.pdf`;
    
    // Save to folder
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(pdfBlob);
    
    // Delete temp doc
    DriveApp.getFileById(docId).setTrashed(true);
    
    return {
      success: true,
      fileName: file.getName(),
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      message: "Jadwal PDF berhasil disimpan ke Drive"
    };
  } catch(err) {
    return {error: err.toString()};
  }
}

/**
 * Upload file ke Google Drive
 */
function uploadFile(params) {
  try {
    const folderId = params.folderId || DRIVE_ROOT_FOLDER_ID;
    const fileName = params.fileName || "Unnamed File";
    const mimeType = params.mimeType || "text/plain";
    const content = params.content || "";
    
    const folder = DriveApp.getFolderById(folderId);
    const blob = Utilities.newBlob(content, mimeType, fileName);
    const file = folder.createFile(blob);
    
    return {
      success: true,
      fileName: file.getName(),
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      mimeType: file.getMimeType(),
      uploadedAt: new Date().toISOString()
    };
  } catch(err) {
    return {error: err.toString()};
  }
}

/**
 * List files di folder Drive
 */
function listDriveFiles(folderId) {
  try {
    folderId = folderId || DRIVE_ROOT_FOLDER_ID;
    const folder = DriveApp.getFolderById(folderId);
    const files = [];
    
    const fileIterator = folder.getFiles();
    while (fileIterator.hasNext()) {
      const file = fileIterator.next();
      files.push({
        name: file.getName(),
        id: file.getId(),
        url: file.getUrl(),
        type: file.getMimeType(),
        size: file.getSize(),
        lastModified: file.getLastUpdated(),
        owner: file.getOwner().getEmail()
      });
    }
    
    return {
      success: true,
      folderId: folderId,
      folderName: folder.getName(),
      fileCount: files.length,
      files: files
    };
  } catch(err) {
    return {error: err.toString()};
  }
}

/**
 * Get folder hierarchy
 */
function getFolderStructure(folderId) {
  try {
    folderId = folderId || DRIVE_ROOT_FOLDER_ID;
    const folder = DriveApp.getFolderById(folderId);
    const structure = {
      name: folder.getName(),
      id: folder.getId(),
      folders: [],
      files: []
    };
    
    // Ambil subfolder
    const folderIterator = folder.getFolders();
    while (folderIterator.hasNext()) {
      const subfolder = folderIterator.next();
      structure.folders.push({
        name: subfolder.getName(),
        id: subfolder.getId(),
        url: subfolder.getUrl()
      });
    }
    
    // Ambil file
    const fileIterator = folder.getFiles();
    while (fileIterator.hasNext()) {
      const file = fileIterator.next();
      structure.files.push({
        name: file.getName(),
        id: file.getId(),
        url: file.getUrl(),
        size: file.getSize()
      });
    }
    
    return {
      success: true,
      structure: structure
    };
  } catch(err) {
    return {error: err.toString()};
  }
}

/**
 * Backup data dari Sheets ke Drive sebagai CSV
 */
function backupSheetToCSV(spreadsheetId, sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {error: `Sheet "${sheetName}" tidak ditemukan`};
    }
    
    const data = sheet.getDataRange().getValues();
    let csv = "";
    
    // Convert to CSV
    for (let i = 0; i < data.length; i++) {
      csv += data[i].map(cell => `"${cell}"`).join(",") + "\n";
    }
    
    // Upload ke Drive
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${sheetName}_Backup_${timestamp}.csv`;
    const blob = Utilities.newBlob(csv, MimeType.CSV, fileName);
    const folder = DriveApp.getFolderById(DRIVE_ROOT_FOLDER_ID);
    const file = folder.createFile(blob);
    
    return {
      success: true,
      fileName: file.getName(),
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      rowCount: data.length,
      backupTime: new Date().toISOString()
    };
  } catch(err) {
    return {error: err.toString()};
  }
}

/**
 * Search files di Drive
 */
function searchDriveFiles(query, folderId) {
  try {
    folderId = folderId || DRIVE_ROOT_FOLDER_ID;
    const folder = DriveApp.getFolderById(folderId);
    
    const searchResults = DriveApp.searchFiles(`fullText contains "${query}" and trashed=false`);
    const files = [];
    
    while (searchResults.hasNext()) {
      const file = searchResults.next();
      // Filter hanya file di folder tertentu
      if (file.getParents().hasNext()) {
        files.push({
          name: file.getName(),
          id: file.getId(),
          url: file.getUrl(),
          type: file.getMimeType()
        });
      }
      if (files.length >= 20) break; // Limit 20 hasil
    }
    
    return {
      success: true,
      query: query,
      resultCount: files.length,
      results: files
    };
  } catch(err) {
    return {error: err.toString()};
  }
}

// ===== BATCH OPERATIONS =====

/**
 * Tulis banyak data ke Sheets sekaligus (lebih cepat)
 */
function batchAppendToSheet(spreadsheetId, sheetName, rowsData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {error: `Sheet "${sheetName}" tidak ditemukan`};
    }
    
    // Pastikan sheet punya space
    const lastRow = sheet.getLastRow();
    const range = sheet.getRange(lastRow + 1, 1, rowsData.length, rowsData[0].length);
    range.setValues(rowsData);
    
    return {
      success: true,
      rowsAdded: rowsData.length,
      message: `${rowsData.length} baris berhasil ditambahkan`,
      appendedAt: new Date().toISOString()
    };
  } catch(err) {
    return {error: err.toString()};
  }
}

/**
 * Update sel di Sheets
 */
function updateSheetCell(spreadsheetId, sheetName, row, col, value) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      return {error: `Sheet "${sheetName}" tidak ditemukan`};
    }
    
    sheet.getRange(row, col).setValue(value);
    
    return {
      success: true,
      updated: {row, col, value},
      updatedAt: new Date().toISOString()
    };
  } catch(err) {
    return {error: err.toString()};
  }
}

/**
 * Get stats dari Sheets (total baris, dll)
 */
function getSheetStats(spreadsheetId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheets = spreadsheet.getSheets();
    const stats = {};
    
    sheets.forEach(sheet => {
      const data = sheet.getDataRange().getValues();
      stats[sheet.getName()] = {
        rows: data.length,
        cols: data[0] ? data[0].length : 0,
        lastRow: sheet.getLastRow(),
        lastColumn: sheet.getLastColumn()
      };
    });
    
    return {
      success: true,
      spreadsheetId: spreadsheetId,
      stats: stats
    };
  } catch(err) {
    return {error: err.toString()};
  }
}
