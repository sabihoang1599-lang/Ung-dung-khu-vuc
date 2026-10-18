let currentAreaKey = localStorage.getItem('thonxom_current_area') || 'Bình An - Vĩnh Long';

function getAreaData(key) {
    let data = localStorage.getItem('thonxom_data_' + key);
    if (!data) {
        let defaultData = {
            khuVuc: "Thôn Xóm Bình An",
            phuongTinh: "Phường Phước Long, Tỉnh Vĩnh Long",
            avatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=100",
            accounts: [
                { id: 1, hoten: "Nguyễn Văn Chủ", chucvu: "Chủ hệ thống", sdt: "0909000000", username: "Chủ hệ thống", password: "password123", type: "chu", area: "Bình An - Vĩnh Long" },
                { id: 2, hoten: "Nguyễn Văn Minh", chucvu: "Bí thư", sdt: "0901234567", username: "Bí thư", password: "password123", type: "me", area: "Bình An - Vĩnh Long" }
            ],
            contacts: [
                { id: 1, name: "Bí Thư Chi Bộ", person: "Nguyễn Văn Minh", phone: "0901234567", isEmergency: true, color: "teal" },
                { id: 2, name: "Công An Xã", person: "Trực ban", phone: "0912345678", isEmergency: true, color: "blue" }
            ],
            news: [
                { id: 1, title: "Kế hoạch xây dựng tuyến đường hoa thanh niên", content: "Toàn dân tham gia dọn dẹp vệ sinh và trồng hoa dọc tuyến đường chính vào thôn xóm.", author: "Bí thư - Nguyễn Văn Minh", date: "18/10/2026", images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600"] }
            ],
            phanAnh: [],
            thuTucDocs: [],
            hopChiBo: [],
            bieuQuyet: [],
            chatMessages: []
        };
        localStorage.setItem('thonxom_data_' + key, JSON.stringify(defaultData));
        return defaultData;
    }
    return JSON.parse(data);
}

let db = getAreaData(currentAreaKey);
let currentUser = JSON.parse(localStorage.getItem('thonxom_logged_user')) || null;

function saveDB() {
    localStorage.setItem('thonxom_data_' + currentAreaKey, JSON.stringify(db));
}

document.addEventListener('DOMContentLoaded', () => {
    initAppConfig();
    renderSidebarContacts();
    renderNews();
    renderPhanAnh();
    renderThuTucDocs();
    renderHopChiBo();
    renderBieuQuyet();
    renderChatMessages();
    renderAccountsTable();
    checkRolePermissions();
});

function initAppConfig() {
    document.getElementById('display-khu-vuc').innerText = db.khuVuc;
    document.getElementById('display-phuong-tỉnh').innerText = db.phuongTinh;
    document.getElementById('header-avatar').src = db.avatar;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = "tab-btn px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition whitespace-nowrap";
    });
    const activeBtn = document.getElementById('btn-' + tabId) || document.getElementById('tab-btn-quanly');
    if(activeBtn) {
        activeBtn.className = "tab-btn px-3.5 py-1.5 rounded-full text-xs font-semibold bg-teal-50 text-travelPrimary border border-teal-200 transition whitespace-nowrap";
    }
}

function renderSidebarContacts() {
    const container = document.getElementById('sidebar-contacts-list');
    const headerEmergency = document.getElementById('header-emergency-buttons');
    if(!container || !headerEmergency) return;
    
    container.innerHTML = '';
    headerEmergency.innerHTML = '';

    db.contacts.forEach(c => {
        container.innerHTML += `
            <div class="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border">
                <div><p class="font-bold">${c.name}</p><p class="text-gray-500 text-[11px]">${c.person} - ${c.phone}</p></div>
                <a href="tel:${c.phone}" class="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-phone"></i> Gọi</a>
            </div>
        `;
        if(c.isEmergency) {
            headerEmergency.innerHTML += `
                <a href="tel:${c.phone}" class="bg-red-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow animate-pulse flex items-center gap-1">
                    <i class="fa-solid fa-phone-volume"></i> ${c.name.split(' ')[0]}
                </a>
            `;
        }
    });
}

