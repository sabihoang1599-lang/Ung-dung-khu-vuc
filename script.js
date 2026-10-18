let currentUser = JSON.parse(localStorage.getItem('thonxom_logged_user')) || null;
let currentAreaKey = localStorage.getItem('thonxom_current_area') || 'Thôn Xóm Bình An';

if (currentUser && currentUser.type !== 'chu' && currentUser.type !== 'andanh' && currentUser.khuVuc) {
    currentAreaKey = currentUser.khuVuc;
}

function getAreaData(key) {
    let data = localStorage.getItem('thonxom_data_' + key);
    if (!data) {
        let defaultData = {
            khuVuc: key,
            phuongTinh: "Phường An Khánh, TP. Cần Thơ",
            avatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=100",
            banner: "",
            ownerEmail: "admin.thonxom@gmail.com",
            accounts: [
                { id: 1, hoten: "Tài Khoản Chủ 1", username: "Taikhoanchu", password: "@Taikhoanchu26", email: "chu1@gmail.com", type: "chu", sdt: "0909000000", khuVuc: "Hệ Thống" },
                { id: 2, hoten: "Tài Khoản Chủ 2 Ẩn", username: "Taikhoanandanh", password: "@Taikhoanandanh26", email: "chu2@gmail.com", type: "andanh", sdt: "", khuVuc: "Hệ Thống" }
            ],
            contacts: [],
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
    let parsed = JSON.parse(data);
    if(!parsed.phuongTinh) parsed.phuongTinh = "Phường An Khánh, TP. Cần Thơ";
    if(!parsed.avatar) parsed.avatar = "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=100";
    if(!parsed.banner) parsed.banner = "";
    if(!parsed.ownerEmail) parsed.ownerEmail = "admin.thonxom@gmail.com";
    
    let hasChu1 = parsed.accounts.some(a => a.username === 'Taikhoanchu');
    if(!hasChu1) {
        parsed.accounts.unshift({ id: 1, hoten: "Tài Khoản Chủ 1", username: "Taikhoanchu", password: "@Taikhoanchu26", email: "chu1@gmail.com", type: "chu", sdt: "0909000000", khuVuc: "Hệ Thống" });
    }
    let hasChu2 = parsed.accounts.some(a => a.username === 'Taikhoanandanh');
    if(!hasChu2) {
        parsed.accounts.push({ id: 2, hoten: "Tài Khoản Chủ 2 Ẩn", username: "Taikhoanandanh", password: "@Taikhoanandanh26", email: "chu2@gmail.com", type: "andanh", sdt: "", khuVuc: "Hệ Thống" });
    } else {
        let c2 = parsed.accounts.find(a => a.username === 'Taikhoanandanh');
        if(c2) c2.sdt = ""; // Xóa sạch số điện thoại của tài khoản chủ ẩn
    }
    return parsed;
}

let db = getAreaData(currentAreaKey);

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
    initChuMonitorSelect();
});

function initAppConfig() {
    document.getElementById('display-khu-vuc').innerText = db.khuVuc;
    document.getElementById('display-phuong-tinh').innerText = db.phuongTinh || "Phường An Khánh, TP. Cần Thơ";
    if(db.avatar) {
        document.getElementById('header-avatar').src = db.avatar;
    }
    if(db.banner) {
        let header = document.getElementById('app-header-bg');
        header.style.backgroundImage = `url('${db.banner}')`;
    }
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

function validatePassword(pwd) {
    return /[A-Z]/.test(pwd) && /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
}

function validateUsername(usr) {
    return /^[A-Z][a-zA-Z0-9]*$/.test(usr);
}

function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('inline-login-username') ? document.getElementById('inline-login-username').value.trim() : document.getElementById('login-username').value.trim();
    const p = document.getElementById('inline-login-password') ? document.getElementById('inline-login-password').value.trim() : document.getElementById('login-password').value.trim();

    let found = null;
    let allKeys = Object.keys(localStorage).filter(k => k.startsWith('thonxom_data_'));
    for(let k of allKeys) {
        let areaData = JSON.parse(localStorage.getItem(k));
        let acc = areaData.accounts.find(a => a.username === u && a.password === p);
        if(acc) {
            found = acc;
            currentAreaKey = areaData.khuVuc;
            localStorage.setItem('thonxom_current_area', currentAreaKey);
            db = areaData;
            break;
        }
    }

    if(found) {
        currentUser = found;
        localStorage.setItem('thonxom_logged_user', JSON.stringify(currentUser));
        closeLoginModal();
        checkRolePermissions();
        renderAccountsTable();
        renderSidebarContacts();
        initAppConfig();
        alert("Đăng nhập thành công!");
        location.reload();
    } else {
        alert("Sai tên đăng nhập hoặc mật khẩu!");
    }
}

