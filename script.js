let currentAreaKey = localStorage.getItem('thonxom_current_area') || 'Thôn Xóm Bình An';

function getAreaData(key) {
    let data = localStorage.getItem('thonxom_data_' + key);
    if (!data) {
        let defaultData = {
            khuVuc: "Thôn Xóm Bình An",
            accounts: [
                { id: 1, hoten: "Chủ Hệ Thống", username: "Taikhoanchu", password: "@Taikhoanchu26", type: "chu", sdt: "0909000000" },
                { id: 2, hoten: "Nguyễn Văn Minh", username: "Bithu", password: "@Bithu123", type: "cap1", sdt: "0901234567" }
            ],
            contacts: [
                { id: 1, dept: "Bí Thư Chi Bộ", person: "Nguyễn Văn Minh", phone: "0901234567" }
            ],
            news: [],
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
    let cfgInput = document.getElementById('cfg-khu-vuc');
    if(cfgInput) cfgInput.value = db.khuVuc;
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = "tab-btn px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition whitespace-nowrap";
    });
    const activeBtn = document.getElementById('btn-' + tabId) || document.getElementById('tab-btn-quanly');
    if(activeBtn) {
        activeBtn.className = "tab-btn px-3.5 py-1.5 rounded-full text-xs font-semibold bg-teal-50 text-travelPrimary border border-teal-200 transition whitespace-nowrap";
    }
}

// Kiểm tra mật khẩu: Ít nhất 1 chữ In hoa và 1 ký tự đặc biệt
function validatePassword(pwd) {
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    return hasUpperCase && hasSpecialChar;
}

// Kiểm tra tên đăng nhập: Viết liền không dấu, viết hoa chữ đầu
function validateUsername(usr) {
    const regex = /^[A-Z][a-zA-Z0-9]*$/;
    return regex.test(usr);
}

function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();

    const found = db.accounts.find(acc => acc.username === u && acc.password === p);
    if(found) {
        currentUser = found;
        localStorage.setItem('thonxom_logged_user', JSON.stringify(currentUser));
        closeLoginModal();
        checkRolePermissions();
        renderAccountsTable();
        renderSidebarContacts();
        alert("Đăng nhập thành công!");
    } else {
        alert("Sai tên đăng nhập hoặc mật khẩu!");
    }
}

function openLoginModal() { document.getElementById('login-modal').classList.remove('hidden'); }
function closeLoginModal() { document.getElementById('login-modal').classList.add('hidden'); }

function checkRolePermissions() {
    const addNewsContainer = document.getElementById('action-add-news-container');
    const addHopContainer = document.getElementById('action-add-hop-container');
    const addBqContainer = document.getElementById('action-add-bq-container');
    const tabQuanLyBtn = document.getElementById('tab-btn-quanly');
    const officerUploadTt = document.getElementById('officer-upload-thutuc-card');
    const areaConfigBox = document.getElementById('area-config-box');
    const authBtnText = document.getElementById('auth-btn-text');
    const currentUserBadge = document.getElementById('current-user-badge');
    const contactAddSec = document.getElementById('contact-add-section');

    if(addNewsContainer) addNewsContainer.innerHTML = '';
    if(addHopContainer) addHopContainer.innerHTML = '';
    if(addBqContainer) addBqContainer.innerHTML = '';
    if(tabQuanLyBtn) tabQuanLyBtn.classList.add('hidden');
    if(officerUploadTt) officerUploadTt.classList.add('hidden');
    if(areaConfigBox) areaConfigBox.classList.add('hidden');
    if(contactAddSec) contactAddSec.classList.add('hidden');

    if(currentUser) {
        authBtnText.innerText = currentUser.username;
        let roleName = currentUser.type === 'chu' ? 'Tài Khoản Chủ' : (currentUser.type === 'cap1' ? 'Cấp 1 (Cán bộ)' : 'Cấp 2 (Đảng viên)');
        if(currentUserBadge) currentUserBadge.innerHTML = `Xin chào: <b>${currentUser.hoten}</b> (${roleName})`;

        if(currentUser.type === 'chu' || currentUser.type === 'cap1') {
            if(tabQuanLyBtn) tabQuanLyBtn.classList.remove('hidden');
            if(officerUploadTt) officerUploadTt.classList.remove('hidden');
            if(areaConfigBox) areaConfigBox.classList.remove('hidden');
            if(contactAddSec) contactAddSec.classList.remove('hidden');
            if(addNewsContainer) addNewsContainer.innerHTML = `<button onclick="openNewsModal()" class="bg-travelPrimary text-white text-xs px-3 py-1.5 rounded-full font-bold shadow"><i class="fa-solid fa-plus"></i> Đăng Bài</button>`;
            if(addHopContainer) addHopContainer.innerHTML = `<button onclick="openHopModal()" class="bg-travelPrimary text-white text-xs px-3 py-1.5 rounded-full font-bold shadow"><i class="fa-solid fa-plus"></i> Tạo Lịch Họp</button>`;
            if(addBqContainer) addBqContainer.innerHTML = `<button onclick="openBqModal()" class="bg-travelAccent text-white text-xs px-3 py-1.5 rounded-full font-bold shadow"><i class="fa-solid fa-plus"></i> Tạo Biểu Quyết</button>`;
        }
    } else {
        authBtnText.innerText = "Đăng Nhập";
        if(currentUserBadge) currentUserBadge.innerHTML = "Chưa đăng nhập";
    }
}

