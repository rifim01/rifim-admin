# 🔐 Setup Google API untuk RIFIM ERP

## Tahap 1: Membuat Google Cloud Project

### 1.1 Buat Project Baru
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **Select a Project** di atas
3. Klik **NEW PROJECT**
4. Nama: `RIFIM ERP Admin`
5. Klik **CREATE**
6. Tunggu hingga project selesai dibuat (1-2 menit)

### 1.2 Aktifkan API yang Diperlukan
Di Google Cloud Console, cari dan aktifkan:

1. **Google Drive API**
   - Cari "Google Drive API"
   - Klik **ENABLE**

2. **Google Sheets API**
   - Cari "Google Sheets API"
   - Klik **ENABLE**

3. **Apps Script API** (untuk Google Apps Script)
   - Cari "Apps Script API"
   - Klik **ENABLE**

---

## Tahap 2: Membuat Service Account

### 2.1 Buat Service Account
1. Di Google Cloud Console, buka **APIs & Services** → **Credentials**
2. Klik **+ CREATE CREDENTIALS**
3. Pilih **Service Account**
4. Isi:
   - Service account name: `rifim-erp-admin`
   - Description: `RIFIM ERP Admin Service Account`
5. Klik **CREATE AND CONTINUE**

### 2.2 Grant Permissions (Langkah 2, Opsional)
- Klik **CONTINUE** (skip untuk sekarang)

### 2.3 Buat Key
1. Di bagian **Service Accounts**, klik service account yang baru dibuat
2. Buka tab **KEYS**
3. Klik **ADD KEY** → **Create new key**
4. Pilih **JSON**
5. Klik **CREATE**
6. File JSON akan otomatis didownload → **SIMPAN DENGAN AMAN**

⚠️ **PENTING**: Jangan upload JSON key ke GitHub! Simpan di tempat aman.

---

## Tahap 3: Setup Google Apps Script (Untuk Backend)

### 3.1 Buka Google Apps Script Editor
1. Buka [script.google.com](https://script.google.com/)
2. Klik **+ New project**
3. Beri nama: `RIFIM ERP Backend`

### 3.2 Copy Code dari File `apps-script-backend.js`
1. Buka file `apps-script-backend.js` di folder ini
2. Copy seluruh kode
3. Paste di editor Google Apps Script
4. Klik **💾 Save**

### 3.3 Deploy sebagai Web App
1. Klik **Deploy** → **New deployment**
2. Pilih tipe: **Web app**
3. Isi:
   - Execute as: `Your Google Account`
   - Who has access: `Anyone`
4. Klik **DEPLOY**
5. **COPY URL deployment** → Ini yang Anda masukkan ke `const GAS = "..."` di index.html

---

## Tahap 4: Setup Google Drive Folder & Share Access

### 4.1 Siapkan Folder di Drive
1. Buka [Google Drive](https://drive.google.com/)
2. Buat folder: **RIFIM Admin Data**
3. Buat subfolder:
   - `Jadwal Shift`
   - `Laporan Transaksi`
   - `Export PDF`
   - `Backup Data`

### 4.2 Share Folder dengan Service Account
1. Di file JSON yang didownload, cari field `client_email` (contoh: `rifim-erp-admin@project-id.iam.gserviceaccount.com`)
2. Buka folder **RIFIM Admin Data**
3. Klik **Share**
4. Paste email service account
5. Berikan akses: **Editor**
6. Klik **Share**

### 4.3 Copy Folder ID
Dari URL folder: `https://drive.google.com/drive/folders/FOLDER_ID`
- Copy `FOLDER_ID`
- Masukkan ke `DRIVE_ROOT` di index.html

---

## Tahap 5: Setup Google Sheets Database

### 5.1 Buat Sheet Database STAFF
1. Buka [Google Sheets](https://sheets.google.com/)
2. Klik **+ Blank**
3. Nama: `DATABASE STAFF - RIFIM`
4. Struktur Sheet 1 (MASTER DATA STAFF):

```
| ID | Nama | Jabatan | Cabang | ID Staff | Catatan |
|----|------|---------|--------|----------|---------|
| 1  | Nabilla | ADMIN | Admin | RIF0139 | Cover Govin & Sandra |
```

5. Share dengan service account email (Editor access)

### 5.2 Buat Sheet Database TRANSAKSI
1. Buat sheet baru: `DATABASE TRANSAKSI - RIFIM`
2. Struktur:

```
| Tanggal | Cabang | Tipe | Nominal | Keterangan | User |
|---------|--------|------|---------|-----------|------|
```

3. Share dengan service account email

### 5.3 Update URL di index.html
```javascript
const DATABASE_STAFF_ID = "1fcraq3QHqIaD-13Ebzt6stT9aA6j_loTXeAtpNX12kw";
const DATABASE_TRANSAKSI_ID = "1Qhwg1MB4IWqcWZJliGOlxh6q9AFrGyP7EICvFVOIXoY";
const SERVICE_ACCOUNT_EMAIL = "rifim-erp-admin@your-project.iam.gserviceaccount.com";
```

---

## Tahap 6: Testing Koneksi

### 6.1 Test di Browser Console
```javascript
// Test fetch ke Apps Script
fetch('YOUR_GAS_URL?action=dbstaff')
  .then(r => r.json())
  .then(d => console.log('✅ Berhasil:', d))
  .catch(e => console.error('❌ Error:', e))
```

### 6.2 Cek Response
- Jika berhasil: `✅ Berhasil: {success: true, data: [...]}`
- Jika gagal: `❌ Error: ...`

---

## Tahap 7: Environment Variables (Untuk Production)

Jika Anda deploy ke Vercel, buat file `.env.local`:

```env
REACT_APP_GAS_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
REACT_APP_ADMIN_PASS=rifim2024
REACT_APP_OWNER_PASS=owner2024
```

---

## Troubleshooting

| Error | Solusi |
|-------|--------|
| `401 Unauthorized` | Pastikan service account email sudah dishare di Drive/Sheets |
| `404 Not Found` | Cek URL GAS deployment dan folder ID |
| `CORS Error` | Gunakan `Fetch` dengan proper headers atau JSONP |
| `Sheet tidak ditemukan` | Verify sheet ID dan nama sheet di Apps Script |

---

## Checklist Setup

- [ ] Google Cloud Project dibuat
- [ ] API diaktifkan (Drive, Sheets, Apps Script)
- [ ] Service Account dibuat dengan JSON key
- [ ] Google Apps Script dikonfigurasi
- [ ] Deployment URL didapat
- [ ] Google Drive folder dibuat dan dishare
- [ ] Database Sheets dibuat
- [ ] index.html diupdate dengan URL
- [ ] Testing koneksi berhasil
- [ ] GitHub Pages berhasil di-deploy

---

✨ **Setup selesai!** Aplikasi Anda siap terintegrasi dengan Google Drive dan Sheets.
