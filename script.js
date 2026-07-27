// =======================================================
// KASKELASKU ULTRA PRO MAX - SCRIPT (NO QRIS, NO MARKUP)
// =======================================================

const SUPABASE_URL = 'https://xjkahrfgkbjvvwxspsux.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqa2FocmZna2JqdnZ3eHNwc3V4Iiwicm9sZSI6ImFub24iOiJpYXQiOjE3ODQ5ODAyMDcsImV4cCI6MjEwMDU1NjIwN30.CMbZiIszCqlryp8G6h5sL6vH_JFX-Y-3wvyMSb_3SVU';
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
let pengumumanKelas = "Selamat datang di Kas Kelas XI DKV 1 Ultra Pro Max!";

// Target default (tanpa markup dummy, dikembalikan ke 0)
let classGoal = { title: "Target Proyek Kelas", target: 0 }; 

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
    
    try {
        if (!dataSiswa || dataSiswa.length === 0) {
            dataSiswa = JSON.parse(localStorage.getItem('XIDKV1_Siswa')) || [];
        }
    } catch (e) { dataSiswa = []; }

    // Jika data benar-benar kosong
    if (!dataSiswa || dataSiswa.length === 0) {
        dataSiswa = [
            { id: 1, nama: "Aditya Pratama", payments: [] },
            { id: 2, nama: "Alya Zahra", payments: [] },
            { id: 3, nama: "Bintang Saputra", payments: [] },
            { id: 4, nama: "Cinta Kirana", payments: [] },
            { id: 5, nama: "Dimas Anggara", payments: [] },
            { id: 6, nama: "Fauzan Al-Ghifari", payments: [] },
            { id: 7, nama: "Intan Permata", payments: [] },
            { id: 8, nama: "M. Irsyal", payments: [] },
            { id: 9, nama: "Naufal Ramadhan", payments: [] },
            { id: 10, nama: "Siti Aisyah", payments: [] }
        ];
    }

    // Urutkan data siswa otomatis sesuai abjad (seperti nomor absen)
    dataSiswa.sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));

    try { dataPengeluaran = JSON.parse(localStorage.getItem('XIDKV1_Exp')) || []; } catch(e) { dataPengeluaran = []; }
    try { dataPemasukanLain = JSON.parse(localStorage.getItem('XIDKV1_Lain')) || []; } catch(e) { dataPemasukanLain = []; }
    try { dataAudit = JSON.parse(localStorage.getItem('XIDKV1_Audit')) || []; } catch(e) { dataAudit = []; }
    
    pengumumanKelas = localStorage.getItem('XIDKV1_Ann') || pengumumanKelas;
    
    let savedGoal = localStorage.getItem('XIDKV1_Goal');
    if(savedGoal) { try { classGoal = JSON.parse(savedGoal); } catch(e){} }

    dataSiswa.forEach(s => {
        if (s && Array.isArray(s.payments)) {
            s.payments.forEach((p, idx) => {
                if (p && !p.id) p.id = 'pay_' + Date.now() + '_' + idx;
            });
        }
    });
}

