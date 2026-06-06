// ═══════════ RIFIM Admin — Setting ═══════════
const Setting = {
  async init(){
    this.buildCabang();
    this.buildPwList();
    this.buildOwnerInfo();
    // Load driver SAL by default
    this.loadDriversSAL();
  },

  buildCabang(){
    const el=$('set-cab-list'); if(!el) return;
    el.innerHTML=CABANG.map((c,i)=>`
      <div class="li rh" style="cursor:pointer;"
        onclick="window.open('https://docs.google.com/spreadsheets/d/${API.SAL}/edit','_blank')">
        <div class="li-av">${['✈️','✈️','✈️','✈️','✈️','🏢','🏢'][i]||'🏢'}</div>
        <div class="li-main">
          <div class="li-title">${c}</div>
          <div class="li-sub">Cabang aktif RIFIM</div>
        </div>
        <span class="bdg bdg-ok">AKTIF</span>
      </div>`).join('');
  },

  async loadDriversSAL(){
    this.setDrvHeader('DB_DRIVER — File SAL',
      `https://docs.google.com/spreadsheets/d/${API.SAL}/edit`);
    const hd=$('set-drv-hd'),tb=$('set-drv-tb'); if(!tb) return;
    tb.innerHTML='<tr><td colspan="6" class="tbl-empty">⏳ Memuat...</td></tr>';
    try{
      const d=await API.sheet(API.SAL,'DB_DRIVER');
      this.renderDrvTable(d);
    }catch(e){if(tb)tb.innerHTML=`<tr><td colspan="6" class="tbl-empty">❌ ${e.message}</td></tr>`;}
  },

  async loadDriversAirport(){
    this.setDrvHeader('Database Driver Airport — Semua Cabang',
      'https://docs.google.com/spreadsheets/d/1FEZxyHPx_GCQKw92hLSf6QxxkXgZn5R1sRswOYM_Tlc/edit');
    const tb=$('set-drv-tb'); if(!tb) return;
    tb.innerHTML='<tr><td colspan="6" class="tbl-empty">⏳ Memuat dari 5 sheet...</td></tr>';
    const sheets=[
      {s:'ID Rifim Airport Batam',     label:'✈ Batam'},
      {s:'ID Rifim Airport Jambi',     label:'✈ Jambi'},
      {s:'ID Rifim Airport Balikpapan',label:'✈ Balikpapan'},
      {s:'ID Rifim Airport Manado',    label:'✈ Manado'},
      {s:'ID Rifim Airport Pekanbaru', label:'✈ Pekanbaru'},
    ];
    let all=[];
    for(const sh of sheets){
      try{
        const d=await API.sheet(API.DRV_AIRPORT,sh.s);
        d.forEach(r=>{ r['_Cabang_']=sh.label; all.push(r); });
      }catch(e){console.warn('Airport '+sh.s+':',e.message);}
    }
    this.renderDrvTable(all);
  },

  async loadDriversExternal(){
    this.setDrvHeader('Database Driver External',
      'https://docs.google.com/spreadsheets/d/1suoDC-RsWOgTHiLq4max6iIsWe39Ou-RMddRXl5DVJc/edit');
    const tb=$('set-drv-tb'); if(!tb) return;
    tb.innerHTML='<tr><td colspan="6" class="tbl-empty">⏳ Memuat...</td></tr>';
    let all=[];
    const sheets=[
      {s:'ID Rifim Batam',     label:'🏢 Batam'},
      {s:'ID Rifim Jambi Luar',label:'🏢 Jambi Luar'},
    ];
    for(const sh of sheets){
      try{
        const d=await API.sheet(API.DRV_EXTERNAL,sh.s);
        d.forEach(r=>{ r['_Cabang_']=sh.label; all.push(r); });
      }catch(e){console.warn('Ext '+sh.s+':',e.message);}
    }
    this.renderDrvTable(all);
  },

  setDrvHeader(title, url){
    st('set-drv-title', title);
    const link=$('set-drv-link');
    if(link){ link.href=url||'#'; link.style.display=url?'inline-flex':'none'; }
  },

  renderDrvTable(data){
    const hd=$('set-drv-hd'), tb=$('set-drv-tb');
    if(!tb) return;
    if(!data||!data.length){
      tb.innerHTML='<tr><td colspan="6" class="tbl-empty">Tidak ada data</td></tr>';
      return;
    }
    const keys=Object.keys(data[0]).slice(0,6);
    if(hd) hd.innerHTML='<tr>'+keys.map(k=>`<th>${k}</th>`).join('')+'</tr>';
    tb.innerHTML=data.slice(0,200).map(r=>'<tr>'+keys.map((k,i)=>`
      <td style="${i===0?'font-family:var(--mono);font-size:11px;':'font-size:12px;'}">${r[k]||'—'}</td>`
    ).join('')+'</tr>').join('');
  },

  buildPwList(){
    const el=$('set-pw-list'); if(!el) return;
    if(!Auth.canEdit()){
      el.innerHTML='<p style="padding:16px;color:var(--t2);font-size:13px;">Hanya Nabilla & Owner.</p>';
      return;
    }
    el.innerHTML=Auth.USERS.filter(u=>u.role!=='owner').map(u=>`
      <div class="li">
        <div class="li-av">${u.nama[0]}</div>
        <div class="li-main">
          <div class="li-title">${u.nama}</div>
          <div class="li-sub">${u.jabatan}</div>
        </div>
        <span style="font-family:var(--mono);font-size:11px;color:var(--t3);">${'•'.repeat(Math.min(u.pw.length,8))}</span>
      </div>`).join('');
    const sel=$('set-pw-sel');
    if(sel){
      sel.innerHTML='<option value="">— Pilih Staff —</option>';
      Auth.USERS.filter(u=>u.role!=='owner').forEach(u=>{
        const o=document.createElement('option');o.value=u.nama;o.textContent=u.nama;sel.appendChild(o);
      });
    }
  },

  savePw(){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    const nm=$('set-pw-sel')?.value;
    const pw=$('set-pw-inp')?.value?.trim();
    if(!nm){al('set-pw-al','⚠️ Pilih staff!','wn');return;}
    if(!pw||pw.length<6){al('set-pw-al','⚠️ Min 6 karakter!','wn');return;}
    const u=Auth.USERS.find(x=>x.nama===nm);
    if(!u){al('set-pw-al','❌ Tidak ditemukan','er');return;}
    u.pw=pw;
    if($('set-pw-inp')) $('set-pw-inp').value='';
    this.buildPwList();
    al('set-pw-al','✅ Password '+nm+' diubah!','ok');
  },

  buildOwnerInfo(){
    const el=$('set-owner-info'); if(!el) return;
    if(!Auth.isOwner()){
      el.innerHTML='<p style="padding:16px;color:var(--t2);font-size:13px;">Hanya Owner/Bobby yang bisa akses.</p>';
      return;
    }
    el.innerHTML=`
      <div class="li"><div class="li-av">👤</div>
        <div class="li-main"><div class="li-title">Bobby Rahman Maholi Berutu</div>
        <div class="li-sub">Direktur Utama — PT. Rifim International Gemilang</div></div>
      </div>
      <div class="li"><div class="li-av">🏢</div>
        <div class="li-main"><div class="li-title">7 Cabang Aktif</div>
        <div class="li-sub" style="white-space:normal;">${CABANG.join(' · ')}</div></div>
      </div>
      <div class="li rh" style="cursor:pointer" onclick="window.open('https://drive.google.com/drive/folders/${API.DRIVE}','_blank')">
        <div class="li-av">📁</div>
        <div class="li-main"><div class="li-title">Google Drive Root</div>
        <div class="li-sub">Folder penyimpanan utama RIFIM</div></div>
        <span style="color:var(--t3)">›</span>
      </div>
      <div class="li rh" style="cursor:pointer"
        onclick="window.open('https://docs.google.com/spreadsheets/d/${API.DRV_AIRPORT}/edit','_blank')">
        <div class="li-av">✈️</div>
        <div class="li-main"><div class="li-title">Database Driver Airport</div>
        <div class="li-sub">ID: ${API.DRV_AIRPORT}</div></div>
        <span style="color:var(--t3)">›</span>
      </div>
      <div class="li rh" style="cursor:pointer"
        onclick="window.open('https://docs.google.com/spreadsheets/d/${API.DRV_EXTERNAL}/edit','_blank')">
        <div class="li-av">🏢</div>
        <div class="li-main"><div class="li-title">Database Driver External</div>
        <div class="li-sub">ID: ${API.DRV_EXTERNAL}</div></div>
        <span style="color:var(--t3)">›</span>
      </div>`;
  },

  loadDrivers(){ this.loadDriversSAL(); }
};
