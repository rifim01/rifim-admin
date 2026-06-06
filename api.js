// ═══════════ RIFIM Admin — API ═══════════
const API = {
  GAS:    'https://script.google.com/macros/s/AKfycbzd_X11jphLlMTGQYqDTcqbjjoJ1aizeoAY7-9ks5f1S2ZaDJqcRsuKR4FCluET1l65/exec',

  // ── Spreadsheet IDs (DIPERBAIKI - typo I vs l) ──
  SAL:          '1Qhwg1MB4IWqcWZJliGOlxh6q9AFrGyP7ElCvFVOIXoY',  // SAL>INPUT DOCK  ✅ fix: EIC→ElC
  POT:          '14Nr1vRwnNVUEjmhtqZkzu29UsvCj02Gwn5RfBU6rU-E',  // POT>INPUT DOCK  ✅ baru
  STAFF:        '1fcraq3QHqIaD-13Ebzt6stT9aA6j_loTXeAtpNX12kw',
  DRV_AIRPORT:  '1FEZxyHPx_GCQKw92hLSf6QxxkXgZn5R1sRswOYM_TIc', // DB Driver Airport ✅ fix: Tlc→TIc
  DRV_EXTERNAL: '1suoDC-RsWOgTHiLq4max6ilsWe39Ou-RMddRXl5DVJc',  // DB Driver External ✅ fix: iIs→ils
  DRIVE:        '1hSeERvZrHQtBP_9tWqw87fqQfy2wiBS4',
  OS:           'https://opensheet.elk.sh',

  async sheet(sheetId, name){
    const r = await fetch(`${this.OS}/${sheetId}/${encodeURIComponent(name)}`,
      {signal: AbortSignal.timeout(10000)});
    if(!r.ok) throw new Error('HTTP '+r.status);
    const d = await r.json();
    if(d.error) throw new Error(typeof d.error==='string'?d.error:'Sheet error');
    return Array.isArray(d) ? d : [];
  },

  async post(body){
    const r = await fetch(this.GAS, {
      method:'POST', headers:{'Content-Type':'text/plain'},
      body: JSON.stringify(body), signal: AbortSignal.timeout(15000)
    });
    const t = await r.text();
    try{ return JSON.parse(t); }catch{ return {success:true}; }
  },

  async appendRows(sheetId, sheetName, rows, clearFirst=false){
    return this.post({action:'appendRows', sheetId, sheetName, rows, clearFirst});
  }
};