async function saveData(key, data, table) {
    if (key === 'XIDKV1_Siswa') {
        data.sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));
    }
    localStorage.setItem(key, JSON.stringify(data));
    if (useCloud && supabaseClient) {
        try { 
            for(let item of data) { await supabaseClient.from(table).upsert(item); }
        } catch(e) {}
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
    const realTimeNow = new Date();
    globalYear = realTimeNow.getFullYear();
    globalMonth = realTimeNow.getMonth() + 1;
    calDate = new Date(globalYear, globalMonth - 1, 1);

    initTheme(); 
    initMonthFilter(); 
    await loadData();
    
    updateTime(); 
    setInterval(updateTime, 1000);

    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.style.display = 'block';
    
    const annText = document.getElementById('announcement-text');
    if (annText) annText.innerText = pengumumanKelas;

    renderAll(); 
    renderCalendar(); 
    lucide.createIcons(); 
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
        dateEl.innerText = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    if (timeEl) {
        timeEl.innerText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} WIB`;
    }
}

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

function prevMonth() { 
    calDate.setMonth(calDate.getMonth() - 1); 
    globalYear = calDate.getFullYear(); globalMonth = calDate.getMonth() + 1;
    syncMonthFilterSelect(); renderCalendar(); renderAll();
}

function nextMonth() { 
    calDate.setMonth(calDate.getMonth() + 1); 
    globalYear = calDate.getFullYear(); globalMonth = calDate.getMonth() + 1;
    syncMonthFilterSelect(); renderCalendar(); renderAll();
}

function syncMonthFilterSelect() {
    const sel = document.getElementById('global-month-filter');
    if (sel) sel.value = `${globalYear}-${String(globalMonth).padStart(2,'0')}`;
}

function initMonthFilter() {
    const sel = document.getElementById('global-month-filter'); 
    if (!sel) return;
    const y = new Date().getFullYear();
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    sel.innerHTML = '';
    for(let i = y-1; i <= y+1; i++) {
        for(let j=0; j<12; j++) {
            let val = `${i}-${String(j+1).padStart(2,'0')}`; 
            sel.innerHTML += `<option value="${val}" ${(i === globalYear && j + 1 === globalMonth) ? 'selected' : ''}>${months[j]} ${i}</option>`;
        }
    }
}

function updateGlobalFilter() { 
    const filterEl = document.getElementById('global-month-filter');
    if (!filterEl) return;
    const v = filterEl.value.split('-'); 
    if (v.length === 2) {
        globalYear = parseInt(v[0]); globalMonth = parseInt(v[1]); 
        calDate = new Date(globalYear, globalMonth - 1, 1);
        renderCalendar(); renderAll(); 
    }
}

function getMonthTarget(year, month) {
    if (year === 2026 && month === 7) return 3000; 
    return 12000; 
}

function getAllMonthsAllocation(student) {
    let allPayments = [];
    if (student && Array.isArray(student.payments)) {
        allPayments = [...student.payments].filter(p => p && p.date).sort((a,b) => new Date(a.date) - new Date(b.date));
    }
    let monthAllocations = {}; 
    if (allPayments.length > 0) {
        let firstDate = new Date(allPayments[0].date);
        let curY = firstDate.getFullYear();
        let curM = firstDate.getMonth() + 1;
        let paymentQueue = allPayments.map(p => ({ ...p, remainingAmount: Number(p.amount || 0) }));
        let qIdx = 0;
        while (qIdx < paymentQueue.length && curY <= globalYear + 1) {
            let curKey = `${curY}-${String(curM).padStart(2, '0')}`;
            if (!monthAllocations[curKey]) monthAllocations[curKey] = 0;
            let monthlyTarget = getMonthTarget(curY, curM);
            let spaceInMonth = monthlyTarget - monthAllocations[curKey];
            if (spaceInMonth > 0) {
                let pay = paymentQueue[qIdx];
                if (pay.remainingAmount <= spaceInMonth) {
                    monthAllocations[curKey] += pay.remainingAmount;
                    pay.remainingAmount = 0; qIdx++;
                } else {
                    monthAllocations[curKey] += spaceInMonth;
                    pay.remainingAmount -= spaceInMonth;
                }
            }
            if (spaceInMonth <= 0 || paymentQueue[qIdx]?.remainingAmount <= 0) {
                curM++; if (curM > 12) { curM = 1; curY++; }
            }
        }
    }
    return monthAllocations;
}

function getEffectiveMonthlyStatus(student, year, month) {
    let allocations = getAllMonthsAllocation(student);
    let totalBulanEffective = allocations[`${year}-${String(month).padStart(2, '0')}`] || 0;
    let monthlyTarget = getMonthTarget(year, month);
    if (totalBulanEffective > monthlyTarget) totalBulanEffective = monthlyTarget;

    let isJuliStart = (year === 2026 && month === 7);
    let weeks = [];
    for (let w = 1; w <= 4; w++) {
        if (isJuliStart && w > 1) weeks.push({ name: `Minggu ${w}`, target: 0, paid: 0, status: 'off' });
        else weeks.push({ name: `Minggu ${w}`, target: 3000, paid: 0, status: 'belum' });
    }
    let remaining = totalBulanEffective;
    for (let i = 0; i < weeks.length; i++) {
        if (weeks[i].target === 0) continue;
        if (remaining >= weeks[i].target) { weeks[i].paid = weeks[i].target; weeks[i].status = 'lunas'; remaining -= weeks[i].target; }
        else if (remaining > 0) { weeks[i].paid = remaining; weeks[i].status = 'kurang'; remaining = 0; }
        else { weeks[i].paid = 0; weeks[i].status = 'belum'; }
    }
    return { totalBulan: totalBulanEffective, weeks };
}

function calcBulan(arr) {
    if (!arr || !Array.isArray(arr)) return 0;
    return arr.filter(p => {
        if (!p || !p.date || !p.date.includes('-')) return false;
        const parts = p.date.split('-');
        return parseInt(parts[0]) === globalYear && parseInt(parts[1]) === globalMonth;
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
                        if(p.sumber === 'digital') masukDigi += amt; else masukFisik += amt; 
                    }
                }); 
            }
        });
    }
    if (Array.isArray(dataPemasukanLain)) {
        dataPemasukanLain.forEach(p => { 
            if (p) {
                let amt = Number(p.nominal || 0);
                if(p.sumber === 'digital') masukDigi += amt; else masukFisik += amt; 
            }
        });
    }
    if (Array.isArray(dataPengeluaran)) {
        dataPengeluaran.forEach(e => { 
            if (e) {
                let amt = Number(e.amount || 0);
                if(e.sumber === 'digital') keluarDigi += amt; else keluarFisik += amt; 
            }
        });
    }
    if(jenis === 'fisik') return masukFisik - keluarFisik;
    if(jenis === 'digital') return masukDigi - keluarDigi;
    return (masukFisik + masukDigi) - (keluarFisik + keluarDigi);
}

function getGamifikasi(total, freq) {
    let xp = total + (freq * 1000);
    if(xp >= 50000) return "Master Legend DKV 👑 [Lv. 5]"; 
    if(xp >= 35000) return "Elite Sensation 💎 [Lv. 4]";
    if(xp >= 20000) return "Sultan Aktif ⚡ [Lv. 3]"; 
    if(xp >= 10000) return "Pejuang Setia 🪙 [Lv. 2]"; 
    if(total > 0) return "Warga Baru 🥉 [Lv. 1]";
    return "Beban Bendahara 🗿 [Lv. 0]";
}

function renderAll() { 
    renderDashboard(); 
    renderTablePublic(); 
    renderMatrix(); 
    renderAdminTabs(); 
    renderGoalWidget();
}

function renderGoalWidget() {
    // Murni hitungan dari database saldo aktual, no mark-up
    let saldoBersih = calcSaldo('all');
    let goalCurrent = saldoBersih > 0 ? saldoBersih : 0; 
    let percentage = classGoal.target > 0 ? Math.min(100, Math.round((goalCurrent / classGoal.target) * 100)) : 0;

    const gTitle = document.getElementById('goal-title');
    const gCurr = document.getElementById('goal-current');
    const gTarget = document.getElementById('goal-target');
    const gFill = document.getElementById('goal-progress-fill');

    if(gTitle) gTitle.innerText = classGoal.title;
    if(gCurr) gCurr.innerText = formatRp(goalCurrent);
    if(gTarget) gTarget.innerText = formatRp(classGoal.target);
    if(gFill) gFill.style.width = `${percentage}%`;

    // Penjelasan sumber dana otomatis agar transparan
    if (gTitle && !document.getElementById('sumber-dana-proyek')) {
        gTitle.insertAdjacentHTML('afterend', '<div id="sumber-dana-proyek" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 12px; font-style: italic;">*Progres dana diambil murni dari <b>Total Saldo Bersih</b> keseluruhan kas kelas.</div>');
    }
}

function renderAdminTabs() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel && adminPanel.style.display !== 'none') {
        if (document.getElementById('tab-siswa').style.display !== 'none') renderTableAdmin();
        else if (document.getElementById('tab-pengeluaran').style.display !== 'none') { renderTableExpense(); initChart(); }
        else if (document.getElementById('tab-audit').style.display !== 'none') renderAudit();
    }
}

function renderDashboard() {
    let totMasukBulan = Array.isArray(dataSiswa) ? dataSiswa.reduce((sum,s)=>sum+calcBulan(s.payments),0) : 0;
    
    document.getElementById('total-terkumpul').innerText = formatRp(totMasukBulan);
    document.getElementById('total-pengeluaran-publik').innerText = formatRp(calcBulan(dataPengeluaran));
    document.getElementById('total-lain').innerText = formatRp(calcBulan(dataPemasukanLain));
    document.getElementById('saldo-fisik').innerText = formatRp(calcSaldo('fisik'));
    document.getElementById('saldo-digital').innerText = formatRp(calcSaldo('digital'));
    document.getElementById('saldo-bersih').innerText = formatRp(calcSaldo('all'));

    updateHealthProgressCard();

    const feed = document.getElementById('public-activity-feed'); 
    if (feed) {
        feed.innerHTML = ''; let acts = [];
        dataSiswa.forEach(s => { s?.payments?.forEach(p => { if (p?.date) acts.push({t:`Setor: ${s.nama}`, d:p.date, a:p.amount, type:'in'}); }); });
        dataPemasukanLain.forEach(p => { if (p?.tanggal) acts.push({t:`Lain: ${p.desc}`, d:p.tanggal, a:p.nominal, type:'in'}); });
        dataPengeluaran.forEach(e => { if (e?.date) acts.push({t:`Keluar: ${e.desc}`, d:e.date, a:e.amount, type:'out'}); });
        
        acts.sort((a,b) => new Date(b.d) - new Date(a.d)).slice(0,5).forEach(act => {
            let isM = act.type === 'in'; 
            feed.innerHTML += `<li class="activity-item"><div><div style="font-weight:800;">${act.t}</div><div style="font-size:0.75rem; color:var(--text-muted);">${act.d}</div></div><div class="money-blur" style="color:var(--${isM?'success':'danger'}); font-weight:900;">${isM?'+':'-'} ${formatRp(act.a)}</div></li>`;
        });
        if (acts.length === 0) feed.innerHTML = `<li style="text-align:center; padding: 20px; color:var(--text-muted);">Belum ada riwayat transaksi.</li>`;
    }
    
    const lb = document.getElementById('leaderboard-list'); 
    if (lb) {
        lb.innerHTML = '';
        [...dataSiswa].sort((a,b)=>(calcTotal(b.payments)+b.payments.length*1000)-(calcTotal(a.payments)+a.payments.length*1000)).slice(0,5).forEach((s,i) => {
            if(!s || calcTotal(s.payments) === 0) return;
            let rc = i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-other';
            lb.innerHTML += `<div class="leaderboard-item"><div style="display:flex; gap:12px; align-items:center;"><div class="rank-badge ${rc}">${i+1}</div><b>${s.nama}</b></div><div style="font-size:0.75rem; color:var(--purple); font-weight:800;">${getGamifikasi(calcTotal(s.payments), s.payments.length)}</div></div>`;
        });
        if (lb.innerHTML === '') lb.innerHTML = `<li style="text-align:center; padding: 20px; color:var(--text-muted);">Belum ada data kontributor.</li>`;
    }
    renderPublicExpenses();
}

function updateHealthProgressCard() {
    const monthsNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    document.getElementById('health-month-label').innerText = `${monthsNames[globalMonth - 1]} ${globalYear}`;
    let totalTargetBulanIni = dataSiswa.length * getMonthTarget(globalYear, globalMonth);
    let totalTerkumpulBulanIni = dataSiswa.reduce((sum, s) => sum + getEffectiveMonthlyStatus(s, globalYear, globalMonth).totalBulan, 0);
    let percentage = totalTargetBulanIni > 0 ? Math.min(100, Math.round((totalTerkumpulBulanIni / totalTargetBulanIni) * 100)) : 0;

    document.getElementById('health-percentage').innerText = `${percentage}% Lunas`;
    document.getElementById('health-progress-fill').style.width = `${percentage}%`;
    let msgEl = document.getElementById('health-message');
    if (percentage === 100) { msgEl.innerText = "Luar biasa! Seluruh warga kelas sudah melunasi kas bulan ini! 🎉"; msgEl.style.color = "var(--success)"; }
    else if (percentage >= 50) { msgEl.innerText = "Hebat! Progress kas bulan ini sudah setengah jalan. Ayo kejar sisanya! 💪"; msgEl.style.color = "var(--primary)"; }
    else { msgEl.innerText = "Kas bulan ini masih perlu ditagih ke beberapa warga kelas. Semangat Bendahara! 🚀"; msgEl.style.color = "var(--warning)"; }
}

function renderPublicExpenses() {
    const tbody = document.getElementById('public-expense-tbody');
    if (!tbody) return; tbody.innerHTML = '';
    if (!dataPengeluaran || dataPengeluaran.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:var(--text-muted); padding:30px;">Belum ada pengeluaran kas.</td></tr>`;
        return;
    }
    [...dataPengeluaran].sort((a,b) => new Date(b.date || b.tanggal) - new Date(a.date || a.tanggal)).forEach(e => {
        let bkt = e.bukti ? `<a href="${e.bukti}" target="_blank" class="btn btn-outline btn-sm"><i data-lucide="image"></i> Lihat Bukti</a>` : '<span style="color:var(--text-muted);">Tidak ada bukti</span>';
        tbody.innerHTML += `<tr><td>${e.date || e.tanggal || ''}</td><td><span class="badge" style="background:var(--secondary); color:var(--text-main);">${e.kategori||'Lainnya'}</span></td><td style="text-align:left; font-weight:700;">${e.desc || ''}</td><td>${e.sumber==='digital'?'Digital':'Tunai'}</td><td class="money-blur" style="color:var(--danger); font-weight:900;">${formatRp(e.amount || 0)}</td><td>${bkt}</td></tr>`;
    });
    lucide.createIcons();
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
    if (!tbody) return; tbody.innerHTML = '';
    const kw = document.getElementById('search-input')?.value.toLowerCase() || '';
    
    dataSiswa.forEach((s,i) => {
        if (!s) return;
        let weekly = getEffectiveMonthlyStatus(s, globalYear, globalMonth);
        let totBln = weekly.totalBulan;
        let isFullLunas = totBln >= getMonthTarget(globalYear, globalMonth);
        
        if(currentFilter==='lunas' && !isFullLunas) return; 
        if(currentFilter==='belum' && isFullLunas) return;
        if(kw && s.nama && !s.nama.toLowerCase().includes(kw)) return;
        
        let hasTalangan = s.payments?.some(p => p && p.talangan && p.date && parseInt(p.date.split('-')[0]) === globalYear && parseInt(p.date.split('-')[1]) === globalMonth);
        
        let weekBadges = '';
        weekly.weeks.forEach((w, idx) => {
            if (w.status === 'off') return;
            let badgeClass = w.status === 'lunas' ? 'badge-lunas' : w.status === 'kurang' ? 'badge-talangan' : 'badge-belum';
            weekBadges += `<span class="badge ${badgeClass}" style="font-size:0.65rem; padding:4px 8px; margin-right:4px;"><i data-lucide="${w.status === 'lunas' ? 'check' : w.status === 'kurang' ? 'clock' : 'x'}" style="width:12px;height:12px;"></i> M${idx+1} (${formatRp(w.paid)})</span>`;
        });
        if(hasTalangan) weekBadges += ` <span class="badge badge-talangan" style="font-size:0.65rem; padding:4px 8px;">HUTANG</span>`;
        
        let btn = `<button class="btn btn-outline btn-icon-only" onclick="lihatProfil(${s.id})"><i data-lucide="eye"></i></button>`;
        if(!isFullLunas || hasTalangan) btn += ` <button class="btn btn-whatsapp btn-icon-only" onclick="window.open('https://api.whatsapp.com/send?text=${encodeURIComponent('Halo '+s.nama+', tagihan kas mingguan lo di bulan ini belum lunas full. Segera diurus ya, Thanks!')}')"><i data-lucide="message-circle"></i></button>`;
        
        tbody.innerHTML += `<tr><td><b>#${i+1}</b></td><td><div class="student-profile-trigger" onclick="lihatProfil(${s.id})"><img src="${generateAvatar(s.nama)}" class="student-avatar"><b>${s.nama}</b></div></td><td class="money-blur" style="font-weight:900; color:var(--primary);">${formatRp(totBln)}</td><td><div style="display:flex; flex-wrap:wrap; gap:4px; justify-content:center;">${weekBadges}</div></td><td>${btn}</td></tr>`;
    }); 
    if(tbody.innerHTML === '') tbody.innerHTML = `<tr><td colspan="5" style="color:var(--text-muted); padding:30px;">Data tidak ditemukan.</td></tr>`;
    lucide.createIcons();
}

