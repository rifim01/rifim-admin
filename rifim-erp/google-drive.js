// ============================================================
// RIFIM ERP — google-drive.js v2
// Upload via Apps Script proxy — TANPA gapi, TANPA OAuth popup
// ============================================================

// ⚠️ Ganti dengan URL Apps Script Web App Anda setelah deploy
// Cara deploy: script.google.com → Deploy → Web App → Anyone
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyrUp1IVAOrHpXpDrpOvK4W6J0w6Ky9aI0T5TDTwHbCn7sUBu1U-8laJ5LfPU5Gy-Rd/exec";

const DRIVE_FOLDER_ID = "1Ejaz210g3TeM46W6up5BtgHNzEWwOnRQ";

/**
 * Upload file selfie ke Google Drive via Apps Script proxy
 */
async function uploadFileToDrive(file) {
  const statusEl = document.getElementById("upload-status");

  // Cek apakah Apps Script URL sudah dikonfigurasi
  if (APPS_SCRIPT_URL.includes("GANTI_DENGAN_URL_ANDA")) {
    setStatus(statusEl,
      "⚠️ Apps Script URL belum dikonfigurasi. Lihat PANDUAN_PERBAIKAN.md",
      "#fef9c3", "#854d0e"
    );
    console.warn("https://script.google.com/macros/s/AKfycbyrUp1IVAOrHpXpDrpOvK4W6J0w6Ky9aI0T5TDTwHbCn7sUBu1U-8laJ5LfPU5Gy-Rd/exec");
    return null;
  }

  try {
    setStatus(statusEl, "⏳ Mengupload selfie ke Drive...", "#dbeafe", "#1e40af");

    const base64 = await fileToBase64(file);

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName:  file.name,
        mimeType:  file.type,
        base64Data: base64,
        folderId:  DRIVE_FOLDER_ID,
      }),
    });

    const result = await response.json();

    if (result.success && result.fileId) {
      setStatus(statusEl,
        "✅ Selfie berhasil diupload ke Google Drive",
        "#dcfce7", "#166534"
      );
      return result.fileId;
    } else {
      throw new Error(result.error || "Respons tidak valid dari server");
    }

  } catch (err) {
    setStatus(statusEl,
      "❌ Upload gagal: " + err.message,
      "#fee2e2", "#991b1b"
    );
    console.error("Drive upload error:", err);
    return null;
  }
}

// Konversi File → base64 string (tanpa prefix data:...)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

// Helper set status box
function setStatus(el, msg, bg, color) {
  if (!el) return;
  Object.assign(el.style, {
    display: "block",
    background: bg,
    color: color,
    padding: "12px 16px",
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "15px",
    marginTop: "10px",
  });
  el.textContent = msg;
}
