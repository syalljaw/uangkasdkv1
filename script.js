// --- 1. KONFIGURASI SUPABASE CLOUD DATABASE ---
// Masukkan kredensial Supabase Anda di sini agar bisa langsung di-deploy online secara real-time!
const SUPABASE_URL = 'https://xjkahrfgkbjvvwxspsux.supabase.co';
const SUPABASE_ANON_KEY = 'YeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqa2FocmZna2JqdnZ3eHNwc3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5ODAyMDcsImV4cCI6MjEwMDU1NjIwN30.CMbZiIszCqlryp8G6h5sL6vH_JFX-Y-3wvyMSb_3SVU';

let supabaseClient = null;
let useCloud = false;

try {
    if (window.supabase && SUPABASE_URL.includes('http')) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        useCloud = true;
    }
} catch (e) {
    console.log("Menggunakan LocalStorage offline fallback.");
}

// --- 2. STATE DATA KELAS ---
let dataSiswa = [];
let dataPengeluaran = [];
let dataAudit = [];

const defaultSiswa = [
    { id: 101, nama: "Agus Setiawan", payments: [{date: "2026-01-10", amount: 3000}, {date: "2026-02-12", amount: 3000}, {date: "2026-06-05", amount: 3000}] },
    { id: 102, nama: "Bunga Citra", payments: [{date: "2026-01-15", amount: 1500}, {date: "2026-01-20", amount: 1500}, {date: "2026-06-10", amount: 3000}] },
    { id: 103, nama: "Chandra Wijaya", payments: [{date: "2026-01-05", amount: 1000}] },
    { id: 104, nama: "Dian Pelangi", payments: [{date: "2026-01-02", amount: 3000}, {date: "2026-02-01", amount: 3000}, {date: "2026-06-01", amount: 3000}] },
    { id: 105, nama: "Eko Pratama", payments: [{date: "2026-01-12", amount: 2000}, {date: "2026-06-03", amount: 3000}] }
];

const defaultExpenses = [
    { id: 1, desc: "Pembelian Spidol Whiteboard", amount: 10000, date: "2026-01-15" },
    { id: 2, desc: "Kebersihan & Sapu Baru", amount: 15000, date: "2026-06-02" }
];

// --- 3. LOAD & SYNC DATA DATABASE ---
async function loadData() {
    if (useCloud) {
        try {
            let { data: siswaData, error: errS } = await supabaseClient.from('siswa').select('*');
            let { data: expData, error: errE } = await supabaseClient.from('pengeluaran').select('*');
            let { data: auditData, error: errA } = await supabaseClient.from('audit_log').select('*');

            if (!errS && siswaData && siswaData.length > 0) {
                dataSiswa = siswaData.map(s => ({ id: s.id, nama: s.nama, payments: s.payments || [] }));
            } else {
                dataSiswa = defaultSiswa;
            }

            if (!errE && expData) dataPengeluaran = expData;
            else dataPengeluaran = defaultExpenses;

            if (!errA && auditData) dataAudit = auditData;
            else dataAudit = [];
            
            return;
        } catch(err) {
            console.warn("Gagal sinkron cloud, beralih ke local storage.");
        }
    }

    // Fallback LocalStorage
    dataSiswa = JSON.parse(localStorage.getItem('XIDKV1_Siswa')) || defaultSiswa;
    dataPengeluaran = JSON.parse(localStorage.getItem('XIDKV1_Expense')) || defaultExpenses;
    dataAudit = JSON.parse(localStorage.getItem('XIDKV1_Audit')) || [];
}

async function saveDataSiswa() {
    localStorage.setItem('XIDKV1_Siswa', JSON.stringify(dataSiswa));
    if (useCloud) {
        // Upsert data siswa ke supabase
        for(let s of dataSiswa) {
            await supabaseClient.from('siswa').upsert({ id: s.id, nama: s.nama, payments: s.payments });
        }
    }
}

async function saveDataExpense() {
    localStorage.setItem('XIDKV1_Expense', JSON.stringify(dataPengeluaran));
    if (useCloud) {
        for(let e of dataPengeluaran) {
            await supabaseClient.from('pengeluaran').upsert({ id: e.id, desc: e.desc, amount: e.amount, date: e.date });
        }
    }
}

async function logAudit(action, detail) {
    const logItem = { id: Date.now(), time: new Date().toLocaleString('id-ID'), action, detail };
    dataAudit.unshift(logItem);
    localStorage.setItem('XIDKV1_Audit', JSON.stringify(dataAudit));
    if (useCloud) {
        await supabaseClient.from('audit_log').insert([logItem]);
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

// Fitur Tombol Kirim Pengingat WhatsApp
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
                const [y, m] = p.date.split('-');
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
    showToast("Data siswa berhasil disimpan ke database!", "success");
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
