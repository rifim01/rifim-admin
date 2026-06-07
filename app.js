// ═══════════ RIFIM Admin — App Controller ═══════════
const PAGES = {
  dashboard: {title:'Dashboard',        sub:'Monitor koneksi & statistik real-time',     icon:'🏠'},
  potongan:  {title:'Database Potongan', sub:'Input AIST · Auto-detect driver & cabang · Hitung otomatis', icon:'📊'},
  saldo:     {title:'Riwayat',          sub:'Riwayat Input Saldo & Database Potongan',   icon:'📋'},
  invoice:   {title:'Generate Invoice', sub:'Invoice penagihan ke DB_LAPORAN_CABANG',    icon:'📄'},
  setting:   {title:'Pengaturan',       sub:'Cabang · Driver · Password · Owner',        icon:'⚙️'},
};

const App = {
  cur: 'dashboard',

  init(){
    if(!Auth.load()){ this.showLogin(); return; }
    this.showApp();
  },

  showLogin(){
    $('loginWrap').classList.add('show');
    $('appWrap').classList.remove('show');
    Auth.populateSel('lgn-sel');
  },

  showApp(){
    $('loginWrap').classList.remove('show');
    $('appWrap').classList.add('show');
    this.updateUser();
    Auth.updateAccess();
    this.buildNav();
    this.buildMob();
    this.go('dashboard');
    initRipple();
    startClock('clock');
  },

  updateUser(){
    const u=Auth.current; if(!u) return;
    st('sb-uname',u.nama); st('sb-urole',u.jabatan);
    const av=$('sb-av'); if(av) av.textContent=u.nama[0].toUpperCase();
  },

  buildNav(){
    const nav=$('sb-nav'); if(!nav) return;
    nav.innerHTML=Object.entries(PAGES).map(([k,p])=>`
      <div class="nav-item rh ${k===this.cur?'active':''}" id="nav-${k}" onclick="App.go('${k}')">
        <div class="nav-ic">${p.icon}</div>
        <span class="nav-lbl">${p.title}</span>
      </div>`).join('');
  },

  buildMob(){
    const wrap=$('mob-wrap'); if(!wrap) return;
    wrap.innerHTML=Object.entries(PAGES).map(([k,p])=>`
      <button class="mob-btn rh ${k===this.cur?'active':''}" id="mob-${k}" onclick="App.go('${k}')">
        <div class="mob-pill">${p.icon}</div>
        <div class="mob-lbl">${p.title.split(' ')[0]}</div>
      </button>`).join('');
  },

  go(key){
    if(!PAGES[key]) return;
    this.cur=key;
    const pg=PAGES[key];
    $$('.page').forEach(p=>p.classList.remove('active'));
    const el=$('page-'+key); if(el) el.classList.add('active');
    $$('.nav-item').forEach(n=>n.classList.remove('active'));
    $$('.mob-btn').forEach(n=>n.classList.remove('active'));
    const ni=$('nav-'+key); if(ni) ni.classList.add('active');
    const mi=$('mob-'+key); if(mi) mi.classList.add('active');
    st('tb-title',pg.title); st('tb-sub',pg.sub); st('tb-icon',pg.icon);
    const pages=$('pages'); if(pages) pages.scrollTop=0;
    // Page init
    if(key==='dashboard')  Dashboard.load();
    if(key==='potongan')   Potongan.init();
    if(key==='saldo')      Riwayat.init();
    if(key==='setting')    Setting.init();
    if(key==='invoice'){
      const ic=$('inv-cab');
      if(ic&&ic.options.length<2){
        ic.innerHTML='<option value="">— Pilih Cabang —</option>';
        CABANG.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=cabShort(c);ic.appendChild(o);});
      }
    }
  },

  updateDashStats(){ Dashboard.updateStats(); },
  toggleSb(){ const sb=$('sidebar'); if(sb) sb.classList.toggle('collapsed'); },

  refresh(){
    Dashboard.load();
    if(this.cur==='saldo')   Riwayat.init();
    if(this.cur==='setting') Setting.loadDrivers();
    Potongan.loadDrivers();
  },

  login(){
    const nm=$('lgn-sel')?.value?.trim(), pw=$('lgn-pw')?.value?.trim();
    const err=$('lgn-err');
    const show=(m)=>{if(err){err.textContent=m;err.style.display='block';setTimeout(()=>err.style.display='none',3200);}};
    if(!nm){show('❌ Pilih nama dulu!');return;}
    if(!pw){show('❌ Isi password!');return;}
    if(!Auth.login(nm,pw)){show('❌ Password salah!');return;}
    this.showApp();
  },

  logout(){
    if(!confirm('Yakin logout?')) return;
    Auth.logout();
    const pw=$('lgn-pw'); if(pw) pw.value='';
    this.showLogin();
  }
};

document.addEventListener('DOMContentLoaded',()=>{
  App.init();
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-tab]');
    if(!t) return;
    const grp=t.dataset.tabGroup;
    const tabKey=t.dataset.tab;
    $$(`[data-tab-group="${grp}"]`).forEach(x=>x.classList.remove('active'));
    $$(`[data-tab-content="${grp}"]`).forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const cnt=$(tabKey); if(cnt) cnt.classList.add('active');
  });
  $('lgn-pw')?.addEventListener('keydown',e=>{if(e.key==='Enter')App.login();});
});
