// Konfigurasi Supabase
const SUPABASE_URL = 'https://dyisevuroujenyqhhwmu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aXNldnVyb3VqZW55cWhod211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTgyNTQsImV4cCI6MjEwMDk3NDI1NH0.IGn1ExMUo-zpKqlLULskB2TftHpv5AOmoYIuiVzEvvs';

// Inisialisasi Klien Supabase secara langsung & aman
const _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window._supabaseClient = _supabaseClient;

// Default Data 39 Siswa XI DKV 1
let defaultSiswaData = [
    { id: "sis_1", absen: 1, nama: "AIRA HUMAIROO NUR ROCHMAN" },
    { id: "sis_2", absen: 2, nama: "ALENA VEYRA PRAMUDITA" },
    { id: "sis_3", absen: 3, nama: "ANDIKA NURUL KAMIL" },
    { id: "sis_4", absen: 4, nama: "ANISA NURLITA RAHMA" },
    { id: "sis_5", absen: 5, nama: "CHARISA RIVANI SALSABILA" },
    { id: "sis_6", absen: 6, nama: "CHRISTIAN ADINATA SINAGA" },
    { id: "sis_7", absen: 7, nama: "DHEA SUCI NUR RAMADAN" },
    { id: "sis_8", absen: 8, nama: "DINARRA SYAFINA PUTRI" },
    { id: "sis_9", absen: 9, nama: "FADLAN MAULANA MARDYAN" },
    { id: "sis_10", absen: 10, nama: "FAIZIA NILA KHAIRUNNISA" },
    { id: "sis_11", absen: 11, nama: "FATHIA MAULANI ADITRIYANTI" },
    { id: "sis_12", absen: 12, nama: "HARSTA ASYIFA LAYALIA SHOLIHAH" },
    { id: "sis_13", absen: 13, nama: "HASNA JASIM AQILAH" },
    { id: "sis_14", absen: 14, nama: "HIBAR SANG FAJAR SYAHPUTRA" },
    { id: "sis_15", absen: 15, nama: "IRSYAL FAIZ HAUZAN" },
    { id: "sis_16", absen: 16, nama: "JESSICA OLIVIA" },
    { id: "sis_17", absen: 17, nama: "LEVIA RESTI" },
    { id: "sis_18", absen: 18, nama: "MARVEL MAPALIYE" },
    { id: "sis_19", absen: 19, nama: "MAURA NATALI PUTRI" },
    { id: "sis_20", absen: 20, nama: "MEISYA TRIAMANDA" },
    { id: "sis_21", absen: 21, nama: "MOCHAMAD REYHAN HARDHIKA" },
    { id: "sis_22", absen: 22, nama: "MUHAMAD YAFI AL GHOFARI" },
    { id: "sis_23", absen: 23, nama: "MUHAMMAD RIDWAN KURNIADI" },
    { id: "sis_24", absen: 24, nama: "NAJLAA DWI PUTRI ARDIANSYAH" },
    { id: "sis_25", absen: 25, nama: "NAJMI DARIS DZAKWAN" },
    { id: "sis_26", absen: 26, nama: "NAZWA NUR AZIZAH" },
    { id: "sis_27", absen: 27, nama: "RAFA RIZA AKBAR" },
    { id: "sis_28", absen: 28, nama: "RAFLI ZULFIKAR AKBAR" },
    { id: "sis_29", absen: 29, nama: "REGISHA DEMI CINTYA" },
    { id: "sis_30", absen: 30, nama: "RENDI KAMIL" },
    { id: "sis_31", absen: 31, nama: "RESTA AULIANA" },
    { id: "sis_32", absen: 32, nama: "RIZKI MAULANA AJIANTO" },
    { id: "sis_33", absen: 33, nama: "RIZKY MAULANA" },
    { id: "sis_34", absen: 34, nama: "SITI NAAILAH HASNAA HAAMIDAH" },
    { id: "sis_35", absen: 35, nama: "VICKY NAUFAL RAJIBYAN" },
    { id: "sis_36", absen: 36, nama: "WAHAD SHAHRUR HIDAYATULLOH" },
    { id: "sis_37", absen: 37, nama: "WIDY YUNIAR AINUN" },
    { id: "sis_38", absen: 38, nama: "YEN NABILA" },
    { id: "sis_39", absen: 39, nama: "ZULFHAN BAIHAQI GUNAWAN" }
];

let siswaData = JSON.parse(localStorage.getItem('kas_dkv1_siswa')) || defaultSiswaData;
let kasData = JSON.parse(localStorage.getItem('kas_dkv1_kas')) || [];
let iuranData = JSON.parse(localStorage.getItem('kas_dkv1_iuran')) || [];
let pengeluaranData = JSON.parse(localStorage.getItem('kas_dkv1_pengeluaran')) || [];

let isAdminLoggedIn = localStorage.getItem('kas_dkv1_admin_logged') === 'true';

function saveToLocalStorage() {
    try {
        localStorage.setItem('kas_dkv1_siswa', JSON.stringify(siswaData));
        localStorage.setItem('kas_dkv1_kas', JSON.stringify(kasData));
        localStorage.setItem('kas_dkv1_iuran', JSON.stringify(iuranData));
        localStorage.setItem('kas_dkv1_pengeluaran', JSON.stringify(pengeluaranData));
    } catch (e) {
        console.error("Gagal menyimpan ke localStorage:", e);
    }
}