function checkRolePermissions() {
    const addNewsContainer = document.getElementById('action-add-news-container');
    const tabQuanLyBtn = document.getElementById('tab-btn-quanly');
    const officerUploadTt = document.getElementById('officer-upload-thutuc-card');
    const authBtnText = document.getElementById('auth-btn-text');
    const currentUserBadge = document.getElementById('current-user-badge');

    if(addNewsContainer) addNewsContainer.innerHTML = '';
    if(tabQuanLyBtn) tabQuanLyBtn.classList.add('hidden');
    if(officerUploadTt) officerUploadTt.classList.add('hidden');

    if(currentUser) {
        authBtnText.innerText = currentUser.chucvu;
        if(currentUserBadge) currentUserBadge.innerHTML = `Đang đăng nhập: <b>${currentUser.chucvu}</b> - ${currentUser.hoten}`;

        if(currentUser.type === 'chu' || currentUser.type === 'me') {
            if(tabQuanLyBtn) tabQuanLyBtn.classList.remove('hidden');
            if(officerUploadTt) officerUploadTt.classList.remove('hidden');
            if(addNewsContainer) addNewsContainer.innerHTML = `<button onclick="openNewsModal()" class="bg-travelPrimary text-white text-xs px-3 py-1.5 rounded-full font-bold shadow"><i class="fa-solid fa-plus"></i> Đăng Bài</button>`;
        }
    } else {
        authBtnText.innerText = "Đăng Nhập";
        if(currentUserBadge) currentUserBadge.innerHTML = "Chưa đăng nhập";
    }
}

function openLoginModal() { document.getElementById('login-modal').classList.remove('hidden'); }
function closeLoginModal() { document.getElementById('login-modal').classList.add('hidden'); }

function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();

    const found = db.accounts.find(acc => acc.username.toLowerCase() === u.toLowerCase() && acc.password === p);
    if(found) {
        currentUser = found;
        localStorage.setItem('thonxom_logged_user', JSON.stringify(currentUser));
        closeLoginModal();
        checkRolePermissions();
        renderAccountsTable();
        alert("Đăng nhập thành công: " + found.chucvu);
    } else {
        alert("Sai tên đăng nhập hoặc mật khẩu (≥ 8 ký tự)!");
    }
}

function createNewAccount(e) {
    e.preventDefault();
    if(!currentUser || (currentUser.type !== 'chu' && currentUser.type !== 'me')) {
        alert("Không có quyền!"); return;
    }
    const hoten = document.getElementById('acc-hoten').value.trim();
    const chucvu = document.getElementById('acc-chucvu').value.trim();
    const sdt = document.getElementById('acc-sdt').value.trim();
    const password = document.getElementById('acc-password').value.trim();
    const type = document.getElementById('acc-type').value;

    if(password.length < 8) { alert("Mật khẩu phải từ 8 ký tự trở lên!"); return; }

    db.accounts.push({ id: Date.now(), hoten, chucvu, sdt, username: chucvu, password, type, area: currentAreaKey });
    saveDB();
    renderAccountsTable();
    alert("Đã cấp tài khoản thành công!");
    e.target.reset();
}

function renderAccountsTable() {
    const container = document.getElementById('accounts-table-body');
    if(!container) return;
    container.innerHTML = '';
    db.accounts.forEach(acc => {
        container.innerHTML += `
            <div class="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded-xl border">
                <span><b>${acc.hoten}</b> (${acc.chucvu})</span>
                ${currentUser && currentUser.type === 'chu' && acc.type !== 'chu' ? `<button onclick="deleteAccount(${acc.id})" class="text-red-500"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>
        `;
    });
}
function deleteAccount(id) {
    db.accounts = db.accounts.filter(a => a.id !== id);
    saveDB();
    renderAccountsTable();
}

let tempNewsImages = [];
function openNewsModal() { document.getElementById('news-modal').classList.remove('hidden'); }
function closeNewsModal() { document.getElementById('news-modal').classList.add('hidden'); tempNewsImages = []; }
function handleNewsImages(e) {
    const files = e.target.files;
    tempNewsImages = [];
    const preview = document.getElementById('news-image-preview');
    preview.innerHTML = '';
    for(let i=0; i<Math.min(files.length, 5); i++) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            tempNewsImages.push(evt.target.result);
            preview.innerHTML += `<img src="${evt.target.result}" class="w-12 h-12 object-cover rounded-xl border">`;
        };
        reader.readAsDataURL(files[i]);
    }
}
function submitNewsArticle(e) {
    e.preventDefault();
    db.news.unshift({
        id: Date.now(),
        title: document.getElementById('news-title').value.trim(),
        content: document.getElementById('news-content').value.trim(),
        images: [...tempNewsImages],
        author: currentUser ? currentUser.chucvu + " - " + currentUser.hoten : "Ban Quản Trị",
        date: new Date().toLocaleDateString('vi-VN')
    });
    saveDB(); closeNewsModal(); renderNews(); e.target.reset();
}
function renderNews(filter = "") {
    const list = document.getElementById('news-feed-list');
    if(!list) return;
    list.innerHTML = '';
    let filtered = db.news.filter(n => n.title.toLowerCase().includes(filter.toLowerCase()));
    filtered.forEach(n => {
        let imgTag = n.images && n.images[0] ? `<img src="${n.images[0]}" class="w-full h-36 object-cover rounded-2xl mb-2">` : '';
        list.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border dark:border-gray-700 shadow-sm space-y-2">
                ${imgTag}
                <div class="flex justify-between text-[11px] text-gray-400"><span>${n.author}</span><span>${n.date}</span></div>
                <h4 class="font-bold text-sm text-travelPrimary">${n.title}</h4>
                <p class="text-xs text-gray-600 dark:text-gray-300">${n.content}</p>
            </div>
        `;
    });
}
function filterNews() { renderNews(document.getElementById('search-news-input').value); }

