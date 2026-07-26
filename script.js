// =======================================================
// KASKELASKU ULTRA PRO MAX - SCRIPT (PAYMENT DELETE FIX)
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

    document.getElementById('loader').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        document.getElementById('announcement-text').innerText = pengumumanKelas;
        renderAll(); renderCalendar(); lucide.createIcons(); 
    }, 300);
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
}// --- 3. LOAD & SYNC DATA DATABASE DENGAN AUTO SEEDING ---
async function loadData() {
    if (useCloud) {
        try {
            let { data: siswaData, error: errS } = await supabaseClient.from('siswa').select('*');
            let { data: expData, error: errE } = await supabaseClient.from('pengeluaran').select('*');
            let { data: auditData, error: errA } = await supabaseClient.from('audit_log').select('*');

            if (!errS && siswaData) {
                if (siswaData.length > 0) {
                    dataSiswa = siswaData.map(s => ({ id: s.id, nama: s.nama, payments: s.payments || [] }));
                } else {
                    dataSiswa = defaultSiswa;
                    await saveDataSiswa(); // Auto seed ke cloud jika tabel kosong
                }
            }

            if (!errE && expData) {
                if (expData.length > 0) {
                    dataPengeluaran = expData;
                } else {
                    dataPengeluaran = defaultExpenses;
                    await saveDataExpense();
                }
            }

            if (!errA && auditData) {
                dataAudit = auditData;
            }
            return;
        } catch(err) {
            console.warn("Koneksi cloud gagal, beralih ke penyimpanan lokal.");
            useCloud = false;
        }
    }

    // Fallback LocalStorage (Menyimpan permanen di browser pengguna)
    dataSiswa = JSON.parse(localStorage.getItem('XIDKV1_Siswa')) || defaultSiswa;
    dataPengeluaran = JSON.parse(localStorage.getItem('XIDKV1_Expense')) || defaultExpenses;
    dataAudit = JSON.parse(localStorage.getItem('XIDKV1_Audit')) || [];
}

async function saveDataSiswa() {
    localStorage.setItem('XIDKV1_Siswa', JSON.stringify(dataSiswa));
    if (useCloud && supabaseClient) {
        try {
            for(let s of dataSiswa) {
                await supabaseClient.from('siswa').upsert({ id: s.id, nama: s.nama, payments: s.payments });
            }
        } catch(e) { console.error("Gagal simpan cloud:", e); }
    }
}

async function saveDataExpense() {
    localStorage.setItem('XIDKV1_Expense', JSON.stringify(dataPengeluaran));
    if (useCloud && supabaseClient) {
        try {
            for(let e of dataPengeluaran) {
                await supabaseClient.from('pengeluaran').upsert({ id: e.id, desc: e.desc, amount: e.amount, date: e.date });
            }
        } catch(e) { console.error("Gagal simpan cloud:", e); }
    }
}

async function logAudit(action, detail) {
    const logItem = { id: Date.now(), time: new Date().toLocaleString('id-ID'), action, detail };
    dataAudit.unshift(logItem);
    localStorage.setItem('XIDKV1_Audit', JSON.stringify(dataAudit));
    if (useCloud && supabaseClient) {
        try {
            await supabaseClient.from('audit_log').insert([logItem]);
        } catch(e) { console.error("Gagal log audit cloud:", e); }
    }
}

// --- 4. TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconName = type === 'success' ? 'circle-check' : 'circle-alert';
    toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 5. RENDER SISTEM AWAL ---
window.addEventListener('load', async () => {
    await loadData();
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            
            renderTablePublic();
            renderCalendar();
            renderLeaderboard();
            renderPublicActivityFeed();
            lucide.createIcons();
        }, 400);
    }, 1000);
});

