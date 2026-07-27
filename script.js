// =======================================================
// KASKELASKU ULTRA PRO MAX - SCRIPT (NO LOADER)
// =======================================================

const SUPABASE_URL = 'https://xjkahrfgkbjvvwxspsux.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqa2FocmZna2JqdnZ3eHNwc3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5ODAyMDcsImV4cCI6MjEwMDU1NjIwN30.CMbZiIszCqlryp8G6h5sL6vH_JFX-Y-3wvyMSb_3SVU';
let supabaseClient = null;
let useCloud = false;

try {
    if (window.supabase && SUPABASE_URL && !SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT_ID')) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        useCloud = true;
    }
} catch (e) { useCloud = false; }

let dataSiswa = [];
let dataPengeluaran = [];
let dataAudit = [];
let dataPemasukanLain = [];
let pengumumanKelas = "Selamat datang di Kas Kelas XI DKV 1 Ultra Pro!";
let globalMonth = new Date().getMonth() + 1;
let globalYear = new Date().getFullYear();
let currentProfileId = null;

async function loadData() {
    if (useCloud) {
        try {
            let { data: siswaData } = await supabaseClient.from('siswa').select('*');
            let { data: expData } = await supabaseClient.from('pengeluaran').select('*');
            let { data: auditData } = await supabaseClient.from('audit_log').select('*');
            let { data: lainData } = await supabaseClient.from('pemasukan_lain').select('*');
            let { data: annData } = await supabaseClient.from('pengumuman').select('*').single();
            if (siswaData) dataSiswa = siswaData; if (expData) dataPengeluaran = expData;
            if (auditData) dataAudit = auditData; if (lainData) dataPemasukanLain = lainData;
            if (annData && annData.pesan) pengumumanKelas = annData.pesan;
        } catch(err) { useCloud = false; }
    }
    
    if (!dataSiswa || dataSiswa.length === 0) {
        dataSiswa = JSON.parse(localStorage.getItem('XIDKV1_Siswa')) || [];
    }
    dataPengeluaran = JSON.parse(localStorage.getItem('XIDKV1_Exp')) || [];
    dataPemasukanLain = JSON.parse(localStorage.getItem('XIDKV1_Lain')) || [];
    dataAudit = JSON.parse(localStorage.getItem('XIDKV1_Audit')) || [];
    pengumumanKelas = localStorage.getItem('XIDKV1_Ann') || pengumumanKelas;

    // Auto-patch ID untuk data setoran lama yang belum punya ID
    dataSiswa.forEach(s => {
        if (s && Array.isArray(s.payments)) {
            s.payments.forEach((p, idx) => {
                if (p && !p.id) {
                    p.id = 'pay_' + Date.now() + '_' + idx;
                }
            });
        }
    });
}

async function saveData(key, data, table) {
    localStorage.setItem(key, JSON.stringify(data));
    if (useCloud && supabaseClient) {
        try { for(let item of data) await supabaseClient.from(table).upsert(item); } catch(e) {}
    }
}

async function logAudit(action, detail) {
    const logItem = { id: Date.now(), time: new Date().toLocaleString('id-ID'), action, detail };
    dataAudit.unshift(logItem); localStorage.setItem('XIDKV1_Audit', JSON.stringify(dataAudit));
    if (useCloud && supabaseClient) await supabaseClient.from('audit_log').insert([logItem]);
}

function showToast(msg, type='success') {
    const t = document.createElement('div'); t.className = `toast ${type}`;
    t.innerHTML = `<i data-lucide="${type==='success'?'circle-check':'circle-alert'}"></i> <span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(t); lucide.createIcons();
    setTimeout(() => { t.style.opacity = '0'; setTimeout(()=>t.remove(), 300); }, 3000);
}

window.addEventListener('load', async () => {
    initTheme(); initMonthFilter(); await loadData();
    
    updateTime(); 
    setInterval(updateTime, 1000);

    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.style.display = 'block';
    
    const annText = document.getElementById('announcement-text');
    if (annText) annText.innerText = pengumumanKelas;

    renderAll(); renderCalendar(); lucide.createIcons(); 
});

function initTheme() {
    const t = localStorage.getItem('XIDKV1_Theme') || 'light'; 
    document.documentElement.setAttribute('data-theme', t);
    const i = document.getElementById('theme-icon'); if(i) i.setAttribute('data-lucide', t==='dark'?'sun':'moon');
}
function toggleTheme() {
    const n = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', n); localStorage.setItem('XIDKV1_Theme', n); 
    initTheme(); lucide.createIcons();
}
function togglePrivacy() {
    document.body.classList.toggle('privacy-on');
    const isPriv = document.body.classList.contains('privacy-on');
    document.getElementById('privacy-icon').setAttribute('data-lucide', isPriv ? 'eye' : 'eye-off'); lucide.createIcons();
}

function formatRp(angka) { return 'Rp ' + Number(angka || 0).toLocaleString('id-ID'); }
function generateAvatar(nama) { return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(nama || 'user')}&backgroundColor=e0f2fe`; }

function updateTime() {
    const now = new Date();
    const dateEl = document.getElementById('current-date');
    const timeEl = document.getElementById('current-time');
    
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.innerText = now.toLocaleDateString('id-ID', options);
    }
    
    if (timeEl) {
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timeEl.innerText = `${hours}:${minutes}:${seconds} WIB`;
    }
}

// Kalender Interaktif
let calDate = new Date();
function renderCalendar() {
    const monthYear = document.getElementById('month-year');
    const calBody = document.getElementById('calendar-body');
    if(!monthYear || !calBody) return;
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const month = calDate.getMonth(); const year = calDate.getFullYear();
    monthYear.innerText = `${months[month]} ${year}`;
    const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
    calBody.innerHTML = '';
    for(let i = 0; i < firstDay; i++) calBody.innerHTML += `<div class="cal-day empty"></div>`;
    const today = new Date();
    for(let i = 1; i <= daysInMonth; i++) {
        let isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) ? 'today' : '';
        calBody.innerHTML += `<div class="cal-day ${isToday}">${i}</div>`;
    }
}
function prevMonth() { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); }
function nextMonth() { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); }