// Cấp tài khoản mới
function createNewAccount(e) {
    e.preventDefault();
    if(!currentUser || (currentUser.type !== 'chu' && currentUser.type !== 'cap1')) {
        alert("Bạn không có quyền cấp tài khoản!"); return;
    }
    const hoten = document.getElementById('acc-hoten').value.trim();
    const username = document.getElementById('acc-chucvu').value.trim();
    const sdt = document.getElementById('acc-sdt').value.trim();
    const password = document.getElementById('acc-password').value.trim();
    const type = document.getElementById('acc-type').value;

    if(!validateUsername(username)) {
        alert("Tên đăng nhập phải viết liền không dấu và viết hoa chữ cái đầu (VD: BiThu)!"); return;
    }
    if(!validatePassword(password)) {
        alert("Mật khẩu phải chứa ít nhất 1 chữ In hoa và 1 ký tự đặc biệt!"); return;
    }

    db.accounts.push({ id: Date.now(), hoten, username, password, type, sdt });
    saveDB();
    renderAccountsTable();
    alert("Cấp tài khoản thành công!");
    e.target.reset();
}

// Hiển thị danh sách thành viên (Ẩn tài khoản Chủ)
function renderAccountsTable() {
    const container = document.getElementById('accounts-table-body');
    if(!container) return;
    container.innerHTML = '';
    
    // Lọc bỏ tài khoản chủ
    let visibleAccounts = db.accounts.filter(acc => acc.type !== 'chu');
    if(visibleAccounts.length === 0) {
        container.innerHTML = `<p class="text-gray-400">Chưa có tài khoản nào khác.</p>`;
        return;
    }

    visibleAccounts.forEach(acc => {
        let levelBadge = acc.type === 'cap1' ? '<span class="bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">Cấp 1</span>' : '<span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Cấp 2</span>';
        container.innerHTML += `
            <div class="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border text-xs">
                <div>
                    <p class="font-bold">${acc.hoten} (${acc.username}) ${levelBadge}</p>
                    <p class="text-gray-500 text-[11px]">SĐT: ${acc.sdt} | Mật khẩu: ${acc.password}</p>
                </div>
                ${(currentUser && currentUser.type === 'chu') ? `<button onclick="deleteAccount(${acc.id})" class="text-red-500"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>
        `;
    });
}

function deleteAccount(id) {
    db.accounts = db.accounts.filter(a => a.id !== id);
    saveDB();
    renderAccountsTable();
}

// Đổi tên khu vực riêng biệt
function saveKhuVucConfig() {
    const kv = document.getElementById('cfg-khu-vuc').value.trim();
    if(!kv) { alert("Nhập tên khu vực!"); return; }
    currentAreaKey = kv;
    localStorage.setItem('thonxom_current_area', currentAreaKey);
    db.khuVuc = kv;
    saveDB();
    alert("Đã cập nhật khu vực riêng biệt!");
    location.reload();
}

// Quản lý Danh Bạ (Cấp 1 thêm thủ công)
function renderSidebarContacts() {
    const container = document.getElementById('sidebar-contacts-list');
    const headerEmergency = document.getElementById('header-emergency-buttons');
    if(!container) return;
    container.innerHTML = '';
    if(headerEmergency) headerEmergency.innerHTML = '';

    db.contacts.forEach(c => {
        container.innerHTML += `
            <div class="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border">
                <div><p class="font-bold">${c.dept}</p><p class="text-gray-500 text-[11px]">${c.person} - ${c.phone}</p></div>
                <div class="flex items-center gap-2">
                    <a href="tel:${c.phone}" class="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-phone"></i> Gọi</a>
                    ${currentUser && (currentUser.type === 'chu' || currentUser.type === 'cap1') ? `<button onclick="deleteContact(${c.id})" class="text-red-500"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
            </div>
        `;
    });
}

function saveNewContact(e) {
    e.preventDefault();
    const dept = document.getElementById('ct-dept').value.trim();
    const person = document.getElementById('ct-person').value.trim();
    const phone = document.getElementById('ct-phone').value.trim();

    db.contacts.push({ id: Date.now(), dept, person, phone });
    saveDB();
    renderSidebarContacts();
    alert("Đã thêm danh bạ thành công!");
    e.target.reset();
}

function deleteContact(id) {
    db.contacts = db.contacts.filter(c => c.id !== id);
    saveDB();
    renderSidebarContacts();
}

// Đăng Tin (Cấp 1)
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
        author: currentUser ? currentUser.username : "Cán bộ",
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
            <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border shadow-sm space-y-2 text-xs">
                ${imgTag}
                <div class="flex justify-between text-[11px] text-gray-400"><span>${n.author}</span><span>${n.date}</span></div>
                <h4 class="font-bold text-sm text-travelPrimary">${n.title}</h4>
                <p class="text-gray-600 dark:text-gray-300">${n.content}</p>
            </div>
        `;
    });
}
function filterNews() { renderNews(document.getElementById('search-news-input').value); }

// Phản Ánh (Bắt buộc họ tên, SĐT, nội dung, ít nhất 3 hình)
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
    if(tempPaImages.length < 3) { alert("Bắt buộc phải đính kèm ít nhất 3 hình ảnh minh chứng!"); return; }
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
    saveDB(); renderPhanAnh(); e.target.reset(); tempPaImages = []; document.getElementById('pa-image-preview').innerHTML = ''; alert("Đã gửi phản ánh thành công!");
}
function renderPhanAnh() {
    const container = document.getElementById('phan-anh-list-container');
    if(!container) return;
    container.innerHTML = '';
    db.phanAnh.forEach(p => {
        container.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl border text-xs space-y-1 shadow-sm">
                <div class="flex justify-between font-bold"><span>${p.hoten} (${p.sdt})</span><span class="text-teal-600">${p.status}</span></div>
                <p class="text-gray-600 dark:text-gray-300">${p.noidung}</p>
            </div>
        `;
    });
}

