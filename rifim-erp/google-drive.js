// ============================================================
// RIFIM ERP - Google Drive Upload
// FIXED: Tidak lagi pakai OAuth popup (penyebab origin_mismatch)
// Upload via Google Apps Script Web App sebagai proxy
// ============================================================

// ⚠️ GANTI dengan URL Apps Script Web App milik Anda
// Cara deploy: buka script.google.com → Deploy → Web App → Anyone
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_ID/exec";

// Folder Drive tujuan upload selfie
const FOLDER_ID = "1Ejaz210g3TeM46W6up5BtgHNzEWwOnRQ";

/**
 * Upload file ke Google Drive via Apps Script proxy
 * Tidak perlu OAuth popup — aman dari origin_mismatch
 * @param {File} file - File object (gambar selfie)
 * @returns {Promise<string>} - File ID jika sukses
 */
async function uploadFileToDrive(file) {
  try {
    showUploadStatus("⏳ Mengupload selfie...", "info");

    // Konversi file ke base64
    const base64 = await fileToBase64(file);

    const payload = {
      fileName: file.name,
      mimeType: file.type,
      base64Data: base64,
      folderId: FOLDER_ID,
    };

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success && result.fileId) {
      showUploadStatus("✅ Selfie berhasil diupload ke Google Drive", "success");
      console.log("File ID:", result.fileId);
      return result.fileId;
    } else {
      throw new Error(result.error || "Upload gagal");
    }
  } catch (err) {
    console.error("Upload error:", err);
    showUploadStatus("❌ Upload gagal: " + err.message, "error");
    throw err;
  }
}

/**
 * Konversi File ke base64 string
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Hapus prefix "data:image/jpeg;base64," — kirim data saja
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Tampilkan status upload di UI
 */
function showUploadStatus(message, type) {
  let el = document.getElementById("upload-status");
  if (!el) {
    el = document.createElement("div");
    el.id = "upload-status";
    el.style.cssText = `
      padding: 12px 18px;
      border-radius: 12px;
      margin-top: 12px;
      font-weight: 600;
      font-size: 15px;
    `;
    // Sisipkan setelah tombol upload jika ada
    const btn = document.getElementById("uploadBtn");
    if (btn) btn.parentNode.insertBefore(el, btn.nextSibling);
    else document.body.appendChild(el);
  }

  const styles = {
    info:    { bg: "#dbeafe", color: "#1e40af" },
    success: { bg: "#dcfce7", color: "#166534" },
    error:   { bg: "#fee2e2", color: "#991b1b" },
  };

  const s = styles[type] || styles.info;
  el.style.background = s.bg;
  el.style.color = s.color;
  el.textContent = message;
}