function initMonthFilter() {
    const sel = document.getElementById('global-month-filter'); 
    if (!sel) return;
    const y = new Date().getFullYear();
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    sel.innerHTML = '';
    for(let i = y-1; i <= y+1; i++) {
        for(let j=0; j<12; j++) {
            let val = `${i}-${String(j+1).padStart(2,'0')}`; 
            let selAttr = (i===globalYear && j+1===globalMonth) ? 'selected' : '';
            sel.innerHTML += `<option value="${val}" ${selAttr}>${months[j]} ${i}</option>`;
        }
    }
}
function updateGlobalFilter() { 
    const filterEl = document.getElementById('global-month-filter');
    if (!filterEl) return;
    const v = filterEl.value.split('-'); 
    if (v.length === 2) {
        globalYear = parseInt(v[0]); 
        globalMonth = parseInt(v[1]); 
        renderAll(); 
    }
}

function calcBulan(arr) {
    if (!arr || !Array.isArray(arr)) return 0;
    return arr.filter(p => {
        if (!p) return false;
        const d = p.date || p.tanggal;
        if (!d || typeof d !== 'string' || !d.includes('-')) return false;
        const parts = d.split('-');
        if (parts.length < 2) return false;
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        return y === globalYear && m === globalMonth;
    }).reduce((sum, p) => sum + Number(p.amount || p.nominal || 0), 0);
}

function calcTotal(arr) {
    if (!arr || !Array.isArray(arr)) return 0;
    return arr.reduce((sum, p) => sum + Number(p ? (p.amount || p.nominal || 0) : 0), 0);
}

function calcSaldo(jenis) {
    let masukFisik = 0, masukDigi = 0, keluarFisik = 0, keluarDigi = 0;
    if (Array.isArray(dataSiswa)) {
        dataSiswa.forEach(s => { 
            if (s && Array.isArray(s.payments)) {
                s.payments.forEach(p => { 
                    if (p) {
                        let amt = Number(p.amount || 0);
                        if(p.sumber === 'digital') masukDigi += amt; 
                        else masukFisik += amt; 
                    }
                }); 
            }
        });
    }
    if (Array.isArray(dataPemasukanLain)) {
        dataPemasukanLain.forEach(p => { 
            if (p) {
                let amt = Number(p.nominal || 0);
                if(p.sumber === 'digital') masukDigi += amt; 
                else masukFisik += amt; 
            }
        });
    }
    if (Array.isArray(dataPengeluaran)) {
        dataPengeluaran.forEach(e => { 
            if (e) {
                let amt = Number(e.amount || 0);
                if(e.sumber === 'digital') keluarDigi += amt; 
                else keluarFisik += amt; 
            }
        });
    }
    
    if(jenis === 'fisik') return masukFisik - keluarFisik;
    if(jenis === 'digital') return masukDigi - keluarDigi;
    return (masukFisik + masukDigi) - (keluarFisik + keluarDigi);
}

function getGamifikasi(total, freq) {
    if(total >= 36000) return "Sultan Kelas 👑"; 
    if(total >= 15000) return "Donatur Aktif 💎";
    if(freq >= 5) return "Pejuang Receh 🪙"; 
    if(total === 0) return "Beban Bendahara 🗿"; 
    return "Warga Biasa 🥉";
}

function renderAll() { 
    renderDashboard(); 
    renderTablePublic(); 
    renderMatrix(); 
    renderAdminTabs(); 
}

function renderAdminTabs() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel && adminPanel.style.display !== 'none') {
        const tabSiswa = document.getElementById('tab-siswa');
        const tabExp = document.getElementById('tab-pengeluaran');
        const tabAudit = document.getElementById('tab-audit');
        
        if (tabSiswa && tabSiswa.style.display !== 'none') {
            renderTableAdmin();
        } else if (tabExp && tabExp.style.display !== 'none') {
            renderTableExpense();
            initChart();
        } else if (tabAudit && tabAudit.style.display !== 'none') {
            renderAudit();
        }
    }
}