function handleLogout() {
    localStorage.removeItem('thonxom_logged_user');
    currentUser = null;
    alert("Đã đăng xuất thành công!");
    location.reload();
}

function openLoginModal() { document.getElementById('login-modal').classList.remove('hidden'); }
function closeLoginModal() { document.getElementById('login-modal').classList.add('hidden'); }

let generatedForgotOtp = "";
function openForgotModal() {
    closeLoginModal();
    document.getElementById('forgot-modal').classList.remove('hidden');
    document.getElementById('forgot-step-1').classList.remove('hidden');
    document.getElementById('forgot-step-2').classList.add('hidden');
}
function closeForgotModal() { document.getElementById('forgot-modal').classList.add('hidden'); }

function sendForgotOtp() {
    const usr = document.getElementById('forgot-username').value.trim();
    const email = document.getElementById('forgot-email').value.trim();
    if(!usr || !email) { alert("Vui lòng nhập đầy đủ tên đăng nhập và email!"); return; }

    let targetAcc = null;
    let allKeys = Object.keys(localStorage).filter(k => k.startsWith('thonxom_data_'));
    for(let k of allKeys) {
        let areaData = JSON.parse(localStorage.getItem(k));
        let acc = areaData.accounts.find(a => a.username === usr && (a.email === email || a.type === 'chu' || a.type === 'andanh' || a.type === 'cap1'));
        if(acc) {
            targetAcc = acc;
            break;
        }
    }

    if(!targetAcc) { alert("Không tìm thấy tài khoản hoặc email không khớp!"); return; }

    generatedForgotOtp = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`[MÔ PHỎNG GỬI EMAIL] Mã OTP khôi phục gửi đến ${email} là: ${generatedForgotOtp}`);
    document.getElementById('forgot-step-1').classList.add('hidden');
    document.getElementById('forgot-step-2').classList.remove('hidden');
}

function confirmResetPassword() {
    const usr = document.getElementById('forgot-username').value.trim();
    const otp = document.getElementById('forgot-otp-code').value.trim();
    const newPwd = document.getElementById('forgot-new-pwd').value.trim();

    if(otp !== generatedForgotOtp) { alert("Mã OTP không chính xác!"); return; }
    if(!validatePassword(newPwd)) { alert("Mật khẩu mới phải chứa ít nhất 1 chữ In hoa và 1 ký tự đặc biệt!"); return; }

    let allKeys = Object.keys(localStorage).filter(k => k.startsWith('thonxom_data_'));
    let updated = false;
    for(let k of allKeys) {
        let areaData = JSON.parse(localStorage.getItem(k));
        let acc = areaData.accounts.find(a => a.username === usr);
        if(acc) {
            acc.password = newPwd;
            localStorage.setItem(k, JSON.stringify(areaData));
            updated = true;
            break;
        }
    }

    if(updated) {
        alert("Khôi phục mật khẩu thành công! Hãy đăng nhập lại.");
        closeForgotModal();
        openLoginModal();
    } else {
        alert("Có lỗi xảy ra!");
    }
}

function updateMyCredentials(e) {
    e.preventDefault();
    if(!currentUser) return;
    const newUsr = document.getElementById('my-new-username').value.trim();
    const newPwd = document.getElementById('my-new-password').value.trim();

    if(!validateUsername(newUsr)) { alert("Tên đăng nhập phải viết liền không dấu và viết hoa chữ cái đầu!"); return; }
    if(!validatePassword(newPwd)) { alert("Mật khẩu phải chứa ít nhất 1 chữ In hoa và 1 ký tự đặc biệt!"); return; }

    if(currentUser.username === 'Taikhoanandanh') {
        alert("Tài khoản Chủ 2 Ẩn cố định không được đổi tên đăng nhập và mật khẩu!");
        return;
    }

    currentUser.username = newUsr;
    currentUser.password = newPwd;

    let accInDb = db.accounts.find(a => a.id === currentUser.id || a.type === currentUser.type);
    if(accInDb) {
        accInDb.username = newUsr;
        accInDb.password = newPwd;
    }

    saveDB();
    localStorage.setItem('thonxom_logged_user', JSON.stringify(currentUser));
    alert("Đã cập nhật thông tin thành công và đồng bộ tới hệ thống các tài khoản Chủ!");
    location.reload();
}

let handoverOtpCode = "";
function sendHandoverOtp() {
    const email = document.getElementById('user-email-input').value.trim();
    if(!email) { alert("Vui lòng nhập email mới cần đổi!"); return; }
    handoverOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`[MÔ PHỎNG XÁC THỰC OTP EMAIL] Mã OTP gửi đến email mới (${email}) là: ${handoverOtpCode}`);
}