function renderMatrix() {
    const tbody = document.getElementById('data-matrix-body'); 
    if (!tbody) return; tbody.innerHTML = '';
    dataSiswa.forEach((s,i) => {
        if (!s) return;
        let allocations = getAllMonthsAllocation(s);
        let mt = [];
        for (let m = 1; m <= 12; m++) mt.push(allocations[`${globalYear}-${String(m).padStart(2, '0')}`] || 0);
        let row = `<td><b>${i+1}</b></td><td style="text-align:left; font-weight:800;">${s.nama}</td>`;
        mt.forEach((v, idx) => { 
            let mTarget = getMonthTarget(globalYear, idx + 1);
            row += `<td class="money-blur" style="color:var(--${v>=mTarget?'success':v>0?'primary':'text-muted'}); font-weight:800;">${v>0?formatRp(v):'-'}</td>`; 
        });
        tbody.innerHTML += `<tr>${row}<td class="money-blur" style="font-weight:900; color:var(--primary);">${formatRp(calcTotal(s.payments))}</td></tr>`;
    });
}

function switchMainView(v) {
    document.querySelectorAll('.main-tab-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById('view-tabel').style.display = v==='tabel'?'block':'none';
    document.getElementById('view-matrix').style.display = v==='matrix'?'block':'none';
    document.querySelector(v==='tabel'?'.main-nav-tabs button:nth-child(1)':'.main-nav-tabs button:nth-child(2)')?.classList.add('active'); 
    lucide.createIcons();
}

function switchAdminTab(t) {
    document.querySelectorAll('.admin-tab-item').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c=>c.style.display = 'none');
    document.getElementById(`tab-${t}`).style.display = 'block';
    
    let buttons = document.querySelectorAll('.admin-tab-item');
    if(t==='siswa') buttons[0]?.classList.add('active');
    if(t==='pengeluaran') { buttons[1]?.classList.add('active'); renderTableExpense(); initChart(); }
    if(t==='pengumuman') buttons[2]?.classList.add('active');
    if(t==='audit') { buttons[3]?.classList.add('active'); renderAudit(); }
    if(t==='siswa') renderTableAdmin();
}