function renderDashboard() {
    let totMasukBulan = Array.isArray(dataSiswa) ? dataSiswa.reduce((sum,s)=>sum+calcBulan(s.payments),0) : 0;
    let totKeluarBulan = calcBulan(dataPengeluaran); 
    let totLainBulan = calcBulan(dataPemasukanLain);
    
    const elTerkumpul = document.getElementById('total-terkumpul');
    const elKeluar = document.getElementById('total-pengeluaran-publik');
    const elLain = document.getElementById('total-lain');
    const elFisik = document.getElementById('saldo-fisik');
    const elDigital = document.getElementById('saldo-digital');
    const elBersih = document.getElementById('saldo-bersih');

    if(elTerkumpul) elTerkumpul.innerText = formatRp(totMasukBulan);
    if(elKeluar) elKeluar.innerText = formatRp(totKeluarBulan);
    if(elLain) elLain.innerText = formatRp(totLainBulan);
    if(elFisik) elFisik.innerText = formatRp(calcSaldo('fisik'));
    if(elDigital) elDigital.innerText = formatRp(calcSaldo('digital'));
    if(elBersih) elBersih.innerText = formatRp(calcSaldo('all'));

    const feed = document.getElementById('public-activity-feed'); 
    if (feed) {
        feed.innerHTML = ''; 
        let acts = [];
        
        if (Array.isArray(dataSiswa)) {
            dataSiswa.forEach(s => { 
                if(s && Array.isArray(s.payments)) {
                    s.payments.forEach(p => {
                        if (p && (p.date || p.tanggal)) {
                            acts.push({t:`Setor: ${s.nama || 'Siswa'}`, d:p.date || p.tanggal, a:p.amount || 0, type:'in'});
                        }
                    });
                }
            });
        }
        if (Array.isArray(dataPemasukanLain)) {
            dataPemasukanLain.forEach(p => {
                if (p && (p.date || p.tanggal)) {
                    acts.push({t:`Lain: ${p.desc || 'Pemasukan'}`, d:p.tanggal || p.date, a:p.nominal || 0, type:'in'});
                }
            });
        }
        if (Array.isArray(dataPengeluaran)) {
            dataPengeluaran.forEach(e => {
                if (e && (e.date || e.tanggal)) {
                    acts.push({t:`Keluar: ${e.desc || 'Pengeluaran'}`, d:e.date || e.tanggal, a:e.amount || 0, type:'out'});
                }
            });
        }
        
        acts.sort((a,b) => new Date(b.d) - new Date(a.d)).slice(0,5).forEach(act => {
            let isM = act.type === 'in'; 
            feed.innerHTML += `<li class="activity-item"><div><div style="font-weight:800;">${act.t}</div><div style="font-size:0.75rem; color:var(--text-muted);">${act.d}</div></div><div class="money-blur" style="color:var(--${isM?'success':'danger'}); font-weight:900;">${isM?'+':'-'} ${formatRp(act.a)}</div></li>`;
        });
        if (acts.length === 0) feed.innerHTML = `<li style="text-align:center; padding: 20px; color:var(--text-muted);">Belum ada riwayat transaksi.</li>`;
    }
    
    const lb = document.getElementById('leaderboard-list'); 
    if (lb) {
        lb.innerHTML = '';
        const sortedLb = [...dataSiswa].sort((a,b)=>calcTotal(b.payments)-calcTotal(a.payments)).slice(0,5);
        
        sortedLb.forEach((s,i) => {
            if(!s || calcTotal(s.payments) === 0) return;
            let rc = i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-other';
            lb.innerHTML += `<div class="leaderboard-item"><div style="display:flex; gap:12px; align-items:center;"><div class="rank-badge ${rc}">${i+1}</div><b>${s.nama || ''}</b></div><div class="money-blur" style="color:var(--primary-dark); font-weight:900;">${formatRp(calcTotal(s.payments))}</div></div>`;
        });
        if (lb.innerHTML === '') lb.innerHTML = `<li style="text-align:center; padding: 20px; color:var(--text-muted);">Belum ada data kontributor.</li>`;
    }
}

let currentFilter = 'all';
function setFilter(f, btn) { 
    currentFilter = f; 
    document.querySelectorAll('.pill').forEach(p=>p.classList.remove('active')); 
    if (btn) btn.classList.add('active'); 
    renderTablePublic(); 
}
function filterData() { renderTablePublic(); }

function renderTablePublic() {
    const tbody = document.getElementById('data-siswa-publik'); 
    if (!tbody) return;
    tbody.innerHTML = '';
    const searchInput = document.getElementById('search-input');
    const kw = searchInput ? searchInput.value.toLowerCase() : '';
    
    [...dataSiswa].sort((a,b)=>calcBulan(b.payments)-calcBulan(a.payments)).forEach((s,i) => {
        if (!s) return;
        let totBln = calcBulan(s.payments); 
        let isLunas = totBln >= 3000;
        
        if(currentFilter==='lunas' && !isLunas) return; 
        if(currentFilter==='belum' && isLunas) return;
        if(kw && s.nama && !s.nama.toLowerCase().includes(kw)) return;
        
        let hasTalangan = s.payments && Array.isArray(s.payments) && s.payments.some(p => p && p.talangan && p.date && parseInt(p.date.split('-')[0]) === globalYear && parseInt(p.date.split('-')[1]) === globalMonth);
        
        let badge = isLunas ? `<span class="badge badge-lunas"><i data-lucide="check-circle"></i> LUNAS</span>` : `<span class="badge badge-belum"><i data-lucide="alert-circle"></i> KURANG ${formatRp(3000-totBln)}</span>`;
        if(hasTalangan) badge += ` <span class="badge badge-talangan">HUTANG TALANGAN</span>`;
        
        let btn = `<button class="btn btn-outline btn-icon-only" onclick="lihatProfil(${s.id})"><i data-lucide="eye"></i></button>`;
        if(!isLunas || hasTalangan) btn += ` <button class="btn btn-whatsapp btn-icon-only" onclick="window.open('https://api.whatsapp.com/send?text=${encodeURIComponent('Halo '+(s.nama||'')+', tagihan kas/talangan lo bulan ini belum lunas nih. Segera diurus ya, Thanks!')}')"><i data-lucide="message-circle"></i></button>`;
        
        tbody.innerHTML += `<tr><td><b>#${i+1}</b></td><td><div class="student-profile-trigger" onclick="lihatProfil(${s.id})"><img src="${generateAvatar(s.nama)}" class="student-avatar"><b>${s.nama || ''}</b></div></td><td class="money-blur" style="font-weight:900; color:var(--primary-dark);">${formatRp(totBln)}</td><td>${badge}</td><td>${btn}</td></tr>`;
    }); 
    if(tbody.innerHTML === '') tbody.innerHTML = `<tr><td colspan="5" style="color:var(--text-muted); padding:30px;">Data tidak ditemukan.</td></tr>`;
    lucide.createIcons();
}