function verifyHandoverOtp(e) {
    e.preventDefault();
    const email = document.getElementById('user-email-input').value.trim();
    const otp = document.getElementById('handover-otp-input').value.trim();

    if(otp !== handoverOtpCode) { alert("Mã OTP không chính xác!"); return; }

    currentUser.email = email;
    let accInDb = db.accounts.find(a => a.id === currentUser.id);
    if(accInDb) accInDb.email = email;

    saveDB();
    localStorage.setItem('thonxom_logged_user', JSON.stringify(currentUser));
    alert("Đã xác thực OTP thành công và cập nhật email mới cho tài khoản!");
    location.reload();
}

function checkRolePermissions() {
    const addNewsContainer = document.getElementById('action-add-news-container');
    const addHopContainer = document.getElementById('action-add-hop-container');
    const addBqContainer = document.getElementById('action-add-bq-container');
    const officerUploadTt = document.getElementById('officer-upload-thutuc-card');
    const chuCreateAreaBox = document.getElementById('chu-create-area-box');
    const chuDeleteAreaBox = document.getElementById('chu-delete-area-box');
    const chuMonitorBox = document.getElementById('chu-monitor-box');
    const accountCreateSec = document.getElementById('account-create-section');
    const cap1CustomBox = document.getElementById('cap1-custom-area-box');
    const handoverSec = document.getElementById('handover-section');
    const authActionContainer = document.getElementById('auth-action-container');
    const currentUserBadge = document.getElementById('current-user-badge');
    const contactAddSec = document.getElementById('contact-add-section');
    const btnBqNoiBo = document.getElementById('btn-bq-noibo');
    const changeCredentialsBox = document.getElementById('change-credentials-box');
    const loggedOutManagerView = document.getElementById('logged-out-manager-view');
    const loggedInManagerView = document.getElementById('logged-in-manager-view');

    if(addNewsContainer) addNewsContainer.innerHTML = '';
    if(addHopContainer) addHopContainer.innerHTML = '';
    if(addBqContainer) addBqContainer.innerHTML = '';
    if(officerUploadTt) officerUploadTt.classList.add('hidden');
    if(chuCreateAreaBox) chuCreateAreaBox.classList.add('hidden');
    if(chuDeleteAreaBox) chuDeleteAreaBox.classList.add('hidden');
    if(chuMonitorBox) chuMonitorBox.classList.add('hidden');
    if(accountCreateSec) accountCreateSec.classList.add('hidden');
    if(cap1CustomBox) cap1CustomBox.classList.add('hidden');
    if(handoverSec) handoverSec.classList.add('hidden');
    if(contactAddSec) contactAddSec.classList.add('hidden');
    if(btnBqNoiBo) btnBqNoiBo.classList.add('hidden');
    if(changeCredentialsBox) changeCredentialsBox.classList.remove('hidden');

    if(currentUser) {
        if(loggedOutManagerView) loggedOutManagerView.classList.add('hidden');
        if(loggedInManagerView) loggedInManagerView.classList.remove('hidden');

        if(authActionContainer) {
            authActionContainer.innerHTML = `
                <button onclick="handleLogout()" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow transition flex items-center gap-1" title="Đăng xuất">
                    <i class="fa-solid fa-right-from-bracket"></i> Đăng Xuất
                </button>
            `;
        }

        let roleName = currentUser.type === 'chu' ? 'Tài Khoản Chủ 1' : (currentUser.type === 'andanh' ? 'Tài Khoản Chủ 2 Ẩn' : (currentUser.type === 'cap1' ? 'Cấp 1 (Cán bộ)' : 'Cấp 2 (Đảng viên)'));
        if(currentUserBadge) currentUserBadge.innerHTML = `Xin chào: <b>${currentUser.hoten}</b> (${roleName}) - Khu vực: <b>${db.khuVuc}</b>`;

        if(currentUser.type === 'chu') {
            if(chuCreateAreaBox) chuCreateAreaBox.classList.remove('hidden');
            if(chuDeleteAreaBox) chuDeleteAreaBox.classList.remove('hidden');
            if(chuMonitorBox) chuMonitorBox.classList.remove('hidden');
            if(handoverSec) handoverSec.classList.remove('hidden');
        } else if(currentUser.type === 'andanh') {
            if(chuCreateAreaBox) chuCreateAreaBox.classList.remove('hidden');
            if(chuDeleteAreaBox) chuDeleteAreaBox.classList.remove('hidden');
            if(chuMonitorBox) chuMonitorBox.classList.remove('hidden');
            if(handoverSec) handoverSec.classList.remove('hidden');
            if(changeCredentialsBox) changeCredentialsBox.classList.add('hidden');
        } else if(currentUser.type === 'cap1') {
            if(officerUploadTt) officerUploadTt.classList.remove('hidden');
            if(accountCreateSec) accountCreateSec.classList.remove('hidden');
            if(cap1CustomBox) cap1CustomBox.classList.remove('hidden');
            if(handoverSec) handoverSec.classList.remove('hidden');
            if(contactAddSec) contactAddSec.classList.remove('hidden');
            if(btnBqNoiBo) btnBqNoiBo.classList.remove('hidden');
            if(addNewsContainer) addNewsContainer.innerHTML = `<button onclick="openNewsModal()" class="bg-travelPrimary text-white text-xs px-3 py-1.5 rounded-full font-bold shadow"><i class="fa-solid fa-plus"></i> Đăng Bài</button>`;
            if(addHopContainer) addHopContainer.innerHTML = `<button onclick="openHopModal()" class="bg-travelPrimary text-white text-xs px-3 py-1.5 rounded-full font-bold shadow"><i class="fa-solid fa-plus"></i> Tạo Lịch Họp</button>`;
            if(addBqContainer) addBqContainer.innerHTML = `<button onclick="openBqModal()" class="bg-travelAccent text-white text-xs px-3 py-1.5 rounded-full font-bold shadow"><i class="fa-solid fa-plus"></i> Tạo Biểu Quyết</button>`;

            document.getElementById('preview-avatar-box').src = db.avatar;
            if(db.banner) {
                let bannerPrev = document.getElementById('preview-banner-box');
                bannerPrev.style.backgroundImage = `url('${db.banner}')`;
                bannerPrev.classList.remove('hidden');
            }
        } else if(currentUser.type === 'cap2') {
            if(btnBqNoiBo) btnBqNoiBo.classList.remove('hidden');
        }
    } else {
        if(loggedOutManagerView) loggedOutManagerView.classList.remove('hidden');
        if(loggedInManagerView) loggedInManagerView.classList.add('hidden');

        if(authActionContainer) {
            authActionContainer.innerHTML = `
                <button onclick="openLoginModal()" class="bg-white text-travelPrimary px-3 py-1.5 rounded-full text-xs font-bold shadow transition flex items-center gap-1">
                    <i class="fa-solid fa-user-lock"></i> <span>Đăng Nhập</span>
                </button>
            `;
        }
        if(activeBqTab === 'noibo') {
            switchBqTab('congdong');
        }
    }
    renderBieuQuyet();
}