function renderTableAdmin() {
    const tb = document.getElementById('data-siswa-admin'); 
    if (!tb) return; tb.innerHTML='';
    dataSiswa.forEach((s,i) => {
        if (!s) return;
        let tot = calcTotal(s.payments); 
        tb.innerHTML += `<tr><td><b>${i+1}</b></td><td style="text-align:left; font-weight:800;">${s.nama}</td><td><b style="color:var(--purple);">${getGamifikasi(tot, s.payments.length)}</b></td><td class="money-blur" style="font-weight:900; color:var(--primary);">${formatRp(tot)}</td><td><div style="display:flex; justify-content:center; gap:8px;"><button class="btn btn-outline btn-icon-only" onclick="openFormModal(${s.id})"><i data-lucide="pencil"></i></button> <button class="btn btn-danger btn-icon-only" onclick="hapusSiswa(${s.id})"><i data-lucide="trash"></i></button></div></td></tr>`;
    }); 
    lucide.createIcons();
}

function renderTableExpense() {
    const tb = document.getElementById('data-pengeluaran'); 
    if (!tb) return; tb.innerHTML='';
    dataPengeluaran.forEach((e) => {
        if (!e) return;
        let bkt = e.bukti ? `<a href="${e.bukti}" target="_blank" class="btn btn-outline btn-icon-only" style="padding:4px;"><i data-lucide="image"></i></a>` : '-';
        tb.innerHTML += `<tr><td>${e.date || e.tanggal || ''}</td><td><span class="badge" style="background:var(--secondary); color:var(--text-main);">${e.kategori||'Lainnya'}</span></td><td style="text-align:left; font-weight:700;">${e.desc}</td><td>${e.sumber==='digital'?'Digital':'Tunai'}</td><td class="money-blur" style="color:var(--danger); font-weight:900;">${formatRp(e.amount || 0)}</td><td>${bkt}</td><td><button class="btn btn-danger btn-icon-only" onclick="hapusEx(${e.id})"><i data-lucide="trash"></i></button></td></tr>`;
    }); 
    lucide.createIcons();
}