function renderMatrix() {
    const tbody = document.getElementById('data-matrix-body'); 
    if (!tbody) return;
    tbody.innerHTML = '';
    dataSiswa.forEach((s,i) => {
        if (!s) return;
        let mt = Array(12).fill(0); 
        let gt = 0;
        if(s.payments && Array.isArray(s.payments)) {
            s.payments.forEach(p => { 
                if (p && p.date && p.date.includes('-')) {
                    let parts = p.date.split('-'); 
                    let y = parseInt(parts[0]);
                    let m = parseInt(parts[1]);
                    if(y === globalYear && m >= 1 && m <= 12){ 
                        mt[m - 1] += Number(p.amount || 0); 
                    } 
                    gt += Number(p.amount || 0); 
                }
            });
        }
        let row = `<td><b>${i+1}</b></td><td style="text-align:left; font-weight:800;">${s.nama || ''}</td>`;
        mt.forEach(v => { row += `<td class="money-blur" style="color:var(--${v>=3000?'success':v>0?'primary-dark':'text-muted'}); font-weight:800;">${v>0?formatRp(v):'-'}</td>`; });
        tbody.innerHTML += `<tr>${row}<td class="money-blur" style="font-weight:900; color:var(--primary-dark);">${formatRp(gt)}</td></tr>`;
    });
}

function switchMainView(v) {
    document.querySelectorAll('.main-tab-btn').forEach(b=>b.classList.remove('active'));
    const tabTabel = document.getElementById('view-tabel');
    const tabMatrix = document.getElementById('view-matrix');
    if (tabTabel) tabTabel.style.display = v==='tabel'?'block':'none';
    if (tabMatrix) tabMatrix.style.display = v==='matrix'?'block':'none';
    
    const activeBtn = document.querySelector(v==='tabel'?'.main-nav-tabs button:nth-child(1)':'.main-nav-tabs button:nth-child(2)');
    if (activeBtn) activeBtn.classList.add('active'); 
    lucide.createIcons();
}

function switchAdminTab(t) {
    document.querySelectorAll('.admin-tab-item').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c=>c.style.display = 'none');
    
    const targetTab = document.getElementById(`tab-${t}`);
    if (targetTab) targetTab.style.display = 'block';
    
    const buttons = document.querySelectorAll('.admin-tab-item');
    if(t==='siswa' && buttons[0]) buttons[0].classList.add('active');
    if(t==='pengeluaran' && buttons[1]) buttons[1].classList.add('active');
    if(t==='pengumuman' && buttons[2]) buttons[2].classList.add('active');
    if(t==='audit' && buttons[3]) buttons[3].classList.add('active');
    
    if(t==='siswa') renderTableAdmin(); 
    if(t==='pengeluaran') { renderTableExpense(); initChart(); }
    if(t==='audit') renderAudit();
}

function renderTableAdmin() {
    const tb = document.getElementById('data-siswa-admin'); 
    if (!tb) return;
    tb.innerHTML='';
    dataSiswa.forEach((s,i) => {
        if (!s) return;
        let tot = calcTotal(s.payments); 
        let fr = s.payments && Array.isArray(s.payments) ? s.payments.length : 0;
        tb.innerHTML += `<tr><td><b>${i+1}</b></td><td style="text-align:left; font-weight:800;">${s.nama || ''}</td><td><b>${getGamifikasi(tot, fr)}</b></td><td class="money-blur" style="font-weight:900; color:var(--primary-dark);">${formatRp(tot)}</td><td><div style="display:flex; justify-content:center; gap:8px;"><button class="btn btn-outline btn-icon-only" onclick="openFormModal(${s.id})"><i data-lucide="pencil"></i></button> <button class="btn btn-danger btn-icon-only" onclick="hapusSiswa(${s.id})"><i data-lucide="trash"></i></button> <button class="btn btn-warning btn-icon-only" onclick="cetakSP(${s.id})"><i data-lucide="alert-triangle"></i></button></div></td></tr>`;
    }); 
    lucide.createIcons();
}

function renderTableExpense() {
    const tb = document.getElementById('data-pengeluaran'); 
    if (!tb) return;
    tb.innerHTML='';
    dataPengeluaran.forEach((e) => {
        if (!e) return;
        let bkt = e.bukti ? `<a href="${e.bukti}" target="_blank" class="btn btn-outline btn-icon-only" style="padding:4px;"><i data-lucide="image"></i></a>` : '-';
        tb.innerHTML += `<tr><td>${e.date || e.tanggal || ''}</td><td><span class="badge" style="background:var(--secondary); color:var(--primary-dark);">${e.kategori||'Lainnya'}</span></td><td style="text-align:left; font-weight:700;">${e.desc || ''}</td><td>${e.sumber==='digital'?'Digital':'Tunai'}</td><td class="money-blur" style="color:var(--danger); font-weight:900;">${formatRp(e.amount || 0)}</td><td>${bkt}</td><td><button class="btn btn-danger btn-icon-only" onclick="hapusEx(${e.id})"><i data-lucide="trash"></i></button></td></tr>`;
    }); 
    lucide.createIcons();
}

function renderAudit() {
    const tb = document.getElementById('data-audit'); 
    if (!tb) return;
    tb.innerHTML='';
    let todayDate = new Date().toLocaleDateString('id-ID'); 
    let checkout = 0;
    
    dataAudit.forEach(l => {
        if (!l) return;
        tb.innerHTML += `<tr><td style="font-size:0.8rem; color:var(--text-muted);">${l.time || ''}</td><td><span class="badge" style="background:var(--secondary); color:var(--primary-dark);">${l.action || ''}</span></td><td style="text-align:left; font-weight:700;">${l.detail || ''}</td></tr>`;
    });
    
    dataSiswa.forEach(s => { 
        if(s && Array.isArray(s.payments)) {
            s.payments.forEach(p => { 
                if (p && p.date) {
                    let pDate = new Date(p.date).toLocaleDateString('id-ID'); 
                    if(pDate === todayDate) checkout += Number(p.amount || 0); 
                }
            }); 
        }
    });
    dataPemasukanLain.forEach(p => { 
        if (p && p.tanggal) {
            let pDate = new Date(p.tanggal).toLocaleDateString('id-ID'); 
            if(pDate === todayDate) checkout += Number(p.nominal || 0); 
        }
    });
    
    const checkoutEl = document.getElementById('daily-checkout');
    if (checkoutEl) checkoutEl.innerText = formatRp(checkout);
}

