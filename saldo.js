// ═══════════ RIFIM Admin — Riwayat (Tab Riwayat) ═══════════
const Riwayat = {

  async init(){
    al('rwt-al','⏳ Memuat riwayat...','in');
    await Promise.allSettled([
      this.loadSaldo(),
      this.loadPotongan()
    ]);
    al('rwt-al','✅ Data riwayat dimuat!','ok');
    setTimeout(()=>{ const a=$('rwt-al'); if(a) a.style.display='none'; }, 2500);
  },

  // ── Riwayat Saldo (7 hari terakhir dari SAL>INPUT DOCK DB_TRANSAKSI) ──
  async loadSaldo(){
    const tb=$('rwt-sal-tb'), hd=$('rwt-sal-hd'), cnt=$('rwt-sal-cnt');
    if(!tb) return;
    tb.innerHTML='<tr><td colspan="7" class="tbl-empty">⏳ Memuat saldo 7 hari...</td></tr>';
    try{
      const all = await API.sheet(API.SAL,'DB_TRANSAKSI');
      // Filter 7 hari terakhir
      const cut = new Date(); cut.setDate(cut.getDate()-7);
      const data = all.filter(r=>{
        const ts = r['TIMESTAMP']||r['TRX_ID']||'';
        if(!ts) return true; // tampilkan semua jika tidak ada timestamp
        try{ return new Date(ts) >= cut; }catch{ return true; }
      });
      if(cnt) cnt.textContent = data.length + ' transaksi';
      if(!data.length){
        tb.innerHTML='<tr><td colspan="7" class="tbl-empty">Belum ada data saldo</td></tr>';
        return;
      }
      const cols=['TIMESTAMP','LOGIN_ID','NAMA','CABANG','JENIS','NOMINAL','ADMIN'];
      if(hd) hd.innerHTML='<tr>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr>';
      tb.innerHTML = data.slice(0,200).map(r=>`<tr>
        <td style="font-size:11px;font-family:var(--mono)">${r['TIMESTAMP']||'—'}</td>
        <td style="font-family:var(--mono);font-size:11px">${r['LOGIN_ID']||'—'}</td>
        <td>${r['NAMA']||'—'}</td>
        <td><span class="bdg bdg-ok" style="font-size:10px">${cabShort(r['CABANG']||'')}</span></td>
        <td style="color:var(--sky)">${r['JENIS']||'—'}</td>
        <td style="text-align:right;color:var(--gold);font-weight:700">${r['NOMINAL']?rup(Number(r['NOMINAL'])||0):'—'}</td>
        <td style="font-size:11px;color:var(--t2)">${r['ADMIN']||'—'}</td>
      </tr>`).join('');
    }catch(e){
      tb.innerHTML=`<tr><td colspan="7" class="tbl-empty">❌ ${e.message}</td></tr>`;
    }
  },

  // ── Riwayat Potongan (dari localStorage._pot_riwayat — diisi Database Potongan) ──
  async loadPotongan(){
    const tb=$('rwt-pot-tb'), hd=$('rwt-pot-hd'), cnt=$('rwt-pot-cnt');
    if(!tb) return;
    try{
      // Baca dari localStorage yang diisi saat "Tambah ke Riwayat" di Database Potongan
      const raw = localStorage.getItem('_pot_riwayat');
      const data = raw ? JSON.parse(raw) : [];
      if(cnt) cnt.textContent = data.length + ' transaksi';
      if(!data.length){
        tb.innerHTML='<tr><td colspan="9" class="tbl-empty">Belum ada data — klik "Tambah ke Riwayat" di Tab Database Potongan</td></tr>';
        return;
      }
      // Field names sesuai potongan.js entry: tgl, waktuAIST, waktuLive, loginId, drvNama, cabang, price, pot, net
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

  // ── Export Riwayat Potongan ke POT DB_Transaksi ──
  async exportPotongan(){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    const raw = localStorage.getItem('_pot_riwayat');
    const data = raw ? JSON.parse(raw) : [];
    if(!data.length){al('rwt-al','⚠️ Tidak ada data potongan untuk di-export!','wn');return;}
    al('rwt-al',`⏳ Menyimpan ${data.length} data ke POT DB_Transaksi...`,'in');
    try{
      // Schema POT DB_Transaksi: ID Cabang, Price, Login ID, Waktu Order, Offline?, Kode Opsional, Pembanding PKU, Nama Driver, Potongan Kantor, Hak Driver, Status, Waktu Input Admin
      const rows = data.map(e=>[
        e.cabang||'',
        e.price||0,
        e.loginId||'',
        e.waktuAIST||'',
        'FALSE',
        e.surcharge||'',
        '',
        e.drvNama||'',
        e.pot||0,
        e.net||0,
        'DONE',
        e.waktuLive||''
      ]);
      const res = await API.appendRows(API.POT,'DB_Transaksi',rows,false);
      if(res?.error) throw new Error(res.error);
      al('rwt-al',`✅ ${rows.length} data potongan berhasil di-export ke POT DB_Transaksi!`,'ok');
      // Clear localStorage setelah berhasil export
      setTimeout(()=>{
        localStorage.removeItem('_pot_riwayat');
        this.loadPotongan();
      }, 1200);
    }catch(e){al('rwt-al','❌ Gagal: '+e.message,'er');}
  },

  // ── Clear tampilan Riwayat Potongan ──
  clearPotongan(){
    if(!confirm('Hapus riwayat potongan dari tampilan dan localStorage?\n(Data di Google Sheet tidak terhapus)')) return;
    localStorage.removeItem('_pot_riwayat');
    this.loadPotongan();
    al('rwt-al','✅ Riwayat potongan di-clear!','ok');
  },

  // Backward compat (dipanggil dari Saldo references lama)
  loadAll(){ this.init(); },

  // Export Riwayat Saldo ke SAL DB_TRANSAKSI + Clear
  async exportSaldo(){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    const tb=$('rwt-sal-tb');
    if(!tb) return;
    const rows=[];
    tb.querySelectorAll('tr[data-row]').forEach(tr=>{
      const cells=[...tr.querySelectorAll('td')];
      if(cells.length>=6){
        rows.push(['', cells[0]?.textContent?.trim()||'',
          cells[1]?.textContent?.trim()||'',
          cells[2]?.textContent?.trim()||'',
          cells[3]?.textContent?.trim()||'',
          cells[4]?.textContent?.trim()||'',
          cells[5]?.textContent?.trim()||'', '', '', '']);
      }
    });
    if(!rows.length){alert('Tidak ada data untuk di-export!');return;}
    try{
      await API.appendRows(API.SAL,'DB_TRANSAKSI',rows,false);
      alert(`✅ ${rows.length} data Riwayat Saldo di-export ke SAL DB_TRANSAKSI`);
    }catch(e){alert('❌ Gagal: '+e.message);}
},

async exportPotongan(){

  if(!Auth.canEdit()){
    alert('Hanya Nabilla & Owner!');
    return;
  }

  const data = JSON.parse(
    localStorage.getItem('_pot_riwayat') || '[]'
  );

  if(!data.length){
    alert('Tidak ada data potongan!');
    return;
  }

  try{

    const rows = data.map(e=>[
      e.cabang || '',
      e.loginId || '',
      e.drvNama || '',
      e.waktuAIST || '',
      e.price || 0,
      e.pot || 0,
      e.net || 0,
      'DONE'
    ]);

    await API.appendRows(
      API.POT,
      'DB_TRANSAKSI',
      rows,
      false
    );

    alert(`✅ ${rows.length} data potongan berhasil di-export!`);

    localStorage.removeItem('_pot_riwayat');

    this.loadPotongan();

  }catch(err){

    alert('❌ Gagal export: ' + err.message);
  }
  },
// Clear semua cache Riwayat
clearRiwayat(){
  },

  // Clear semua cache Riwayat
  clearRiwayat(){
    if(!confirm('Hapus semua tampilan riwayat sesi ini?')) return;
    const tb1=$('rwt-sal-tb'), tb2=$('rwt-pot-tb');
    if(tb1) tb1.innerHTML='<tr><td colspan="7" class="tbl-empty">Sudah di-clear</td></tr>';
    if(tb2) tb2.innerHTML='<tr><td colspan="8" class="tbl-empty">Sudah di-clear</td></tr>';
    const c1=$('rwt-sal-cnt'), c2=$('rwt-pot-cnt');
    if(c1) c1.textContent='';
    if(c2) c2.textContent='';
  },
  raw:{ driver:[], transaksi:[], harian:[], rank:[] },
  filtered:{ transaksi:[], harian:[] }
};
// Alias supaya kode lama yang panggil Saldo masih jalan
const Saldo = Riwayat;
