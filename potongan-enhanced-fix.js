// ═══════════════════════════════════════════════════════════════
// ENHANCED FIX: Auto-fill dengan Fallback Opensheet
// Issue: loadDrivers() relies on API.sheet() which may fail silently
// Solution: Add fallback to opensheet + better logging
// ═══════════════════════════════════════════════════════════════

// REPLACE onLoginInput() function (around line 59-68):
onLoginInput(){
  const loginEl=$('pot-loginid'); 
  if(!loginEl) return;
  
  const val=loginEl.value.trim().toLowerCase();
  console.log('[AUTO-FILL] Input:', val, 'driverMap size:', Object.keys(this.driverMap).length);
  
  if(!val){ 
    $('pot-driver-nama')&&($('pot-driver-nama').value=''); 
    $('pot-cabang')&&($('pot-cabang').value='');
    return; 
  }
  
  const found=this.driverMap[val];
  if(found){
    console.log('[AUTO-FILL] Found:', found);
    const nm=$('pot-driver-nama'); if(nm) nm.value=found.nama;
    const cb=$('pot-cabang');
    if(cb&&found.cabang){ 
      cb.value=found.cabang; 
      this.preview(); 
    }
  } else {
    console.warn('[AUTO-FILL] Not found in driverMap:', val);
    // Optional: Clear previous values
    $('pot-driver-nama')&&($('pot-driver-nama').value='');
  }
},

// REPLACE loadDrivers() function (around line 72-100):
async loadDrivers(){
  this.allDrivers=[];
  this.driverMap={};
  
  console.log('[LOAD-DRIVERS] Starting load...');
  
  const load = async (sheetId, sheetNames)=>{
    for(const sn of sheetNames){
      try{
        console.log(`[LOAD-DRIVERS] Loading ${sn}...`);
        const d=await API.sheet(sheetId, sn);
        
        if(!d || d.length===0){
          console.warn(`[LOAD-DRIVERS] ${sn} returned empty`);
          continue;
        }
        
        d.forEach(r=>{
          const keys=Object.keys(r);
          // Robust column detection
          const loginKey=keys.find(k=>/login|id.?login|id.?driver/i.test(k));
          const namaKey =keys.find(k=>/^nama|nama.?driver|driver.?nama/i.test(k));
          const cabKey  =keys.find(k=>/cabang|id.?cabang|branch|id.?branch/i.test(k));
          
          const loginId=(loginKey?r[loginKey]:'').toString().trim();
          const nama   =(namaKey ?r[namaKey] :'').toString().trim();
          const cabang =(cabKey  ?r[cabKey]  :'').toString().trim();
          
          if(loginId){
            this.allDrivers.push({loginId,nama,cabang,raw:r});
            this.driverMap[loginId.toLowerCase()]={nama,cabang};
          }
        });
      }catch(e){
        console.warn(`[LOAD-DRIVERS] Error ${sn}:`, e.message);
      }
    }
  };
  
  // Try load from API.sheet (existing method)
  try {
    await load(API.DRV_AIRPORT,  ['ID Rifim Airport Batam','ID Rifim Airport Jambi','ID Rifim Airport Balikpapan','ID Rifim Airport Manado','ID Rifim Airport Pekanbaru']);
    await load(API.DRV_EXTERNAL, ['ID Rifim Batam','ID Rifim Jambi Luar']);
  } catch(e) {
    console.error('[LOAD-DRIVERS] API.sheet failed:', e);
  }
  
  console.log('[LOAD-DRIVERS] Loaded from API:', this.allDrivers.length, 'drivers');
  
  // FALLBACK: If API failed, try opensheet
  if(this.allDrivers.length === 0){
    console.warn('[LOAD-DRIVERS] API returned 0 drivers, falling back to opensheet...');
    await this.loadDriversFromOpensheet();
  }
  
  this.buildDriverSel();
},

// ADD NEW: Fallback function untuk load dari opensheet
async loadDriversFromOpensheet(){
  try {
    // ⚠️ GANTI ID_SPREADSHEET_INI dengan Spreadsheet ID Bobby
    const spreadsheetId = 'ID_SPREADSHEET_INI'; // Contoh: '1jTMLB5KwFmU9...'
    
    if(spreadsheetId === 'ID_SPREADSHEET_INI'){
      console.error('[OPENSHEET] Spreadsheet ID not configured!');
      return;
    }
    
    const sheetNames = [
      'DATABASE_DRIVER_AIRPORT',
      'DATABASE_DRIVER_EXTERNAL',
      'DB_DRIVER_AIRPORT',
      'DB_DRIVER_EXTERNAL'
    ];
    
    for(const sn of sheetNames){
      try {
        console.log(`[OPENSHEET] Trying sheet: ${sn}`);
        const url = `https://opensheet.elk.sh/${spreadsheetId}/${sn}`;
        const response = await fetch(url, {timeout: 5000});
        
        if(!response.ok) {
          console.warn(`[OPENSHEET] ${sn} not found (404), trying next...`);
          continue;
        }
        
        const data = await response.json();
        if(!Array.isArray(data) || data.length === 0) {
          console.warn(`[OPENSHEET] ${sn} is empty`);
          continue;
        }
        
        console.log(`[OPENSHEET] Loaded ${sn}:`, data.length, 'rows');
        
        // Parse data dengan flexible column detection
        data.forEach(r => {
          const keys = Object.keys(r);
          const loginKey = keys.find(k => /login|id/i.test(k) && k.toLowerCase() !== 'id rifim');
          const namaKey = keys.find(k => /nama/i.test(k));
          const cabKey = keys.find(k => /cabang|branch/i.test(k));
          
          const loginId = (loginKey ? r[loginKey] : '').toString().trim();
          const nama = (namaKey ? r[namaKey] : '').toString().trim();
          const cabang = (cabKey ? r[cabKey] : '').toString().trim();
          
          if(loginId && nama) {
            this.allDrivers.push({loginId, nama, cabang, raw: r});
            this.driverMap[loginId.toLowerCase()] = {nama, cabang};
          }
        });
        
        if(this.allDrivers.length > 0) break; // Berhenti jika sudah load berhasil
      } catch(e) {
        console.warn(`[OPENSHEET] Error ${sn}:`, e.message);
      }
    }
    
    console.log('[OPENSHEET] Total loaded:', this.allDrivers.length, 'drivers');
  } catch(e) {
    console.error('[OPENSHEET] Fatal error:', e);
  }
},

// UPDATE buildDriverSel() to reflect fallback
buildDriverSel(){
  const ds=$('pot-driver'); 
  if(!ds) return;
  
  ds.innerHTML='<option value="">— Cari driver —</option>';
  
  if(this.allDrivers.length === 0){
    console.warn('[BUILD-DRIVER-SEL] No drivers available! Check console logs.');
    ds.innerHTML += '<option disabled>❌ Tidak ada driver (check console)</option>';
    return;
  }
  
  this.allDrivers.forEach(d=>{
    const opt=document.createElement('option');
    opt.value=JSON.stringify({loginId:d.loginId,nama:d.nama,cabang:d.cabang});
    opt.textContent=`${d.loginId} — ${d.nama} (${d.cabang||'?'})`;
    ds.appendChild(opt);
  });
},

// ═══════════════════════════════════════════════════════════════
// NOTES:
// 1. Ganti 'ID_SPREADSHEET_INI' dengan actual Spreadsheet ID
// 2. Open browser console (F12) untuk lihat debug logs
// 3. Jika loadDriversFromOpensheet() jalan, berarti API.sheet() failing
// 4. Check spreadsheet tab names match (case-sensitive!)
// ═══════════════════════════════════════════════════════════════