function saveCap1Customization(e) {
    e.preventDefault();
    const avatarFile = document.getElementById('custom-avatar-file').files[0];
    const bannerFile = document.getElementById('custom-banner-file').files[0];

    let processSave = () => {
        saveDB();
        alert("Đã cập nhật thành công!");
        location.reload();
    };

    let filesProcessed = 0;
    let totalFiles = (avatarFile ? 1 : 0) + (bannerFile ? 1 : 0);

    if (totalFiles === 0) {
        alert("Vui lòng chọn hình ảnh để tải lên!");
        return;
    }

    if (avatarFile) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            db.avatar = evt.target.result;
            filesProcessed++;
            if (filesProcessed === totalFiles) processSave();
        };
        reader.readAsDataURL(avatarFile);
    }

    if (bannerFile) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            db.banner = evt.target.result;
            filesProcessed++;
            if (filesProcessed === totalFiles) processSave();
        };
        reader.readAsDataURL(bannerFile);
    }
}

function initChuMonitorSelect() {
    const select = document.getElementById('chu-area-select');
    if(!select) return;
    select.innerHTML = '';

    let allKeys = Object.keys(localStorage).filter(k => k.startsWith('thonxom_data_'));
    allKeys.forEach(k => {
        let areaData = JSON.parse(localStorage.getItem(k));
        let opt = document.createElement('option');
        opt.value = areaData.khuVuc;
        opt.innerText = areaData.khuVuc;
        if(areaData.khuVuc === db.khuVuc) opt.selected = true;
        select.appendChild(opt);
    });
}

function switchChuMonitorArea(areaName) {
    currentAreaKey = areaName;
    localStorage.setItem('thonxom_current_area', currentAreaKey);
    db = getAreaData(currentAreaKey);
    location.reload();
}

