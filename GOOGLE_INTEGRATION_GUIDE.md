# 📚 RIFIM ERP - Google Integration Guide

## 🎯 Tujuan

Panduan lengkap untuk mengintegrasikan **Google Drive** dan **Google Sheets** ke aplikasi RIFIM ERP dengan fitur:
- ✅ Read/Write data ke Google Sheets
- ✅ Upload file ke Google Drive  
- ✅ Backup otomatis
- ✅ Generate & simpan PDF
- ✅ Search & manage files

---

## 📋 Daftar Isi

1. [Setup Google Cloud Project](#1-setup-google-cloud-project)
2. [Create Service Account](#2-create-service-account)
3. [Setup Google Apps Script](#3-setup-google-apps-script)
4. [Configure Database Sheets](#4-configure-database-sheets)
5. [Test Connection](#5-test-connection)
6. [Frontend Integration](#6-frontend-integration)
7. [Troubleshooting](#troubleshooting)

---

## 1️⃣ Setup Google Cloud Project

### 1.1 Buat Project Baru

```
1. Buka: https://console.cloud.google.com/
2. Klik: Select a Project → NEW PROJECT
3. Nama: RIFIM ERP Admin
4. Klik: CREATE (tunggu 1-2 menit)
```

### 1.2 Aktifkan API

Cari dan aktifkan API ini:

| API | Tujuan |
|-----|--------|
| **Google Drive API** | Upload & manage file |
| **Google Sheets API** | Read/Write data |
| **Apps Script API** | Jalankan script backend |

**Langkah aktivasi:**
```
1. Di sidebar, buka: APIs & Services → Library
2. Cari: "Google Drive API" → ENABLE
3. Ulangi untuk Sheets API dan Apps Script API
```

---

## 2️⃣ Create Service Account

### 2.1 Buat Service Account

```
1. Buka: APIs & Services → Credentials
2. Klik: + CREATE CREDENTIALS → Service Account
3. Isi form:
   - Service account name: rifim-erp-admin
   - Description: RIFIM ERP Admin Backend
4. Klik: CREATE AND CONTINUE
5. Klik: CONTINUE (skip Grant permissions untuk sekarang)
6. Klik: DONE
```

### 2.2 Generate JSON Key

```
1. Di daftar Service Accounts, klik: rifim-erp-admin
2. Buka tab: KEYS
3. Klik: ADD KEY → Create new key
4. Pilih: JSON
5. Klik: CREATE
6. File JSON otomatis didownload ⬇️
```

⚠️ **PENTING**: 
- Simpan JSON key di tempat aman
- **JANGAN** upload ke GitHub
- Extract: `client_email` dari JSON (contoh: `rifim-erp-admin@project-id.iam.gserviceaccount.com`)

---

## 3️⃣ Setup Google Apps Script

### 3.1 Buka Editor

```
1. Buka: https://script.google.com/
2. Klik: + New project
3. Nama: RIFIM ERP Backend
```

### 3.2 Copy & Paste Code

**File:** `apps-script-backend.js` di repository ini

```bash
# Copy seluruh kode dari:
/apps-script-backend.js
```

1. Buka file di text editor
2. Copy semua kode
3. Paste ke Google Apps Script editor
4. **Hapus kode default yang ada**
5. Klik: 💾 Save

### 3.3 Update Konfigurasi

Di bagian atas `apps-script-backend.js`, update ID:

```javascript
// ===== CONFIG =====
const DATABASE_STAFF_ID = "YOUR_STAFF_SHEET_ID";
const DATABASE_TRANSAKSI_ID = "YOUR_TRANSAKSI_SHEET_ID";
const DRIVE_ROOT_FOLDER_ID = "YOUR_DRIVE_FOLDER_ID";
```

Cara dapat ID:

| ID | Dari Mana |
|----|-----------|
| **Sheet ID** | URL Sheet: `https://docs.google.com/spreadsheets/d/**SHEET_ID**/edit` |
| **Folder ID** | URL Folder: `https://drive.google.com/drive/folders/**FOLDER_ID**` |

### 3.4 Deploy sebagai Web App

```
1. Klik: Deploy → New deployment
2. Select type: Web app ⚙️
3. Isi:
   - Execute as: Your Google Account
   - Who has access: Anyone
4. Klik: DEPLOY
5. ✅ Copy URL → Simpan di tempat aman
```

**Contoh URL:**
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

---

## 4️⃣ Configure Database Sheets

### 4.1 Buat Master Sheets

Buka [Google Sheets](https://sheets.google.com/):

**Sheet 1: DATABASE STAFF**

```
| ID | Nama | Jabatan | Cabang | ID Staff | Catatan |
|----|------|---------|--------|----------|---------|
| 1  | Nabilla | ADMIN | Admin | RIF0139 | Cover Govin & Sandra |
| 2  | Govin | ADMIN | Admin | RIF0143 | Govin 1 & 2 (sama) |
```

**Sheet 2: DATABASE TRANSAKSI**

```
| Tanggal | Cabang | Tipe | Nominal | Keterangan | User |
|---------|--------|------|---------|-----------|------|
| 2026-06-03 | Batam | SALDO | 1000000 | Isi Saldo | Nabilla |
```

### 4.2 Share dengan Service Account

Untuk **masing-masing sheet**:

```
1. Buka Sheet
2. Klik: Share (kanan atas)
3. Paste email service account:
   rifim-erp-admin@project-id.iam.gserviceaccount.com
4. Berikan akses: Editor
5. Klik: Share
```

### 4.3 Update index.html

Ganti konstanta di `index.html`:

```javascript
const GAS = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
const DRIVE_ROOT = "https://drive.google.com/drive/folders/YOUR_FOLDER_ID";
```

---

## 5️⃣ Test Connection

### 5.1 Browser Console Test

Buka aplikasi → Tekan `F12` → Console:

```javascript
// Test koneksi ke Apps Script
fetch('YOUR_GAS_URL?action=ping')
  .then(r => r.json())
  .then(d => console.log('✅ Success:', d))
  .catch(e => console.error('❌ Error:', e))
```

**Hasil yang diharapkan:**
```
✅ Success: {success: true, status: 'success', data: 'Pong! Apps Script running.'}
```

### 5.2 Test Read Data

```javascript
// Test ambil data Staff
fetch('YOUR_GAS_URL?action=dbstaff')
  .then(r => r.json())
  .then(d => console.log('Staff:', d.data))
  .catch(e => console.error('Error:', e))
```

**Hasil yang diharapkan:**
```
Staff: [
  {ID: "1", Nama: "Nabilla", Jabatan: "ADMIN", ...},
  {ID: "2", Nama: "Govin", Jabatan: "ADMIN", ...}
]
```

---

## 6️⃣ Frontend Integration

### 6.1 Import Utility Functions

Di komponen React Anda:

```javascript
import { 
  getAllStaff, 
  getAllTransactions,
  uploadToDrive,
  exportToCSV 
} from './utils/googleSheets.js';
```

### 6.2 Load Data dari Google Sheets

```javascript
import { getAllStaff } from './utils/googleSheets.js';

function StaffComponent() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStaff() {
      try {
        const data = await getAllStaff();
        setStaff(data);
      } catch (error) {
        console.error('Gagal load staff:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStaff();
  }, []);

  return (
    <div>
      {loading ? <p>Loading...</p> : (
        <ul>
          {staff.map(s => <li key={s.ID}>{s.Nama}</li>)}
        </ul>
      )}
    </div>
  );
}
```

### 6.3 Export Data ke CSV

```javascript
import { exportToCSV, getAllTransactions } from './utils/googleSheets.js';

async function downloadTransactions() {
  const data = await getAllTransactions();
  exportToCSV(data, 'transaksi-rifim.csv');
}
```

### 6.4 Upload File ke Drive

```javascript
import { uploadToDrive } from './utils/googleSheets.js';

async function backupData(data) {
  try {
    const json = JSON.stringify(data, null, 2);
    const result = await uploadToDrive(
      'backup-jadwal.json',
      json,
      'application/json',
      'FOLDER_ID_BACKUP'
    );
    console.log('✅ Backup tersimpan:', result.fileUrl);
  } catch (error) {
    console.error('❌ Backup gagal:', error);
  }
}
```

---

## 🔧 Troubleshooting

### ❌ Error: `401 Unauthorized`

**Penyebab:** Service account belum di-share di Sheet/Folder

**Solusi:**
```
1. Buka Sheet/Folder
2. Share → Tambah email service account
3. Berikan akses: Editor
```

### ❌ Error: `404 Not Found`

**Penyebab:** Sheet ID atau Folder ID salah

**Solusi:**
```
1. Copy ID dari URL yang benar
2. Pastikan aplikasi punya akses (share sudah dilakukan)
3. Update di apps-script-backend.js
```

### ❌ Error: `CORS Error`

**Penyebab:** Browser security policy

**Solusi:**
```
1. Gunakan fetch (sudah built-in support)
2. Hindari XMLHttpRequest tanpa CORS headers
3. Apps Script otomatis handle CORS
```

### ❌ Data tidak muncul di frontend

**Penyebab:** GAS_URL belum diupdate atau Apps Script error

**Solusi:**
```javascript
// Debug: cek URL
console.log('GAS URL:', window.GAS);

// Cek response Apps Script
fetch(window.GAS + '?action=ping')
  .then(r => r.json())
  .then(d => console.log('Response:', d));

// Cek error log di Apps Script:
// Google Apps Script → Executions
```

### ❌ Upload file gagal

**Penyebab:** Folder ID salah atau size file terlalu besar

**Solusi:**
```javascript
// Cek size file sebelum upload
const maxSize = 5 * 1024 * 1024; // 5MB
if (data.length > maxSize) {
  console.error('File terlalu besar');
}

// Compress data sebelum upload
import pako from 'pako';
const compressed = pako.deflate(JSON.stringify(data));
```

---

## 📊 Struktur File

```
rifim-admin/
├── index.html                          # Main app
├── apps-script-backend.js             # 🔑 Google Apps Script backend
├── utils/
│   └── googleSheets.js                # 🔧 Frontend utilities
├── SETUP_GOOGLE_API.md               # Setup guide (ini)
└── .env.local (⚠️ jangan commit)
    ├── REACT_APP_GAS_URL
    ├── REACT_APP_DRIVE_ROOT
    └── REACT_APP_ADMIN_PASS
```

---

## ✅ Checklist Setup Lengkap

- [ ] Google Cloud Project dibuat
- [ ] APIs diaktifkan (Drive, Sheets, Apps Script)
- [ ] Service Account dibuat + JSON key didownload
- [ ] Google Apps Script dikonfigurasi
- [ ] Deployment URL didapat
- [ ] Database Sheets dibuat
- [ ] Service account di-share ke Sheets & Folder
- [ ] `apps-script-backend.js` diupdate dengan IDs
- [ ] `index.html` diupdate dengan GAS URL
- [ ] Browser console test berhasil
- [ ] Sync Staff button bisa diclick
- [ ] Data muncul di aplikasi

---

## 🚀 Next Steps

Setelah setup selesai:

1. **Sync Staff Data**: Buka aplikasi → Jadwal Shift → 🔄 Sync DB Staff
2. **Upload File**: Coba upload jadwal ke Drive
3. **Backup Otomatis**: Setup schedule di Google Cloud Tasks
4. **Monitoring**: Cek executions di Google Apps Script console

---

## 📞 Support

Jika ada error:

1. Buka **Google Apps Script** → **Executions**
2. Cari error terbaru
3. Buka **Google Cloud Console** → **Logs**
4. Cek **Network tab** di browser (F12)

---

**Happy integrating! 🎉**