function openModal(id) { 
    const m = document.getElementById(id);
    if (m) {
        m.classList.add('show'); 
        lucide.createIcons(); 
    }
}
function closeModal(id) { 
    const m = document.getElementById(id);
    if (m) m.classList.remove('show'); 
}
function openLogin() { openModal('login-modal'); }

function prosesLogin() {
    const userEl = document.getElementById('username');
    const passEl = document.getElementById('password');
    const user = userEl ? userEl.value.trim() : '';
    const pass = passEl ? passEl.value.trim() : '';
    
    if (user === 'syallofficial.id' && pass === 'irsyal989511') {
        closeModal('login-modal'); 
        switchMainView('tabel');
        const adminPanel = document.getElementById('admin-panel');
        const btnLogin = document.getElementById('btn-login-trigger');
        const btnLogout = document.getElementById('btn-logout-trigger');
        
        if (adminPanel) adminPanel.style.display = 'block';
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'flex';
        
        switchAdminTab('siswa'); 
        logAudit('LOGIN', 'Admin masuk panel.'); 
        showToast('Akses Admin Diberikan!');
        
        if (userEl) userEl.value = ''; 
        if (passEl) passEl.value = '';
    } else { 
        showToast('Kredensial salah!', 'error'); 
    }
}

function logoutAdmin() {
    const adminPanel = document.getElementById('admin-panel');
    const btnLogin = document.getElementById('btn-login-trigger');
    const btnLogout = document.getElementById('btn-logout-trigger');
    
    if (adminPanel) adminPanel.style.display = 'none';
    if (btnLogin) btnLogin.style.display = 'flex';
    if (btnLogout) btnLogout.style.display = 'none';
    showToast('Berhasil keluar.');
}

function openFormModal(id=null) {
    const formId = document.getElementById('form-id');
    const formNama = document.getElementById('form-nama');
    const formTitle = document.getElementById('form-title');

    if(id) { 
        let s = dataSiswa.find(x=>x.id===id); 
        if (s) {
            if (formId) formId.value = s.id; 
            if (formNama) formNama.value = s.nama || ''; 
            if (formTitle) formTitle.innerText = 'Edit Siswa'; 
        }
    } else { 
        if (formId) formId.value = ''; 
        if (formNama) formNama.value = ''; 
        if (formTitle) formTitle.innerText = 'Tambah Siswa Baru'; 
    }
    openModal('form-modal');
}

async function simpanDataSiswa() {
    const formId = document.getElementById('form-id');
    const formNama = document.getElementById('form-nama');
    let id = formId ? formId.value : '';
    let nama = formNama ? formNama.value.trim() : '';
    
    if(!nama) return showToast('Nama wajib!','error');
    
    if(id) { 
        let s = dataSiswa.find(x=>x.id == id); 
        if (s) {
            s.nama = nama; 
            logAudit('EDIT', `Ubah nama ${nama}`); 
        }
    } else { 
        dataSiswa.push({id:Date.now(), nama, payments:[]}); 
        logAudit('TAMBAH', `Siswa: ${nama}`); 
    }
    
    await saveData('XIDKV1_Siswa', dataSiswa, 'siswa'); 
    closeModal('form-modal'); 
    renderTableAdmin(); 
    renderTablePublic(); 
    showToast('Disimpan!');
}

async function hapusSiswa(id) {
    if(confirm('Hapus siswa ini?')) { 
        dataSiswa = dataSiswa.filter(s=>s.id !== id); 
        await saveData('XIDKV1_Siswa', dataSiswa, 'siswa'); 
        renderTableAdmin(); 
        renderTablePublic(); 
        showToast('Dihapus.'); 
    }
}

function openPaymentModal() {
    let sel = document.getElementById('pay-siswa-id'); 
    if (sel) {
        sel.innerHTML=''; 
        dataSiswa.forEach(s => {
            if (s) sel.innerHTML += `<option value="${s.id}">${s.nama || ''}</option>`;
        });
    }
    
    const payDate = document.getElementById('pay-date');
    const payAmount = document.getElementById('pay-amount');
    const payDiterima = document.getElementById('pay-uang-diterima');
    const payKembalian = document.getElementById('pay-kembalian');
    
    if (payDate) payDate.value = new Date().toISOString().split('T')[0];
    if (payAmount) payAmount.value = ''; 
    if (payDiterima) payDiterima.value = ''; 
    if (payKembalian) {
        payKembalian.innerText = 'Kembalian: Rp 0';
        payKembalian.style.color = 'var(--text-muted)';
    }
    openModal('payment-modal');
}

const payDiterimaEl = document.getElementById('pay-uang-diterima');
if (payDiterimaEl) {
    payDiterimaEl.addEventListener('input', (e) => {
        let r = e.target.value;
        let payAmountEl = document.getElementById('pay-amount');
        let a = payAmountEl ? payAmountEl.value : ''; 
        let kc = document.getElementById('pay-kembalian');
        
        if(kc && r && a) { 
            let c = Number(r) - Number(a); 
            kc.innerText = c >= 0 ? `Kembalian: ${formatRp(c)}` : `Kurang: ${formatRp(Math.abs(c))}`; 
            kc.style.color = c >= 0 ? 'var(--success)' : 'var(--danger)'; 
        } else if (kc) { 
            kc.innerText = 'Kembalian: Rp 0'; 
            kc.style.color = 'var(--text-muted)'; 
        }
    });
}

const payAmountEl = document.getElementById('pay-amount');
if (payAmountEl) {
    payAmountEl.addEventListener('input', () => { 
        const payDiterima = document.getElementById('pay-uang-diterima');
        if (payDiterima) payDiterima.dispatchEvent(new Event('input')); 
    });
}

