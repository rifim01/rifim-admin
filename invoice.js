// ═══════════ RIFIM Admin — Invoice (Disederhanakan) ═══════════
const Invoice = {
  data: null,

  async generate(){
    const cab=$('inv-cab')?.value;
    const tgl=$('inv-tgl')?.value;
    if(!cab){al('inv-al','⚠️ Pilih cabang!','wn');return;}
    if(!tgl){al('inv-al','⚠️ Pilih tanggal!','wn');return;}
    al('inv-al','⏳ Memuat data...','in');

    // Format tanggal untuk filter (yyyy-mm-dd)
    const tglFmt = tgl; // input type=date sudah format yyyy-mm-dd
    const tglDisp = new Date(tgl).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});

    try{
      // Load dari POT>INPUT DOCK DB_Transaksi
      const allPot = await API.sheet(API.POT,'DB_Transaksi');

      // Filter by cabang dan tanggal
      // Waktu Order format: "5/22/2026 2:36:00" atau "22/05/2026 02:36:00"
      const potD = allPot.filter(r=>{
        const rcab = (r['ID Cabang']||'').trim();
        if(rcab !== cab) return false;
        const wo = r['Waktu Order']||r['Waktu Input Admin']||'';
        // Coba parse tanggal dari Waktu Order
        try{
          const d = new Date(wo);
          const d2 = d.toISOString().split('T')[0]; // yyyy-mm-dd
          return d2 === tglFmt;
        }catch{ return false; }
      });

      const totalPot   = potD.reduce((s,r)=>s+(Number(r['Potongan Kantor'])||0),0);
      const totalPrice = potD.reduce((s,r)=>s+(Number(r['Price'])||0),0);
      const totalNet   = potD.reduce((s,r)=>s+(Number(r['Hak Driver'])||0),0);

      this.data = {cab,tglFmt,tglDisp,potD,totalPot,totalPrice,totalNet};

      // Update header invoice
      st('invCab',   cabShort(cab));
      st('invBln',   tglDisp);
      st('invTrxPot',potD.length);
      st('invTrxSal','—');
      st('invTotalPot',rup(totalPot));
      st('invDate',  new Date().toLocaleDateString('id-ID'));

      // Tabel detail orderan
      $('invBody').innerHTML = potD.length === 0
        ? `<tr><td colspan="4" style="text-align:center;padding:16px;color:var(--t2)">Tidak ada data untuk ${cabShort(cab)} tanggal ${tglDisp}</td></tr>`
        : potD.map((r,i)=>`<tr>
            <td style="text-align:center">${i+1}</td>
            <td>${r['Nama Driver']||r['Login ID']||'—'}</td>
            <td style="text-align:right">${rup(Number(r['Price'])||0)}</td>
            <td style="text-align:right;color:var(--red);font-weight:700">${rup(Number(r['Potongan Kantor'])||0)}</td>
          </tr>`).join('') +
          `<tr style="border-top:2px solid var(--t3);font-weight:700">
            <td colspan="2" style="text-align:right">TOTAL (${potD.length} order)</td>
            <td style="text-align:right">${rup(totalPrice)}</td>
            <td style="text-align:right;color:var(--red)">${rup(totalPot)}</td>
          </tr>`;

      const pv=$('inv-preview'),em=$('inv-empty');
      if(pv) pv.style.display='block';
      if(em) em.style.display='none';
      al('inv-al',`✅ ${potD.length} order ditemukan untuk ${cabShort(cab)} — ${tglDisp}`,'ok');
    }catch(e){
      al('inv-al','❌ Error: '+e.message,'er');
    }
  },

  async saveToSheet(){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    if(!this.data){al('inv-al','⚠️ Generate dulu!','wn');return;}
    al('inv-al','⏳ Menyimpan ke DB_LAPORAN_CABANG...','in');
    try{
      const {cab,tglDisp,potD,totalPot,totalNet}=this.data;
      const rows=[
        [today(),cab,tglDisp,'POT',potD.length,rup(totalPot)],
        [today(),cab,tglDisp,'NET','—',rup(totalNet)],
      ];
      const r=await API.appendRows(API.SAL,'DB_LAPORAN_CABANG',rows);
      if(r?.error) throw new Error(r.error);
      al('inv-al','✅ Tersimpan ke DB_LAPORAN_CABANG!','ok');
    }catch(e){al('inv-al','❌ Gagal: '+e.message,'er');}
  },

  exportPDF(){
    if(!this.data){alert('Generate dulu!');return;}
    const doc=$('invDoc');
    if(!doc) return;
    exportPDF(`Invoice ${cabShort(this.data.cab)} — ${this.data.tglDisp}`,doc.innerHTML,false);
  },

  reset(){
    this.data=null;
    const pv=$('inv-preview'),em=$('inv-empty');
    if(pv) pv.style.display='none';
    if(em) em.style.display='block';
    al('inv-al','','ok');
  }
};
