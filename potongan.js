// ═══════════ RIFIM Admin — Database Potongan ═══════════
const Potongan = {
  data: [],
  allDrivers: [],   // gabungan airport + external
  driverMap: {},    // loginId -> {nama, cabang}

  // ── Rumus potongan LENGKAP per cabang (sesuai Google Sheets formula) ──
  // Parameter: cabang, price, waktuOrder (string), isMaxim, surcharge, jenisTarif, override
  hitung(cabang, price, waktuOrder, isMaxim, surcharge, jenisTarif, override){
    // Jika ada override manual, pakai itu + surcharge + maxim
    if(override && override!=='auto'){
      let pot=Number(override)||0;
      if(surcharge==='Y') pot+=10000;
      if(isMaxim) pot+=Math.round((Number(price)||0)*0.12); // +12% Maxim tetap dihitung
      return pot;
    }

    const p = Number(price)||0;
    const cab = cabang||'';
    let jam=0;

    // Parse waktu dari berbagai format: HH:MM:SS, HH:MM, dd.mm.yyyy HH:MM:SS
    const mTime=(waktuOrder||'').match(/(\d{1,2})[:.h](\d{2})(?:[:.h](\d{2}))?/);
    if(mTime) jam=parseInt(mTime[1])+parseInt(mTime[2])/60+(parseInt(mTime[3]||0)/3600);

    let pot=0;

    // ═══ RUMUS SESUAI SPREADSHEET ═══════════════════════
    if(cab==='ID Rifim Airport Balikpapan'){
      // =25000
      pot=25000;
    }
    else if(cab==='ID Rifim Airport Batam'){
      // =IF((waktu>=07:00)*(waktu<=18:30), IF(price>=70000,30000,20000), IF(price>=70000,25000,20000)) + IF(maxim,ROUND(price*12%),0)
      const siang=(jam>=7.0 && jam<=18.5);
      pot=siang?(p>=70000?30000:20000):(p>=70000?25000:20000);
      if(isMaxim) pot+=Math.round(p*0.12);
    }
    else if(cab==='ID Rifim Airport Manado'){
      // =25000 + IF(maxim,ROUND(price*12%),0)
      pot=25000;
      if(isMaxim) pot+=Math.round(p*0.12);
    }
    else if(cab==='ID Rifim Airport Pekanbaru'||cab==='ID Rifim Pekanbaru'){
      // =IF(tarif=1,35000, IF(tarif=3,20000, IF(tarif=2,35000+ROUND((G-B)*12%),0)))
      const tarif=Number(jenisTarif)||1;
      if(tarif===1)      pot=35000;
      else if(tarif===3) pot=20000;
      else if(tarif===2) pot=35000; // simplified
      else               pot=35000;
    }
    else if(cab==='ID Rifim Airport Jambi'){
      // =IF(price<70000,25000, IF(LOWER(tarif)="p",35000,25000)) + IF(maxim,ROUND(price*12%),0)
      const tarif=String(jenisTarif||'').toLowerCase();
      pot=p<70000?25000:(tarif==='p'?35000:25000);
      if(isMaxim) pot+=Math.round(p*0.12);
    }
    else if(cab==='ID Rifim Batam'||cab==='ID Rifim Jambi Luar'){
      // Non-airport: base per price
      pot=p>=70000?25000:20000;
      if(isMaxim) pot+=Math.round(p*0.12);
    }
    else {
      pot=0; // cabang tidak dikenal
    }

    // Surcharge opsional +10.000
    if(surcharge==='Y') pot+=10000;
    return pot;
  },

  // ── Load semua driver dari kedua sheet ────────────
  async loadDrivers(){
    this.allDrivers=[];
    this.driverMap={};
    try{
      // Load semua driver sekaligus dari SAL DB_DRIVER (lebih efisien — 1 request)
      const data = await API.sheet(API.SAL,'DB_DRIVER');
      data.forEach(r=>{
        const keys=Object.keys(r);
        const loginKey=keys.find(k=>/login.?id/i.test(k.trim())||k.trim()==='Login ID');
        const namaKey =keys.find(k=>/nama.?driver/i.test(k.trim())||k.trim()==='Nama Driver');
        const cabKey  =keys.find(k=>/^cabang/i.test(k.trim()));
        const loginId=(loginKey?r[loginKey]:'').toString().trim();
        const nama   =(namaKey ?r[namaKey] :'').toString().trim();
        const cabang =(cabKey  ?r[cabKey]  :'').toString().trim();
        if(loginId&&nama){
          this.allDrivers.push({loginId,nama,cabang});
          this.driverMap[loginId.toLowerCase()]={nama,cabang};
        }
      });
      console.log('Drivers loaded:',this.allDrivers.length,'dari SAL DB_DRIVER');
    }catch(e){
      console.warn('loadDrivers error:',e.message);
    }
    this.buildDriverSel();
  },

  buildDriverSel(){
    const sel=$('pot-driver'); if(!sel) return;
    sel.innerHTML='<option value="">— Pilih Driver (opsional) —</option>';
    this.allDrivers.forEach(d=>{
      const o=document.createElement('option');
      o.value=JSON.stringify({loginId:d.loginId,nama:d.nama,cabang:d.cabang});
      o.textContent=`${d.loginId} — ${d.nama}`;
      sel.appendChild(o);
    });
  },

  // ── Auto-fill saat input Login ID ─────────────────
  onLoginInput(){
    const loginEl=$('pot-loginid'); if(!loginEl) return;
    const raw=loginEl.value.trim();
    // AUTO-HAPUS browser autofill non-digit (misal "erp")
    if(raw && !/\d/.test(raw)){ loginEl.value=''; $('pot-driver-nama')&&($('pot-driver-nama').value=''); $('pot-cabang')&&($('pot-cabang').value=''); return; }
    if(!raw){ $('pot-driver-nama')&&($('pot-driver-nama').value=''); $('pot-cabang')&&($('pot-cabang').value=''); return; }
    // Handle format AIST: "173140630: Hendosra" → ambil ID saja
    const loginId = raw.includes(':') ? raw.split(':')[0].trim() : raw.trim();
    const val = loginId.toLowerCase();
    // Auto-fill nama dari AIST format jika tidak ada di driverMap
    const namaFromAIST = raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : '';
    const found=this.driverMap[val];
    if(found){
      const nm=$('pot-driver-nama'); if(nm) nm.value=found.nama;
      const cb=$('pot-cabang');
      if(cb&&found.cabang){ cb.value=found.cabang; this.preview(); }
    } else if(namaFromAIST){
      // Fallback: pakai nama dari paste AIST langsung
      const nm=$('pot-driver-nama'); if(nm) nm.value=namaFromAIST;
      console.log('[AUTO-FILL] Nama dari AIST:', namaFromAIST, '| ID:', loginId);
    }
  },

  onDriverChange(){
    const sel=$('pot-driver'); if(!sel||!sel.value) return;
    try{
      const d=JSON.parse(sel.value);
      const li=$('pot-loginid');  if(li) li.value=d.loginId||'';
      const nm=$('pot-driver-nama'); if(nm) nm.value=d.nama||'';
      const cb=$('pot-cabang');   if(cb&&d.cabang){ cb.value=d.cabang; }
      this.preview();
    }catch{}
  },

  // ── Preview kalkulasi ─────────────────────────────
  preview(){
    const price=Number($('pot-price')?.value)||0;
    const waktu=$('pot-waktu-aist')?.value||'';
    const cabang=$('pot-cabang')?.value||'';
    const maxim=$('pot-maxim')?.checked||false;
    const sur=$('pot-surcharge')?.value||'N';
    const override=$('pot-override')?.value||'auto';
    const tarif=$('pot-tarif')?.value||'1';
    const pb=$('pot-pvbox'); if(!pb) return;
    if(!price||!cabang){ pb.style.display='none'; return; }
    const pot=this.hitung(cabang,price,waktu,maxim,sur,tarif,override);
    st('pvPrice',rup(price)); st('pvPot',rup(pot)); st('pvNet',rup(price-pot));
    pb.style.display='block';
    // Update tombol copy
    const cpBtn=$('pot-copy'); if(cpBtn) cpBtn.setAttribute('data-val',pot);
  },

  copyPotongan(){
    const btn=$('pot-copy'); if(!btn) return;
    const val=btn.getAttribute('data-val')||'0';
    navigator.clipboard.writeText(val).then(()=>{
      const orig=btn.textContent; btn.textContent='✅ Copied!';
      setTimeout(()=>btn.textContent=orig,1500);
    }).catch(()=>{ alert('Potongan: Rp '+Number(val).toLocaleString('id-ID')); });
  },

  // ── Add entry ─────────────────────────────────────
  addEntry(){
    const loginId =$('pot-loginid')?.value?.trim();
    const price   =Number($('pot-price')?.value)||0;
    const waktuAIST=$('pot-waktu-aist')?.value?.trim()||'';
    const waktuLive=$('pot-waktu-live')?.textContent||new Date().toLocaleTimeString('id-ID');
    const cabang  =$('pot-cabang')?.value||'';
    const maxim   =$('pot-maxim')?.checked||false;
    const sur     =$('pot-surcharge')?.value||'N';
    const override=$('pot-override')?.value||'auto';
    const tarif   =$('pot-tarif')?.value||'1';
    const drvNama =$('pot-driver-nama')?.value?.trim()||'';

    if(!loginId){ al('pot-al','⚠️ Isi Login ID!','wn'); return; }
    if(!price){   al('pot-al','⚠️ Isi Price!','wn'); return; }
    if(!cabang){  al('pot-al','⚠️ Pilih Cabang!','wn'); return; }

    const pot=this.hitung(cabang,price,waktuAIST,maxim,sur,tarif,override);
    const e={
      id:uid(), tgl:today(), waktuAIST, waktuLive, loginId,
      drvNama, cabang, price, pot, net:price-pot, maxim, surcharge:sur,
      ts:new Date().toISOString()
    };
    this.data.unshift(e);
    this.saveToLS(); this.renderTable();
    this.clearForm();
    al('pot-al','✅ Berhasil ditambahkan!','ok');
    App.updateDashStats();
  },

  clearForm(){
    ['pot-loginid','pot-price','pot-waktu-aist'].forEach(id=>{const e=$(id);if(e)e.value='';});
    const d=$('pot-driver-nama');if(d)d.value='';
    const dr=$('pot-driver');if(dr)dr.value='';
    const m=$('pot-maxim');if(m)m.checked=false;
    const s=$('pot-surcharge');if(s)s.value='N';
    const ov=$('pot-override');if(ov)ov.value='auto';
    const pb=$('pot-pvbox');if(pb)pb.style.display='none';
  },

  deleteEntry(id){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    this.data=this.data.filter(e=>e.id!==id);
    this.saveToLS(); this.renderTable(); App.updateDashStats();
  },

  reset(){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    if(!confirm('Reset semua data Database Potongan?\n(Data di Sheet tidak terhapus)')) return;
    this.data=[]; this.saveToLS(); this.renderTable();
    al('pot-al','✅ Data direset','ok'); App.updateDashStats();
  },

  async saveToSheet(){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    if(!this.data.length){al('pot-al','⚠️ Tidak ada data!','wn');return;}
    al('pot-al','⏳ Menyimpan ke POT DB_Transaksi...','in');
    try{
      // Kolom sesuai schema POT>INPUT DOCK > DB_Transaksi:
      // ID Cabang | Price | Login ID | Waktu Order | Offline? | Kode Opsional | Pembanding PKU | Nama Driver | Potongan Kantor | Hak Driver | Status | Waktu Input Admin
      const rows=this.data.map(e=>[
        e.cabang||'',           // ID Cabang
        e.price||0,             // Price
        e.loginId||'',          // Login ID
        e.waktuAIST||'',        // Waktu Order
        'FALSE',                // Offline?
        '',                     // Kode Opsional
        '',                     // Pembanding PKU
        e.drvNama||'',          // Nama Driver
        e.pot||0,               // Potongan Kantor
        e.net||0,               // Hak Driver
        'DONE',                 // Status
        e.waktuLive||''         // Waktu Input Admin
      ]);
      const res=await API.appendRows(API.POT,'DB_Transaksi',rows,false);
      if(res?.error) throw new Error(res.error);
      al('pot-al',`✅ ${rows.length} baris tersimpan ke DB_Transaksi!`,'ok');
      ls.set('_ra_last_save',Date.now());
    }catch(e){al('pot-al','❌ Gagal: '+e.message,'er');}
  },

  exportPDF(){
    if(!this.data.length){alert('Tidak ada data!');return;}
    const rows=this.data.slice(0,200).map(e=>`<tr>
      <td>${e.tgl}</td><td>${e.waktuAIST||'—'}</td><td>${e.waktuLive||'—'}</td>
      <td>${e.loginId}</td><td>${e.drvNama||'—'}</td>
      <td>${cabShort(e.cabang)}</td>
      <td style="text-align:right;">${rup(e.price)}</td>
      <td style="text-align:right;color:#C62828;font-weight:700;">${rup(e.pot)}</td>
      <td style="text-align:right;color:#166534;">${rup(e.net)}</td>
      <td>${e.surcharge||'N'}</td></tr>`).join('');
    exportPDF('Riwayat Database Potongan',
      `<table><thead><tr><th>Tgl</th><th>Waktu AIST</th><th>Waktu Live</th><th>Login ID</th><th>Driver</th><th>Cabang</th><th>Price</th><th>Potongan</th><th>Net</th><th>Sur</th></tr></thead><tbody>${rows}</tbody></table>`);
  },

  // ── Render riwayat per cabang ──────────────────────
  renderTable(){
    const tgl=$('pot-filter-tgl')?.value||'';
    const drv=($('pot-filter-drv')?.value||'').toLowerCase();
    let data=this.data;
    if(tgl) data=data.filter(e=>e.tgl===tgl);
    if(drv) data=data.filter(e=>(e.drvNama+e.loginId).toLowerCase().includes(drv));

    // Group by cabang
    const groups={};
    data.forEach(e=>{
      const c=e.cabang||'Lainnya';
      if(!groups[c]) groups[c]=[];
      groups[c].push(e);
    });

    const container=$('pot-riwayat'); if(!container) return;
    if(!data.length){
      container.innerHTML='<div class="tbl-empty">Belum ada data — isi form di atas</div>';
      return;
    }

    container.innerHTML=Object.entries(groups).map(([cab,rows])=>`
      <div style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px 6px;">
          <span class="sec-lbl">${cabShort(cab)} <span style="background:var(--blue-l);color:var(--sky);padding:2px 8px;border-radius:100px;font-size:10px;margin-left:6px;">${rows.length}</span></span>
          <button class="btn btn-ok btn-sm rh" onclick="Potongan.saveTabToSheet('${cab}')" data-access="editor" style="font-size:10px;height:28px;">💾 Save Cabang</button>
        </div>
        <div class="tbl-wrap"><div class="tbl-scroll" style="max-height:280px;">
          <table class="tbl">
            <thead><tr><th>Tgl</th><th>Waktu AIST</th><th>Waktu Live</th><th>Login ID</th><th>Driver</th><th>Price</th><th>Potongan</th><th>Net</th><th>Sur</th><th></th></tr></thead>
            <tbody>${rows.map(e=>`<tr>
              <td style="font-size:11px;">${e.tgl}</td>
              <td style="font-size:11px;">${e.waktuAIST||'—'}</td>
              <td style="font-size:11px;color:var(--sky);">${e.waktuLive||'—'}</td>
              <td style="font-family:var(--mono);font-size:11px;">${e.loginId}</td>
              <td>${e.drvNama||'—'}</td>
              <td style="text-align:right;font-weight:600;">${rup(e.price)}</td>
              <td style="text-align:right;color:var(--err);font-weight:700;">${rup(e.pot)}</td>
              <td style="text-align:right;color:var(--ok);font-weight:700;">${rup(e.net)}</td>
              <td><span class="bdg ${e.surcharge==='Y'?'bdg-warn':'bdg-dim'}">${e.surcharge||'N'}</span></td>
              <td>${Auth.canEdit()?`<button class="btn btn-err btn-sm rh" style="height:24px;padding:0 8px;" onclick="Potongan.deleteEntry('${e.id}')">🗑</button>`:''}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div></div>
      </div>`).join('');
    // Update access buttons setelah render
    Auth.updateAccess();
  },

  async saveTabToSheet(cab){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    const rows=this.data.filter(e=>e.cabang===cab).map(e=>[
      e.tgl,e.waktuAIST||'',e.waktuLive||'',e.loginId,e.drvNama,cabShort(cab),e.price,e.pot,e.net,e.maxim?'Ya':'Tidak',e.surcharge||'N'
    ]);
    if(!rows.length){al('pot-al','⚠️ Tidak ada data untuk '+cabShort(cab),'wn');return;}
    al('pot-al','⏳ Menyimpan '+cabShort(cab)+'...','in');
    try{
      const r=await API.appendRows(API.SAL,'DB_TRANSAKSI',rows,false);
      if(r?.error) throw new Error(r.error);
      al('pot-al','✅ '+rows.length+' baris '+cabShort(cab)+' tersimpan!','ok');
    }catch(e){al('pot-al','❌ '+e.message,'er');}
  },

  // ── Init ──────────────────────────────────────────
  init(){
    this.buildCabangSel();
    this.loadFromLS();
    this.renderTable();
    this.loadDrivers();
    this.startLiveClock();
  },

  buildCabangSel(){
    const cs=$('pot-cabang'); if(!cs||cs.options.length>1) return;
    cs.innerHTML='<option value="">— Pilih Cabang —</option>';
    CABANG.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=cabShort(c);cs.appendChild(o);});
  },

  startLiveClock(){
    const el=$('pot-waktu-live'); if(!el) return;
    const u=()=>{ el.textContent=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'}); };
    u(); setInterval(u,1000);
  },

  saveToLS(){
    const now=Date.now();
    // Simpan 30 hari
    this.data=this.data.filter(e=>(now-new Date(e.ts||e.tgl+'T00:00').getTime())<30*864e5);
    ls.set('_ra_pot',this.data);
  },

  loadFromLS(){
    const saved=ls.get('_ra_pot')||[];
    const now=Date.now();
    this.data=saved.filter(e=>(now-new Date(e.ts||e.tgl+'T00:00').getTime())<30*864e5);
    const lastSave=ls.get('_ra_last_save')||0;
    if(now-lastSave>3*864e5&&this.data.length) this.saveToSheet();
  }
};
