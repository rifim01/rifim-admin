// ═══════════ RIFIM Admin — File SAL ═══════════
const Saldo = {
  raw:{driver:[],transaksi:[],harian:[],rank:[]},
  filtered:{transaksi:[],harian:[]},

  async loadAll(){
    al('sal-al','⏳ Memuat File SAL...','in');
    await Promise.allSettled([
      this.load('DB_DRIVER','driver'),
      this.load('DB_TRANSAKSI','transaksi'),
      this.load('DASHBOARD_HARIAN','harian'),
      this.load('RANK_DRIVER','rank'),
    ]);
    this.filtered.transaksi=this.raw.transaksi;
    this.filtered.harian=this.raw.harian;
    this.renderAll();
    al('sal-al',`✅ Driver:${this.raw.driver.length} · Trx:${this.raw.transaksi.length} · Harian:${this.raw.harian.length}`,'ok');
    App.updateDashStats();
  },

  async load(sheet,key){
    try{ this.raw[key]=await API.sheet(API.SAL,sheet); }
    catch(e){ console.warn('SAL '+sheet+':',e.message); }
  },

  filter(){
    const s=($('sal-srch')?.value||'').toLowerCase();
    const c=$('sal-cab')?.value||'';
    let d=this.raw.transaksi;
    if(s) d=d.filter(r=>JSON.stringify(r).toLowerCase().includes(s));
    if(c) d=d.filter(r=>JSON.stringify(r).includes(c));
    this.filtered.transaksi=d;
    this.renderTrx();
  },

  renderAll(){ this.renderDrv(); this.renderTrx(); this.renderHarian(); this.renderRank(); },

  renderDrv(){
    const tb=$('sal-drv-tb'),hd=$('sal-drv-hd'); if(!tb) return;
    const d=this.raw.driver;
    if(!d.length){tb.innerHTML='<tr><td colspan="6" class="tbl-empty">Muat data dulu</td></tr>';return;}
    const k=Object.keys(d[0]);
    if(hd) hd.innerHTML='<tr>'+k.map(x=>`<th>${x}</th>`).join('')+'</tr>';
    tb.innerHTML=d.slice(0,100).map(r=>'<tr>'+k.map((x,i)=>`<td style="${i===0?'font-family:var(--mono);font-size:11px;':''}">${r[x]||'—'}</td>`).join('')+'</tr>').join('');
  },

  renderTrx(){
    const tb=$('sal-trx-tb'),hd=$('sal-trx-hd'); if(!tb) return;
    const d=this.filtered.transaksi;
    if(!d.length){tb.innerHTML='<tr><td colspan="8" class="tbl-empty">Tidak ada data</td></tr>';return;}
    const k=Object.keys(d[0]).slice(0,8);
    if(hd) hd.innerHTML='<tr>'+k.map(x=>`<th>${x}</th>`).join('')+'</tr>';
    tb.innerHTML=d.slice(0,200).map(r=>'<tr>'+k.map((x,i)=>`<td style="${i===0?'font-family:var(--mono);font-size:11px;':''}">${r[x]||'—'}</td>`).join('')+'</tr>').join('');
  },

  renderHarian(){
    const tb=$('sal-hr-tb'),hd=$('sal-hr-hd'); if(!tb) return;
    const d=this.raw.harian;
    if(!d.length){tb.innerHTML='<tr><td colspan="8" class="tbl-empty">Tidak ada data</td></tr>';return;}
    const k=Object.keys(d[0]).slice(0,8);
    if(hd) hd.innerHTML='<tr>'+k.map(x=>`<th>${x}</th>`).join('')+'</tr>';
    tb.innerHTML=d.slice(0,100).map(r=>'<tr>'+k.map(x=>`<td>${r[x]||'—'}</td>`).join('')+'</tr>').join('');
  },

  renderRank(){
    const tb=$('sal-rank-tb'),hd=$('sal-rank-hd'); if(!tb) return;
    const d=this.raw.rank;
    if(!d.length){tb.innerHTML='<tr><td colspan="6" class="tbl-empty">Tidak ada data</td></tr>';return;}
    const k=Object.keys(d[0]).slice(0,5);
    if(hd) hd.innerHTML='<tr><th>#</th>'+k.map(x=>`<th>${x}</th>`).join('')+'</tr>';
    tb.innerHTML=d.slice(0,50).map((r,i)=>`<tr><td style="text-align:center;font-weight:800;color:${i===0?'var(--gold)':i===1?'var(--t1)':i===2?'#CD7F32':'var(--t2)'}">${i+1}</td>`+k.map(x=>`<td>${r[x]||'—'}</td>`).join('')+'</tr>').join('');
  },

  exportPDF(){
    const tb=$('sal-trx-table');
    if(!tb||!this.filtered.transaksi.length){ alert('Load data dulu!'); return; }
    exportPDF('Transaksi SAL — RIFIM', tb.outerHTML);
  }
};