async function prosesTambahCicilan() {
    let paySiswaId = document.getElementById('pay-siswa-id');
    let payAmount = document.getElementById('pay-amount');
    let payDate = document.getElementById('pay-date');
    let paySumber = document.getElementById('pay-sumber');
    let payTalangan = document.getElementById('pay-talangan');

    let id = paySiswaId ? Number(paySiswaId.value) : 0; 
    let am = payAmount ? Number(payAmount.value) : 0; 
    let dt = payDate ? payDate.value : ''; 
    let sum = paySumber ? paySumber.value : 'fisik'; 
    let tal = payTalangan ? payTalangan.checked : false;
    
    if(!am || am <= 0 || !dt) return showToast('Nominal tidak valid','error');
    
    let s = dataSiswa.find(x=>x.id === id);
    if(s) { 
        if(!s.payments || !Array.isArray(s.payments)) s.payments = []; 
        s.payments.push({ id: 'pay_' + Date.now(), date: dt, amount: am, sumber: sum, talangan: tal }); 
        await saveData('XIDKV1_Siswa', dataSiswa, 'siswa'); 
        closeModal('payment-modal'); 
        renderAll(); 
        logAudit('KAS MASUK', `${s.nama || ''} ${formatRp(am)}`); 
        showToast('Tersimpan!'); 
    }
}

function openExpenseModal() { 
    const expDate = document.getElementById('exp-date');
    const expAmount = document.getElementById('exp-amount');
    const expDesc = document.getElementById('exp-desc');
    const expBukti = document.getElementById('exp-bukti');

    if (expDate) expDate.value = new Date().toISOString().split('T')[0]; 
    if (expAmount) expAmount.value = ''; 
    if (expDesc) expDesc.value = ''; 
    if (expBukti) expBukti.value = ''; 
    openModal('expense-modal'); 
}

async function prosesTambahPengeluaran() {
    const expDesc = document.getElementById('exp-desc');
    const expAmount = document.getElementById('exp-amount');
    const expDate = document.getElementById('exp-date');
    const expKategori = document.getElementById('exp-kategori');
    const expSumber = document.getElementById('exp-sumber');
    const expBukti = document.getElementById('exp-bukti');

    let d = expDesc ? expDesc.value.trim() : '';
    let a = expAmount ? Number(expAmount.value) : 0;
    let dt = expDate ? expDate.value : '';
    let k = expKategori ? expKategori.value : 'Lainnya';
    let s = expSumber ? expSumber.value : 'fisik';
    let b = expBukti ? expBukti.value.trim() : '';
    
    if(!d || a <= 0 || !dt) return showToast('Lengkapi data!','error');
    
    dataPengeluaran.push({id:Date.now(), desc:d, amount:a, date:dt, kategori:k, sumber:s, bukti:b}); 
    await saveData('XIDKV1_Exp', dataPengeluaran, 'pengeluaran'); 
    closeModal('expense-modal'); 
    renderAll(); 
    logAudit('KAS KELUAR', `${k} - ${formatRp(a)}`); 
    showToast('Dicatat!');
}

async function hapusEx(id) { 
    if(confirm('Hapus?')) { 
        dataPengeluaran = dataPengeluaran.filter(e=>e.id !== id); 
        await saveData('XIDKV1_Exp', dataPengeluaran, 'pengeluaran'); 
        renderTableExpense(); 
        renderDashboard(); 
        showToast('Dihapus'); 
    } 
}

function openPemasukanLainModal() { 
    const lainAmount = document.getElementById('lain-amount');
    const lainDesc = document.getElementById('lain-desc');

    if (lainAmount) lainAmount.value = ''; 
    if (lainDesc) lainDesc.value = ''; 
    openModal('lain-modal'); 
}

async function prosesTambahLain() {
    const lainDesc = document.getElementById('lain-desc');
    const lainAmount = document.getElementById('lain-amount');
    const lainSumber = document.getElementById('lain-sumber');

    let d = lainDesc ? lainDesc.value.trim() : '';
    let a = lainAmount ? Number(lainAmount.value) : 0;
    let s = lainSumber ? lainSumber.value : 'fisik';
    
    if(!d || a <= 0) return showToast('Invalid!','error');
    
    dataPemasukanLain.push({id:Date.now(), desc:d, nominal:a, sumber:s, tanggal:new Date().toISOString().split('T')[0]}); 
    await saveData('XIDKV1_Lain', dataPemasukanLain, 'pemasukan_lain'); 
    closeModal('lain-modal'); 
    renderAll(); 
    logAudit('KAS LAIN', `${d} - ${formatRp(a)}`); 
    showToast('Disimpan!');
}

async function simpanPengumuman() {
    const inputAnn = document.getElementById('input-pengumuman');
    let p = inputAnn ? inputAnn.value.trim() : ''; 
    if(!p) return showToast('Kosong!', 'error');
    
    pengumumanKelas = p; 
    localStorage.setItem('XIDKV1_Ann', p); 
    if(useCloud && supabaseClient) await supabaseClient.from('pengumuman').upsert({id:1, pesan:p});
    
    const annText = document.getElementById('announcement-text');
    if (annText) annText.innerText = p; 
    showToast('Diupdate!');
}

function updateFileName(input) {
    const lbl = document.getElementById('file-name-label');
    if(!lbl) return;
    if(input && input.files && input.files[0]) { 
        lbl.innerText = "File: " + input.files[0].name; 
        lbl.style.color = "var(--success)"; 
    } else { 
        lbl.innerText = "Klik untuk pilih file Excel"; 
        lbl.style.color = "inherit"; 
    }
}