function renderAudit() {
    const tb = document.getElementById('data-audit'); 
    if (!tb) return; tb.innerHTML='';
    let todayDate = new Date().toLocaleDateString('id-ID'); let checkout = 0;
    dataAudit.forEach(l => { if (l) tb.innerHTML += `<tr><td style="font-size:0.8rem; color:var(--text-muted);">${l.time}</td><td><span class="badge" style="background:var(--secondary); color:var(--text-main);">${l.action}</span></td><td style="text-align:left; font-weight:700;">${l.detail}</td></tr>`; });
    
    dataSiswa.forEach(s => { s?.payments?.forEach(p => { if (p?.date && new Date(p.date).toLocaleDateString('id-ID') === todayDate) checkout += Number(p.amount || 0); }); });
    dataPemasukanLain.forEach(p => { if (p?.tanggal && new Date(p.tanggal).toLocaleDateString('id-ID') === todayDate) checkout += Number(p.nominal || 0); });
    document.getElementById('daily-checkout').innerText = formatRp(checkout);
}

function openModal(id) { document.getElementById(id)?.classList.add('show'); lucide.createIcons(); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }
function openLogin() { openModal('login-modal'); }

function prosesLogin() {
    if (document.getElementById('username').value.trim() === 'syallofficial.id' && document.getElementById('password').value.trim() === 'irsyal989511') {
        closeModal('login-modal'); switchMainView('tabel');
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('btn-login-trigger').style.display = 'none';
        document.getElementById('btn-logout-trigger').style.display = 'flex';
        switchAdminTab('siswa'); logAudit('LOGIN', 'Admin masuk panel.'); showToast('Akses Admin Diberikan!');
        document.getElementById('username').value = ''; document.getElementById('password').value = '';
    } else { showToast('Kredensial salah!', 'error'); }
}

function logoutAdmin() {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('btn-login-trigger').style.display = 'flex';
    document.getElementById('btn-logout-trigger').style.display = 'none';
    showToast('Berhasil keluar.');
}