function chuAssignAreaAndAccount(e) {
    e.preventDefault();
    const newAreaName = document.getElementById('chu-new-area-name').value.trim();
    const newPhuongTinh = document.getElementById('chu-new-phuong-tinh').value.trim();
    const hoten = document.getElementById('chu-acc-hoten').value.trim();
    const username = document.getElementById('chu-acc-username').value.trim();
    const email = document.getElementById('chu-acc-email').value.trim();
    const sdt = document.getElementById('chu-acc-sdt').value.trim();
    const password = document.getElementById('chu-acc-password').value.trim();

    if(!newAreaName) { alert("Vui lòng nhập tên khu vực!"); return; }
    if(!validateUsername(username)) {
        alert("Tên đăng nhập phải viết liền không dấu và viết hoa chữ cái đầu!"); return;
    }
    if(!validatePassword(password)) {
        alert("Mật khẩu phải chứa ít nhất 1 chữ In hoa và 1 ký tự đặc biệt!"); return;
    }

    let newAreaData = getAreaData(newAreaName);
    newAreaData.phuongTinh = newPhuongTinh;
    newAreaData.accounts.push({
        id: Date.now(),
        hoten,
        username,
        password,
        email,
        type: "cap1",
        sdt,
        khuVuc: newAreaName
    });
    localStorage.setItem('thonxom_data_' + newAreaName, JSON.stringify(newAreaData));
    alert(`Đã tạo khu vực "${newAreaName}" thành công!`);
    location.reload();
}

function confirmDeleteCurrentArea() {
    if(!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn khu vực "${db.khuVuc}" không?`)) return;
    localStorage.removeItem('thonxom_data_' + currentAreaKey);
    
    let allKeys = Object.keys(localStorage).filter(k => k.startsWith('thonxom_data_'));
    if(allKeys.length > 0) {
        let firstArea = JSON.parse(localStorage.getItem(allKeys[0])).khuVuc;
        localStorage.setItem('thonxom_current_area', firstArea);
    } else {
        localStorage.setItem('thonxom_current_area', 'Thôn Xóm Bình An');
    }
    alert("Đã xóa khu vực thành công!");
    location.reload();
}

function createNewAccount(e) {
    e.preventDefault();
    if(!currentUser || currentUser.type !== 'cap1') {
        alert("Chỉ tài khoản Cấp 1 mới có quyền cấp phát tài khoản trong khu vực này!"); return;
    }
    const hoten = document.getElementById('acc-hoten').value.trim();
    const username = document.getElementById('acc-chucvu').value.trim();
    const email = document.getElementById('acc-email').value.trim();
    const sdt = document.getElementById('acc-sdt').value.trim();
    const password = document.getElementById('acc-password').value.trim();
    const type = document.getElementById('acc-type').value;

    if(!validateUsername(username)) {
        alert("Tên đăng nhập phải viết liền không dấu và viết hoa chữ cái đầu!"); return;
    }
    if(!validatePassword(password)) {
        alert("Mật khẩu phải chứa ít nhất 1 chữ In hoa và 1 ký tự đặc biệt!"); return;
    }

    db.accounts.push({ id: Date.now(), hoten, username, password, email, type, sdt, khuVuc: db.khuVuc });
    saveDB();
    renderAccountsTable();
    alert("Cấp tài khoản thành công!");
    e.target.reset();
}

function renderAccountsTable() {
    const container = document.getElementById('accounts-table-body');
    if(!container) return;
    container.innerHTML = '';
    
    let isOwner = currentUser && (currentUser.type === 'chu' || currentUser.type === 'andanh');
    let visibleAccounts = db.accounts.filter(acc => acc.type !== 'andanh');
    if(!isOwner) {
        visibleAccounts = visibleAccounts.filter(acc => acc.type !== 'chu');
    }

    if(visibleAccounts.length === 0) {
        container.innerHTML = `<p class="text-gray-400">Chưa có thành viên nào.</p>`;
        return;
    }

    visibleAccounts.forEach(acc => {
        let levelBadge = acc.type === 'chu' ? '<span class="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">Chủ 1</span>' : (acc.type === 'cap1' ? '<span class="bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">Cấp 1 (Cán bộ)</span>' : '<span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Cấp 2 (Đảng viên)</span>');
        let passwordDisplay = isOwner ? `| Mật khẩu: <b class="text-travelPrimary">${acc.password}</b>` : '';
        let emailDisplay = acc.email ? `| Email: ${acc.email}` : '';
        let sdtDisplay = acc.sdt ? `SĐT: ${acc.sdt}` : '';
        container.innerHTML += `
            <div class="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border text-xs">
                <div>
                    <p class="font-bold">${acc.hoten} (${acc.username}) ${levelBadge}</p>
                    <p class="text-gray-500 text-[11px]">${sdtDisplay} ${emailDisplay} ${passwordDisplay}</p>
                </div>
                ${(isOwner && acc.type !== 'chu') ? `<button onclick="deleteAccount(${acc.id})" class="text-red-500"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>
        `;
    });
}

