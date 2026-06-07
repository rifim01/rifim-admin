// ═══════════ RIFIM Admin — Invoice (Disederhanakan) ═══════════
const Invoice = {
  data: null,

  async generate(){
    const cab=$('inv-cab')?.value;
    const tgl=$('inv-tgl')?.value;
    if(!cab){al('inv-al','⚠️ Pilih cabang!','wn');return;}
    if(!tgl){al('inv-al','⚠️ Pilih tanggal!','wn');return;}
    al('inv-al','⏳ Memuat data potongan & saldo...','in');
    const tglFmt = tgl;
    const tglDisp = new Date(tgl).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});

    try{
      // Load dari POT DB_Transaksi (potongan)
      let potD = [];
      try{
        const allPot = await API.sheet(API.POT,'DB_Transaksi');
        potD = allPot.filter(r=>{
          if((r['ID Cabang']||'').trim() !== cab) return false;
          const wo = r['Waktu Order']||r['Waktu Input Admin']||'';
          try{ return new Date(wo).toISOString().split('T')[0] === tglFmt; }catch{ return false; }
        });
      }catch(e){ console.warn('POT load:',e.message); }

      // Load dari SAL DB_TRANSAKSI (saldo top-up)
      let salD = [];
      try{
        const allSal = await API.sheet(API.SAL,'DB_TRANSAKSI');
        salD = allSal.filter(r=>{
          if((r['CABANG']||'').trim() !== cab) return false;
          const ts = r['TIMESTAMP']||'';
          try{ return new Date(ts).toISOString().split('T')[0] === tglFmt; }catch{ return false; }
        });
      }catch(e){ console.warn('SAL load:',e.message); }

      const totalPot   = potD.reduce((s,r)=>s+(Number(r['Potongan Kantor'])||0),0);
      const totalPrice = potD.reduce((s,r)=>s+(Number(r['Price'])||0),0);
      const totalNet   = potD.reduce((s,r)=>s+(Number(r['Hak Driver'])||0),0);
      const totalSalFee= salD.length * 5000;

      this.data = {cab,tglFmt,tglDisp,potD,salD,totalPot,totalPrice,totalNet,totalSalFee};

      st('invCab',   cabShort(cab));
      st('invBln',   tglDisp);
      st('invTrxPot',potD.length);
      st('invTrxSal',salD.length);
      st('invTotalPot',rup(totalPot));
      st('invDate',  new Date().toLocaleDateString('id-ID'));

      // Tabel potongan
      const potRows = potD.length === 0
        ? `<tr><td colspan="4" style="text-align:center;padding:12px;color:var(--t2)">Tidak ada data potongan untuk ${cabShort(cab)} — ${tglDisp}</td></tr>`
        : potD.map((r,i)=>`<tr>
            <td style="text-align:center">${i+1}</td>
            <td>${r['Nama Driver']||r['Login ID']||'—'}</td>
            <td style="text-align:right">${rup(Number(r['Price'])||0)}</td>
            <td style="text-align:right;color:var(--red);font-weight:700">${rup(Number(r['Potongan Kantor'])||0)}</td>
          </tr>`).join('') +
          `<tr style="border-top:2px solid var(--t3);font-weight:700">
            <td colspan="2" style="text-align:right">TOTAL POTONGAN (${potD.length} order)</td>
            <td style="text-align:right">${rup(totalPrice)}</td>
            <td style="text-align:right;color:var(--red)">${rup(totalPot)}</td>
          </tr>`;

      // Tabel saldo
      const salRows = salD.length === 0
        ? ''
        : `<tr><td colspan="4" style="padding:8px;font-weight:700;color:var(--gold);">TOP-UP SALDO (${salD.length} transaksi — Fee Rp 5.000/transaksi = ${rup(totalSalFee)})</td></tr>`
        + salD.map((r,i)=>`<tr>
            <td style="text-align:center">${i+1}</td>
            <td>${r['NAMA']||r['LOGIN_ID']||'—'}</td>
            <td style="text-align:right">${rup(Number(r['NOMINAL'])||0)}</td>
            <td style="text-align:right;color:var(--gold);">Rp 5.000</td>
          </tr>`).join('') +
          `<tr style="border-top:2px solid var(--t3);font-weight:700">
            <td colspan="2" style="text-align:right">TOTAL FEE SALDO (${salD.length} TRX)</td>
            <td></td>
            <td style="text-align:right;color:var(--gold)">${rup(totalSalFee)}</td>
          </tr>`;

      $('invBody').innerHTML = potRows + salRows;
      const pv=$('inv-preview'),em=$('inv-empty');
      if(pv) pv.style.display='block';
      if(em) em.style.display='none';
      al('inv-al',`✅ ${potD.length} potongan + ${salD.length} saldo untuk ${cabShort(cab)} — ${tglDisp}`,'ok');
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