function openFormModal(id=null) {
    if(id) { 
        let s = dataSiswa.find(x=>x.id===id); 
        if (s) { document.getElementById('form-id').value = s.id; document.getElementById('form-nama').value = s.nama; document.getElementById('form-title').innerText = 'Edit Siswa'; }
    } else { 
        document.getElementById('form-id').value = ''; document.getElementById('form-nama').value = ''; document.getElementById('form-title').innerText = 'Tambah Siswa Baru'; 
    }
    openModal('form-modal');
}

async function simpanDataSiswa() {
    let id = document.getElementById('form-id').value;
    let nama = document.getElementById('form-nama').value.trim();
    if(!nama) return showToast('Nama wajib!','error');
    if(id) { 
        let s = dataSiswa.find(x=>x.id == id); if (s) { s.nama = nama; logAudit('EDIT', `Ubah nama ${nama}`); }
    } else { 
        dataSiswa.push({id:Date.now(), nama, payments:[]}); logAudit('TAMBAH', `Siswa: ${nama}`); 
    }
    dataSiswa.sort((a, b) => a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' }));
    await saveData('XIDKV1_Siswa', dataSiswa, 'siswa'); closeModal('form-modal'); renderAll(); showToast('Disimpan!');
}

async function hapusSiswa(id) {
    if(confirm('Hapus siswa ini?')) { 
        dataSiswa = dataSiswa.filter(s=>s.id !== id); 
        await saveData('XIDKV1_Siswa', dataSiswa, 'siswa'); 
        if (useCloud && supabaseClient) { try { await supabaseClient.from('siswa').delete().eq('id', id); } catch(e) {} }
        renderAll(); showToast('Dihapus.'); 
    }
}

function openPaymentModal() {
    let sel = document.getElementById('pay-siswa-id'); 
    if (sel) { sel.innerHTML=''; dataSiswa.forEach(s => { if (s) sel.innerHTML += `<option value="${s.id}">${s.nama}</option>`; }); }
    document.getElementById('pay-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('pay-amount').value = ''; document.getElementById('pay-uang-diterima').value = ''; 
    document.getElementById('pay-kembalian').innerText = 'Kembalian: Rp 0';
    openModal('payment-modal');
}

document.getElementById('pay-uang-diterima')?.addEventListener('input', (e) => {
    let r = e.target.value; let a = document.getElementById('pay-amount').value; let kc = document.getElementById('pay-kembalian');
    if(kc && r && a) { 
        let c = Number(r) - Number(a); 
        kc.innerText = c >= 0 ? `Kembalian: ${formatRp(c)}` : `Kurang: ${formatRp(Math.abs(c))}`; 
        kc.style.color = c >= 0 ? 'var(--success)' : 'var(--danger)'; 
    }
});

async function prosesTambahCicilan() {
    let id = Number(document.getElementById('pay-siswa-id').value); 
    let am = Number(document.getElementById('pay-amount').value); 
    let dt = document.getElementById('pay-date').value; 
    let sum = document.getElementById('pay-sumber').value; 
    let tal = document.getElementById('pay-talangan').checked;
    if(!am || am <= 0 || !dt) return showToast('Nominal tidak valid','error');
    
    let s = dataSiswa.find(x=>x.id === id);
    if(s) { 
        if(!s.payments || !Array.isArray(s.payments)) s.payments = []; 
        s.payments.push({ id: 'pay_' + Date.now(), date: dt, amount: am, sumber: sum, talangan: tal }); 
        await saveData('XIDKV1_Siswa', dataSiswa, 'siswa'); closeModal('payment-modal'); renderAll(); 
        logAudit('KAS MASUK', `${s.nama} ${formatRp(am)}`); showToast('Tersimpan!'); 
    }
}

function openExpenseModal() { 
    document.getElementById('exp-date').value = new Date().toISOString().split('T')[0]; 
    document.getElementById('exp-amount').value = ''; document.getElementById('exp-desc').value = ''; document.getElementById('exp-bukti').value = ''; 
    openModal('expense-modal'); 
}

async function prosesTambahPengeluaran() {
    let d = document.getElementById('exp-desc').value.trim();
    let a = Number(document.getElementById('exp-amount').value);
    let dt = document.getElementById('exp-date').value;
    let k = document.getElementById('exp-kategori').value;
    let s = document.getElementById('exp-sumber').value;
    let b = document.getElementById('exp-bukti').value.trim();
    if(!d || a <= 0 || !dt) return showToast('Lengkapi data!','error');
    
    dataPengeluaran.push({id:Date.now(), desc:d, amount:a, date:dt, kategori:k, sumber:s, bukti:b}); 
    await saveData('XIDKV1_Exp', dataPengeluaran, 'pengeluaran'); closeModal('expense-modal'); renderAll(); 
    logAudit('KAS KELUAR', `${k} - ${formatRp(a)}`); showToast('Dicatat!');
}

async function hapusEx(id) { 
    if(confirm('Hapus?')) { 
        dataPengeluaran = dataPengeluaran.filter(e=>e.id !== id); 
        await saveData('XIDKV1_Exp', dataPengeluaran, 'pengeluaran'); 
        if (useCloud && supabaseClient) { try { await supabaseClient.from('pengeluaran').delete().eq('id', id); } catch(e) {} }
        renderAll(); showToast('Dihapus'); 
    } 
}

function openPemasukanLainModal() { 
    document.getElementById('lain-amount').value = ''; document.getElementById('lain-desc').value = ''; 
    openModal('lain-modal'); 
}

async function prosesTambahLain() {
    let d = document.getElementById('lain-desc').value.trim();
    let a = Number(document.getElementById('lain-amount').value);
    let s = document.getElementById('lain-sumber').value;
    if(!d || a <= 0) return showToast('Invalid!','error');
    
    dataPemasukanLain.push({id:Date.now(), desc:d, nominal:a, sumber:s, tanggal:new Date().toISOString().split('T')[0]}); 
    await saveData('XIDKV1_Lain', dataPemasukanLain, 'pemasukan_lain'); closeModal('lain-modal'); renderAll(); 
    logAudit('KAS LAIN', `${d} - ${formatRp(a)}`); showToast('Disimpan!');
}

async function simpanPengumuman() {
    let p = document.getElementById('input-pengumuman').value.trim(); if(!p) return showToast('Kosong!', 'error');
    pengumumanKelas = p; localStorage.setItem('XIDKV1_Ann', p); 
    if(useCloud && supabaseClient) await supabaseClient.from('pengumuman').upsert({id:1, pesan:p});
    document.getElementById('announcement-text').innerText = p; showToast('Diupdate!');
}

async function simpanTargetProyek() {
    let title = document.getElementById('input-goal-title').value.trim();
    let target = Number(document.getElementById('input-goal-target').value);
    if(!title || target < 0) return showToast('Data target proyek tidak valid!', 'error');
    classGoal = { title, target };
    localStorage.setItem('XIDKV1_Goal', JSON.stringify(classGoal));
    renderGoalWidget(); showToast('Target Proyek Diupdate!');
}

function openSplitterModal() { openModal('splitter-modal'); }
function hitungPatungan() {
    let tot = Number(document.getElementById('split-total').value);
    let cnt = Number(document.getElementById('split-count').value);
    if(!tot || !cnt || cnt <= 0) return showToast('Masukkan data valid!', 'error');
    document.getElementById('split-result').innerText = formatRp(Math.ceil(tot / cnt));
}

function lihatProfil(id) {
    currentProfileId = id; let s = dataSiswa.find(x=>x.id === id); if(!s) return;
    let tot = calcTotal(s.payments); let weekly = getEffectiveMonthlyStatus(s, globalYear, globalMonth);
    
    document.getElementById('profil-avatar').src = generateAvatar(s.nama); 
    document.getElementById('profil-nama').innerText = s.nama;
    document.getElementById('profil-gamifikasi').innerText = getGamifikasi(tot, s.payments.length);
    document.getElementById('profil-total').innerText = formatRp(tot); 
    
    let monthlyTarget = getMonthTarget(globalYear, globalMonth);
    let sisaKurang = monthlyTarget - weekly.totalBulan;
    document.getElementById('profil-sisa').innerText = sisaKurang <= 0 ? 'LUNAS (FULL)' : formatRp(sisaKurang);
    document.getElementById('profil-sisa').style.color = sisaKurang <= 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('profil-status-badge').innerHTML = sisaKurang <= 0 ? `<span class="badge badge-lunas">LUNAS BULAN INI</span>` : `<span class="badge badge-belum">BELUM FULL</span>`;

    const monthsNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    document.getElementById('profil-bulan-label').innerText = `${monthsNames[globalMonth - 1]} ${globalYear}`;

    let weeklyListEl = document.getElementById('profil-weekly-list'); weeklyListEl.innerHTML = '';
    weekly.weeks.forEach((w, idx) => {
        if (w.status === 'off') {
            weeklyListEl.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background: var(--bg-color); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border-color); font-size:0.85rem; opacity: 0.5;"><b>${w.name}</b><span style="font-weight:800; color: var(--text-muted);">Belum Mulai</span></div>`;
        } else {
            let statusText = w.status === 'lunas' ? 'Lunas (Rp 3.000)' : w.status === 'kurang' ? `Kurang (${formatRp(3000 - w.paid)})` : 'Belum Bayar';
            weeklyListEl.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; background: var(--bg-color); padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border-color); font-size:0.85rem;"><b>${w.name}</b><span style="font-weight:800; color: ${w.status === 'lunas' ? 'var(--success)' : w.status === 'kurang' ? 'var(--warning)' : 'var(--danger)'};">${statusText}</span></div>`;
        }
    });
    
    let hl = document.getElementById('history-list'); hl.innerHTML = '';
    let isAdminLoggedIn = document.getElementById('admin-panel')?.style.display !== 'none';
    s.payments?.slice().reverse().forEach((p, index) => { 
        if (p) {
            if (!p.id) p.id = 'pay_fallback_' + index;
            let deleteBtn = isAdminLoggedIn ? `<button class="btn btn-danger btn-icon-only" style="width:28px; height:28px; padding:0;" onclick="hapusSetoranSiswa(${s.id}, '${p.id}')"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>` : '';
            hl.innerHTML += `<li class="history-item" style="display:flex; justify-content:space-between; align-items:center;"><div><b style="font-size:0.9rem;">${p.date}</b>${p.talangan ? '<br><span class="badge badge-talangan" style="padding:2px 6px; font-size:0.6rem;">Talangan</span>' : ''}</div><div style="display:flex; align-items:center; gap:12px;"><div class="money-blur" style="color:var(--primary); font-weight:900;">${formatRp(p.amount)}</div>${deleteBtn}</div></li>`; 
        }
    });
    if (hl.innerHTML === '') hl.innerHTML = `<li style="text-align:center; padding: 20px; color:var(--text-muted);">Belum ada riwayat setoran.</li>`;
    openModal('student-modal'); lucide.createIcons();
}