// --- 6. WAKTU REALTIME WIB ---
function updateTime() {
    const now = new Date();
    const optionsDate = { timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById('current-date').innerText = now.toLocaleDateString('id-ID', optionsDate);
    
    const optionsTime = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    document.getElementById('current-time').innerText = now.toLocaleTimeString('id-ID', optionsTime).replace(/\./g, ':') + ' WIB';
}
setInterval(updateTime, 1000);
updateTime();

// --- 7. KALENDER DASHBOARD ---
let calDate = new Date();
function renderCalendar() {
    const monthYear = document.getElementById('month-year');
    const calBody = document.getElementById('calendar-body');
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    const month = calDate.getMonth();
    const year = calDate.getFullYear();
    monthYear.innerText = `${months[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    calBody.innerHTML = '';
    for(let i = 0; i < firstDay; i++) {
        calBody.innerHTML += `<div class="cal-day empty"></div>`;
    }
    
    const today = new Date();
    for(let i = 1; i <= daysInMonth; i++) {
        let isToday = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) ? 'today' : '';
        calBody.innerHTML += `<div class="cal-day ${isToday}">${i}</div>`;
    }
}
function prevMonth() { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); }
function nextMonth() { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); }

// --- 8. SWITCH MAIN VIEW ---
function switchMainView(viewType) {
    document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
    if(viewType === 'tabel') {
        document.querySelector('.main-tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('view-tabel').style.display = 'block';
        document.getElementById('view-matrix').style.display = 'none';
        renderTablePublic();
    } else {
        document.querySelector('.main-tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('view-tabel').style.display = 'none';
        document.getElementById('view-matrix').style.display = 'block';
        renderMatrixRecap();
    }
    lucide.createIcons();
}

// --- 9. FILTER & PENCARIAN ---
let currentFilter = 'all';

function setFilter(filterType, btnElement) {
    currentFilter = filterType;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    btnElement.classList.add('active');
    renderTablePublic();
}

function filterData() {
    renderTablePublic();
}

// --- 10. RENDER KEUANGAN & WIDGETS ---
let lunasCount = 0;
let belumCount = 0;

function formatRp(angka) {
    return 'Rp ' + Number(angka).toLocaleString('id-ID');
}
function generateAvatar(nama) {
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(nama)}&backgroundColor=e0f2fe`;
}

function hitungTotalBulanIni(siswa) {
    if (!siswa.payments) return 0;
    const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');
    const currentYearStr = String(new Date().getFullYear());
    return siswa.payments
        .filter(p => {
            const [y, m] = p.date.split('-');
            return y === currentYearStr && m === currentMonthStr;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);
}

function hitungTotalKeseluruhan(siswa) {
    if (!siswa.payments) return 0;
    return siswa.payments.reduce((sum, p) => sum + Number(p.amount), 0);
}

function renderLeaderboard() {
    const listEl = document.getElementById('leaderboard-list');
    listEl.innerHTML = '';
    const sorted = [...dataSiswa].sort((a, b) => hitungTotalKeseluruhan(b) - hitungTotalKeseluruhan(a));
    const topThree = sorted.slice(0, 5);

    topThree.forEach((siswa, index) => {
        const total = hitungTotalKeseluruhan(siswa);
        let rankClass = index === 0 ? 'rank-1' : (index === 1 ? 'rank-2' : (index === 2 ? 'rank-3' : 'rank-other'));

        listEl.innerHTML += `
            <div class="leaderboard-item">
                <div class="leaderboard-left">
                    <div class="rank-badge ${rankClass}">${index + 1}</div>
                    <span>${siswa.nama}</span>
                </div>
                <div style="font-weight:900; color:var(--primary-dark);">${formatRp(total)}</div>
            </div>
        `;
    });
}

function renderPublicActivityFeed() {
    const feedEl = document.getElementById('public-activity-feed');
    feedEl.innerHTML = '';
    let activities = [];

    dataSiswa.forEach(s => {
        if(s.payments) {
            s.payments.forEach(p => {
                activities.push({ type: 'in', title: `Setoran dari ${s.nama}`, date: p.date, amount: p.amount });
            });
        }
    });

    dataPengeluaran.forEach(e => {
        activities.push({ type: 'out', title: `Keluar: ${e.desc}`, date: e.date, amount: e.amount });
    });

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = activities.slice(0, 5);

    if(recent.length === 0) {
        feedEl.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:15px;">Belum ada aktivitas.</div>`;
        return;
    }

    recent.forEach(act => {
        const isIncome = act.type === 'in';
        const colorStyle = isIncome ? 'color: var(--success); font-weight:800;' : 'color: var(--danger); font-weight:800;';
        const sign = isIncome ? '+' : '-';

        feedEl.innerHTML += `
            <div class="activity-item">
                <div>
                    <div style="font-weight:700; color:var(--text-dark);">${act.title}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">${act.date}</div>
                </div>
                <div style="${colorStyle}">${sign} ${formatRp(act.amount)}</div>
            </div>
        `;
    });
}

function kirimPengingatWA(namaSiswa, sisaTagihan) {
    const pesan = `Halo ${namaSiswa}, ini pengingat ramah dari pengurus Kas XI DKV 1. Tagihan kas bulan ini masih kurang ${formatRp(sisaTagihan)}. Mohon segera dicicil ya, terima kasih! ✨`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`;
    window.open(url, '_blank');
}

function renderTablePublic() {
    const tbody = document.getElementById('data-siswa-publik');
    tbody.innerHTML = '';
    let totalTerkumpulAll = 0;
    let totalKeluar = dataPengeluaran.reduce((sum, e) => sum + Number(e.amount), 0);
    lunasCount = 0; belumCount = 0;

    const keyword = document.getElementById('search-input').value.toLowerCase();
    const TARGET_BULANAN = 3000;
    let sortedSiswa = [...dataSiswa].sort((a, b) => hitungTotalKeseluruhan(b) - hitungTotalKeseluruhan(a));

    sortedSiswa.forEach((siswa, index) => {
        const totalBulanIni = hitungTotalBulanIni(siswa);
        const totalAll = hitungTotalKeseluruhan(siswa);
        totalTerkumpulAll += totalAll;
        
        const isLunas = totalBulanIni >= TARGET_BULANAN;
        if(isLunas) lunasCount++; else belumCount++;

        if (currentFilter === 'lunas' && !isLunas) return;
        if (currentFilter === 'belum' && isLunas) return;
        if (keyword && !siswa.nama.toLowerCase().includes(keyword)) return;

        let badge = '';
        let actionBtn = `<button class="btn btn-outline btn-icon-only" onclick="lihatProfil(${siswa.id})" title="Detail"><i data-lucide="eye"></i></button>`;

        if (isLunas) {
            badge = `<span class="badge badge-lunas"><i data-lucide="circle-check"></i> LUNAS</span>`;
        } else {
            let kurang = TARGET_BULANAN - totalBulanIni;
            badge = `<span class="badge badge-belum"><i data-lucide="circle-alert"></i> KURANG ${formatRp(kurang)}</span>`;
            actionBtn += ` <button class="btn btn-whatsapp btn-icon-only" onclick="kirimPengingatWA('${siswa.nama}', ${kurang})" title="Kirim WA Pengingat"><i data-lucide="message-circle"></i></button>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>#${index + 1}</b></td>
            <td>
                <div class="student-profile-trigger" onclick="lihatProfil(${siswa.id})">
                    <img src="${generateAvatar(siswa.nama)}" class="student-avatar" alt="Avatar">
                    <span class="student-name">${siswa.nama}</span>
                </div>
            </td>
            <td style="font-weight:800; color:var(--primary-dark);">${formatRp(totalBulanIni)}</td>
            <td>${badge}</td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('total-terkumpul').innerText = formatRp(totalTerkumpulAll);
    document.getElementById('total-pengeluaran-publik').innerText = formatRp(totalKeluar);
    document.getElementById('saldo-bersih').innerText = formatRp(totalTerkumpulAll - totalKeluar);
    
    renderLeaderboard();
    renderPublicActivityFeed();
    lucide.createIcons(); 
}

// --- 11. MATRIKS REKAP 12 BULAN ---
function renderMatrixRecap() {
    const tbody = document.getElementById('data-matrix-body');
    tbody.innerHTML = '';

    dataSiswa.forEach((siswa, index) => {
        let monthlyTotals = Array(12).fill(0);
        let grandTotal = 0;

        if (siswa.payments) {
            siswa.payments.forEach(p => {
                const [y, m, d] = p.date.split('-');
                const monthIndex = parseInt(m, 10) - 1;
                if (monthIndex >= 0 && monthIndex < 12) {
                    monthlyTotals[monthIndex] += Number(p.amount);
                }
                grandTotal += Number(p.amount);
            });
        }

        let rowHTML = `<td><b>${index + 1}</b></td><td style="font-weight:800; text-align:left;">${siswa.nama}</td>`;
        for(let i = 0; i < 12; i++) {
            let val = monthlyTotals[i];
            let cellColor = val >= 3000 ? 'color: var(--success); font-weight:800;' : (val > 0 ? 'color: var(--primary-dark); font-weight:700;' : 'color: #cbd5e1;');
            rowHTML += `<td style="${cellColor}">${val > 0 ? formatRp(val) : '-'}</td>`;
        }
        rowHTML += `<td style="font-weight:900; color:var(--primary-dark);">${formatRp(grandTotal)}</td>`;

        const tr = document.createElement('tr');
        tr.innerHTML = rowHTML;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

// --- 12. ADMIN TABS & AUDIT LOG ---
function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
    
    if(tabName === 'siswa') {
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('tab-siswa').style.display = 'block';
        renderTableAdmin();
    } else if(tabName === 'pengeluaran') {
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('tab-pengeluaran').style.display = 'block';
        renderTableExpense();
    } else if(tabName === 'audit') {
        document.querySelector('.tab-btn:nth-child(3)').classList.add('active');
        document.getElementById('tab-audit').style.display = 'block';
        renderTableAudit();
    } else if(tabName === 'analisis') {
        document.querySelector('.tab-btn:nth-child(4)').classList.add('active');
        document.getElementById('tab-analisis').style.display = 'block';
        initAdminChart();
    }
    lucide.createIcons();
}

function renderTableAdmin() {
    const tbody = document.getElementById('data-siswa-admin');
    tbody.innerHTML = '';

    dataSiswa.forEach((siswa, index) => {
        const totalAll = hitungTotalKeseluruhan(siswa);
        const jumlahCicilan = siswa.payments ? siswa.payments.length : 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${index + 1}</b></td>
            <td style="font-weight: 800; text-align:left;">${siswa.nama}</td>
            <td><span class="badge bg-soft-blue">${jumlahCicilan}x Cicilan</span></td>
            <td style="font-weight:800; color:var(--primary-dark);">${formatRp(totalAll)}</td>
            <td>
                <div style="display:flex; gap:8px; justify-content:center;">
                    <button class="btn btn-outline btn-icon-only" onclick="editSiswa(${siswa.id})" title="Edit Nama"><i data-lucide="pencil"></i></button>
                    <button class="btn btn-danger btn-icon-only" onclick="hapusSiswa(${siswa.id})" title="Hapus"><i data-lucide="trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

function renderTableExpense() {
    const tbody = document.getElementById('data-pengeluaran');
    tbody.innerHTML = '';

    if(dataPengeluaran.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:var(--text-muted); padding:20px;">Belum ada catatan kas keluar.</td></tr>`;
        return;
    }

    dataPengeluaran.forEach((exp, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${index + 1}</b></td>
            <td>${exp.date}</td>
            <td style="text-align:left; font-weight:700;">${exp.desc}</td>
            <td style="font-weight:800; color:var(--danger);">${formatRp(exp.amount)}</td>
            <td><button class="btn btn-danger btn-icon-only" onclick="hapusPengeluaran(${exp.id})"><i data-lucide="trash"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

function renderTableAudit() {
    const tbody = document.getElementById('data-audit');
    tbody.innerHTML = '';

    if(dataAudit.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="color:var(--text-muted); padding:20px;">Belum ada riwayat aktivitas admin.</td></tr>`;
        return;
    }

    dataAudit.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-size:0.8rem; color:var(--text-muted);">${log.time}</td>
            <td><span class="badge bg-soft-blue">${log.action}</span></td>
            <td style="text-align:left; font-weight:600;">${log.detail}</td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

// --- 13. PROFIL SISWA & CHART ---
let studentBarInstance = null;

function lihatProfil(id) {
    const siswa = dataSiswa.find(s => s.id === id);
    if(!siswa) return;

    const totalAll = hitungTotalKeseluruhan(siswa);
    const totalBulanIni = hitungTotalBulanIni(siswa);
    const TARGET_BULANAN = 3000;
    const sisa = TARGET_BULANAN - totalBulanIni;
    const freq = siswa.payments ? siswa.payments.length : 0;
    const avg = freq > 0 ? Math.round(totalAll / freq) : 0;

    document.getElementById('profil-avatar').src = generateAvatar(siswa.nama);
    document.getElementById('profil-nama').innerText = siswa.nama;
    document.getElementById('profil-total').innerText = formatRp(totalAll);
    document.getElementById('profil-sisa').innerText = sisa > 0 ? formatRp(sisa) : 'Rp 0 (Lunas)';
    document.getElementById('profil-freq').innerText = freq + 'x';
    document.getElementById('profil-avg').innerText = formatRp(avg);

    let levelHtml = `<i data-lucide="award"></i> Bronze`;
    if(totalAll >= 15000) levelHtml = `<i data-lucide="crown"></i> Elite Gold`;
    else if(totalAll >= 8000) levelHtml = `<i data-lucide="shield-check"></i> Silver Pro`;
    document.getElementById('profil-badge-level').innerHTML = levelHtml;
    
    const badgeHtml = totalBulanIni >= TARGET_BULANAN 
        ? `<span class="badge badge-lunas"><i data-lucide="circle-check"></i> Target Bulan Ini Lunas!</span>` 
        : `<span class="badge badge-belum"><i data-lucide="circle-alert"></i> Belum Lunas Bulan Ini</span>`;
    document.getElementById('profil-status-badge').innerHTML = badgeHtml;

    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    if(!siswa.payments || siswa.payments.length === 0) {
        historyList.innerHTML = `<li style="text-align:center; color:var(--text-muted); padding:15px;">Belum ada riwayat cicilan setoran.</li>`;
    } else {
        const sortedPayments = [...siswa.payments].reverse();
        sortedPayments.forEach(p => {
            historyList.innerHTML += `
                <li class="history-item">
                    <div class="history-left"><i data-lucide="circle-check" class="icon-success"></i> ${p.date}</div>
                    <div class="history-right">${formatRp(p.amount)}</div>
                </li>
            `;
        });
    }

    openModal('student-modal');

    const ctx = document.getElementById('studentBarChart').getContext('2d');
    if(studentBarInstance) studentBarInstance.destroy();

    const labels = siswa.payments && siswa.payments.length > 0 ? siswa.payments.map(p => p.date) : ['Belum Ada'];
    const amounts = siswa.payments && siswa.payments.length > 0 ? siswa.payments.map(p => p.amount) : [0];

    studentBarInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nominal Cicilan (Rp)',
                data: amounts,
                backgroundColor: '#0284c7',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}

// --- 14. ADMIN AUTH & CRUD ---
function openLogin() { openModal('login-modal'); }

function prosesLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (user === 'syallofficial.id' && pass === 'irsyal989511') {
        closeModal('login-modal');
        document.getElementById('view-tabel').style.display = 'block';
        document.getElementById('view-matrix').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('btn-login-trigger').style.display = 'none';
        document.getElementById('btn-logout-trigger').style.display = 'flex';
        
        switchAdminTab('siswa');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        showToast("Login Berhasil! Selamat datang Admin.", "success");
        logAudit("LOGIN", "Admin berhasil masuk ke panel.");
    } else {
        showToast("Akses Ditolak! Kredensial salah.", "error");
    }
}

function logoutAdmin() {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('btn-login-trigger').style.display = 'flex';
    document.getElementById('btn-logout-trigger').style.display = 'none';
    renderTablePublic();
    showToast("Berhasil keluar dari mode Admin.", "success");
}

function openFormModal(id = null) {
    if (id) {
        document.getElementById('form-title').innerText = "Edit Nama Siswa";
        const siswa = dataSiswa.find(s => s.id === id);
        document.getElementById('form-id').value = siswa.id;
        document.getElementById('form-nama').value = siswa.nama;
    } else {
        document.getElementById('form-title').innerText = "Tambah Siswa Baru";
        document.getElementById('form-id').value = "";
        document.getElementById('form-nama').value = "";
    }
    openModal('form-modal');
}

function editSiswa(id) { openFormModal(id); }

async function simpanDataSiswa() {
    const id = document.getElementById('form-id').value;
    const nama = document.getElementById('form-nama').value.trim();

    if (!nama) { showToast("Nama siswa wajib diisi!", "error"); return; }

    if (id) {
        const index = dataSiswa.findIndex(s => s.id == id);
        if(index !== -1) {
            dataSiswa[index].nama = nama;
            logAudit("EDIT SISWA", `Mengubah nama siswa ID ${id} menjadi ${nama}`);
        }
    } else {
        dataSiswa.push({ id: Date.now(), nama, payments: [] });
        logAudit("TAMBAH SISWA", `Mendaftarkan siswa baru: ${nama}`);
    }

    await saveDataSiswa();
    closeModal('form-modal');
    renderTableAdmin();
    renderTablePublic();
    showToast("Data siswa berhasil disimpan!", "success");
}

async function hapusSiswa(id) {
    if(confirm("Yakin ingin menghapus siswa ini beserta seluruh riwayat setorannya?")) {
        const target = dataSiswa.find(s => s.id === id);
        dataSiswa = dataSiswa.filter(s => s.id !== id);
        await saveDataSiswa();
        renderTableAdmin();
        renderTablePublic();
        logAudit("HAPUS SISWA", `Menghapus siswa: ${target ? target.nama : id}`);
        showToast("Siswa berhasil dihapus.", "success");
    }
}

function openPaymentModal() {
    const select = document.getElementById('pay-siswa-id');
    select.innerHTML = '';
    dataSiswa.forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.nama}</option>`;
    });
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pay-date').value = today;
    document.getElementById('pay-amount').value = '';
    
    openModal('payment-modal');
}

async function prosesTambahCicilan() {
    const siswaId = Number(document.getElementById('pay-siswa-id').value);
    const amount = Number(document.getElementById('pay-amount').value);
    const date = document.getElementById('pay-date').value;

    if(!amount || amount <= 0) { showToast("Masukkan nominal setoran yang valid!", "error"); return; }
    if(!date) { showToast("Pilih tanggal setoran!", "error"); return; }

    const siswa = dataSiswa.find(s => s.id === siswaId);
    if(siswa) {
        if(!siswa.payments) siswa.payments = [];
        siswa.payments.push({ date, amount });
        await saveDataSiswa();
        closeModal('payment-modal');
        renderTableAdmin();
        renderTablePublic();
        logAudit("CICILAN KAS", `Mencatat setoran ${formatRp(amount)} untuk ${siswa.nama}`);
        showToast(`Berhasil mencatat setoran ${formatRp(amount)} untuk ${siswa.nama}`, "success");
    }
}

function openExpenseModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('exp-date').value = today;
    document.getElementById('exp-desc').value = '';
    document.getElementById('exp-amount').value = '';
    openModal('expense-modal');
}

async function prosesTambahPengeluaran() {
    const desc = document.getElementById('exp-desc').value.trim();
    const amount = Number(document.getElementById('exp-amount').value);
    const date = document.getElementById('exp-date').value;

    if(!desc) { showToast("Keterangan pengeluaran wajib diisi!", "error"); return; }
    if(!amount || amount <= 0) { showToast("Nominal pengeluaran tidak valid!", "error"); return; }
    if(!date) { showToast("Pilih tanggal pengeluaran!", "error"); return; }

    dataPengeluaran.push({ id: Date.now(), desc, amount, date });
    await saveDataExpense();
    closeModal('expense-modal');
    renderTableExpense();
    renderTablePublic();
    logAudit("KAS KELUAR", `Pengeluaran "${desc}" sebesar ${formatRp(amount)}`);
    showToast("Catatan kas keluar berhasil disimpan!", "success");
}

async function hapusPengeluaran(id) {
    if(confirm("Hapus catatan pengeluaran ini?")) {
        dataPengeluaran = dataPengeluaran.filter(e => e.id !== id);
        await saveDataExpense();
        renderTableExpense();
        renderTablePublic();
        logAudit("HAPUS KAS KELUAR", `Menghapus catatan pengeluaran ID ${id}`);
        showToast("Pengeluaran dihapus.", "success");
    }
}

// --- 15. UTILS MODAL & ICON ---
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
    lucide.createIcons(); 
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// --- 16. ANALYTICS CHART & EXCEL ---
let adminChartIns = null;
function initAdminChart() {
    const ctx = document.getElementById('analisisChart').getContext('2d');
    if(adminChartIns) adminChartIns.destroy();

    const TARGET_BULANAN = 3000;
    lunasCount = 0; belumCount = 0;
    dataSiswa.forEach(s => {
        if(hitungTotalBulanIni(s) >= TARGET_BULANAN) lunasCount++;
        else belumCount++;
    });

    adminChartIns = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Siswa Lunas Bulan Ini', 'Siswa Belum Lunas'],
            datasets: [{
                data: [lunasCount, belumCount],
                backgroundColor: ['#22c55e', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 12
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function exportToExcel() {
    let csvData = [ ["ID", "Nama Siswa", "Total Keseluruhan Kas", "Status Bulan Ini (Rp 3.000)"] ];
    dataSiswa.forEach(s => {
        const totalAll = hitungTotalKeseluruhan(s);
        const totalBulanIni = hitungTotalBulanIni(s);
        const status = totalBulanIni >= 3000 ? "LUNAS" : "BELUM LUNAS";
        csvData.push([s.id, s.nama, totalAll, status]);
    });

    const ws = XLSX.utils.aoa_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Cicilan Kas");
    XLSX.writeFile(wb, "Rekap_Uang_Kas_XI_DKV1_Elite.xlsx");
    showToast("File Excel berhasil diunduh!", "success");
}

function exportMatrixExcel() {
    let headers = ["ID", "Nama Siswa", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des", "Total"];
    let csvData = [headers];

    dataSiswa.forEach(s => {
        let monthly = Array(12).fill(0);
        let total = 0;
        if(s.payments) {
            s.payments.forEach(p => {
                const [y, m] = p.date.split('-');
                const idx = parseInt(m, 10) - 1;
                if(idx >= 0 && idx < 12) monthly[idx] += Number(p.amount);
                total += Number(p.amount);
            });
        }
        csvData.push([s.id, s.nama, ...monthly, total]);
    });

    const ws = XLSX.utils.aoa_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Matriks Tahunan 12 Bulan");
    XLSX.writeFile(wb, "Matriks_Rekap_Tahunan_XI_DKV1.xlsx");
    showToast("Matriks Excel berhasil diunduh!", "success");
}