let tempPaImages = [];
function handlePaImages(e) {
    const files = e.target.files;
    tempPaImages = [];
    const preview = document.getElementById('pa-image-preview');
    preview.innerHTML = '';
    for(let i=0; i<files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            tempPaImages.push(evt.target.result);
            preview.innerHTML += `<img src="${evt.target.result}" class="w-10 h-10 object-cover rounded-lg border">`;
        };
        reader.readAsDataURL(files[i]);
    }
}
function submitPhanAnh(e) {
    e.preventDefault();
    if(tempPaImages.length < 3) { alert("Bắt buộc ít nhất 3 hình ảnh minh chứng!"); return; }
    db.phanAnh.unshift({
        id: Date.now(),
        hoten: document.getElementById('pa-hoten').value.trim(),
        sdt: document.getElementById('pa-sdt').value.trim(),
        diachi: document.getElementById('pa-diachi').value.trim(),
        noidung: document.getElementById('pa-noidung').value.trim(),
        images: [...tempPaImages],
        status: "Đang tiếp nhận",
        date: new Date().toLocaleDateString('vi-VN')
    });
    saveDB(); renderPhanAnh(); e.target.reset(); tempPaImages = []; alert("Đã gửi phản ánh!");
}
function renderPhanAnh() {
    const container = document.getElementById('phan-anh-list-container');
    if(!container) return;
    container.innerHTML = '';
    db.phanAnh.forEach(p => {
        container.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl border text-xs space-y-1 shadow-sm">
                <div class="flex justify-between font-bold"><span>${p.hoten}</span><span class="text-teal-600">${p.status}</span></div>
                <p class="text-gray-600 dark:text-gray-300">${p.noidung}</p>
            </div>
        `;
    });
}

function searchThuTucAI() {
    const query = document.getElementById('tt-search-input').value.trim();
    const box = document.getElementById('ai-result-box');
    if(!query) { alert("Nhập tên thủ tục!"); return; }
    box.classList.remove('hidden');
    box.innerHTML = `<p class="animate-pulse">AI đang tìm kiếm...</p>`;
    setTimeout(() => {
        box.innerHTML = `
            <p class="font-bold text-travelPrimary">Kết quả cho: "${query}"</p>
            <p>1. Chuẩn bị giấy tờ gốc và bản photo.</p>
            <p>2. Nộp tại bộ phận một cửa hoặc trực tuyến.</p>
        `;
    }, 600);
}
function officerUploadThuTuc(e) {
    e.preventDefault();
    db.thuTucDocs.unshift({ id: Date.now(), title: document.getElementById('off-tt-title').value.trim(), uploader: currentUser ? currentUser.chucvu : "Cán bộ" });
    saveDB(); renderThuTucDocs(); e.target.reset(); alert("Đã tải lên biểu mẫu!");
}
function renderThuTucDocs() {
    const list = document.getElementById('thutuc-doc-list');
    if(!list) return;
    list.innerHTML = '';
    db.thuTucDocs.forEach(d => {
        list.innerHTML += `<div class="p-2.5 bg-white dark:bg-gray-800 rounded-xl border text-xs flex justify-between"><span>${d.title}</span><span class="text-gray-400">${d.uploader}</span></div>`;
    });
}

function sendChatMessage(e) {
    e.preventDefault();
    const name = document.getElementById('chat-input-name').value.trim();
    const msg = document.getElementById('chat-input-msg').value.trim();
    db.chatMessages.push({ id: Date.now(), name, msg });
    saveDB(); renderChatMessages(); document.getElementById('chat-input-msg').value = '';
}
function renderChatMessages() {
    const box = document.getElementById('chat-messages-box');
    if(!box) return;
    box.innerHTML = '';
    db.chatMessages.forEach(m => {
        box.innerHTML += `<div class="p-2 bg-gray-50 dark:bg-gray-900 rounded-xl border text-xs"><b>${m.name}:</b> ${m.msg}</div>`;
    });
}

function toggleDarkMode() { document.documentElement.classList.toggle('dark'); }
function openContactModal() { document.getElementById('contact-modal').classList.remove('hidden'); }
function closeContactModal() { document.getElementById('contact-modal').classList.add('hidden'); }