async function hapusSetoranSiswa(studentId, paymentId) {
    if (!confirm('Yakin ingin menghapus setoran ini?')) return;
    let s = dataSiswa.find(x => x.id === studentId);
    if (s && Array.isArray(s.payments)) {
        s.payments = s.payments.filter(p => p && String(p.id) !== String(paymentId));
        await saveData('XIDKV1_Siswa', dataSiswa, 'siswa');
        logAudit('HAPUS SETORAN', `Menghapus riwayat setoran siswa: ${s.nama}`);
        showToast('Setoran berhasil dihapus!', 'success');
        renderAll(); lihatProfil(studentId); 
    }
}

function cetakKwitansi() {
    if(!currentProfileId) return; 
    let s = dataSiswa.find(x=>x.id === currentProfileId); 
    if(!s || !s.payments?.length) return showToast('Belum ada setoran', 'error');
    closeModal('student-modal'); document.body.classList.add('printing-kwitansi'); 
    window.print(); setTimeout(()=>document.body.classList.remove('printing-kwitansi'), 1000);
}

function printOfficialReport() {
    let totMasuk = dataSiswa.reduce((sum,s)=>sum+calcTotal(s.payments),0);
    let totKeluar = dataPengeluaran.reduce((sum,e)=>sum+Number(e.amount||0),0);
    
    document.getElementById('print-rep-masuk').innerText = formatRp(totMasuk);
    document.getElementById('print-rep-keluar').innerText = formatRp(totKeluar);
    document.getElementById('print-rep-saldo').innerText = formatRp(totMasuk - totKeluar);
    document.getElementById('print-rep-tgl').innerText = new Date().toLocaleDateString('id-ID');

    document.body.classList.add('printing-official');
    window.print(); setTimeout(()=>document.body.classList.remove('printing-official'), 1000);
}

