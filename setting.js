// ═══════════ RIFIM Admin — Setting ═══════════
const Setting = {
  async init(){
    this.buildCabang();
    await this.loadDrivers();
    this.buildPwList();
    this.buildOwnerInfo();
  },

  buildCabang(){
    const el=$('set-cab-list'); if(!el) return;
    el.innerHTML=CABANG.map((c,i)=>`
      <div class="li rh" onclick="window.open('https://docs.google.com/spreadsheets/d/${API.SAL}/edit','_blank')">
        <div class="li-av">${['✈️','✈️','✈️','✈️','✈️','🏢','🏢'][i]||'🏢'}</div>
        <div class="li-main"><div class="li-title">${c}</div><div class="li-sub">Cabang aktif RIFIM</div></div>
        <span class="bdg bdg-ok">AKTIF</span>
      </div>`).join('');
  },

  async loadDrivers(){
    const hd=$('set-drv-hd'),tb=$('set-drv-tb'); if(!tb) return;
    try{
      const d=await API.sheet(API.SAL,'DB_DRIVER');
      const k=Object.keys(d[0]||{}).slice(0,5);
      if(hd) hd.innerHTML='<tr>'+k.map(x=>`<th>${x}</th>`).join('')+'</tr>';
      tb.innerHTML=d.slice(0,100).map(r=>'<tr>'+k.map((x,i)=>`<td style="${i===0?'font-family:var(--mono);font-size:11px;':''}">${r[x]||'—'}</td>`).join('')+'</tr>').join('');
    }catch(e){if(tb)tb.innerHTML='<tr><td colspan="5" class="tbl-empty">Gagal: '+e.message+'</td></tr>';}
  },

  buildPwList(){
    const el=$('set-pw-list'); if(!el) return;
    if(!Auth.canEdit()){el.innerHTML='<p style="padding:16px;color:var(--t2);font-size:13px;">Hanya Nabilla & Owner.</p>';return;}
    el.innerHTML=Auth.USERS.filter(u=>u.role!=='owner').map(u=>`
      <div class="li"><div class="li-av">${u.nama[0]}</div>
      <div class="li-main"><div class="li-title">${u.nama}</div><div class="li-sub">${u.jabatan}</div></div>
      <span style="font-family:var(--mono);font-size:11px;color:var(--t3);">${'•'.repeat(Math.min(u.pw.length,8))}</span>
      </div>`).join('');
    const sel=$('set-pw-sel'); if(!sel) return;
    sel.innerHTML='<option value="">— Pilih Staff —</option>';
    Auth.USERS.filter(u=>u.role!=='owner').forEach(u=>{
      const o=document.createElement('option');o.value=u.nama;o.textContent=u.nama;sel.appendChild(o);
    });
  },

  savePw(){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    const nm=$('set-pw-sel')?.value; const pw=$('set-pw-inp')?.value?.trim();
    if(!nm){al('set-pw-al','⚠️ Pilih staff!','wn');return;}
    if(!pw||pw.length<6){al('set-pw-al','⚠️ Min 6 karakter!','wn');return;}
    const u=Auth.USERS.find(x=>x.nama===nm);
    if(!u){al('set-pw-al','❌ Tidak ditemukan','er');return;}
    u.pw=pw; if($('set-pw-inp')) $('set-pw-inp').value='';
    this.buildPwList();
    al('set-pw-al','✅ Password '+nm+' diubah!','ok');
  },

  buildOwnerInfo(){
    const el=$('set-owner-info'); if(!el) return;
    if(!Auth.isOwner()){el.innerHTML='<p style="padding:16px;color:var(--t2);font-size:13px;">Hanya Owner/Bobby yang bisa akses.</p>';return;}
    el.innerHTML=`
      <div class="li"><div class="li-av">👤</div><div class="li-main"><div class="li-title">Bobby Rahman Maholi Berutu</div><div class="li-sub">Direktur Utama — PT. Rifim International Gemilang</div></div></div>
      <div class="li"><div class="li-av">🏢</div><div class="li-main"><div class="li-title">7 Cabang Aktif</div><div class="li-sub">${CABANG.join(' · ')}</div></div></div>
      <div class="li rh" style="cursor:pointer" onclick="window.open('https://drive.google.com/drive/folders/${API.DRIVE}','_blank')">
        <div class="li-av">📁</div><div class="li-main"><div class="li-title">Google Drive Root</div><div class="li-sub">Folder penyimpanan utama RIFIM</div></div><span style="color:var(--t3)">›</span>
      </div>`;
  }
};