function lihatProfil(id) {
    currentProfileId = id; 
    let s = dataSiswa.find(x=>x.id === id); 
    if(!s) return;
    
    let tot = calcTotal(s.payments); 
    let totBln = calcBulan(s.payments); 
    let fr = s.payments && Array.isArray(s.payments) ? s.payments.length : 0;
    
    const avatarEl = document.getElementById('profil-avatar');
    const namaEl = document.getElementById('profil-nama');
    const gamEl = document.getElementById('profil-gamifikasi');
    const totEl = document.getElementById('profil-total');
    const sisaEl = document.getElementById('profil-sisa');
    const statusBadgeEl = document.getElementById('profil-status-badge');

    if (avatarEl) avatarEl.src = generateAvatar(s.nama); 
    if (namaEl) namaEl.innerText = s.nama || '';
    if (gamEl) gamEl.innerText = getGamifikasi(tot, fr);
    if (totEl) totEl.innerText = formatRp(tot); 
    if (sisaEl) {
        sisaEl.innerText = totBln >= 3000 ? 'LUNAS' : formatRp(3000 - totBln);
        sisaEl.style.color = totBln >= 3000 ? 'var(--success)' : 'var(--danger)';
    }
    if (statusBadgeEl) {
        statusBadgeEl.innerHTML = totBln >= 3000 ? `<span class="badge badge-lunas">LUNAS BULAN INI</span>` : `<span class="badge badge-belum">BELUM LUNAS</span>`;
    }
    
    let hl = document.getElementById('history-list'); 
    if (hl) {
        hl.innerHTML = '';
        let isAdminLoggedIn = document.getElementById('admin-panel') && document.getElementById('admin-panel').style.display !== 'none';
        
        if(s.payments && Array.isArray(s.payments)) {
            [...s.payments].reverse().forEach((p, index) => { 
                if (p) {
                    if (!p.id) p.id = 'pay_fallback_' + index;
                    let deleteBtn = isAdminLoggedIn ? `<button class="btn btn-danger btn-icon-only" style="width:28px; height:28px; padding:0; min-height:unset;" onclick="hapusSetoranSiswa(${s.id}, '${p.id}')" title="Hapus Setoran"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>` : '';
                    
                    hl.innerHTML += `
                        <li class="history-item" style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <b style="font-size:0.9rem;">${p.date || ''}</b>
                                ${p.talangan ? '<br><span class="badge badge-talangan" style="padding:2px 6px; margin-top:2px; font-size:0.6rem;">Talangan</span>' : ''}
                            </div>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div class="money-blur" style="color:var(--primary-dark); font-weight:900;">${formatRp(p.amount || 0)}</div>
                                ${deleteBtn}
                            </div>
                        </li>
                    `; 
                }
            });
        }
        if (hl.innerHTML === '') {
            hl.innerHTML = `<li style="text-align:center; padding: 20px; color:var(--text-muted);">Belum ada riwayat setoran.</li>`;
        }
    }
    openModal('student-modal');
    lucide.createIcons();
}

async function hapusSetoranSiswa(studentId, paymentId) {
    if (!confirm('Yakin ingin menghapus setoran/transaksi ini? Saldo dan rekap siswa akan disesuaikan.')) return;
    let s = dataSiswa.find(x => x.id === studentId);
    if (s && Array.isArray(s.payments)) {
        s.payments = s.payments.filter(p => p && String(p.id) !== String(paymentId));
        await saveData('XIDKV1_Siswa', dataSiswa, 'siswa');
        logAudit('HAPUS SETORAN', `Menghapus riwayat setoran siswa: ${s.nama}`);
        showToast('Setoran berhasil dihapus!', 'success');
        renderAll();
        lihatProfil(studentId); 
    }
}

function cetakKwitansi() {
    if(!currentProfileId) return; 
    let s = dataSiswa.find(x=>x.id === currentProfileId); 
    if(!s || !s.payments || !Array.isArray(s.payments) || s.payments.length === 0) return showToast('Belum ada setoran', 'error');
    
    let lp = s.payments[s.payments.length - 1];
    if (!lp) return;

    const kwiNo = document.getElementById('kwi-no');
    const kwiNama = document.getElementById('kwi-nama');
    const kwiTgl = document.getElementById('kwi-tgl');
    const kwiNominal = document.getElementById('kwi-nominal');

    if (kwiNo) kwiNo.innerText = 'KAS-' + Date.now().toString().slice(-6); 
    if (kwiNama) kwiNama.innerText = s.nama || ''; 
    if (kwiTgl) kwiTgl.innerText = lp.date || ''; 
    if (kwiNominal) kwiNominal.innerText = formatRp(lp.amount || 0);
    
    closeModal('student-modal'); 
    document.body.classList.add('printing-kwitansi'); 
    window.print(); 
    setTimeout(()=>document.body.classList.remove('printing-kwitansi'), 1000);
}

function cetakSP(id) {
    let s = dataSiswa.find(x=>x.id === id); 
    if(!s) return;
    let krg = 3000 - calcBulan(s.payments); 
    if(krg <= 0) return showToast('Sudah lunas!', 'error');
    
    const spNama = document.getElementById('sp-nama');
    const spNominal = document.getElementById('sp-nominal');
    const spTgl = document.getElementById('sp-tgl');

    if (spNama) spNama.innerText = s.nama || ''; 
    if (spNominal) spNominal.innerText = formatRp(krg); 
    if (spTgl) spTgl.innerText = new Date().toLocaleDateString('id-ID');
    
    document.body.classList.add('printing-sp'); 
    window.print(); 
    setTimeout(()=>document.body.classList.remove('printing-sp'), 1000); 
    logAudit('CETAK SP', `${s.nama || ''}`);
}

function printReport() { 
    document.body.classList.add('printing-rekap'); 
    window.print(); 
    setTimeout(()=>document.body.classList.remove('printing-rekap'), 1000); 
}