function deleteAccount(id) {
    db.accounts = db.accounts.filter(a => a.id !== id);
    saveDB();
    renderAccountsTable();
}

function renderSidebarContacts() {
    const container = document.getElementById('sidebar-contacts-list');
    const headerEmergency = document.getElementById('header-emergency-buttons');
    if(!container) return;
    container.innerHTML = '';
    if(headerEmergency) headerEmergency.innerHTML = '';

    if(db.contacts.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-center py-2">Chưa có danh bạ.</p>`;
        return;
    }

    db.contacts.forEach(c => {
        container.innerHTML += `
            <div class="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border">
                <div><p class="font-bold">${c.dept}</p><p class="text-gray-500 text-[11px]">${c.person} - ${c.phone}</p></div>
                <div class="flex items-center gap-2">
                    <a href="tel:${c.phone}" class="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-phone"></i> Gọi</a>
                    ${currentUser && currentUser.type === 'cap1' ? `<button onclick="deleteContact(${c.id})" class="text-red-500"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
            </div>
        `;
    });
}

function saveNewContact(e) {
    e.preventDefault();
    if(db.contacts.length >= 10) {
        alert("Tối đa 10 mục danh bạ!"); return;
    }
    const dept = document.getElementById('ct-dept').value.trim();
    const person = document.getElementById('ct-person').value.trim();
    const phone = document.getElementById('ct-phone').value.trim();

    db.contacts.push({ id: Date.now(), dept, person, phone });
    saveDB();
    renderSidebarContacts();
    alert("Đã thêm danh bạ!");
    e.target.reset();
}

function deleteContact(id) {
    db.contacts = db.contacts.filter(c => c.id !== id);
    saveDB();
    renderSidebarContacts();
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
    if(currentUser && currentUser.type === 'cap2') {
        alert("Cấp 2 chỉ có quyền xem!"); return;
    }
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
    if(tempPaImages.length < 1) { alert("Bắt buộc có ít nhất 1 hình ảnh!"); return; }
    db.phanAnh.unshift({
        id: Date.now(),
        hoten: document.getElementById('pa-hoten').value.trim(),
        sdt: document.getElementById('pa-sdt').value.trim(),
        diachi: document.getElementById('pa-diachi').value.trim(),
        noidung: document.getElementById('pa-noidung').value.trim(),
        images: [...tempPaImages],
        status: "Đang chờ",
        date: new Date().toLocaleDateString('vi-VN')
    });
    saveDB(); renderPhanAnh(); e.target.reset(); tempPaImages = []; document.getElementById('pa-image-preview').innerHTML = ''; alert("Đã gửi phản ánh!");
}
function updatePhanAnhStatus(id, newStatus) {
    let item = db.phanAnh.find(p => p.id === id);
    if(item) {
        item.status = newStatus;
        saveDB();
        renderPhanAnh();
    }
}
function renderPhanAnh() {
    const container = document.getElementById('phan-anh-list-container');
    if(!container) return;
    container.innerHTML = '';
    db.phanAnh.forEach(p => {
        let imgsHtml = '';
        if(p.images) {
            p.images.forEach(img => {
                imgsHtml += `<img src="${img}" class="w-14 h-14 object-cover rounded-xl border mt-1">`;
            });
        }

        let statusColor = p.status === 'Đang chờ' ? 'text-amber-600 bg-amber-50' : (p.status === 'Đang xử lý' ? 'text-blue-600 bg-blue-50' : 'text-teal-600 bg-teal-50');
        let officerActions = '';
        if(currentUser && currentUser.type === 'cap1') {
            officerActions = `
                <div class="flex gap-1 mt-2 pt-2 border-t">
                    <button onclick="updatePhanAnhStatus(${p.id}, 'Đang tiếp nhận')" class="px-2 py-1 bg-gray-100 rounded text-[10px] font-semibold">Tiếp Nhận</button>
                    <button onclick="updatePhanAnhStatus(${p.id}, 'Đang xử lý')" class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold">Đang Xử Lý</button>
                    <button onclick="updatePhanAnhStatus(${p.id}, 'Đã xử lý')" class="px-2 py-1 bg-teal-100 text-teal-800 rounded text-[10px] font-semibold">Đã Xử Lý</button>
                </div>
            `;
        }

        container.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl border text-xs space-y-1.5 shadow-sm">
                <div class="flex justify-between font-bold">
                    <span>${p.hoten} (${p.sdt})</span>
                    <span class="px-2 py-0.5 rounded font-bold ${statusColor}">${p.status}</span>
                </div>
                <p class="text-gray-600 dark:text-gray-300">${p.noidung}</p>
                <div class="flex gap-1.5 flex-wrap">${imgsHtml}</div>
                <p class="text-[10px] text-gray-400">Địa chỉ: ${p.diachi} | Ngày: ${p.date}</p>
                ${officerActions}
            </div>
        `;
    });
}

