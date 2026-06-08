// ═══════════ RIFIM Admin — Riwayat (Tab Riwayat) ═══════════
const Riwayat = {

  async init(){
    al('rwt-al','⏳ Memuat riwayat...','in');
    await Promise.allSettled([
      this.loadSaldoDb(),
      this.loadPotongan()
    ]);
    const a=$('rwt-al'); if(a) a.style.display='none';
  },

  // ══════════════════════════════════════════════════════
  // SECTION 1: RIWAYAT DATABASE SALDO
  // Baca dari localStorage._sal_riwayat (diisi oleh Database Saldo tab)
  // ══════════════════════════════════════════════════════
  async loadSaldoDb(){
    const tb=$('rwt-sal-tb'), hd=$('rwt-sal-hd'), cnt=$('rwt-sal-cnt');
    if(!tb) return;
    try{
      const raw = localStorage.getItem('_sal_riwayat');
      const data = raw ? JSON.parse(raw) : [];
      if(cnt) cnt.textContent = data.length + ' transaksi';
      if(!data.length){
        tb.innerHTML='<tr><td colspan="8" class="tbl-empty">Belum ada data — klik "Tambah Saldo" di Tab Database Saldo</td></tr>';
        return;
      }
      // Kolom sesuai SAL DB_TRANSAKSI: Waktu AIST | LOGIN ID | NAMA | CABANG | JENIS | NOMINAL | WAKTU LIVE
      const cols=['TGL','WAKTU AIST','LOGIN ID','NAMA','CABANG','JENIS','NOMINAL','WAKTU LIVE'];
      if(hd) hd.innerHTML='<tr>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr>';
      tb.innerHTML = data.slice(0,300).map(e=>`<tr>
        <td style="font-size:11px;color:var(--t2)">${e.tgl||'—'}</td>
        <td style="font-size:11px;font-family:var(--mono)">${e.waktuAIST||'—'}</td>
        <td style="font-family:var(--mono);font-size:11px">${e.loginId||'—'}</td>
        <td>${e.nama||'—'}</td>
        <td><span class="bdg bdg-ok" style="font-size:10px">${e.cabang||'—'}</span></td>
        <td style="color:var(--sky);font-size:11px">Saldo Top-Up</td>
        <td style="text-align:right;color:var(--gold);font-weight:700">${rup(Number(e.nomPlus)||0)}</td>
        <td style="font-size:11px;color:var(--sky)">${e.waktuLive||'—'}</td>
      </tr>`).join('');
    }catch(e){
      tb.innerHTML=`<tr><td colspan="8" class="tbl-empty">❌ ${e.message}</td></tr>`;
    }
  },

  // Export Database Saldo → SAL DB_TRANSAKSI
  // Format: TRX_ID | Waktu AIST | LOGIN_ID | NAMA | CABANG | JENIS | NOMINAL | ADMIN | Waktu Live
  async exportSaldoDb(){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    const raw = localStorage.getItem('_sal_riwayat');
    const data = raw ? JSON.parse(raw) : [];
    if(!data.length){al('rwt-al','⚠️ Tidak ada data Database Saldo untuk di-export!','wn');return;}
    al('rwt-al',`⏳ Export ${data.length} data ke SAL DB_TRANSAKSI...`,'in');
    try{
      // Schema SAL DB_TRANSAKSI: TRX_ID, Waktu AIST, LOGIN_ID, NAMA, CABANG, JENIS, NOMINAL, ADMIN, Waktu Live
      const rows = data.map(e=>[
        '',               // TRX_ID (auto)
        e.waktuAIST||'', // Waktu AIST (paste dari AIST)
        e.loginId||'',   // LOGIN_ID
        e.nama||'',      // NAMA
        e.cabang||'',    // CABANG
        'Saldo Top-Up',  // JENIS
        e.nomPlus||0,    // NOMINAL
        '',              // ADMIN
        e.waktuLive||''  // Waktu Live ← IKUT DIKIRIM
      ]);
      const res = await API.appendRows(API.SAL,'DB_TRANSAKSI',rows,false);
      if(res?.error) throw new Error(res.error);
      al('rwt-al',`✅ ${rows.length} data saldo berhasil di-export ke SAL DB_TRANSAKSI!`,'ok');
      setTimeout(()=>{
        localStorage.removeItem('_sal_riwayat');
        this.loadSaldoDb();
      }, 1200);
    }catch(e){al('rwt-al','❌ Gagal: '+e.message,'er');}
  },

  clearSaldoDb(){
    if(!confirm('Hapus riwayat Database Saldo dari tampilan?\n(Data di Google Sheet tidak terhapus)')) return;
    localStorage.removeItem('_sal_riwayat');
    this.loadSaldoDb();
    al('rwt-al','✅ Riwayat Database Saldo di-clear!','ok');
  },

  // ══════════════════════════════════════════════════════
  // SECTION 2: RIWAYAT DATABASE POTONGAN
  // Baca dari localStorage._pot_riwayat (diisi oleh Database Potongan tab)
  // ══════════════════════════════════════════════════════
  async loadPotongan(){
    const tb=$('rwt-pot-tb'), hd=$('rwt-pot-hd'), cnt=$('rwt-pot-cnt');
    if(!tb) return;
    try{
      const raw = localStorage.getItem('_pot_riwayat');
      const data = raw ? JSON.parse(raw) : [];
      if(cnt) cnt.textContent = data.length + ' transaksi';
      if(!data.length){
        tb.innerHTML='<tr><td colspan="9" class="tbl-empty">Belum ada data — klik "Tambah ke Riwayat" di Tab Database Potongan</td></tr>';
        return;
      }
      const cols=['TGL','WAKTU AIST','WAKTU LIVE','LOGIN ID','DRIVER','CABANG','PRICE','POTONGAN','NET'];
      if(hd) hd.innerHTML='<tr>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr>';
      tb.innerHTML = data.slice(0,300).map(e=>`<tr>
        <td style="font-size:11px;color:var(--t2)">${e.tgl||'—'}</td>
        <td style="font-size:11px;font-family:var(--mono)">${e.waktuAIST||'—'}</td>
        <td style="font-size:11px;color:var(--sky)">${e.waktuLive||'—'}</td>
        <td style="font-family:var(--mono);font-size:11px">${e.loginId||'—'}</td>
        <td style="font-size:12px">${e.drvNama||'—'}</td>
        <td style="font-size:11px">${e.cabang||'—'}</td>
        <td style="text-align:right;font-size:12px">${rup(Number(e.price)||0)}</td>
        <td style="text-align:right;color:var(--red);font-weight:700">${rup(Number(e.pot)||0)}</td>
        <td style="text-align:right;color:var(--ok)">${rup(Number(e.net)||0)}</td>
      </tr>`).join('');
    }catch(e){
      tb.innerHTML=`<tr><td colspan="9" class="tbl-empty">❌ ${e.message}</td></tr>`;
    }
  },

  // Export Database Potongan → POT DB_Transaksi
  // Schema: Id Cabang | Id Login | Nama Driver | Waktu Order | Waktu Live | Tarif | Total Potongan | Bersih driver | Status
  async exportPotongan(){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    const raw = localStorage.getItem('_pot_riwayat');
    const data = raw ? JSON.parse(raw) : [];
    if(!data.length){al('rwt-al','⚠️ Tidak ada data potongan untuk di-export!','wn');return;}
    al('rwt-al',`⏳ Export ${data.length} data ke POT DB_Transaksi...`,'in');
    try{
      // Schema POT DB_Transaksi (dari screenshot): Id Cabang, Id Login, Nama Driver, Waktu Order, Waktu Live, Tarif, Total Potongan, Bersih driver, Status
      const rows = data.map(e=>[
        e.cabang||'',      // Id Cabang
        e.loginId||'',     // Id Login
        e.drvNama||'',     // Nama Driver
        e.waktuAIST||'',   // Waktu Order
        e.waktuLive||'',   // Waktu Live ← SEKARANG IKUT
        e.price||0,        // Tarif
        e.pot||0,          // Total Potongan
        e.net||0,          // Bersih driver
        'DONE'             // Status
      ]);
      const res = await API.appendRows(API.POT,'DB_Transaksi',rows,false);
      if(res?.error) throw new Error(res.error);
      al('rwt-al',`✅ ${rows.length} data potongan berhasil di-export ke POT DB_Transaksi!`,'ok');
      setTimeout(()=>{
        localStorage.removeItem('_pot_riwayat');
        this.loadPotongan();
      }, 1200);
    }catch(e){al('rwt-al','❌ Gagal: '+e.message,'er');}
  },

  clearPotongan(){
    if(!confirm('Hapus riwayat Database Potongan dari tampilan?\n(Data di Google Sheet tidak terhapus)')) return;
    localStorage.removeItem('_pot_riwayat');
    this.loadPotongan();
    al('rwt-al','✅ Riwayat Database Potongan di-clear!','ok');
  },

  // Backward compat
  loadAll(){ this.init(); },
  raw:{ driver:[], transaksi:[], harian:[], rank:[] },
  filtered:{ transaksi:[], harian:[] }
};
const Saldo = Riwayat;