// Họp Chi Bộ (3000 ký tự, tải tài liệu xem trực tiếp)
let tempHopFile = "";
function openHopModal() { document.getElementById('hop-modal').classList.remove('hidden'); }
function closeHopModal() { document.getElementById('hop-modal').classList.add('hidden'); tempHopFile = ""; }
function submitHopChiBo(e) {
    e.preventDefault();
    const title = document.getElementById('hop-title').value.trim();
    const content = document.getElementById('hop-content').value.trim();
    const fileInput = document.getElementById('hop-file');

    let saveRecord = () => {
        db.hopChiBo.unshift({
            id: Date.now(),
            title,
            content,
            file: tempHopFile,
            fileName: fileInput.files[0] ? fileInput.files[0].name : "",
            author: currentUser ? currentUser.username : "Cán bộ"
        });
        saveDB(); closeHopModal(); renderHopChiBo(); alert("Đã đăng lịch họp và tài liệu!"); e.target.reset();
    };

    if(fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            tempHopFile = evt.target.result;
            saveRecord();
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        saveRecord();
    }
}
function renderHopChiBo() {
    const list = document.getElementById('hop-chibo-list');
    if(!list) return;
    list.innerHTML = '';
    db.hopChiBo.forEach(h => {
        let fileHtml = h.file ? `<a href="${h.file}" download="${h.fileName || 'tai-lieu.pdf'}" class="inline-flex items-center gap-1.5 text-xs bg-teal-100 text-teal-800 font-bold px-3 py-1.5 rounded-lg mt-2"><i class="fa-solid fa-file-arrow-down"></i> Tải tài liệu xem trực tiếp (${h.fileName || 'File'})</a>` : '';
        list.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border text-xs space-y-2 shadow-sm">
                <div class="flex justify-between text-gray-400"><span>${h.author}</span></div>
                <h4 class="font-bold text-sm text-travelPrimary">${h.title}</h4>
                <p class="text-gray-600 dark:text-gray-300 whitespace-pre-line">${h.content}</p>
                ${fileHtml}
            </div>
        `;
    });
}

// Biểu Quyết
function openBqModal() { document.getElementById('bq-modal').classList.remove('hidden'); }
function closeBqModal() { document.getElementById('bq-modal').classList.add('hidden'); }
function submitBieuQuyet(e) {
    e.preventDefault();
    db.bieuQuyet.unshift({ id: Date.now(), title: document.getElementById('bq-title').value.trim(), options: document.getElementById('bq-options').value.split(',').map(o => o.trim()) });
    saveDB(); closeBqModal(); renderBieuQuyet(); alert("Đã phát động biểu quyết!"); e.target.reset();
}
function renderBieuQuyet() {
    const list = document.getElementById('bieu-quyet-list');
    if(!list) return;
    list.innerHTML = '';
    db.bieuQuyet.forEach(b => {
        list.innerHTML += `<div class="p-4 bg-white dark:bg-gray-800 rounded-2xl border text-xs shadow-sm"><h4 class="font-bold text-travelPrimary">${b.title}</h4><p class="text-gray-500 mt-1">Phương án: ${b.options.join(', ')}</p></div>`;
    });
}

// Chat (Bắt buộc nhập tên)
function sendChatMessage(e) {
    e.preventDefault();
    const name = document.getElementById('chat-input-name').value.trim();
    const msg = document.getElementById('chat-input-msg').value.trim();
    if(!name) { alert("Bắt buộc phải nhập tên mới được chat!"); return; }
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

function searchThuTucAI() {
    const query = document.getElementById('tt-search-input').value.trim();
    const box = document.getElementById('ai-result-box');
    if(!query) { alert("Nhập tên thủ tục!"); return; }
    box.classList.remove('hidden');
    box.innerHTML = `<p class="animate-pulse">AI đang tìm kiếm...</p>`;
    setTimeout(() => {
        box.innerHTML = `<p class="font-bold text-travelPrimary">Kết quả cho: "${query}"</p><p>1. Chuẩn bị giấy tờ gốc.</p><p>2. Nộp tại bộ phận một cửa.</p>`;
    }, 600);
}
function officerUploadThuTuc(e) {
    e.preventDefault();
    db.thuTucDocs.unshift({ id: Date.now(), title: document.getElementById('off-tt-title').value.trim(), uploader: currentUser ? currentUser.username : "Cán bộ" });
    saveDB(); renderThuTucDocs(); e.target.reset(); alert("Đã tải lên!");
}
function renderThuTucDocs() {
    const list = document.getElementById('thutuc-doc-list');
    if(!list) return;
    list.innerHTML = '';
    db.thuTucDocs.forEach(d => {
        list.innerHTML += `<div class="p-2.5 bg-white dark:bg-gray-800 rounded-xl border text-xs flex justify-between"><span>${d.title}</span><span class="text-gray-400">${d.uploader}</span></div>`;
    });
}

function toggleDarkMode() { document.documentElement.classList.toggle('dark'); }
function openContactModal() { document.getElementById('contact-modal').classList.remove('hidden'); }
function closeContactModal() { document.getElementById('contact-modal').classList.add('hidden'); }