let tempHopFile = "";
function openHopModal() { document.getElementById('hop-modal').classList.remove('hidden'); }
function closeHopModal() { document.getElementById('hop-modal').classList.add('hidden'); tempHopFile = ""; }
function submitHopChiBo(e) {
    e.preventDefault();
    if(currentUser && currentUser.type === 'cap2') {
        alert("Cấp 2 chỉ có quyền xem!"); return;
    }
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
        saveDB(); closeHopModal(); renderHopChiBo(); alert("Đã đăng lịch họp!"); e.target.reset();
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
        let fileHtml = h.file ? `<a href="${h.file}" download="${h.fileName || 'tai-lieu.pdf'}" class="inline-flex items-center gap-1.5 text-xs bg-teal-100 text-teal-800 font-bold px-3 py-1.5 rounded-lg mt-2"><i class="fa-solid fa-file-arrow-down"></i> Tải tài liệu (${h.fileName || 'File'})</a>` : '';
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

let activeBqTab = 'congdong';
function switchBqTab(tab) {
    if(tab === 'noibo' && (!currentUser || (currentUser.type !== 'cap1' && currentUser.type !== 'cap2' && currentUser.type !== 'chu' && currentUser.type !== 'andanh'))) {
        alert("Chỉ Cấp 1 và Cấp 2 mới có quyền xem nội bộ!");
        return; 
    }
    activeBqTab = tab;
    document.getElementById('btn-bq-congdong').className = tab === 'congdong' ? "px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800" : "px-3 py-1 rounded-full text-xs font-bold text-gray-500";
    let btnNoiBo = document.getElementById('btn-bq-noibo');
    if(btnNoiBo && currentUser && (currentUser.type === 'cap1' || currentUser.type === 'cap2' || currentUser.type === 'chu' || currentUser.type === 'andanh')) {
        btnNoiBo.className = tab === 'noibo' ? "px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800" : "px-3 py-1 rounded-full text-xs font-bold text-gray-500";
    }
    renderBieuQuyet();
}

function openBqModal() { document.getElementById('bq-modal').classList.remove('hidden'); }
function closeBqModal() { document.getElementById('bq-modal').classList.add('hidden'); }
function submitBieuQuyet(e) {
    e.preventDefault();
    if(currentUser && currentUser.type === 'cap2') {
        alert("Cấp 2 không có quyền tạo!"); return;
    }
    db.bieuQuyet.unshift({
        id: Date.now(),
        title: document.getElementById('bq-title').value.trim(),
        options: document.getElementById('bq-options').value.split(',').map(o => o.trim()),
        type: document.getElementById('bq-type').value,
        votes: {}
    });
    saveDB(); closeBqModal(); renderBieuQuyet(); alert("Đã phát động!"); e.target.reset();
}

function voteBieuQuyet(bqId, optionIndex) {
    let bq = db.bieuQuyet.find(b => b.id === bqId);
    if(bq) {
        if(bq.type === 'noibo' && (!currentUser || (currentUser.type !== 'cap1' && currentUser.type !== 'cap2' && currentUser.type !== 'chu' && currentUser.type !== 'andanh'))) {
            alert("Bạn không có quyền bình chọn nội bộ!");
            return;
        }
        if(!bq.votes) bq.votes = {};
        let voterName = currentUser ? currentUser.username : ('Khách_' + Math.floor(Math.random()*1000));
        bq.votes[voterName] = optionIndex;
        saveDB();
        renderBieuQuyet();
        alert("Đã bỏ phiếu!");
    }
}

function renderBieuQuyet() {
    const list = document.getElementById('bieu-quyet-list');
    if(!list) return;
    list.innerHTML = '';

    if(activeBqTab === 'noibo' && (!currentUser || (currentUser.type !== 'cap1' && currentUser.type !== 'cap2' && currentUser.type !== 'chu' && currentUser.type !== 'andanh'))) {
        activeBqTab = 'congdong';
    }

    let filtered = db.bieuQuyet.filter(b => {
        if(activeBqTab === 'congdong') return b.type === 'congdong' || !b.type;
        return b.type === 'noibo' && currentUser && (currentUser.type === 'cap1' || currentUser.type === 'cap2' || currentUser.type === 'chu' || currentUser.type === 'andanh');
    });

    if(filtered.length === 0) {
        list.innerHTML = `<p class="text-gray-400 text-center py-2">Không có biểu quyết.</p>`;
        return;
    }

    filtered.forEach(b => {
        let badge = b.type === 'noibo' ? '<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">Nội bộ</span>' : '<span class="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-[10px] font-bold">Cộng đồng</span>';
        
        let optionsHtml = '';
        b.options.forEach((opt, idx) => {
            let count = 0;
            if(b.votes) {
                Object.values(b.votes).forEach(val => { if(val === idx) count++; });
            }
            optionsHtml += `
                <button onclick="voteBieuQuyet(${b.id}, ${idx})" class="w-full text-left p-2 bg-gray-50 dark:bg-gray-900 hover:bg-teal-50 border rounded-xl flex justify-between items-center transition">
                    <span><i class="fa-regular fa-circle-check text-teal-600 mr-1.5"></i> ${opt}</span>
                    <span class="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full text-[10px] font-bold">${count} phiếu</span>
                </button>
            `;
        });

        list.innerHTML += `
            <div class="p-4 bg-white dark:bg-gray-800 rounded-2xl border text-xs shadow-sm space-y-2">
                <div class="flex justify-between items-center"><h4 class="font-bold text-travelPrimary text-sm">${b.title}</h4>${badge}</div>
                <div class="space-y-1.5">${optionsHtml}</div>
            </div>
        `;
    });
}

function sendChatMessage(e) {
    e.preventDefault();
    const name = document.getElementById('chat-input-name').value.trim();
    const msg = document.getElementById('chat-input-msg').value.trim();
    if(!name) { alert("Nhập tên!"); return; }
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

function searchOnlineThuTuc() {
    const query = document.getElementById('ai-tt-query').value.trim();
    const resultBox = document.getElementById('ai-search-result-box');
    if(!query) { alert("Nhập tên thủ tục!"); return; }

    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `<p class="animate-pulse text-teal-700 font-bold"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang tra cứu...</p>`;

    setTimeout(() => {
        resultBox.innerHTML = `
            <p class="font-bold text-travelPrimary"><i class="fa-solid fa-circle-check text-teal-600 mr-1"></i> Kết quả tra cứu: "${query}"</p>
            <div class="space-y-1 text-gray-700 dark:text-gray-300 mt-1">
                <p><b>1. Hồ sơ:</b> Giấy tờ tùy thân bản chính.</p>
                <p><b>2. Quy trình:</b> Nộp trực tuyến hoặc tại bộ phận một cửa.</p>
                <p><b>3. Thời gian:</b> 01 - 03 ngày làm việc.</p>
            </div>
        `;
    }, 800);
}

function officerUploadThuTuc(e) {
    e.preventDefault();
    if(currentUser && currentUser.type === 'cap2') {
        alert("Cấp 2 chỉ có quyền xem!"); return;
    }
    const title = document.getElementById('off-tt-title').value.trim();
    const fileInput = document.getElementById('off-tt-file');

    if(fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            db.thuTucDocs.unshift({
                id: Date.now(),
                title,
                file: evt.target.result,
                fileName: fileInput.files[0].name,
                uploader: currentUser ? currentUser.username : "Cán bộ"
            });
            saveDB(); renderThuTucDocs(); e.target.reset(); alert("Đã tải lên!");
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
}

function renderThuTucDocs(filter = "") {
    const list = document.getElementById('thutuc-doc-list');
    if(!list) return;
    list.innerHTML = '';

    let filtered = db.thuTucDocs.filter(d => d.title.toLowerCase().includes(filter.toLowerCase()));
    if(filtered.length === 0) {
        list.innerHTML = `<p class="text-gray-400 text-center py-2">Không tìm thấy biểu mẫu.</p>`;
        return;
    }

    filtered.forEach(d => {
        let downloadBtn = d.file ? `<a href="${d.file}" download="${d.fileName || 'bieu-mau.pdf'}" class="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded-lg"><i class="fa-solid fa-download"></i> Tải</a>` : '';
        list.innerHTML += `
            <div class="p-3 bg-white dark:bg-gray-800 rounded-xl border text-xs flex justify-between items-center">
                <div>
                    <p class="font-bold text-travelPrimary">${d.title}</p>
                    <p class="text-[10px] text-gray-400">Đăng bởi: ${d.uploader}</p>
                </div>
                ${downloadBtn}
            </div>
        `;
    });
}
function filterThuTucDocs() {
    renderThuTucDocs(document.getElementById('tt-search-input').value);
}

function toggleDarkMode() { document.documentElement.classList.toggle('dark'); }
function openContactModal() { document.getElementById('contact-modal').classList.remove('hidden'); }
function closeContactModal() { document.getElementById('contact-modal').classList.add('hidden'); }
