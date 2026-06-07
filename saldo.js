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

  // ── Riwayat Potongan (dari POT>INPUT DOCK DB_Transaksi) ──
  async loadPotongan(){
    const tb=$('rwt-pot-tb'), hd=$('rwt-pot-hd'), cnt=$('rwt-pot-cnt');
    if(!tb) return;
    tb.innerHTML='<tr><td colspan="8" class="tbl-empty">⏳ Memuat riwayat potongan...</td></tr>';
    try{
      const data = await API.sheet(API.POT,'DB_Transaksi');
      if(cnt) cnt.textContent = data.length + ' transaksi';
      if(!data.length){
        tb.innerHTML='<tr><td colspan="8" class="tbl-empty">Belum ada data potongan</td></tr>';
        return;
      }
      const cols=['ID Cabang','Login ID','Nama Driver','Waktu Order','Price','Potongan Kantor','Hak Driver','Status'];
      if(hd) hd.innerHTML='<tr>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr>';
      tb.innerHTML = data.slice(0,200).map(r=>`<tr>
        <td><span class="bdg bdg-ok" style="font-size:10px">${cabShort(r['ID Cabang']||'')}</span></td>
        <td style="font-family:var(--mono);font-size:11px">${r['Login ID']||'—'}</td>
        <td>${r['Nama Driver']||'—'}</td>
        <td style="font-size:11px;font-family:var(--mono)">${r['Waktu Order']||'—'}</td>
        <td style="text-align:right">${r['Price']?rup(Number(r['Price'])||0):'—'}</td>
        <td style="text-align:right;color:var(--red);font-weight:700">${r['Potongan Kantor']?rup(Number(r['Potongan Kantor'])||0):'—'}</td>
        <td style="text-align:right;color:var(--ok)">${r['Hak Driver']?rup(Number(r['Hak Driver'])||0):'—'}</td>
        <td><span class="bdg ${r['Status']==='DONE'?'bdg-ok':'bdg-wn'}" style="font-size:10px">${r['Status']||'—'}</span></td>
      </tr>`).join('');
    }catch(e){
      tb.innerHTML=`<tr><td colspan="8" class="tbl-empty">❌ ${e.message}</td></tr>`;
    }
  },

  // Backward compat (dipanggil dari Saldo references lama)
  loadAll(){ this.init(); },
  raw:{ driver:[], transaksi:[], harian:[], rank:[] },
  filtered:{ transaksi:[], harian:[] }
};
// Alias supaya kode lama yang panggil Saldo masih jalan
const Saldo = Riwayat;