function getIsoWeek(date) {
    try {
        let d = new Date(date.getTime());
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        let yearStart = new Date(d.getFullYear(), 0, 1);
        let weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getFullYear()}-W${weekNo}`;
    } catch (e) {
        return "2026-W01";
    }
}

function getCurrentIsoWeek() {
    try {
        let nowWIB = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
        return getIsoWeek(nowWIB);
    } catch (e) {
        return "2026-W01";
    }
}

function getTotalKasMingguIni(absen, week) {
    return kasData
        .filter(k => Number(k.absen) === Number(absen) && k.minggu === week)
        .reduce((sum, k) => sum + (Number(k.nominal) || 0), 0);
}

function updateNavAuthButton() {
    const btnText = document.getElementById('nav-auth-text');
    if(btnText) btnText.innerText = isAdminLoggedIn ? 'Logout Admin' : 'Login Admin';
}

function handleNavAuthClick() {
    if(isAdminLoggedIn) logoutAdmin();
    else openLoginModal();
}

function getAvatarUrl(nama) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nama || 'User')}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

function sortDataByAbsen() {
    siswaData.sort((a, b) => Number(a.absen || 99) - Number(b.absen || 99));
    kasData.sort((a, b) => Number(a.absen || 99) - Number(b.absen || 99));
    iuranData.sort((a, b) => Number(a.absen || 99) - Number(b.absen || 99));
}

function getUserTitle(totalNominal) {
    if (totalNominal >= 50000) return { text: '👑 Enterprise Sultan', class: 'bg-purple-50 text-purple-700 border-purple-200' };
    else if (totalNominal > 0) return { text: '⚡ Warga Teladan', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    else return { text: '⚠️ Belum Ada Kontribusi', class: 'bg-amber-50 text-amber-700 border-amber-200' };
}

function updateWIBClock() {
    try {
        const now = new Date();
        const optionsTime = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        const optionsDate = { timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        
        const timeString = new Intl.DateTimeFormat('id-ID', optionsTime).format(now);
        const dateString = new Intl.DateTimeFormat('id-ID', optionsDate).format(now);

        const timeEl = document.getElementById('live-time');
        const dateEl = document.getElementById('live-date');
        const labelMinggu = document.getElementById('label-minggu-ini');

        if(timeEl) timeEl.innerText = timeString + ' WIB';
        if(dateEl) dateEl.innerText = dateString;
        if(labelMinggu) labelMinggu.innerText = `Periode: ${getCurrentIsoWeek()}`;
    } catch (e) {
        console.error("Error clock:", e);
    }
}

function initAppFromLocal() {
    try {
        updateNavAuthButton();
        populateSiswaDropdown();
        renderSiswaAdminList();
        loadDataKas();
        loadDataIuran();
        loadDataPengeluaran();
        renderRanking();
        initCalendarDefault();
        checkAndProcessAutoMonthlyArchive();
    } catch (e) {
        console.error("Error initApp:", e);
    }
}

function checkAndProcessAutoMonthlyArchive() {
    try {
        let nowWIB = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
        let currentYearMonth = `${nowWIB.getFullYear()}-${String(nowWIB.getMonth() + 1).padStart(2, '0')}`;
        let archivedMonths = JSON.parse(localStorage.getItem('kas_dkv1_archives')) || {};
        let allMonthsSet = new Set();

        kasData.forEach(item => { if(item.tanggal && item.tanggal.length >= 7) allMonthsSet.add(item.tanggal.substring(0, 7)); });
        iuranData.forEach(item => { if(item.tanggal && item.tanggal.length >= 7) allMonthsSet.add(item.tanggal.substring(0, 7)); });
        pengeluaranData.forEach(item => { if(item.tanggal && item.tanggal.length >= 7) allMonthsSet.add(item.tanggal.substring(0, 7)); });

        Object.keys(archivedMonths).forEach(ym => { if(!allMonthsSet.has(ym)) delete archivedMonths[ym]; });

        allMonthsSet.forEach(ym => {
            if(ym < currentYearMonth) {
                let [y, m] = ym.split('-');
                let monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                let labelBulan = `${monthNames[parseInt(m)-1]} ${y}`;
                let tPemasukan = 0;
                kasData.forEach(k => { if(k.tanggal && k.tanggal.startsWith(ym)) tPemasukan += Number(k.nominal) || 0; });
                iuranData.forEach(i => { if(i.tanggal && i.tanggal.startsWith(ym)) tPemasukan += Number(i.nominal) || 0; });
                let tPengeluaran = 0;
                pengeluaranData.forEach(e => { if(e.tanggal && e.tanggal.startsWith(ym)) tPengeluaran += Number(e.nominal) || 0; });
                archivedMonths[ym] = { periode: labelBulan, pemasukan: tPemasukan, pengeluaran: tPengeluaran, saldo: tPemasukan - tPengeluaran };
            }
        });

        localStorage.setItem('kas_dkv1_archives', JSON.stringify(archivedMonths));
        renderRekapTable();
    } catch (e) {
        console.error("Error archive:", e);
    }
}

function renderRekapTable() {
    let tbody = document.getElementById('tabel-rekap-body');
    if(!tbody) return;

    let archivedMonths = JSON.parse(localStorage.getItem('kas_dkv1_archives')) || {};
    let nowWIB = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    let currentYM = `${nowWIB.getFullYear()}-${String(nowWIB.getMonth() + 1).padStart(2, '0')}`;
    let monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    let currentLabel = `${monthNames[nowWIB.getMonth()]} ${nowWIB.getFullYear()} (Berjalan)`;

    let curPemasukan = 0;
    kasData.forEach(k => { if(k.tanggal && k.tanggal.startsWith(currentYM)) curPemasukan += Number(k.nominal) || 0; });
    iuranData.forEach(i => { if(i.tanggal && i.tanggal.startsWith(currentYM)) curPemasukan += Number(i.nominal) || 0; });

    let curPengeluaran = 0;
    pengeluaranData.forEach(e => { if(e.tanggal && e.tanggal.startsWith(currentYM)) curPengeluaran += Number(e.nominal) || 0; });

    let allKeys = Object.keys(archivedMonths).sort().reverse();
    let html = `
        <tr onclick="openRekapModal('${currentYM}', '${currentLabel}')" class="bg-blue-50/40 font-semibold hover:bg-blue-100/50 transition-all cursor-pointer">
            <td class="py-3.5 px-4 text-slate-900">${currentLabel} 🔍</td>
            <td class="py-3.5 px-4 text-emerald-600">Rp ${curPemasukan.toLocaleString('id-ID')}</td>
            <td class="py-3.5 px-4 text-rose-600">Rp ${curPengeluaran.toLocaleString('id-ID')}</td>
            <td class="py-3.5 px-4 text-accent">Rp ${(curPemasukan - curPengeluaran).toLocaleString('id-ID')}</td>
        </tr>
    `;

    allKeys.forEach(ym => {
        let arc = archivedMonths[ym];
        html += `
            <tr onclick="openRekapModal('${ym}', '${arc.periode}')" class="hover:bg-slate-100/60 transition-all cursor-pointer">
                <td class="py-3.5 px-4 font-semibold text-slate-800">${arc.periode} 🔍</td>
                <td class="py-3.5 px-4 text-emerald-600">Rp ${Number(arc.pemasukan).toLocaleString('id-ID')}</td>
                <td class="py-3.5 px-4 text-rose-600">Rp ${Number(arc.pengeluaran).toLocaleString('id-ID')}</td>
                <td class="py-3.5 px-4 text-slate-900 font-bold">Rp ${Number(arc.saldo).toLocaleString('id-ID')}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function openRekapModal(ym, titleLabel) {
    const modal = document.getElementById('rekap-modal');
    const container = document.getElementById('rekap-modal-container');
    const titleEl = document.getElementById('rekap-modal-title');
    const contentEl = document.getElementById('rekap-modal-content');
    if(!modal || !container) return;

    titleEl.innerText = `Rincian Arsip: ${titleLabel}`;

    let matchedKas = kasData.filter(item => item.tanggal && item.tanggal.startsWith(ym) && Number(item.nominal) > 0);
    let matchedIuran = iuranData.filter(item => item.tanggal && item.tanggal.startsWith(ym) && Number(item.nominal) > 0);
    let matchedExp = pengeluaranData.filter(item => item.tanggal && item.tanggal.startsWith(ym));

    let html = '';
    if(matchedKas.length > 0) {
        html += `<div class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Uang Kas (${matchedKas.length})</div>`;
        matchedKas.forEach(item => {
            let metodeBadge = item.metode === 'Digital' ? '💳 Digital' : '💵 Cash';
            html += `<div class="flex justify-between items-center p-3 bg-surface rounded-xl border border-bordercol text-xs mb-2"><div><span class="font-semibold text-slate-900">${item.nama}</span><span class="text-[10px] text-slate-500 block">Absen ${item.absen || '-'} &bull; ${metodeBadge} &bull; ${item.tanggal}</span></div><span class="font-bold text-emerald-600">+ Rp ${Number(item.nominal).toLocaleString('id-ID')}</span></div>`;
        });
    }

    if(matchedIuran.length > 0) {
        html += `<div class="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mt-3 mb-1">Iuran Khusus (${matchedIuran.length})</div>`;
        matchedIuran.forEach(item => {
            let metodeBadge = item.metode === 'Digital' ? '💳 Digital' : '💵 Cash';
            html += `<div class="flex justify-between items-center p-3 bg-surface rounded-xl border border-bordercol text-xs mb-2"><div><span class="font-semibold text-slate-900">${item.nama} (${item.namaIuran})</span><span class="text-[10px] text-slate-500 block">Absen ${item.absen || '-'} &bull; ${metodeBadge} &bull; ${item.tanggal}</span></div><span class="font-bold text-indigo-600">+ Rp ${Number(item.nominal).toLocaleString('id-ID')}</span></div>`;
        });
    }

    if(matchedExp.length > 0) {
        html += `<div class="text-[11px] font-bold text-rose-600 uppercase tracking-wider mt-3 mb-1">Pengeluaran (${matchedExp.length})</div>`;
        matchedExp.forEach(item => {
            html += `<div class="flex justify-between items-center p-3 bg-surface rounded-xl border border-bordercol text-xs mb-2"><div><span class="font-semibold text-slate-900">${item.keterangan}</span><span class="text-[10px] text-slate-500 block">Tanggal: ${item.tanggal}</span></div><span class="font-bold text-rose-600">- Rp ${Number(item.nominal).toLocaleString('id-ID')}</span></div>`;
        });
    }

    if(matchedKas.length === 0 && matchedIuran.length === 0 && matchedExp.length === 0) {
        html = `<div class="text-center py-8 text-slate-400 font-medium text-xs">Belum ada catatan transaksi pada periode ini.</div>`;
    }

    contentEl.innerHTML = html;
    modal.classList.remove('hidden');
    setTimeout(() => { container.classList.remove('scale-95', 'opacity-0'); container.classList.add('scale-100', 'opacity-100'); }, 10);
}

function closeRekapModal() {
    const modal = document.getElementById('rekap-modal');
    const container = document.getElementById('rekap-modal-container');
    if(!modal || !container) return;
    container.classList.remove('scale-100', 'opacity-100');
    container.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

function exportToExcel() {
    let tableHTML = document.getElementById('excel-table');
    if(!tableHTML) return;
    let excelFile = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Report</title></head><body><h2>Laporan Keuangan XI DKV 1</h2>${tableHTML.outerHTML}</body></html>`;
    let blob = new Blob([excelFile], { type: 'application/vnd.ms-excel' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = `Enterprise_Financial_Report_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function renderCalendar() {
    const monthSelect = document.getElementById('cal-month');
    const yearSelect = document.getElementById('cal-year');
    const gridEl = document.getElementById('calendar-grid');
    if(!monthSelect || !yearSelect || !gridEl) return;

    let month = parseInt(monthSelect.value);
    let year = parseInt(yearSelect.value);
    let firstDay = new Date(year, month, 1).getDay();
    let totalDays = new Date(year, month + 1, 0).getDate();

    let html = '';
    for(let i = 0; i < firstDay; i++) html += `<span></span>`;

    let today = new Date();
    let currentWIBDate = new Date(today.toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    let isCurrentMonth = currentWIBDate.getMonth() === month && currentWIBDate.getFullYear() === year;
    let todayDate = currentWIBDate.getDate();

    for(let day = 1; day <= totalDays; day++) {
        let isToday = isCurrentMonth && day === todayDate;
        let formattedMonth = String(month + 1).padStart(2, '0');
        let formattedDay = String(day).padStart(2, '0');
        let dateStr = `${year}-${formattedMonth}-${formattedDay}`;

        let hasIncome = kasData.some(d => d.tanggal === dateStr && Number(d.nominal) > 0) || iuranData.some(i => i.tanggal === dateStr && Number(i.nominal) > 0);
        let hasExpense = pengeluaranData.some(e => e.tanggal === dateStr);
        let indicatorDot = (hasIncome || hasExpense) ? `<span class="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-full"></span>` : '';
        let baseClass = isToday ? 'bg-accent text-white font-bold rounded-xl shadow-sm' : 'hover:bg-blue-50 text-slate-700 rounded-xl py-1.5 border border-transparent hover:border-blue-200 cursor-pointer';

        html += `<div onclick="openCalendarModal('${dateStr}')" class="py-1.5 relative ${baseClass}">${day}${indicatorDot}</div>`;
    }
    gridEl.innerHTML = html;
}

function openCalendarModal(dateStr) {
    const modal = document.getElementById('calendar-modal');
    const container = document.getElementById('cal-modal-container');
    const titleEl = document.getElementById('cal-modal-title');
    const contentEl = document.getElementById('cal-modal-content');
    if(!modal || !container) return;

    let [y, m, d] = dateStr.split('-');
    titleEl.innerText = `Audit Tanggal: ${d} / ${m} / ${y}`;

    let matchedKas = kasData.filter(item => item.tanggal === dateStr && Number(item.nominal) > 0);
    let matchedIuran = iuranData.filter(item => item.tanggal === dateStr && Number(item.nominal) > 0);
    let matchedExp = pengeluaranData.filter(item => item.tanggal === dateStr);

    let html = '';
    if(matchedKas.length > 0) {
        html += `<div class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Uang Kas (${matchedKas.length})</div>`;
        matchedKas.forEach(item => {
            let metodeBadge = item.metode === 'Digital' ? '💳 Digital' : '💵 Cash';
            html += `<div class="flex justify-between items-center p-3 bg-surface rounded-xl border border-bordercol text-xs mb-2"><div><span class="font-semibold text-slate-900">${item.nama}</span><span class="text-[10px] text-slate-500 block">Absen ${item.absen || '-'} &bull; ${metodeBadge}</span></div><span class="font-bold text-emerald-600">+ Rp ${Number(item.nominal).toLocaleString('id-ID')}</span></div>`;
        });
    }

    if(matchedIuran.length > 0) {
        html += `<div class="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mt-3 mb-1">Iuran Khusus (${matchedIuran.length})</div>`;
        matchedIuran.forEach(item => {
            let metodeBadge = item.metode === 'Digital' ? '💳 Digital' : '💵 Cash';
            html += `<div class="flex justify-between items-center p-3 bg-surface rounded-xl border border-bordercol text-xs mb-2"><div><span class="font-semibold text-slate-900">${item.nama} (${item.namaIuran})</span><span class="text-[10px] text-slate-500 block">Absen ${item.absen || '-'} &bull; ${metodeBadge}</span></div><span class="font-bold text-indigo-600">+ Rp ${Number(item.nominal).toLocaleString('id-ID')}</span></div>`;
        });
    }

    if(matchedExp.length > 0) {
        html += `<div class="text-[11px] font-bold text-rose-600 uppercase tracking-wider mt-3 mb-1">Pengeluaran (${matchedExp.length})</div>`;
        matchedExp.forEach(item => {
            html += `<div class="flex justify-between items-center p-3 bg-surface rounded-xl border border-bordercol text-xs mb-2"><div><span class="font-semibold text-slate-900">${item.keterangan}</span><span class="text-[10px] text-slate-500 block">Keperluan Kelas</span></div><span class="font-bold text-rose-600">- Rp ${Number(item.nominal).toLocaleString('id-ID')}</span></div>`;
        });
    }

    if(matchedKas.length === 0 && matchedIuran.length === 0 && matchedExp.length === 0) {
        html = `<div class="text-center py-8 text-slate-400 font-medium text-xs">Tidak ada transaksi pada tanggal ini.</div>`;
    }

    contentEl.innerHTML = html;
    modal.classList.remove('hidden');
    setTimeout(() => { container.classList.remove('scale-95', 'opacity-0'); container.classList.add('scale-100', 'opacity-100'); }, 10);
}

function closeCalendarModal() {
    const modal = document.getElementById('calendar-modal');
    const container = document.getElementById('cal-modal-container');
    if(!modal || !container) return;
    container.classList.remove('scale-100', 'opacity-100');
    container.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

function initCalendarDefault() {
    try {
        let nowWIB = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
        const monthSelect = document.getElementById('cal-month');
        const yearSelect = document.getElementById('cal-year');
        if(monthSelect) monthSelect.value = nowWIB.getMonth();
        if(yearSelect) yearSelect.value = nowWIB.getFullYear();
        renderCalendar();
    } catch (e) {
        console.error("Error calendar default:", e);
    }
}

function checkAdminAccess() {
    if(isAdminLoggedIn) switchTab('admin');
    else openLoginModal();
}

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    const container = document.getElementById('login-container');
    if(!modal || !container) return;
    if(document.getElementById('login-user')) document.getElementById('login-user').value = '';
    if(document.getElementById('login-pass')) document.getElementById('login-pass').value = '';
    if(document.getElementById('login-error')) document.getElementById('login-error').classList.add('hidden');
    modal.classList.remove('hidden');
    setTimeout(() => { container.classList.remove('scale-95', 'opacity-0'); container.classList.add('scale-100', 'opacity-100'); }, 10);
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    const container = document.getElementById('login-container');
    if(!modal || !container) return;
    container.classList.remove('scale-100', 'opacity-100');
    container.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

function prosesLoginAdmin(e) {
    if(e) e.preventDefault();
    let u = document.getElementById('login-user') ? document.getElementById('login-user').value.trim() : '';
    let p = document.getElementById('login-pass') ? document.getElementById('login-pass').value.trim() : '';
    if(u === 'syallofficial.id' && p === 'irsyal989511') {
        isAdminLoggedIn = true;
        localStorage.setItem('kas_dkv1_admin_logged', 'true');
        closeLoginModal();
        updateNavAuthButton();
        switchTab('admin');
    } else {
        if(document.getElementById('login-error')) document.getElementById('login-error').classList.remove('hidden');
    }
}

function logoutAdmin() {
    isAdminLoggedIn = false;
    localStorage.removeItem('kas_dkv1_admin_logged');
    updateNavAuthButton();
    switchTab('home');
}

function switchTab(tab) {
    const homeSec = document.getElementById('section-home');
    const adminSec = document.getElementById('section-admin');
    const btnHome = document.getElementById('btn-home');
    const btnAdmin = document.getElementById('btn-admin');

    if(tab === 'home') {
        if(homeSec) homeSec.classList.remove('hidden');
        if(adminSec) adminSec.classList.add('hidden');
        if(btnHome) btnHome.className = "px-5 py-2 rounded-lg font-semibold text-xs transition-all bg-accent text-white shadow-sm";
        if(btnAdmin) btnAdmin.className = "px-5 py-2 rounded-lg font-semibold text-xs text-slate-300 transition-all hover:text-white";
        loadDataKas();
        loadDataIuran();
        loadDataPengeluaran();
        renderRanking();
        renderCalendar();
        checkAndProcessAutoMonthlyArchive();
    } else {
        if(!isAdminLoggedIn) { openLoginModal(); return; }
        if(homeSec) homeSec.classList.add('hidden');
        if(adminSec) adminSec.classList.remove('hidden');
        if(btnAdmin) btnAdmin.className = "px-5 py-2 rounded-lg font-semibold text-xs transition-all bg-accent text-white shadow-sm";
        if(btnHome) btnHome.className = "px-5 py-2 rounded-lg font-semibold text-xs text-slate-300 transition-all hover:text-white";
        loadAdminStatistics();
        loadDataAdminKas();
        loadDataAdminIuran();
        loadDataAdminPengeluaran();
        renderSiswaAdminList();
    }
}

function toggleNamaIuran() {
    let tipe = document.getElementById('input-tipe');
    let wrapper = document.getElementById('wrapper-nama-iuran');
    let inputNamaIuran = document.getElementById('input-nama-iuran');
    if(!tipe || !wrapper || !inputNamaIuran) return;
    if(tipe.value === 'Iuran') { wrapper.classList.remove('hidden'); inputNamaIuran.required = true; }
    else { wrapper.classList.add('hidden'); inputNamaIuran.required = false; inputNamaIuran.value = ''; }
}

function hitungPatungan() {
    try {
        let target = document.getElementById('calc-target') ? Number(document.getElementById('calc-target').value) || 0 : 0;
        let siswa = document.getElementById('calc-siswa') ? Number(document.getElementById('calc-siswa').value) || (siswaData.length || 39) : 39;
        let hasil = target / siswa;
        let hasilBulat = Math.ceil(hasil / 1000) * 1000;
        if(document.getElementById('calc-hasil')) document.getElementById('calc-hasil').innerText = `Rp ${Math.round(hasil).toLocaleString('id-ID')}`;
        if(document.getElementById('calc-hasil-bulat')) document.getElementById('calc-hasil-bulat').innerText = `Rp ${hasilBulat.toLocaleString('id-ID')}`;
    } catch(e) {}
}

function startGiveawaySpin() {
    let currentWeek = getCurrentIsoWeek();
    let lunasMingguIniSiswa = siswaData.filter(s => getTotalKasMingguIni(s.absen, currentWeek) >= 3000);
    let statusBox = document.getElementById('giveaway-status-box');
    let winnerBox = document.getElementById('giveaway-winner-name');
    let btnSpin = document.getElementById('btn-spin');

    if(lunasMingguIniSiswa.length === 0) { alert('Belum ada siswa yang lunas uang kas minggu ini (minimal Rp 3.000) untuk di-spin!'); return; }
    if(btnSpin) { btnSpin.disabled = true; btnSpin.classList.add('opacity-50', 'cursor-not-allowed'); }
    if(statusBox) statusBox.innerText = '🎲 Mengocok undian untuk siswa teladan minggu ini...';

    let counter = 0;
    let spinInterval = setInterval(() => {
        let randomIndex = Math.floor(Math.random() * lunasMingguIniSiswa.length);
        if(winnerBox) winnerBox.innerText = lunasMingguIniSiswa[randomIndex].nama;
        counter++;
        if(counter > 15) {
            clearInterval(spinInterval);
            let finalWinner = lunasMingguIniSiswa[Math.floor(Math.random() * lunasMingguIniSiswa.length)];
            if(winnerBox) winnerBox.innerText = `🏆 SELAMAT! ${finalWinner.nama} 🎉`;
            if(statusBox) statusBox.innerText = 'Pemenang Giveaway Minggu Ini Terpilih!';
            if(btnSpin) { btnSpin.disabled = false; btnSpin.classList.remove('opacity-50', 'cursor-not-allowed'); }
        }
    }, 100);
}

function renderRanking() {
    let rankingEl = document.getElementById('ranking-list');
    if(!rankingEl) return;
    let kontribusiMap = {};
    kasData.forEach(item => { if(Number(item.nominal) > 0) kontribusiMap[item.nama] = (kontribusiMap[item.nama] || 0) + (Number(item.nominal) || 0); });
    iuranData.forEach(item => { if(Number(item.nominal) > 0) kontribusiMap[item.nama] = (kontribusiMap[item.nama] || 0) + (Number(item.nominal) || 0); });

    let sortedArray = Object.keys(kontribusiMap).map(nama => ({ nama, total: kontribusiMap[nama] }));
    sortedArray.sort((a, b) => b.total - a.total);

    let html = '';
    if(sortedArray.length === 0) { rankingEl.innerHTML = `<div class="text-center py-6 text-slate-400 font-medium text-xs">Belum ada data kontribusi</div>`; return; }

    sortedArray.slice(0, 5).forEach((item, index) => {
        let medalColor = index === 0 ? 'bg-amber-100 text-amber-700 border-amber-300' : index === 1 ? 'bg-slate-200 text-slate-700 border-slate-300' : index === 2 ? 'bg-amber-700/20 text-amber-900 border-amber-700/30' : 'bg-surface text-slate-600 border-bordercol';
        let rankBadge = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        html += `<div class="flex items-center justify-between p-3 rounded-xl border border-bordercol bg-surface hover:bg-slate-100/60 transition-all"><div class="flex items-center gap-3"><span class="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold border ${medalColor}">${rankBadge}</span><span class="text-xs font-semibold text-slate-900">${item.nama}</span></div><span class="text-xs font-bold text-accent">Rp ${Number(item.total).toLocaleString('id-ID')}</span></div>`;
    });
    rankingEl.innerHTML = html;
}

function updateDashboardMetrics() {
    let totalPemasukan = 0, totalCash = 0, totalDigital = 0;
    let currentWeek = getCurrentIsoWeek();
    let countBelumMingguIni = 0;
    
    kasData.forEach(item => { let nominal = Number(item.nominal) || 0; totalPemasukan += nominal; if(item.metode === 'Digital') totalDigital += nominal; else totalCash += nominal; });
    iuranData.forEach(item => { let nominal = Number(item.nominal) || 0; totalPemasukan += nominal; if(item.metode === 'Digital') totalDigital += nominal; else totalCash += nominal; });
    siswaData.forEach(s => { if(getTotalKasMingguIni(s.absen, currentWeek) < 3000) countBelumMingguIni++; });

    let totalPengeluaran = pengeluaranData.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
    let saldoBersih = totalPemasukan - totalPengeluaran;

    if(document.getElementById('stat-total-pemasukan')) document.getElementById('stat-total-pemasukan').innerText = `Rp ${totalPemasukan.toLocaleString('id-ID')}`;
    if(document.getElementById('stat-total-cash')) document.getElementById('stat-total-cash').innerText = `Rp ${totalCash.toLocaleString('id-ID')}`;
    if(document.getElementById('stat-total-digital')) document.getElementById('stat-total-digital').innerText = `Rp ${totalDigital.toLocaleString('id-ID')}`;
    if(document.getElementById('stat-total-pengeluaran')) document.getElementById('stat-total-pengeluaran').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    if(document.getElementById('stat-saldo-bersih')) document.getElementById('stat-saldo-bersih').innerText = `Rp ${saldoBersih.toLocaleString('id-ID')}`;
    if(document.getElementById('stat-belum-bayar')) document.getElementById('stat-belum-bayar').innerText = `${countBelumMingguIni} Siswa`;
}

function loadAdminStatistics() {
    let currentWeek = getCurrentIsoWeek();
    let countBelum = 0;
    siswaData.forEach(s => { if(getTotalKasMingguIni(s.absen, currentWeek) < 3000) countBelum++; });

    if(document.getElementById('admin-stat-kas-count')) document.getElementById('admin-stat-kas-count').innerText = `${kasData.length} Entri`;
    if(document.getElementById('admin-stat-iuran-count')) document.getElementById('admin-stat-iuran-count').innerText = `${iuranData.length} Entri`;
    if(document.getElementById('admin-stat-belum-count')) document.getElementById('admin-stat-belum-count').innerText = `${countBelum} Siswa`;
    if(document.getElementById('admin-stat-exp-total')) document.getElementById('admin-stat-exp-total').innerText = `Rp ${pengeluaranData.reduce((s, i) => s + (Number(i.nominal)||0), 0).toLocaleString('id-ID')}`;
}

function populateSiswaDropdown() {
    const select = document.getElementById('input-siswa-select');
    if(!select) return;
    sortDataByAbsen();
    let html = `<option value="">-- Pilih Siswa Berdasarkan Absen --</option>`;
    siswaData.forEach(s => { html += `<option value="${s.absen}">Absen ${s.absen} - ${s.nama}</option>`; });
    select.innerHTML = html;
}

function onSelectSiswaChange() {}

function loadDataKas() {
    sortDataByAbsen();
    updateDashboardMetrics();
    renderRanking();
    renderCalendar();
    checkAndProcessAutoMonthlyArchive();
    
    const tbody = document.getElementById('tabel-kas-body');
    if(!tbody) return;
    if(siswaData.length === 0) { tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-slate-400 font-medium">Belum ada data siswa.</td></tr>`; return; }

    let currentWeek = getCurrentIsoWeek();
    let html = '';

    siswaData.forEach((s) => {
        let totalKasMingguIni = getTotalKasMingguIni(s.absen, currentWeek);
        let isLunas = totalKasMingguIni >= 3000;
        let totalSiswaKontribusi = 0;
        kasData.forEach(k => { if(Number(k.absen) === Number(s.absen)) totalSiswaKontribusi += Number(k.nominal) || 0; });
        iuranData.forEach(i => { if(Number(i.absen) === Number(s.absen)) totalSiswaKontribusi += Number(i.nominal) || 0; });

        let titleObj = getUserTitle(totalSiswaKontribusi);
        let statusBadge = isLunas 
            ? '<span class="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold text-[10px]">Lunas Minggu Ini</span>' 
            : '<span class="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-md font-semibold text-[10px]">Belum Bayar</span>';

        let lastMetode = '';
        let matchedKasList = kasData.filter(k => Number(k.absen) === Number(s.absen) && k.minggu === currentWeek);
        if(matchedKasList.length > 0) lastMetode = matchedKasList[matchedKasList.length - 1].metode;

        let metodeBadge = isLunas && lastMetode === 'Digital' 
            ? '<span class="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-semibold">💳 Digital</span>' 
            : (isLunas ? '<span class="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-semibold">💵 Cash</span>' : '-');

        let avatar = getAvatarUrl(s.nama);
        let nominalKas = totalKasMingguIni > 0 ? `Rp ${totalKasMingguIni.toLocaleString('id-ID')}` : 'Rp 0';

        html += `
            <tr class="hover:bg-slate-50/80 transition-all">
                <td class="py-3 px-3 text-center font-bold text-slate-500">${s.absen}</td>
                <td class="py-3 px-3">
                    <div class="flex items-center gap-3">
                        <img src="${avatar}" alt="Avatar" class="w-7 h-7 rounded-full object-cover border border-slate-200 bg-slate-100 shadow-2xs">
                        <div>
                            <div class="font-semibold text-slate-900">${s.nama}</div>
                            <span class="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold border ${titleObj.class}">${titleObj.text}</span>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-3 font-semibold text-slate-900">${nominalKas}</td>
                <td class="py-3 px-3">${metodeBadge}</td>
                <td class="py-3 px-3 text-center">${statusBadge}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function loadDataIuran() {
    const tbody = document.getElementById('tabel-iuran-body');
    if(!tbody) return;
    if(iuranData.length === 0) { tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400 font-medium">Belum ada data iuran khusus</td></tr>`; return; }

    let html = '';
    iuranData.forEach(item => {
        let metodeBadge = item.metode === 'Digital' ? '<span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold">💳 Digital</span>' : '<span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold">💵 Cash</span>';
        let iuranBadge = `<span class="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md text-xs font-semibold">${item.namaIuran || 'Iuran'}</span>`;
        html += `
            <tr class="hover:bg-slate-50/80 transition-all">
                <td class="py-3.5 px-4 text-center font-bold text-slate-500">${item.absen || '-'}</td>
                <td class="py-3.5 px-4 font-semibold text-slate-900">${item.nama}</td>
                <td class="py-3.5 px-4">${iuranBadge}</td>
                <td class="py-3.5 px-4 font-semibold text-slate-900">Rp ${Number(item.nominal).toLocaleString('id-ID')}</td>
                <td class="py-3.5 px-4">${metodeBadge}</td>
                <td class="py-3.5 px-4 text-center"><span class="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">Lunas</span></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function loadDataPengeluaran() {
    const tbody = document.getElementById('tabel-pengeluaran-body');
    if(!tbody) return;
    if(pengeluaranData.length === 0) { tbody.innerHTML = `<tr><td colspan="3" class="text-center py-6 text-slate-400 font-medium">Belum ada catatan pengeluaran kelas</td></tr>`; return; }

    let html = '';
    pengeluaranData.forEach(item => {
        html += `
            <tr class="hover:bg-slate-50/80 transition-all">
                <td class="py-3.5 px-4 font-semibold text-slate-900">${item.keterangan}</td>
                <td class="py-3.5 px-4 font-bold text-rose-600">Rp ${Number(item.nominal).toLocaleString('id-ID')}</td>
                <td class="py-3.5 px-4 text-slate-500">${item.tanggal || '-'}</td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function renderSiswaAdminList() {
    sortDataByAbsen();
    const container = document.getElementById('list-siswa-admin');
    const countEl = document.getElementById('count-siswa');
    if(!container) return;
    if(countEl) countEl.innerText = siswaData.length;
    if(siswaData.length === 0) { container.innerHTML = `<div class="text-xs text-slate-400 italic">Belum ada siswa ditambahkan.</div>`; return; }

    let html = '';
    siswaData.forEach(s => {
        html += `
            <div class="flex items-center justify-between p-2 bg-surface rounded-lg border border-bordercol text-xs">
                <div><span class="font-bold text-accent">Absen ${s.absen}:</span> <span class="font-semibold text-slate-800">${s.nama}</span></div>
                <div class="space-x-1"><button onclick="hapusSiswa('${s.id}')" class="text-rose-600 hover:underline text-[10px] font-bold">Hapus</button></div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function loadDataAdminKas() {
    sortDataByAbsen();
    loadAdminStatistics();
    const tbody = document.getElementById('tabel-admin-kas-body');
    if(!tbody) return;
    if(kasData.length === 0) { tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400 font-medium">Data kas kosong</td></tr>`; return; }

    let html = '';
    kasData.forEach(item => {
        let metodeBadge = item.metode === 'Digital' ? '💳 Digital' : '💵 Cash';
        html += `
            <tr class="hover:bg-slate-50/80 transition-all">
                <td class="py-3.5 px-4 text-center font-bold text-slate-500">${item.absen || '-'}</td>
                <td class="py-3.5 px-4 font-semibold text-slate-900">${item.nama}</td>
                <td class="py-3.5 px-4 font-semibold text-slate-900">Rp ${Number(item.nominal).toLocaleString('id-ID')}</td>
                <td class="py-3.5 px-4 font-medium text-slate-700">${metodeBadge}</td>
                <td class="py-3.5 px-4 text-slate-500">${item.tanggal} (${item.minggu})</td>
                <td class="py-3.5 px-4 text-center space-x-2"><button onclick="hapusDataKas('${item.id}')" class="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all">Hapus</button></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function loadDataAdminIuran() {
    sortDataByAbsen();
    loadAdminStatistics();
    const tbody = document.getElementById('tabel-admin-iuran-body');
    if(!tbody) return;
    if(iuranData.length === 0) { tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400 font-medium">Data iuran khusus kosong</td></tr>`; return; }

    let html = '';
    iuranData.forEach(item => {
        let iuranBadge = `<span class="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-xs font-semibold">${item.namaIuran}</span>`;
        let metodeBadge = item.metode === 'Digital' ? '💳 Digital' : '💵 Cash';
        html += `
            <tr class="hover:bg-slate-50/80 transition-all">
                <td class="py-3.5 px-4 text-center font-bold text-slate-500">${item.absen || '-'}</td>
                <td class="py-3.5 px-4 font-semibold text-slate-900">${item.nama}</td>
                <td class="py-3.5 px-4">${iuranBadge}</td>
                <td class="py-3.5 px-4 font-semibold text-slate-900">Rp ${Number(item.nominal).toLocaleString('id-ID')}</td>
                <td class="py-3.5 px-4 font-medium text-slate-700">${metodeBadge}</td>
                <td class="py-3.5 px-4 text-center space-x-2"><button onclick="hapusDataIuran('${item.id}')" class="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all">Hapus</button></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function loadDataAdminPengeluaran() {
    loadAdminStatistics();
    const tbody = document.getElementById('tabel-admin-pengeluaran-body');
    if(!tbody) return;
    if(pengeluaranData.length === 0) { tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-400 font-medium">Belum ada pengeluaran</td></tr>`; return; }

    let html = '';
    pengeluaranData.forEach(item => {
        html += `
            <tr class="hover:bg-slate-50/80 transition-all">
                <td class="py-3.5 px-4 font-semibold text-slate-900">${item.keterangan}</td>
                <td class="py-3.5 px-4 font-bold text-rose-600">Rp ${Number(item.nominal).toLocaleString('id-ID')}</td>
                <td class="py-3.5 px-4 text-slate-500">${item.tanggal || '-'}</td>
                <td class="py-3.5 px-4 text-center"><button onclick="hapusPengeluaran('${item.id}')" class="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all">Hapus</button></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function simpanDataSiswa(e) {
    if(e) e.preventDefault();
    let absen = Number(document.getElementById('siswa-absen').value);
    let nama = document.getElementById('siswa-nama').value.trim();
    let payload = { id: 'sis_' + Date.now(), absen, nama };
    
    siswaData.push(payload);
    saveToLocalStorage();

    if(document.getElementById('siswa-absen')) document.getElementById('siswa-absen').value = '';
    if(document.getElementById('siswa-nama')) document.getElementById('siswa-nama').value = '';
    populateSiswaDropdown();
    renderSiswaAdminList();
    alert('Siswa berhasil ditambahkan!');
}

function hapusSiswa(id) {
    if(confirm('Hapus siswa ini dari daftar?')) {
        siswaData = siswaData.filter(s => String(s.id) !== String(id));
        saveToLocalStorage();
        populateSiswaDropdown();
        renderSiswaAdminList();
    }
}

function simpanDataPemasukan(e) {
    if(e) e.preventDefault();
    const selectSiswa = document.getElementById('input-siswa-select').value;
    if(!selectSiswa) { alert('Silakan pilih siswa terlebih dahulu!'); return; }

    let siswaObj = siswaData.find(s => Number(s.absen) === Number(selectSiswa));
    const absen = siswaObj.absen;
    const nama = siswaObj.nama;
    const tipe = document.getElementById('input-tipe').value;
    const namaIuran = document.getElementById('input-nama-iuran') ? document.getElementById('input-nama-iuran').value : '';
    const nominal = Number(document.getElementById('input-nominal').value);
    const metode = document.getElementById('input-metode').value;
    const tanggal = document.getElementById('input-tanggal').value;
    let mingguTransaksi = getIsoWeek(new Date(tanggal));

    if (tipe === 'Kas') {
        let payload = { id: Date.now().toString(), absen, nama, nominal, metode, tanggal, minggu: mingguTransaksi };
        kasData.push(payload);
        saveToLocalStorage();
        alert('Data uang kas berhasil disimpan.');
        loadDataAdminKas();
    } else {
        let payload = { id: 'iur_' + Date.now(), absen, nama, namaIuran, nominal, metode, tanggal };
        iuranData.push(payload);
        saveToLocalStorage();
        alert('Data iuran khusus berhasil disimpan.');
        loadDataAdminIuran();
    }

    resetForm();
    loadAdminStatistics();
    checkAndProcessAutoMonthlyArchive();
}

function simpanDataPengeluaran(e) {
    if(e) e.preventDefault();
    const keterangan = document.getElementById('exp-keterangan').value;
    const nominal = Number(document.getElementById('exp-nominal').value);
    const tanggal = document.getElementById('exp-tanggal').value;
    let payload = { id: 'e_' + Date.now(), keterangan, nominal, tanggal };
    
    pengeluaranData.push(payload);
    saveToLocalStorage();

    if(document.getElementById('form-pengeluaran')) document.getElementById('form-pengeluaran').reset();
    alert('Catatan pengeluaran berhasil disimpan.');
    loadDataAdminPengeluaran();
    loadAdminStatistics();
    checkAndProcessAutoMonthlyArchive();
}

function hapusDataKas(id) {
    if(confirm('Hapus transaksi kas ini?')) {
        kasData = kasData.filter(item => String(item.id) !== String(id));
        saveToLocalStorage();
        loadDataAdminKas();
        loadAdminStatistics();
    }
}

function hapusDataIuran(id) {
    if(confirm('Hapus transaksi iuran khusus ini?')) {
        iuranData = iuranData.filter(item => String(item.id) !== String(id));
        saveToLocalStorage();
        loadDataAdminIuran();
        loadAdminStatistics();
    }
}

function hapusPengeluaran(id) {
    if(confirm('Hapus catatan pengeluaran ini?')) {
        pengeluaranData = pengeluaranData.filter(item => String(item.id) !== String(id));
        saveToLocalStorage();
        loadDataAdminPengeluaran();
        loadAdminStatistics();
    }
}

function resetForm() {
    if(document.getElementById('form-admin')) document.getElementById('form-admin').reset();
    if(document.getElementById('edit-id')) document.getElementById('edit-id').value = '';
    toggleNamaIuran();
}

function resetFormSiswa() {
    if(document.getElementById('siswa-absen')) document.getElementById('siswa-absen').value = '';
    if(document.getElementById('siswa-nama')) document.getElementById('siswa-nama').value = '';
}

window.onload = () => {
    try {
        updateWIBClock();
        setInterval(updateWIBClock, 1000);
        hitungPatungan();
        initAppFromLocal();
    } catch (e) {
        console.error("Error onload:", e);
    }
};