function printReport() { printOfficialReport(); }

function exportMatrixExcel() {
    let d = [["No", "Nama", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des", "Total"]];
    dataSiswa.forEach((s,i) => { 
        if (!s) return;
        let allocations = getAllMonthsAllocation(s);
        let mt = []; for (let m = 1; m <= 12; m++) mt.push(allocations[`${globalYear}-${String(m).padStart(2, '0')}`] || 0);
        d.push([i+1, s.nama, ...mt, calcTotal(s.payments)]); 
    });
    let wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(d), "Matriks"); 
    XLSX.writeFile(wb, `Matriks_Rollover_${globalYear}.xlsx`); showToast('Excel diunduh!');
}

function generateBroadcastWA() {
    let mTarget = getMonthTarget(globalYear, globalMonth); let b = []; 
    dataSiswa.forEach(s => { 
        if (s) {
            let krg = mTarget - getEffectiveMonthlyStatus(s, globalYear, globalMonth).totalBulan;
            if(krg > 0) b.push(`- ${s.nama} (Kurang ${formatRp(krg)})`); 
        }
    });
    if(b.length === 0) return showToast('Semua lunas full!', 'success');
    let ta = document.getElementById('hidden-copy-area'); 
    ta.value = `📢 *TAGIHAN KAS KELAS*\n\nBelum lunas:\n${b.join('\n')}\n\nSegera dilunasi ya. Thanks!`;
    ta.select(); document.execCommand('copy'); showToast('Teks dicopy ke clipboard!');
}

function undianLunas() { 
    openModal('undian-modal'); document.getElementById('undian-name').innerText = "Siapa yang beruntung?"; 
}

function mulaiUndian() {
    let lunas = dataSiswa.filter(s => s && getEffectiveMonthlyStatus(s, globalYear, globalMonth).totalBulan >= getMonthTarget(globalYear, globalMonth));
    if(lunas.length === 0) return showToast('Belum ada yang lunas full bulan ini!', 'error');
    let box = document.getElementById('undian-name'); let count = 0; 
    let interval = setInterval(() => { 
        box.innerText = lunas[Math.floor(Math.random() * lunas.length)].nama; 
        if(++count > 25) { clearInterval(interval); box.innerHTML = `🎉 ${lunas[Math.floor(Math.random() * lunas.length)].nama} 🎉`; } 
    }, 80);
}

async function tutupBuku() {
    if(!confirm("Yakin tutup buku? Semua riwayat setoran akan direset.")) return;
    dataSiswa.forEach(s => { if (s) s.payments = []; }); 
    dataPengeluaran = []; dataPemasukanLain = []; dataAudit = [];
    await saveData('XIDKV1_Siswa', dataSiswa, 'siswa'); 
    await saveData('XIDKV1_Exp', dataPengeluaran, 'pengeluaran'); 
    await saveData('XIDKV1_Lain', dataPemasukanLain, 'pemasukan_lain');
    localStorage.removeItem('XIDKV1_Audit'); window.location.reload();
}

let catChart = null;
let initChart = function() {
    const canvas = document.getElementById('kategoriChart');
    if (!canvas) return; let cats = {}; 
    dataPengeluaran.forEach(e => { if (e) cats[e.kategori || 'Lainnya'] = (cats[e.kategori || 'Lainnya'] || 0) + Number(e.amount || 0); });
    if(Object.keys(cats).length === 0) return;
    if(catChart) catChart.destroy();
    catChart = new Chart(canvas.getContext('2d'), { 
        type: 'doughnut', 
        data: { labels: Object.keys(cats), datasets: [{ data: Object.values(cats), backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'], borderWidth: 0 }] }, 
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } } 
    });
};