function exportMatrixExcel() {
    let d = [["No", "Nama", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des", "Total"]];
    dataSiswa.forEach((s,i) => { 
        if (!s) return;
        let mt = Array(12).fill(0); 
        let gt = 0; 
        if(s.payments && Array.isArray(s.payments)) {
            s.payments.forEach(p=>{ 
                if (p && p.date && p.date.includes('-')) {
                    let parts = p.date.split('-'); 
                    let y = parseInt(parts[0]);
                    let m = parseInt(parts[1]);
                    if(y === globalYear && m >= 1 && m <= 12) mt[m - 1] += Number(p.amount || 0); 
                    gt += Number(p.amount || 0); 
                }
            }); 
        }
        d.push([i+1, s.nama || '', ...mt, gt]); 
    });
    let wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(d), "Matriks"); 
    XLSX.writeFile(wb, `Matriks_${globalYear}.xlsx`); 
    showToast('Excel diunduh!');
}

function generateBroadcastWA() {
    const filterEl = document.getElementById('global-month-filter');
    let bln = filterEl && filterEl.options[filterEl.selectedIndex] ? filterEl.options[filterEl.selectedIndex].text : 'Bulan Ini';
    let b = []; 
    dataSiswa.forEach(s => { 
        if (s) {
            let c = calcBulan(s.payments); 
            if(c < 3000) b.push(`- ${s.nama || ''} (Kurang ${formatRp(3000-c)})`); 
        }
    });
    
    if(b.length === 0) return showToast('Semua lunas!', 'success');
    let msg = `📢 *TAGIHAN KAS KELAS* (${bln})\n\nBelum lunas:\n${b.join('\n')}\n\nSegera dilunasi ya. Thanks!`;
    let ta = document.getElementById('hidden-copy-area'); 
    if (ta) {
        ta.value = msg; 
        ta.select(); 
        document.execCommand('copy'); 
        showToast('Teks dicopy ke clipboard!');
    }
}

async function importExcel() {
    const fileEl = document.getElementById('excel-file');
    const file = fileEl && fileEl.files ? fileEl.files[0] : null; 
    if(!file) return showToast('Pilih file!', 'error');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const wb = XLSX.read(e.target.result, {type: 'binary'}); 
            const ws = wb.Sheets[wb.SheetNames[0]]; 
            const data = XLSX.utils.sheet_to_json(ws, {header: 1});
            
            let added = 0;
            data.forEach((row, i) => { 
                if(i > 0 && row && row[0]) { 
                    let nama = row[0].toString().trim(); 
                    if(nama && !dataSiswa.some(s => s && s.nama && s.nama.toLowerCase() === nama.toLowerCase())) { 
                        dataSiswa.push({id:Date.now()+i, nama, payments:[]}); 
                        added++; 
                    } 
                } 
            });
            
            if(added > 0) { 
                await saveData('XIDKV1_Siswa', dataSiswa, 'siswa'); 
                renderTableAdmin(); 
                renderTablePublic(); 
                showToast(`Berhasil import ${added} siswa!`); 
            } else { 
                showToast('Tidak ada siswa baru.', 'error'); 
            }
        } catch (err) {
            showToast('Gagal memproses file Excel.', 'error');
        }
    }; 
    reader.readAsBinaryString(file);
}

function undianLunas() { 
    openModal('undian-modal'); 
    const box = document.getElementById('undian-name');
    if (box) {
        box.innerText = "Siapa yang beruntung?"; 
        box.style.background = 'var(--secondary)'; 
        box.style.color = 'var(--primary-dark)';
    }
}

function mulaiUndian() {
    let lunas = dataSiswa.filter(s => s && calcBulan(s.payments) >= 3000);
    if(lunas.length === 0) return showToast('Belum ada yang lunas!', 'error');
    
    const box = document.getElementById('undian-name'); 
    const btnSpin = document.getElementById('btn-spin');
    let count = 0; 
    if (btnSpin) btnSpin.disabled = true;
    
    let interval = setInterval(() => { 
        if (box && lunas.length > 0) {
            box.innerText = lunas[Math.floor(Math.random() * lunas.length)].nama || ''; 
        }
        count++; 
        
        if(count > 25) { 
            clearInterval(interval); 
            let winnerObj = lunas[Math.floor(Math.random() * lunas.length)];
            let winner = winnerObj ? (winnerObj.nama || '') : ''; 
            if (box) {
                box.innerHTML = `🎉 ${winner} 🎉`; 
                box.style.background = 'var(--success-light)'; 
                box.style.color = 'var(--success)'; 
            }
            if (btnSpin) btnSpin.disabled = false; 
        } 
    }, 80);
}

async function tutupBuku() {
    if(!confirm("Yakin tutup buku? Semua riwayat setoran akan direset.")) return;
    dataSiswa.forEach(s => { if (s) s.payments = []; }); 
    dataPengeluaran = []; 
    dataPemasukanLain = []; 
    dataAudit = [];
    
    await saveData('XIDKV1_Siswa', dataSiswa, 'siswa'); 
    await saveData('XIDKV1_Exp', dataPengeluaran, 'pengeluaran'); 
    await saveData('XIDKV1_Lain', dataPemasukanLain, 'pemasukan_lain');
    
    localStorage.removeItem('XIDKV1_Audit'); 
    window.location.reload();
}

let catChart = null;
function initChart() {
    const canvas = document.getElementById('kategoriChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d'); 
    if(catChart) catChart.destroy();
    
    let cats = {}; 
    dataPengeluaran.forEach(e => { 
        if (e) {
            let k = e.kategori || 'Lainnya'; 
            cats[k] = (cats[k] || 0) + Number(e.amount || 0); 
        }
    });
    
    if(Object.keys(cats).length === 0) return;
    
    catChart = new Chart(ctx, { 
        type: 'doughnut', 
        data: { 
            labels: Object.keys(cats), 
            datasets: [{ 
                data: Object.values(cats), 
                backgroundColor: ['#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'], 
                borderWidth: 0, 
                hoverOffset: 15 
            }] 
        }, 
        options: { 
            responsive: true, 
            plugins: { 
                legend: { position: 'bottom' } 
            } 
        } 
    });
}
