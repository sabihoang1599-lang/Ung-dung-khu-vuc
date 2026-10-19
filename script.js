import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs } from "firebase/firestore";

// Cấu hình Firebase của dự án
const firebaseConfig = {
  apiKey: "AIzaSyDMY3den170DUa3iyBPNhqoIMRa9NXbv8E",
  authDomain: "so-hoa-dau-lang-bdd8e.firebaseapp.com",
  projectId: "so-hoa-dau-lang-bdd8e",
  storageBucket: "so-hoa-dau-lang-bdd8e.firebasestorage.app",
  messagingSenderId: "906894359133",
  appId: "1:906894359133:web:b9285b9bb52c6c4bc4abb4"
};

const app = initializeApp(firebaseConfig);
const dbCloud = getFirestore(app);

let currentUser = null;
try {
    currentUser = JSON.parse(localStorage.getItem('thonxom_logged_user')) || null;
} catch(e) { currentUser = null; }

let currentAreaKey = localStorage.getItem('thonxom_current_area') || 'Thôn Xóm Bình An';
let portalRole = localStorage.getItem('thonxom_portal_role') || (currentUser ? 'chibo' : null);

if (currentUser && currentUser.type !== 'chu' && currentUser.type !== 'andanh' && currentUser.khuVuc) {
    currentAreaKey = currentUser.khuVuc;
}

// Biến chứa dữ liệu đồng bộ real-time từ Firestore
let db = {
    khuVuc: currentAreaKey,
    phuongTinh: "Phường An Khánh, TP. Cần Thơ",
    tinhThanh: "TP. Cần Thơ",
    phuongXa: "Phường An Khánh",
    avatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=100",
    banner: "",
    ownerEmail: "admin.thonxom@gmail.com",
    accounts: [
        { id: 1, hoten: "Tài Khoản Cấp Quyền khu vực", username: "Taikhoanchu", password: "@Taikhoanchu26", email: "chu1@gmail.com", type: "chu", sdt: "0909000000", khuVuc: "Hệ Thống" },
        { id: 2, hoten: "Tài Khoản Cấp Quyền khu vực", username: "Taikhoanandanh", password: "@Taikhoanandanh26", email: "chu2@gmail.com", type: "andanh", sdt: "", khuVuc: "Hệ Thống" }
    ],
    contacts: [
        { id: 101, dept: "Công An Xã / Phường", person: "Trực ban", phone: "02923000111" },
        { id: 102, dept: "Y Tế / Trạm Y Tế", person: "Bác sĩ trực", phone: "02923000222" }
    ],
    news: [],
    phanAnh: [],
    thuTucDocs: [],
    hopChiBo: [],
    bieuQuyet: [],
    chatMessages: []
};

// Hàm lưu dữ liệu lên Firestore
async function saveDB() {
    try {
        const docRef = doc(dbCloud, "thonxom_areas", currentAreaKey);
        await setDoc(docRef, db);
    } catch(e) {
        console.error("Lỗi khi lưu dữ liệu lên Firestore: ", e);
    }
}

// Lắng nghe dữ liệu thời gian thực (Real-time sync) từ Firestore
function initRealtimeSync() {
    const docRef = doc(dbCloud, "thonxom_areas", currentAreaKey);
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            db = docSnap.data();
        } else {
            // Nếu chưa có trên mây thì khởi tạo mặc định lên Firestore
            saveDB();
        }
        // Gọi lại các hàm render giao diện để cập nhật dữ liệu mới nhất
        initAppConfig();
        renderSidebarContacts();
        renderNews();
        renderPhanAnh();
        renderThuTucDocs();
        renderHopChiBo();
        renderBieuQuyet();
        renderChatMessages();
        renderAccountsTable();
    }, (error) => {
        console.error("Lỗi lắng nghe dữ liệu real-time: ", error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        portalRole = 'chibo';
        try {
            localStorage.setItem('thonxom_portal_role', 'chibo');
        } catch(e) {}
    }

    initRealtimeSync();
    checkRolePermissions();
    initChuMonitorSelects();
    applyPortalUIVisibility();
    setupLightboxGestures();
    
    if(!portalRole) {
        let roleModal = document.getElementById('welcome-role-modal');
        if(roleModal) roleModal.classList.remove('hidden');
    }
});

function applyPortalUIVisibility() {
    const btnHopChiBo = document.getElementById('btn-tab-hopchibo');
    const btnQuanLy = document.getElementById('tab-btn-quanly');
    const changeAreaBtn = document.getElementById('header-change-area-btn');
    const paNavButtons = document.getElementById('community-pa-nav-buttons');
    const subTabViet = document.getElementById('subtab-pa-viet');
    const subTabXem = document.getElementById('subtab-pa-xem');
    const officerFilterBar = document.getElementById('officer-pa-filter-bar');

    if (portalRole === 'congdong') {
        if(btnHopChiBo) btnHopChiBo.style.display = 'none';
        if(btnQuanLy) btnQuanLy.style.display = 'none';
        if(changeAreaBtn) changeAreaBtn.style.display = 'flex';
        if(paNavButtons) paNavButtons.classList.remove('hidden');
        if(officerFilterBar) officerFilterBar.classList.add('hidden');
        switchPaSubTab('viet');
    } else if (portalRole === 'chibo') {
        if(btnHopChiBo) btnHopChiBo.style.display = 'block';
        if(btnQuanLy) btnQuanLy.style.display = 'block';
        if(changeAreaBtn) changeAreaBtn.style.display = 'none';
        if(paNavButtons) paNavButtons.classList.add('hidden');
        if(subTabViet) subTabViet.classList.add('hidden');
        if(subTabXem) subTabXem.classList.remove('hidden');
        if(officerFilterBar) officerFilterBar.classList.remove('hidden');
        renderPhanAnh('all');
    }
}

let currentPaFilter = 'all';
function switchPaSubTab(tab) {
    const subTabViet = document.getElementById('subtab-pa-viet');
    const subTabXem = document.getElementById('subtab-pa-xem');
    const btnViet = document.getElementById('btn-pasub-viet');
    const btnXem = document.getElementById('btn-pasub-xem');
    const officerFilterBar = document.getElementById('officer-pa-filter-bar');

    if(tab === 'viet') {
        if(subTabViet) subTabViet.classList.remove('hidden');
        if(subTabXem) subTabXem.classList.add('hidden');
        if(btnViet) btnViet.className = "flex-1 bg-travelPrimary text-white font-bold py-2 rounded-xl text-xs shadow";
        if(btnXem) btnXem.className = "flex-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold py-2 rounded-xl text-xs transition";
        if(officerFilterBar) officerFilterBar.classList.add('hidden');
    } else {
        if(subTabViet) subTabViet.classList.add('hidden');
        if(subTabXem) subTabXem.classList.remove('hidden');
        if(btnViet) btnViet.className = "flex-1 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold py-2 rounded-xl text-xs transition";
        if(btnXem) btnXem.className = "flex-1 bg-travelPrimary text-white font-bold py-2 rounded-xl text-xs shadow";
        if(portalRole === 'chibo' && officerFilterBar) officerFilterBar.classList.remove('hidden');
        renderPhanAnh(currentPaFilter);
    }
}

function filterOfficerPaStatus(status) {
    currentPaFilter = status;
    document.querySelectorAll('#officer-pa-filter-bar button').forEach(b => {
        b.className = "px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold whitespace-nowrap";
    });
    if(status === 'all') document.getElementById('btn-pa-filter-all').className = "px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold whitespace-nowrap";
    else if(status === 'Đang chờ') document.getElementById('btn-pa-filter-cho').className = "px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold whitespace-nowrap";
    else if(status === 'Đang xử lý') document.getElementById('btn-pa-filter-dang').className = "px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold whitespace-nowrap";
    else if(status === 'Đã xử lý') document.getElementById('btn-pa-filter-da').className = "px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-bold whitespace-nowrap";

    renderPhanAnh(status);
}

function selectPortalRole(role) {
    portalRole = role;
    try {
        localStorage.setItem('thonxom_portal_role', role);
    } catch(e) {}
    
    const roleModal = document.getElementById('welcome-role-modal');
    if(roleModal) roleModal.classList.add('hidden');
    
    applyPortalUIVisibility();

    if(role === 'chibo') {
        const cbLoginModal = document.getElementById('chibo-login-modal');
        if(cbLoginModal) cbLoginModal.classList.remove('hidden');
    } else if(role === 'congdong') {
        openCommunityProvinceStep();
    }
}

function returnToPortalRoleSelection() {
    const cbLoginModal = document.getElementById('chibo-login-modal');
    if(cbLoginModal) cbLoginModal.classList.add('hidden');
    
    portalRole = null;
    try {
        localStorage.removeItem('thonxom_portal_role');
    } catch(e) {}

    const roleModal = document.getElementById('welcome-role-modal');
    if(roleModal) roleModal.classList.remove('hidden');
}

function backToWelcomeModal() {
    returnToPortalRoleSelection();
}

let commStep = 'tinh';
let selectedTinh = '';
let selectedPhuong = '';
let selectedTemporaryArea = '';

async function openCommunityProvinceStep() {
    commStep = 'tinh';
    selectedTinh = '';
    selectedPhuong = '';
    selectedTemporaryArea = '';
    
    const titleEl = document.getElementById('comm-modal-title');
    const subEl = document.getElementById('comm-modal-subtitle');
    const backBtn = document.getElementById('comm-back-btn');
    const exitBtn = document.getElementById('comm-exit-btn');
    const confirmBtn = document.getElementById('comm-confirm-btn');
    const commModal = document.getElementById('community-area-modal');
    
    if(titleEl) titleEl.innerText = "Chọn Tỉnh / Thành Phố";
    if(subEl) subEl.innerText = "Bước 1/3: Chọn tỉnh thành của bạn:";
    if(backBtn) backBtn.classList.add('hidden');
    if(exitBtn) exitBtn.classList.remove('hidden');
    if(confirmBtn) confirmBtn.classList.add('hidden');

    const listContainer = document.getElementById('community-selector-list');
    if(listContainer) {
        listContainer.innerHTML = `<p class="text-gray-400 text-center py-2">Đang tải danh sách khu vực...</p>`;
        try {
            const querySnapshot = await getDocs(collection(dbCloud, "thonxom_areas"));
            listContainer.innerHTML = '';
            let tinhSet = new Set();
            
            querySnapshot.forEach((doc) => {
                let areaData = doc.data();
                if(areaData && areaData.tinhThanh) {
                    tinhSet.add(areaData.tinhThanh);
                } else {
                    tinhSet.add("TP. Cần Thơ");
                }
            });

            if(tinhSet.size === 0) tinhSet.add("TP. Cần Thơ");

            tinhSet.forEach(tinh => {
                listContainer.innerHTML += `
                    <button onclick="chooseProvince('${tinh}')" class="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-teal-50 border rounded-2xl flex justify-between items-center transition font-bold text-gray-700 dark:text-gray-200">
                        <span><i class="fa-solid fa-map text-travelPrimary mr-2"></i> ${tinh}</span>
                        <i class="fa-solid fa-chevron-right text-xs text-gray-400"></i>
                    </button>
                `;
            });
        } catch(e) {
            listContainer.innerHTML = `<p class="text-red-500 text-center py-2">Lỗi tải dữ liệu từ mây.</p>`;
        }
    }

    if(commModal) commModal.classList.remove('hidden');
}

function exitToRoleModalFromProvince() {
    const commModal = document.getElementById('community-area-modal');
    if(commModal) commModal.classList.add('hidden');
    
    portalRole = null;
    try {
        localStorage.removeItem('thonxom_portal_role');
        localStorage.removeItem('thonxom_logged_user');
    } catch(e) {}
    
    const roleModal = document.getElementById('welcome-role-modal');
    if(roleModal) roleModal.classList.remove('hidden');
}

async function chooseProvince(tinh) {
    selectedTinh = tinh;
    commStep = 'phuong';
    
    const titleEl = document.getElementById('comm-modal-title');
    const subEl = document.getElementById('comm-modal-subtitle');
    const backBtn = document.getElementById('comm-back-btn');
    const exitBtn = document.getElementById('comm-exit-btn');
    const confirmBtn = document.getElementById('comm-confirm-btn');
    
    if(titleEl) titleEl.innerText = "Chọn Phường / Xã";
    if(subEl) subEl.innerText = `Bước 2/3: Chọn phường xã thuộc ${tinh}:`;
    if(backBtn) backBtn.classList.remove('hidden');
    if(exitBtn) exitBtn.classList.add('hidden');
    if(confirmBtn) confirmBtn.classList.add('hidden');

    const listContainer = document.getElementById('community-selector-list');
    if(listContainer) {
        listContainer.innerHTML = '';
        try {
            const querySnapshot = await getDocs(collection(dbCloud, "thonxom_areas"));
            let phuongSet = new Set();
            querySnapshot.forEach((doc) => {
                let areaData = doc.data();
                if(areaData && (areaData.tinhThanh || "TP. Cần Thơ") === tinh) {
                    phuongSet.add(areaData.phuongXa || "Phường An Khánh");
                }
            });

            phuongSet.forEach(phuong => {
                listContainer.innerHTML += `
                    <button onclick="choosePhuong('${phuong}')" class="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-teal-50 border rounded-2xl flex justify-between items-center transition font-bold text-gray-700 dark:text-gray-200">
                        <span><i class="fa-solid fa-location-pin text-travelPrimary mr-2"></i> ${phuong}</span>
                        <i class="fa-solid fa-chevron-right text-xs text-gray-400"></i>
                    </button>
                `;
            });
        } catch(e) {}
    }
}

async function choosePhuong(phuong) {
    selectedPhuong = phuong;
    commStep = 'khuvuc';
    
    const titleEl = document.getElementById('comm-modal-title');
    const subEl = document.getElementById('comm-modal-subtitle');
    const backBtn = document.getElementById('comm-back-btn');
    const exitBtn = document.getElementById('comm-exit-btn');
    const confirmBtn = document.getElementById('comm-confirm-btn');
    
    if(titleEl) titleEl.innerText = "Chọn Khu Vực / Thôn Xóm";
    if(subEl) subEl.innerText = `Bước 3/3: Chọn đúng thôn xóm của bạn:`;
    if(backBtn) backBtn.classList.remove('hidden');
    if(exitBtn) exitBtn.classList.add('hidden');
    if(confirmBtn) confirmBtn.classList.add('hidden');

    const listContainer = document.getElementById('community-selector-list');
    if(listContainer) {
        listContainer.innerHTML = '';
        try {
            const querySnapshot = await getDocs(collection(dbCloud, "thonxom_areas"));
            querySnapshot.forEach((doc) => {
                let areaData = doc.data();
                if(areaData && (areaData.tinhThanh || "TP. Cần Thơ") === selectedTinh && (areaData.phuongXa || "Phường An Khánh") === phuong) {
                    listContainer.innerHTML += `
                        <button onclick="highlightTemporaryArea('${areaData.khuVuc}', this)" class="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-teal-50 border rounded-2xl flex justify-between items-center transition font-bold text-gray-700 dark:text-gray-200">
                            <span><i class="fa-solid fa-house-chimney text-travelPrimary mr-2"></i> ${areaData.khuVuc}</span>
                            <span class="text-[10px] text-teal-600 font-semibold select-status">Chọn</span>
                        </button>
                    `;
                }
            });
        } catch(e) {}
    }
}

function highlightTemporaryArea(areaName, btnEl) {
    selectedTemporaryArea = areaName;
    document.querySelectorAll('#community-selector-list button').forEach(b => {
        b.classList.remove('border-travelPrimary', 'bg-teal-50', 'dark:bg-teal-900/30');
    });
    btnEl.classList.add('border-travelPrimary', 'bg-teal-50', 'dark:bg-teal-900/30');
    
    const confirmBtn = document.getElementById('comm-confirm-btn');
    const exitBtn = document.getElementById('comm-exit-btn');
    if(confirmBtn) confirmBtn.classList.remove('hidden');
    if(exitBtn) exitBtn.classList.add('hidden');
}

function confirmCommunityArea() {
    if(!selectedTemporaryArea) {
        showCustomConfirm("Lỗi", "Vui lòng chọn một khu vực cụ thể!", false, () => {});
        return;
    }
    currentAreaKey = selectedTemporaryArea;
    try {
        localStorage.setItem('thonxom_current_area', currentAreaKey);
    } catch(e) {}

    const commModal = document.getElementById('community-area-modal');
    if(commModal) commModal.classList.add('hidden');
    
    initRealtimeSync();
    switchTab('tab-tintuc');
}

function backCommunityStep() {
    if(commStep === 'phuong') {
        openCommunityProvinceStep();
    } else if(commStep === 'khuvuc') {
        chooseProvince(selectedTinh);
    }
}

function initAppConfig() {
    const kvEl = document.getElementById('display-khu-vuc');
    const ptEl = document.getElementById('display-phuong-tinh');
    const avEl = document.getElementById('header-avatar');
    const kvLink = document.getElementById('display-khu-vuc-link');
    
    if(kvEl) kvEl.innerText = db.khuVuc;
    if(ptEl) ptEl.innerText = `${db.phuongXa || 'Phường An Khánh'}, ${db.tinhThanh || 'TP. Cần Thơ'}`;
    if(avEl && db.avatar) avEl.src = db.avatar;
    if(db.banner) {
        let header = document.getElementById('app-header-bg');
        if(header) header.style.backgroundImage = `url('${db.banner}')`;
    }
    if(kvLink) {
        let mapsQuery = encodeURIComponent(`${db.khuVuc}, ${db.phuongXa || 'Phường An Khánh'}, ${db.tinhThanh || 'TP. Cần Thơ'}`);
        kvLink.href = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
    }
}

function switchTab(tabId) {
    if(portalRole === 'congdong' && (tabId === 'tab-hopchibo' || tabId === 'tab-quanly')) {
        showCustomConfirm("Thông Báo", "Khu vực cộng đồng không có quyền truy cập mục này!", false, () => {});
        return;
    }

    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const tabEl = document.getElementById(tabId);
    if(tabEl) tabEl.classList.remove('hidden');

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

function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye';
    }
}

async function handleChiBoPortalLogin(e) {
    e.preventDefault();
    const u = document.getElementById('cb-login-user') ? document.getElementById('cb-login-user').value.trim() : '';
    const p = document.getElementById('cb-login-pwd') ? document.getElementById('cb-login-pwd').value.trim() : '';

    let found = null;
    let foundAreaKey = '';
    try {
        const querySnapshot = await getDocs(collection(dbCloud, "thonxom_areas"));
        for(let docSnap of querySnapshot.docs) {
            let areaData = docSnap.data();
            if(areaData && areaData.accounts) {
                let acc = areaData.accounts.find(a => a.username === u && a.password === p);
                if(acc) {
                    found = acc;
                    foundAreaKey = areaData.khuVuc;
                    break;
                }
            }
        }
    } catch(e) {}

    if(found) {
        executeLoginSuccess(found, foundAreaKey);
        const cbModal = document.getElementById('chibo-login-modal');
        if(cbModal) cbModal.classList.add('hidden');
    } else {
        showCustomConfirm("Đăng Nhập Thất Bại", "Sai tên đăng nhập hoặc mật khẩu tài khoản khu vực!", false, () => {});
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('inline-login-username') ? document.getElementById('inline-login-username').value.trim() : '';
    const p = document.getElementById('inline-login-password') ? document.getElementById('inline-login-password').value.trim() : '';

    let found = null;
    let foundAreaKey = '';
    try {
        const querySnapshot = await getDocs(collection(dbCloud, "thonxom_areas"));
        for(let docSnap of querySnapshot.docs) {
            let areaData = docSnap.data();
            if(areaData && areaData.accounts) {
                let acc = areaData.accounts.find(a => a.username === u && a.password === p);
                if(acc) {
                    found = acc;
                    foundAreaKey = areaData.khuVuc;
                    break;
                }
            }
        }
    } catch(e) {}

    if(found) {
        executeLoginSuccess(found, foundAreaKey);
    } else {
        showCustomConfirm("Đăng Nhập Thất Bại", "Sai tên đăng nhập hoặc mật khẩu!", false, () => {});
    }
}

function executeLoginSuccess(acc, areaKey) {
    currentUser = acc;
    currentAreaKey = areaKey;
    portalRole = 'chibo';
    
    if(acc.type !== 'chu' && acc.type !== 'andanh' && acc.khuVuc) {
        currentAreaKey = acc.khuVuc;
    }

    try {
        localStorage.setItem('thonxom_current_area', currentAreaKey);
        localStorage.setItem('thonxom_portal_role', portalRole);
        localStorage.setItem('thonxom_logged_user', JSON.stringify(currentUser));
    } catch(e) {}
    
    initRealtimeSync();
    showCustomConfirm("Thành Công", `Đăng nhập thành công vào khu vực: ${currentAreaKey} (${currentUser.hoten})!`, false, () => {
        location.reload();
    });
}

let confirmCallback = null;

function showCustomConfirm(title, message, isDanger, callback) {
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const iconBox = document.getElementById('confirm-icon-box');
    const yesBtn = document.getElementById('confirm-yes-btn');
    const confirmModal = document.getElementById('custom-confirm-modal');

    if(titleEl) titleEl.innerText = title;
    if(msgEl) msgEl.innerText = message;
    confirmCallback = callback;

    if(isDanger) {
        if(iconBox) iconBox.className = "w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl shadow-inner";
        if(yesBtn) yesBtn.className = "w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow";
    } else {
        if(iconBox) iconBox.className = "w-14 h-14 bg-teal-100 text-travelPrimary rounded-full flex items-center justify-center mx-auto text-xl shadow-inner";
        if(yesBtn) yesBtn.className = "w-1/2 bg-travelPrimary hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl text-xs transition shadow";
    }

    if(confirmModal) confirmModal.classList.remove('hidden');
}

function closeCustomConfirm(isYes) {
    const confirmModal = document.getElementById('custom-confirm-modal');
    if(confirmModal) confirmModal.classList.add('hidden');
    if(confirmCallback) {
        let cb = confirmCallback;
        confirmCallback = null;
        cb(isYes);
    }
}

function promptLogout() {
    showCustomConfirm("Xác Nhận Đăng Xuất", "Bạn có chắc chắn muốn đăng xuất tài khoản này không?", true, (isYes) => {
        if(isYes) {
            handleLogout();
        }
    });
}

function promptDeleteArea() {
    showCustomConfirm("Xác Nhận Xóa Khu Vực", `Bạn có thực sự muốn xóa vĩnh viễn khu vực "${db.khuVuc}" không?`, true, (isYes) => {
        if(isYes) {
            executeDeleteCurrentArea();
        }
    });
}

function handleLogout() {
    currentUser = null;
    portalRole = null;
    try {
        localStorage.removeItem('thonxom_logged_user');
        localStorage.removeItem('thonxom_portal_role');
    } catch(e) {}
    showCustomConfirm("Đã Đăng Xuất", "Đăng xuất tài khoản thành công!", false, () => {
        location.reload();
    });
}

let generatedForgotOtp = "";
function openForgotModal() {
    const m = document.getElementById('forgot-modal');
    const s1 = document.getElementById('forgot-step-1');
    const s2 = document.getElementById('forgot-step-2');
    if(m) m.classList.remove('hidden');
    if(s1) s1.classList.remove('hidden');
    if(s2) s2.classList.add('hidden');
}
function closeForgotModal() {
    const m = document.getElementById('forgot-modal');
    if(m) m.classList.add('hidden');
}

async function sendForgotOtp() {
    const usr = document.getElementById('forgot-username').value.trim();
    const email = document.getElementById('forgot-email').value.trim();
    if(!usr || !email) { showCustomConfirm("Lỗi", "Vui lòng nhập đầy đủ tên đăng nhập và email!", false, () => {}); return; }

    let targetDocRef = null;
    let targetAreaData = null;
    try {
        const querySnapshot = await getDocs(collection(dbCloud, "thonxom_areas"));
        for(let docSnap of querySnapshot.docs) {
            let areaData = docSnap.data();
            if(areaData && areaData.accounts) {
                let acc = areaData.accounts.find(a => a.username === usr && (a.email === email || a.type === 'chu' || a.type === 'andanh' || a.type === 'cap1' || a.type === 'cap2'));
                if(acc) {
                    targetDocRef = doc(dbCloud, "thonxom_areas", docSnap.id);
                    targetAreaData = areaData;
                    break;
                }
            }
        }
    } catch(e) {}

    if(!targetAreaData) { showCustomConfirm("Lỗi", "Không tìm thấy tài khoản hoặc email không khớp!", false, () => {}); return; }

    generatedForgotOtp = Math.floor(100000 + Math.random() * 900000).toString();
    showCustomConfirm("Mã OTP Khôi Phục", `[MÔ PHỎNG EMAIL] Mã OTP gửi đến ${email} là: ${generatedForgotOtp}`, false, () => {
        window.tempForgotTarget = { ref: targetDocRef, data: targetAreaData, usr: usr };
        const s1 = document.getElementById('forgot-step-1');
        const s2 = document.getElementById('forgot-step-2');
        if(s1) s1.classList.add('hidden');
        if(s2) s2.classList.remove('hidden');
    });
}

async function confirmResetPassword() {
    const otp = document.getElementById('forgot-otp-code').value.trim();
    const newPwd = document.getElementById('forgot-new-pwd').value.trim();

    if(otp !== generatedForgotOtp) { showCustomConfirm("Lỗi", "Mã OTP không chính xác!", false, () => {}); return; }
    if(!validatePassword(newPwd)) { showCustomConfirm("Lỗi", "Mật khẩu mới phải chứa ít nhất 1 chữ In hoa và 1 ký tự đặc biệt!", false, () => {}); return; }

    if(window.tempForgotTarget) {
        let { ref, data, usr } = window.tempForgotTarget;
        let acc = data.accounts.find(a => a.username === usr);
        if(acc) {
            acc.password = newPwd;
            try {
                await setDoc(ref, data);
                showCustomConfirm("Thành Công", "Khôi phục mật khẩu thành công! Hãy đăng nhập lại.", false, () => {
                    closeForgotModal();
                });
                return;
            } catch(e) {}
        }
    }
    showCustomConfirm("Lỗi", "Có lỗi xảy ra khi đổi mật khẩu!", false, () => {});
}

function updateMyCredentials(e) {
    e.preventDefault();
    if(!currentUser) return;
    const newUsr = document.getElementById('my-new-username').value.trim();
    const newPwd = document.getElementById('my-new-password').value.trim();

    if(!validateUsername(newUsr)) { showCustomConfirm("Lỗi", "Tên đăng nhập phải viết liền không dấu và viết hoa chữ cái đầu!", false, () => {}); return; }
    if(!validatePassword(newPwd)) { showCustomConfirm("Lỗi", "Mật khẩu phải chứa ít nhất 1 chữ In hoa và 1 ký tự đặc biệt!", false, () => {}); return; }

    showCustomConfirm("Xác Nhận Cập Nhật", "Bạn có chắc chắn muốn thay đổi thông tin tài khoản cá nhân không?", false, async (isYes) => {
        if(isYes) {
            currentUser.username = newUsr;
            currentUser.password = newPwd;
            let accInDb = db.accounts.find(a => a.id === currentUser.id || a.type === currentUser.type);
            if(accInDb) {
                accInDb.username = newUsr;
                accInDb.password = newPwd;
            }
            await saveDB();
            try {
                localStorage.setItem('thonxom_logged_user', JSON.stringify(currentUser));
            } catch(e) {}
            showCustomConfirm("Thành Công", "Đã cập nhật thông tin thành công!", false, () => {
                location.reload();
            });
        }
    });
}

let handoverOtpCode = "";
function sendHandoverOtp() {
    const email = document.getElementById('user-email-input').value.trim();
    if(!email) { showCustomConfirm("Lỗi", "Vui lòng nhập email mới cần đổi!", false, () => {}); return; }
    handoverOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    showCustomConfirm("Mã OTP Email", `[MÔ PHỎNG XÁC THỰC] Mã OTP gửi đến email mới (${email}) là: ${handoverOtpCode}`, false, () => {});
}

function verifyHandoverOtp(e) {
    e.preventDefault();
    const email = document.getElementById('user-email-input').value.trim();
    const otp = document.getElementById('handover-otp-input').value.trim();

    if(otp !== handoverOtpCode) { showCustomConfirm("Lỗi", "Mã OTP không chính xác!", false, () => {}); return; }

    showCustomConfirm("Xác Nhận Đổi Email", "Bạn có chắc chắn muốn cập nhật email mới này không?", false, async (isYes) => {
        if(isYes) {
            currentUser.email = email;
            let accInDb = db.accounts.find(a => a.id === currentUser.id);
            if(accInDb) accInDb.email = email;

            await saveDB();
            try {
                localStorage.setItem('thonxom_logged_user', JSON.stringify(currentUser));
            } catch(e) {}
            showCustomConfirm("Thành Công", "Đã cập nhật email mới thành công!", false, () => {
                location.reload();
            });
        }
    });
}

function promptSaveAreaDetails(e) {
    e.preventDefault();
    if(!currentUser || (currentUser.type !== 'chu' && currentUser.type !== 'andanh')) {
        showCustomConfirm("Lỗi", "Chỉ tài khoản Chủ mới có quyền chỉnh sửa tên khu vực!", false, () => {});
        return;
    }

    const newAreaName = document.getElementById('edit-area-name').value.trim();
    const newPhuong = document.getElementById('edit-area-phuong').value.trim();
    const newTinh = document.getElementById('edit-area-tinh').value.trim();

    if(!newAreaName || !newPhuong || !newTinh) {
        showCustomConfirm("Lỗi", "Vui lòng điền đầy đủ thông tin khu vực!", false, () => {});
        return;
    }

    showCustomConfirm("Xác Nhận Cập Nhật", `Bạn có muốn đổi tên khu vực thành "${newAreaName}" không?`, false, async (isYes) => {
        if(isYes) {
            let oldKey = currentAreaKey;
            db.khuVuc = newAreaName;
            db.phuongXa = newPhuong;
            db.tinhThanh = newTinh;
            db.phuongTinh = `${newPhuong}, ${newTinh}`;

            try {
                // Xóa document cũ trên Firestore và tạo document mới
                const oldDocRef = doc(dbCloud, "thonxom_areas", oldKey);
                await deleteDoc(oldDocRef);

                currentAreaKey = newAreaName;
                localStorage.setItem('thonxom_current_area', currentAreaKey);
                await saveDB();
            } catch(e) {}

            showCustomConfirm("Thành Công", "Đã cập nhật thông tin khu vực thành công!", false, () => {
                location.reload();
            });
        }
    });
}

function executeSwitchChuMonitorArea() {
    const selKhuVuc = document.getElementById('chu-sel-khuvuc');
    if(!selKhuVuc) return;
    let areaName = selKhuVuc.value;
    if(!areaName) {
        showCustomConfirm("Lỗi", "Vui lòng chọn khu vực giám sát!", false, () => {});
        return;
    }
    showCustomConfirm("Xác Nhận Chuyển", `Bạn có muốn chuyển sang giám sát khu vực "${areaName}" không?`, false, (isYes) => {
        if(isYes) {
            currentAreaKey = areaName;
            try {
                localStorage.setItem('thonxom_current_area', currentAreaKey);
            } catch(e) {}
            location.reload();
        }
    });
}

function checkRolePermissions() {
    const addNewsContainer = document.getElementById('action-add-news-container');
    const addHopContainer = document.getElementById('action-add-hop-container');
    const addBqContainer = document.getElementById('action-add-bq-container');
    const officerUploadTt = document.getElementById('officer-upload-thutuc-card');
    const chuCreateAreaBox = document.getElementById('chu-create-area-box');
    const chuDeleteAreaBox = document.getElementById('chu-delete-area-box');
    const chuMonitorBox = document.getElementById('chu-monitor-box');
    const chuEditAreaDetailsBox = document.getElementById('chu-edit-area-details-box');
    const accountCreateSec = document.getElementById('account-create-section');
    const cap1CustomBox = document.getElementById('cap1-custom-area-box');
    const handoverSec = document.getElementById('handover-section');
    const contactAddSec = document.getElementById('contact-add-section');
    const btnBqNoiBo = document.getElementById('btn-bq-noibo');
    const changeCredentialsBox = document.getElementById('change-credentials-box');
    const loggedOutManagerView = document.getElementById('logged-out-manager-view');
    const loggedInManagerView = document.getElementById('logged-in-manager-view');
    const paNavButtons = document.getElementById('community-pa-nav-buttons');
    const subTabViet = document.getElementById('subtab-pa-viet');
    const subTabXem = document.getElementById('subtab-pa-xem');
    const officerFilterBar = document.getElementById('officer-pa-filter-bar');

    if(addNewsContainer) addNewsContainer.innerHTML = '';
    if(addHopContainer) addHopContainer.innerHTML = '';
    if(addBqContainer) addBqContainer.innerHTML = '';
    if(officerUploadTt) officerUploadTt.classList.add('hidden');
    if(chuCreateAreaBox) chuCreateAreaBox.classList.add('hidden');
    if(chuDeleteAreaBox) chuDeleteAreaBox.classList.add('hidden');
    if(chuMonitorBox) chuMonitorBox.classList.add('hidden');
    if(chuEditAreaDetailsBox) chuEditAreaDetailsBox.classList.add('hidden');
    if(accountCreateSec) accountCreateSec.classList.add('hidden');
    if(cap1CustomBox) cap1CustomBox.classList.add('hidden');
    if(handoverSec) handoverSec.classList.add('hidden');
    if(contactAddSec) contactAddSec.classList.add('hidden');
    if(btnBqNoiBo) btnBqNoiBo.classList.add('hidden');
    if(changeCredentialsBox) changeCredentialsBox.classList.remove('hidden');

    if(currentUser) {
        if(loggedOutManagerView) loggedOutManagerView.classList.add('hidden');
        if(loggedInManagerView) loggedInManagerView.classList.remove('hidden');

        if(paNavButtons) paNavButtons.classList.add('hidden');
        if(subTabViet) subTabViet.classList.add('hidden');
        if(subTabXem) subTabXem.classList.remove('hidden');
        if(officerFilterBar) officerFilterBar.classList.remove('hidden');

        if(currentUser.type === 'chu' || currentUser.type === 'andanh') {
            if(chuCreateAreaBox) chuCreateAreaBox.classList.remove('hidden');
            if(chuDeleteAreaBox) chuDeleteAreaBox.classList.remove('hidden');
            if(chuMonitorBox) chuMonitorBox.classList.remove('hidden');
            if(chuEditAreaDetailsBox) chuEditAreaDetailsBox.classList.remove('hidden');
            if(handoverSec) handoverSec.classList.remove('hidden');
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

            let prevAvatar = document.getElementById('preview-avatar-box');
            if(prevAvatar) prevAvatar.src = db.avatar;
            if(db.banner) {
                let bannerPrev = document.getElementById('preview-banner-box');
                if(bannerPrev) {
                    bannerPrev.style.backgroundImage = `url('${db.banner}')`;
                    bannerPrev.classList.remove('hidden');
                }
            }
        } else if(currentUser.type === 'cap2') {
            if(btnBqNoiBo) btnBqNoiBo.classList.remove('hidden');
        }
    } else {
        if(loggedOutManagerView) loggedOutManagerView.classList.remove('hidden');
        if(loggedInManagerView) loggedInManagerView.classList.add('hidden');
        if(paNavButtons) paNavButtons.classList.remove('hidden');
        if(officerFilterBar) officerFilterBar.classList.add('hidden');
        if(activeBqTab === 'noibo') {
            switchBqTab('congdong');
        }
    }
    renderBieuQuyet();
}

function saveCap1Customization(e) {
    e.preventDefault();
    const avatarFileInput = document.getElementById('custom-avatar-file');
    const bannerFileInput = document.getElementById('custom-banner-file');
    const avatarFile = avatarFileInput && avatarFileInput.files ? avatarFileInput.files[0] : null;
    const bannerFile = bannerFileInput && bannerFileInput.files ? bannerFileInput.files[0] : null;

    let processSave = async () => {
        await saveDB();
        showCustomConfirm("Thành Công", "Đã cập nhật giao diện thành công!", false, () => {
            location.reload();
        });
    };

    let filesProcessed = 0;
    let totalFiles = (avatarFile ? 1 : 0) + (bannerFile ? 1 : 0);

    if (totalFiles === 0) {
        showCustomConfirm("Lỗi", "Vui lòng chọn hình ảnh để tải lên!", false, () => {});
        return;
    }

    if (avatarFile) {
        const reader = new FileReader();
        reader.onload = async function(evt) {
            db.avatar = evt.target.result;
            filesProcessed++;
            if (filesProcessed === totalFiles) await processSave();
        };
        reader.readAsDataURL(avatarFile);
    }

    if (bannerFile) {
        const reader = new FileReader();
        reader.onload = async function(evt) {
            db.banner = evt.target.result;
            filesProcessed++;
            if (filesProcessed === totalFiles) await processSave();
        };
        reader.readAsDataURL(bannerFile);
    }
}

async function initChuMonitorSelects() {
    const selTinh = document.getElementById('chu-sel-tinh');
    if(!selTinh) return;

    let tinhSet = new Set();
    try {
        const querySnapshot = await getDocs(collection(dbCloud, "thonxom_areas"));
        querySnapshot.forEach((doc) => {
            let areaData = doc.data();
            if(areaData && areaData.tinhThanh) tinhSet.add(areaData.tinhThanh);
            else tinhSet.add("TP. Cần Thơ");
        });
    } catch(e) {}

    if(tinhSet.size === 0) tinhSet.add("TP. Cần Thơ");

    selTinh.innerHTML = '';
    tinhSet.forEach(tinh => {
        let opt = document.createElement('option');
        opt.value = tinh;
        opt.innerText = tinh;
        if(tinh === (db.tinhThanh || "TP. Cần Thơ")) opt.selected = true;
        selTinh.appendChild(opt);
    });

    onChuTinhChange(selTinh.value);
}

async function onChuTinhChange(tinh) {
    const selPhuong = document.getElementById('chu-sel-phuong');
    if(!selPhuong) return;

    let phuongSet = new Set();
    let firstPhuong = '';

    try {
        const querySnapshot = await getDocs(collection(dbCloud, "thonxom_areas"));
        querySnapshot.forEach((doc) => {
            let areaData = doc.data();
            if(areaData && (areaData.tinhThanh || "TP. Cần Thơ") === tinh) {
                let phuong = areaData.phuongXa || "Phường An Khánh";
                phuongSet.add(phuong);
                if(!firstPhuong) firstPhuong = phuong;
            }
        });
    } catch(e) {}

    selPhuong.innerHTML = '';
    phuongSet.forEach(phuong => {
        let opt = document.createElement('option');
        opt.value = phuong;
        opt.innerText = phuong;
        if(phuong === (db.phuongXa || firstPhuong)) opt.selected = true;
        selPhuong.appendChild(opt);
    });

    onChuPhuongChange(selPhuong.value);
}

async function onChuPhuongChange(phuong) {
    const selKhuVuc = document.getElementById('chu-sel-khuvuc');
    const selTinh = document.getElementById('chu-sel-tinh');
    if(!selKhuVuc || !selTinh) return;

    let tinh = selTinh.value;
    selKhuVuc.innerHTML = '';
    try {
        const querySnapshot = await getDocs(collection(dbCloud, "thonxom_areas"));
        querySnapshot.forEach((doc) => {
            let areaData = doc.data();
            if(areaData && (areaData.tinhThanh || "TP. Cần Thơ") === tinh && (areaData.phuongXa || "Phường An Khánh") === phuong) {
                let opt = document.createElement('option');
                opt.value = areaData.khuVuc;
                opt.innerText = areaData.khuVuc;
                if(areaData.khuVuc === db.khuVuc) opt.selected = true;
                selKhuVuc.appendChild(opt);
            }
        });
    } catch(e) {}
}

function chuAssignAreaAndAccount(e) {
    e.preventDefault();
    const tinhThanh = document.getElementById('chu-new-tinh').value.trim();
    const phuongXa = document.getElementById('chu-new-phuong').value.trim();
    const newAreaName = document.getElementById('chu-new-area-name').value.trim();
    const hoten = document.getElementById('chu-acc-hoten').value.trim();
    const username = document.getElementById('chu-acc-username').value.trim();
    const email = document.getElementById('chu-acc-email').value.trim();
    const sdt = document.getElementById('chu-acc-sdt').value.trim();
    const password = document.getElementById('chu-acc-password').value.trim();

    if(!newAreaName) { showCustomConfirm("Lỗi", "Vui lòng nhập tên khu vực!", false, () => {}); return; }
    if(!validateUsername(username)) {
        showCustomConfirm("Lỗi", "Tên đăng nhập phải viết liền không dấu và viết hoa chữ cái đầu!", false, () => {}); return;
    }
    if(!validatePassword(password)) {
        showCustomConfirm("Lỗi", "Mật khẩu phải chứa ít nhất 1 chữ In hoa và 1 ký tự đặc biệt!", false, () => {}); return;
    }

    showCustomConfirm("Xác Nhận", `Bạn có muốn tạo khu vực mới "${newAreaName}" không?`, false, async (isYes) => {
        if(isYes) {
            let newAreaData = {
                khuVuc: newAreaName,
                phuongTinh: `${phuongXa}, ${tinhThanh}`,
                tinhThanh: tinhThanh,
                phuongXa: phuongXa,
                avatar: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=100",
                banner: "",
                ownerEmail: email,
                accounts: [
                    { id: Date.now(), hoten, username, password, email, type: "cap1", sdt, khuVuc: newAreaName },
                    { id: 1, hoten: "Tài Khoản Cấp Quyền khu vực", username: "Taikhoanchu", password: "@Taikhoanchu26", email: "chu1@gmail.com", type: "chu", sdt: "0909000000", khuVuc: "Hệ Thống" },
                    { id: 2, hoten: "Tài Khoản Cấp Quyền khu vực", username: "Taikhoanandanh", password: "@Taikhoanandanh26", email: "chu2@gmail.com", type: "andanh", sdt: "", khuVuc: "Hệ Thống" }
                ],
                contacts: [
                    { id: 101, dept: "Công An Xã / Phường", person: "Trực ban", phone: "02923000111" },
                    { id: 102, dept: "Y Tế / Trạm Y Tế", person: "Bác sĩ trực", phone: "02923000222" }
                ],
                news: [],
                phanAnh: [],
                thuTucDocs: [],
                hopChiBo: [],
                bieuQuyet: [],
                chatMessages: []
            };
            try {
                const docRef = doc(dbCloud, "thonxom_areas", newAreaName);
                await setDoc(docRef, newAreaData);
                showCustomConfirm("Thành Công", `Đã tạo khu vực "${newAreaName}" thành công!`, false, () => {
                    location.reload();
                });
            } catch(e) {
                showCustomConfirm("Lỗi", "Không thể tạo khu vực trên mây.", false, () => {});
            }
        }
    });
}

function executeDeleteCurrentArea() {
    showCustomConfirm("Xác Nhận Xóa", "Đang tiến hành xóa...", false, async () => {
        try {
            const docRef = doc(dbCloud, "thonxom_areas", currentAreaKey);
            await deleteDoc(docRef);
            localStorage.setItem('thonxom_current_area', 'Thôn Xóm Bình An');
            showCustomConfirm("Thành Công", "Đã xóa khu vực thành công!", false, () => {
                location.reload();
            });
        } catch(e) {
            showCustomConfirm("Lỗi", "Không thể xóa khu vực.", false, () => {});
        }
    });
}

function createNewAccount(e) {
    e.preventDefault();
    if(!currentUser || currentUser.type !== 'cap1') {
        showCustomConfirm("Lỗi", "Chỉ tài khoản Cấp 1 mới có quyền cấp phát tài khoản trong khu vực này!", false, () => {}); return;
    }
    const hoten = document.getElementById('acc-hoten').value.trim();
    const username = document.getElementById('acc-chucvu').value.trim();
    const email = document.getElementById('acc-email').value.trim();
    const sdt = document.getElementById('acc-sdt').value.trim();
    const password = document.getElementById('acc-password').value.trim();
    const type = document.getElementById('acc-type').value;

    if(!validateUsername(username)) {
        showCustomConfirm("Lỗi", "Tên đăng nhập phải viết liền không dấu và viết hoa chữ cái đầu!", false, () => {}); return;
    }
    if(!validatePassword(password)) {
        showCustomConfirm("Lỗi", "Mật khẩu phải chứa ít nhất 1 chữ In hoa và 1 ký tự đặc biệt!", false, () => {}); return;
    }

    showCustomConfirm("Xác Nhận", `Bạn có muốn cấp tài khoản "${username}" không?`, false, async (isYes) => {
        if(isYes) {
            db.accounts.push({ id: Date.now(), hoten, username, password, email, type, sdt, khuVuc: db.khuVuc });
            await saveDB();
            renderAccountsTable();
            showCustomConfirm("Thành Công", "Cấp tài khoản thành công!", false, () => {});
            e.target.reset();
        }
    });
}

function renderAccountsTable() {
    const container = document.getElementById('accounts-table-body');
    if(!container) return;
    container.innerHTML = '';
    
    let visibleAccounts = db.accounts.filter(acc => acc.type === 'cap1' || acc.type === 'cap2');
    if(visibleAccounts.length === 0) {
        container.innerHTML = `<p class="text-gray-400">Chưa có thành viên Cấp 1 hoặc Cấp 2 nào.</p>`;
        return;
    }

    let isOwner = currentUser && (currentUser.type === 'chu' || currentUser.type === 'andanh');

    visibleAccounts.forEach(acc => {
        let levelBadge = acc.type === 'cap1' ? '<span class="bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold">Cấp 1</span>' : '<span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">Cấp 2</span>';
        let passwordDisplay = isOwner ? `| Mật khẩu: <b class="text-travelPrimary">${acc.password}</b>` : '';
        let emailDisplay = acc.email ? `| Email: ${acc.email}` : '';
        let sdtDisplay = acc.sdt ? `SĐT: ${acc.sdt}` : '';
        container.innerHTML += `
            <div class="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border text-xs">
                <div>
                    <p class="font-bold">${acc.hoten} (${acc.username}) ${levelBadge}</p>
                    <p class="text-gray-500 text-[11px]">${sdtDisplay} ${emailDisplay} ${passwordDisplay}</p>
                </div>
                ${(currentUser && currentUser.type === 'cap1') ? `<button onclick="promptDeleteAccount(${acc.id})" class="text-red-500 hover:text-red-700 font-bold p-1"><i class="fa-solid fa-trash"></i> Xóa</button>` : ''}
            </div>
        `;
    });
}

function promptDeleteAccount(id) {
    showCustomConfirm("Xác Nhận Xóa", "Bạn có chắc chắn muốn xóa tài khoản này không?", true, (isYes) => {
        if(isYes) {
            deleteAccount(id);
        }
    });
}

async function deleteAccount(id) {
    db.accounts = db.accounts.filter(a => a.id !== id);
    await saveDB();
    renderAccountsTable();
    showCustomConfirm("Thành Công", "Đã xóa tài khoản thành công!", false, () => {});
}

function renderSidebarContacts() {
    const container = document.getElementById('sidebar-contacts-list');
    if(!container) return;
    container.innerHTML = '';

    if(!db.contacts || db.contacts.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-center py-2">Chưa có danh bạ.</p>`;
        return;
    }

    db.contacts.forEach(c => {
        let canDelete = currentUser && currentUser.type === 'cap1';
        container.innerHTML += `
            <div class="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border">
                <div><p class="font-bold">${c.dept}</p><p class="text-gray-500 text-[11px]">${c.person} - ${c.phone}</p></div>
                <div class="flex items-center gap-2">
                    <a href="tel:${c.phone}" class="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded-full"><i class="fa-solid fa-phone"></i> Gọi</a>
                    ${canDelete ? `<button onclick="promptDeleteContact(${c.id})" class="text-red-500"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
            </div>
        `;
    });
}

function promptDeleteContact(id) {
    showCustomConfirm("Xác Nhận Xóa", "Bạn có muốn xóa mục danh bạ này không?", true, (isYes) => {
        if(isYes) {
            deleteContact(id);
        }
    });
}

async function saveNewContact(e) {
    e.preventDefault();
    if(db.contacts.length >= 10) {
        showCustomConfirm("Lỗi", "Tối đa 10 mục danh bạ!", false, () => {}); return;
    }
    const dept = document.getElementById('ct-dept').value.trim();
    const person = document.getElementById('ct-person').value.trim();
    const phone = document.getElementById('ct-phone').value.trim();

    db.contacts.push({ id: Date.now(), dept, person, phone });
    await saveDB();
    renderSidebarContacts();
    showCustomConfirm("Thành Công", "Đã thêm danh bạ thành công!", false, () => {});
    e.target.reset();
}

async function deleteContact(id) {
    db.contacts = db.contacts.filter(c => c.id !== id);
    await saveDB();
    renderSidebarContacts();
}

// ================= TIN TỨC =================
let tempNewsImages = [];
function openNewsModal(id = null) {
    const m = document.getElementById('news-modal');
    const titleEl = document.getElementById('news-modal-title');
    const submitBtn = document.getElementById('news-submit-btn');
    const editIdInput = document.getElementById('edit-news-id');
    
    if(!m) return;
    tempNewsImages = [];
    document.getElementById('news-image-preview').innerHTML = '';

    if(id) {
        let item = db.news.find(n => n.id === id);
        if(item) {
            if(titleEl) titleEl.innerText = "Chỉnh Sửa Bài Tin Tức";
            if(submitBtn) submitBtn.innerText = "Đăng Lại Bài Sửa";
            if(editIdInput) editIdInput.value = item.id;
            document.getElementById('news-title').value = item.title;
            document.getElementById('news-content').value = item.content;
            if(item.images) {
                tempNewsImages = [...item.images];
                renderNewsImagePreviews();
            }
        }
    } else {
        if(titleEl) titleEl.innerText = "Đăng Bài Tin Tức Số Hóa Đầu Làng";
        if(submitBtn) submitBtn.innerText = "Đăng Bài";
        if(editIdInput) editIdInput.value = "";
        document.getElementById('news-title').value = "";
        document.getElementById('news-content').value = "";
    }
    m.classList.remove('hidden');
}

function closeNewsModal() {
    const m = document.getElementById('news-modal');
    if(m) m.classList.add('hidden');
    tempNewsImages = [];
}

function handleNewsImages(e) {
    const files = e.target.files;
    for(let i=0; i<files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            tempNewsImages.push(evt.target.result);
            renderNewsImagePreviews();
        };
        reader.readAsDataURL(files[i]);
    }
}

function renderNewsImagePreviews() {
    const preview = document.getElementById('news-image-preview');
    if(!preview) return;
    preview.innerHTML = '';
    tempNewsImages.forEach((imgSrc, idx) => {
        preview.innerHTML += `
            <div class="relative inline-block">
                <img src="${imgSrc}" class="w-14 h-14 object-cover rounded-xl border">
                <button type="button" onclick="removeTempNewsImage(${idx})" class="absolute -top-1 -right-1 bg-red-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold shadow hover:bg-red-700"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
    });
}

function removeTempNewsImage(idx) {
    tempNewsImages.splice(idx, 1);
    renderNewsImagePreviews();
}

async function submitNewsArticle(e) {
    e.preventDefault();
    if(currentUser && currentUser.type === 'cap2') {
        showCustomConfirm("Lỗi", "Cấp 2 chỉ có quyền xem!", false, () => {}); return;
    }
    const editId = document.getElementById('edit-news-id').value;
    const title = document.getElementById('news-title').value.trim();
    const content = document.getElementById('news-content').value.trim();

    if(editId) {
        let item = db.news.find(n => n.id == editId);
        if(item) {
            item.title = title;
            item.content = content;
            item.images = [...tempNewsImages];
        }
        showCustomConfirm("Thành Công", "Đã sửa bài và đăng lại thành công!", false, () => {});
    } else {
        db.news.unshift({
            id: Date.now(),
            title,
            content,
            images: [...tempNewsImages],
            author: currentUser ? currentUser.username : "Cán bộ",
            date: new Date().toLocaleDateString('vi-VN')
        });
        showCustomConfirm("Thành Công", "Đã đăng bài viết mới!", false, () => {});
    }
    await saveDB();
    closeNewsModal();
    renderNews();
}

function promptDeleteNews(id) {
    showCustomConfirm("Xác Nhận Xóa", "Cán bộ Cấp 1: Bạn có chắc chắn muốn xóa bài viết này không?", true, async (isYes) => {
        if(isYes) {
            db.news = db.news.filter(n => n.id !== id);
            await saveDB();
            renderNews();
            showCustomConfirm("Thành Công", "Đã xóa bài viết thành công!", false, () => {});
        }
    });
}

function renderNews(filter = "") {
    const list = document.getElementById('news-feed-list');
    if(!list) return;
    list.innerHTML = '';
    let filtered = db.news.filter(n => n.title.toLowerCase().includes(filter.toLowerCase()));

    if(filtered.length === 0) {
        list.innerHTML = `<p class="text-gray-400 text-center py-4 text-xs">Chưa có bản tin nào.</p>`;
        return;
    }

    filtered.forEach(n => {
        let imgsHtml = '';
        if(n.images && n.images.length > 0) {
            let encodedImgs = encodeURIComponent(JSON.stringify(n.images));
            n.images.forEach((img, i) => {
                imgsHtml += `<img src="${img}" onclick="openLightboxFromGallery('${encodedImgs}', ${i})" class="w-20 h-20 object-cover rounded-xl border cursor-pointer hover:opacity-90 transition">`;
            });
        }

        let officerActions = '';
        if(currentUser && currentUser.type === 'cap1') {
            officerActions = `
                <div class="flex gap-2 pt-2 border-t">
                    <button onclick="openNewsModal(${n.id})" class="text-teal-700 font-bold hover:underline"><i class="fa-solid fa-pen-to-square"></i> Sửa bài</button>
                    <button onclick="promptDeleteNews(${n.id})" class="text-red-500 font-bold hover:underline"><i class="fa-solid fa-trash"></i> Xóa</button>
                </div>
            `;
        }

        list.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border shadow-sm space-y-2 text-xs">
                <div class="flex justify-between text-[11px] text-gray-400"><span>${n.author}</span><span>${n.date}</span></div>
                <h4 class="font-bold text-sm text-travelPrimary">${n.title}</h4>
                <p class="text-gray-600 dark:text-gray-300 whitespace-pre-line">${n.content}</p>
                <div class="flex gap-2 flex-wrap pt-1">${imgsHtml}</div>
                ${officerActions}
            </div>
        `;
    });
}

function filterNews() {
    const searchInput = document.getElementById('search-news-input');
    renderNews(searchInput ? searchInput.value : "");
}

// ================= PHẢN ÁNH =================
let tempPaImages = [];
let currentGpsLat = "";
let currentGpsLng = "";

function captureMyLocation() {
    const statusEl = document.getElementById('pa-gps-status');
    if(!navigator.geolocation) {
        if(statusEl) statusEl.innerText = "Trình duyệt không hỗ trợ GPS";
        return;
    }
    if(statusEl) statusEl.innerText = "Đang lấy định vị GPS...";
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            currentGpsLat = pos.coords.latitude;
            currentGpsLng = pos.coords.longitude;
            document.getElementById('pa-lat').value = currentGpsLat;
            document.getElementById('pa-lng').value = currentGpsLng;
            if(statusEl) statusEl.innerText = `Đã lấy GPS: ${currentGpsLat.toFixed(4)}, ${currentGpsLng.toFixed(4)}`;
        },
        (err) => {
            if(statusEl) statusEl.innerText = "Lấy GPS thất bại. Hãy bật định vị!";
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function handlePaImages(e) {
    const files = e.target.files;
    for(let i=0; i<files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            tempPaImages.push(evt.target.result);
            renderPaImagePreviews();
        };
        reader.readAsDataURL(files[i]);
    }
}

function renderPaImagePreviews() {
    const preview = document.getElementById('pa-image-preview');
    if(!preview) return;
    preview.innerHTML = '';
    tempPaImages.forEach((imgSrc, idx) => {
        preview.innerHTML += `
            <div class="relative inline-block">
                <img src="${imgSrc}" class="w-12 h-12 object-cover rounded-xl border">
                <button type="button" onclick="removeTempPaImage(${idx})" class="absolute -top-1 -right-1 bg-red-600 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold shadow"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
    });
}

function removeTempPaImage(idx) {
    tempPaImages.splice(idx, 1);
    renderPaImagePreviews();
}

async function submitPhanAnh(e) {
    e.preventDefault();
    if(tempPaImages.length < 1) { showCustomConfirm("Lỗi", "Bắt buộc đính kèm ít nhất 1 hình ảnh minh chứng!", false, () => {}); return; }
    if(!currentGpsLat || !currentGpsLng) { showCustomConfirm("Lỗi", "Vui lòng bấm nút 'Gửi Định Vị GPS' trước khi đăng bài!", false, () => {}); return; }

    db.phanAnh.unshift({
        id: Date.now(),
        hoten: document.getElementById('pa-hoten').value.trim(),
        sdt: document.getElementById('pa-sdt').value.trim(),
        diachi: document.getElementById('pa-diachi').value.trim(),
        noidung: document.getElementById('pa-noidung').value.trim(),
        images: [...tempPaImages],
        lat: currentGpsLat,
        lng: currentGpsLng,
        status: "Đang chờ",
        date: new Date().toLocaleDateString('vi-VN')
    });

    await saveDB();
    renderPhanAnh();
    e.target.reset();
    tempPaImages = [];
    currentGpsLat = "";
    currentGpsLng = "";
    const preview = document.getElementById('pa-image-preview');
    if(preview) preview.innerHTML = '';
    const statusEl = document.getElementById('pa-gps-status');
    if(statusEl) statusEl.innerText = "Chưa có định vị (bắt buộc lấy GPS)";
    
    showCustomConfirm("Thành Công", "Đã đăng bài phản ánh thành công!", false, () => {
        if(portalRole === 'congdong') {
            switchPaSubTab('xem');
        }
    });
}

function loadMyPhanAnhList() {
    const phoneInput = document.getElementById('manage-pa-phone');
    const container = document.getElementById('my-phananh-manage-container');
    if(!phoneInput || !container) return;
    const phone = phoneInput.value.trim();

    if(!phone) {
        showCustomConfirm("Lỗi", "Vui lòng nhập số điện thoại của bạn!", false, () => {});
        return;
    }

    let myItems = db.phanAnh.filter(p => p.sdt === phone);
    if(myItems.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-xs py-1">Không tìm thấy bài phản ánh nào với SĐT: ${phone}</p>`;
        return;
    }

    container.innerHTML = '';
    myItems.forEach(p => {
        container.innerHTML += `
            <div class="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl border flex justify-between items-center text-xs">
                <div class="truncate pr-2">
                    <p class="font-bold truncate">${p.noidung}</p>
                    <p class="text-[10px] text-gray-400">${p.date} - ${p.status}</p>
                </div>
                <div class="flex gap-1.5 shrink-0">
                    <button onclick="openEditPaModal(${p.id}, '${phone}')" class="bg-teal-100 text-teal-800 px-2 py-1 rounded font-bold">Sửa</button>
                    <button onclick="deleteMyPhanAnh(${p.id}, '${phone}')" class="bg-red-100 text-red-600 px-2 py-1 rounded font-bold">Xóa</button>
                </div>
            </div>
        `;
    });
}

function deleteMyPhanAnh(id, phone) {
    showCustomConfirm("Xác Nhận Xóa", "Bạn có chắc chắn muốn xóa bài phản ánh này không?", true, async (isYes) => {
        if(isYes) {
            db.phanAnh = db.phanAnh.filter(p => p.id !== id);
            await saveDB();
            renderPhanAnh();
            loadMyPhanAnhList();
            showCustomConfirm("Thành Công", "Đã xóa bài phản ánh thành công!", false, () => {});
        }
    });
}

let tempEditPaImages = [];
function openEditPaModal(id, phone) {
    let item = db.phanAnh.find(p => p.id === id && p.sdt === phone);
    if(!item) { showCustomConfirm("Lỗi", "Số điện thoại không khớp, không thể sửa bài!", false, () => {}); return; }

    const m = document.getElementById('edit-pa-modal');
    if(!m) return;
    document.getElementById('edit-pa-id').value = item.id;
    document.getElementById('edit-pa-hoten').value = item.hoten;
    document.getElementById('edit-pa-sdt').value = item.sdt;
    document.getElementById('edit-pa-diachi').value = item.diachi;
    document.getElementById('edit-pa-noidung').value = item.noidung;
    tempEditPaImages = item.images ? [...item.images] : [];
    renderEditPaImagePreviews();
    m.classList.remove('hidden');
}

function closeEditPaModal() {
    const m = document.getElementById('edit-pa-modal');
    if(m) m.classList.add('hidden');
    tempEditPaImages = [];
}

function handleEditPaImages(e) {
    const files = e.target.files;
    for(let i=0; i<files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            tempEditPaImages.push(evt.target.result);
            renderEditPaImagePreviews();
        };
        reader.readAsDataURL(files[i]);
    }
}

function renderEditPaImagePreviews() {
    const preview = document.getElementById('edit-pa-image-preview');
    if(!preview) return;
    preview.innerHTML = '';
    tempEditPaImages.forEach((imgSrc, idx) => {
        preview.innerHTML += `
            <div class="relative inline-block">
                <img src="${imgSrc}" class="w-12 h-12 object-cover rounded-xl border">
                <button type="button" onclick="removeTempEditPaImage(${idx})" class="absolute -top-1 -right-1 bg-red-600 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold shadow"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
    });
}

function removeTempEditPaImage(idx) {
    tempEditPaImages.splice(idx, 1);
    renderEditPaImagePreviews();
}

async function submitEditPhanAnh(e) {
    e.preventDefault();
    const id = document.getElementById('edit-pa-id').value;
    let item = db.phanAnh.find(p => p.id == id);
    if(item) {
        item.hoten = document.getElementById('edit-pa-hoten').value.trim();
        item.diachi = document.getElementById('edit-pa-diachi').value.trim();
        item.noidung = document.getElementById('edit-pa-noidung').value.trim();
        if(tempEditPaImages.length > 0) item.images = [...tempEditPaImages];
        await saveDB();
        renderPhanAnh();
        closeEditPaModal();
        showCustomConfirm("Thành Công", "Đã cập nhật phản ánh thành công!", false, () => {});
    }
}

function promptDeletePhanAnh(id) {
    showCustomConfirm("Xác Nhận Xóa", "Cán bộ Cấp 1: Bạn có muốn xóa bài phản ánh này không?", true, async (isYes) => {
        if(isYes) {
            db.phanAnh = db.phanAnh.filter(p => p.id !== id);
            await saveDB();
            renderPhanAnh(currentPaFilter);
            showCustomConfirm("Thành Công", "Đã xóa bài phản ánh!", false, () => {});
        }
    });
}

async function updatePhanAnhStatus(id, newStatus) {
    let item = db.phanAnh.find(p => p.id === id);
    if(item) {
        item.status = newStatus;
        await saveDB();
        renderPhanAnh(currentPaFilter);
    }
}

function renderPhanAnh(filterStatus = 'all') {
    const container = document.getElementById('phan-anh-list-container');
    if(!container) return;
    container.innerHTML = '';

    let itemsToRender = db.phanAnh;
    if(portalRole === 'chibo' && filterStatus !== 'all') {
        itemsToRender = db.phanAnh.filter(p => p.status === filterStatus);
    }

    if(itemsToRender.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-center py-4 text-xs">Chưa có phản ánh nào.</p>`;
        return;
    }

    let isOfficer = currentUser && (currentUser.type === 'cap1' || currentUser.type === 'chu' || currentUser.type === 'andanh');

    itemsToRender.forEach(p => {
        let imgsHtml = '';
        if(p.images && p.images.length > 0) {
            let encodedImgs = encodeURIComponent(JSON.stringify(p.images));
            p.images.forEach((img, i) => {
                imgsHtml += `<img src="${img}" onclick="openLightboxFromGallery('${encodedImgs}', ${i})" class="w-16 h-16 object-cover rounded-xl border cursor-pointer hover:opacity-90 transition">`;
            });
        }

        let statusColor = p.status === 'Đang chờ' ? 'text-amber-600 bg-amber-50' : (p.status === 'Đang xử lý' ? 'text-blue-600 bg-blue-50' : 'text-teal-600 bg-teal-50');
        
        let contactInfoHtml = '';
        let officerActions = '';

        if(isOfficer) {
            contactInfoHtml = `<p class="font-bold text-travelPrimary">Người gửi: ${p.hoten} - SĐT: ${p.sdt}</p>`;
            if(p.lat && p.lng) {
                contactInfoHtml += `<p class="text-[10px] text-purple-700 font-semibold"><i class="fa-solid fa-location-dot"></i> GPS: ${p.lat}, ${p.lng} (<a href="https://maps.google.com/?q=${p.lat},${p.lng}" target="_blank" class="underline">Mở Bản Đồ</a>)</p>`;
            }
            officerActions = `
                <div class="flex gap-1 mt-2 pt-2 border-t items-center justify-between">
                    <div class="flex gap-1">
                        <button onclick="updatePhanAnhStatus(${p.id}, 'Đang chờ')" class="px-2 py-1 bg-amber-100 text-amber-800 rounded text-[10px] font-semibold">Chưa xử lý</button>
                        <button onclick="updatePhanAnhStatus(${p.id}, 'Đang xử lý')" class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-[10px] font-semibold">Đang xử lý</button>
                        <button onclick="updatePhanAnhStatus(${p.id}, 'Đã xử lý')" class="px-2 py-1 bg-teal-100 text-teal-800 rounded text-[10px] font-semibold">Đã xử lý</button>
                    </div>
                    <button onclick="promptDeletePhanAnh(${p.id})" class="text-red-500 font-bold text-[11px]"><i class="fa-solid fa-trash"></i> Xóa Bài</button>
                </div>
            `;
        } else {
            contactInfoHtml = `<p class="font-bold text-gray-700 dark:text-gray-300">Người gửi: ${p.hoten}</p>`;
        }

        container.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border text-xs space-y-1.5 shadow-sm">
                <div class="flex justify-between items-center font-bold">
                    ${contactInfoHtml}
                    <span class="px-2 py-0.5 rounded font-bold ${statusColor} shrink-0">${p.status}</span>
                </div>
                <p class="text-gray-600 dark:text-gray-300 whitespace-pre-line">${p.noidung}</p>
                <div class="flex gap-1.5 flex-wrap pt-1">${imgsHtml}</div>
                <p class="text-[10px] text-gray-400">Địa chỉ: ${p.diachi} | Ngày: ${p.date}</p>
                ${officerActions}
            </div>
        `;
    });
}

// ================= LIGHTBOX XEM ẢNH TOÀN MÀN HÌNH & GESTURES =================
let lightboxImagesArray = [];
let lightboxCurrentIndex = 0;
let touchStartX = 0;
let touchStartY = 0;

function openLightboxFromGallery(encodedJsonStr, index) {
    try {
        lightboxImagesArray = JSON.parse(decodeURIComponent(encodedJsonStr));
        lightboxCurrentIndex = index;
        showLightboxImage();
        const lb = document.getElementById('lightbox-modal');
        if(lb) lb.classList.remove('hidden');
    } catch(e) {}
}

function showLightboxImage() {
    const imgEl = document.getElementById('lightbox-img-el');
    const counterEl = document.getElementById('lightbox-counter');
    if(imgEl && lightboxImagesArray.length > 0) {
        imgEl.src = lightboxImagesArray[lightboxCurrentIndex];
    }
    if(counterEl) {
        counterEl.innerText = `Ảnh ${lightboxCurrentIndex + 1} / ${lightboxImagesArray.length}`;
    }
}

function nextLightboxImage() {
    if(lightboxImagesArray.length === 0) return;
    lightboxCurrentIndex = (lightboxCurrentIndex + 1) % lightboxImagesArray.length;
    showLightboxImage();
}

function prevLightboxImage() {
    if(lightboxImagesArray.length === 0) return;
    lightboxCurrentIndex = (lightboxCurrentIndex - 1 + lightboxImagesArray.length) % lightboxImagesArray.length;
    showLightboxImage();
}

function closeLightbox() {
    const lb = document.getElementById('lightbox-modal');
    if(lb) lb.classList.add('hidden');
    lightboxImagesArray = [];
}

function setupLightboxGestures() {
    const box = document.getElementById('lightbox-container-box');
    if(!box) return;

    box.addEventListener('touchstart', (e) => {
        if(e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }, {passive: true});

    box.addEventListener('touchend', (e) => {
        if(e.changedTouches.length === 1) {
            let touchEndX = e.changedTouches[0].clientX;
            let touchEndY = e.changedTouches[0].clientY;
            let diffX = touchEndX - touchStartX;
            let diffY = touchEndY - touchStartY;

            if(Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
                if(diffX < 0) {
                    nextLightboxImage();
                } else {
                    prevLightboxImage();
                }
            }
            else if(Math.abs(diffY) > 80 && Math.abs(diffY) > Math.abs(diffX)) {
                closeLightbox();
            }
        }
    }, {passive: true});
}

// ================= CÁC TÍNH NĂNG KHÁC =================
let tempHopFile = "";
function openHopModal() { const m = document.getElementById('hop-modal'); if(m) m.classList.remove('hidden'); }
function closeHopModal() { const m = document.getElementById('hop-modal'); if(m) m.classList.add('hidden'); tempHopFile = ""; }
function submitHopChiBo(e) {
    e.preventDefault();
    if(currentUser && currentUser.type === 'cap2') {
        showCustomConfirm("Lỗi", "Cấp 2 chỉ có quyền xem!", false, () => {}); return;
    }
    const title = document.getElementById('hop-title').value.trim();
    const content = document.getElementById('hop-content').value.trim();
    const fileInput = document.getElementById('hop-file');

    let saveRecord = async () => {
        db.hopChiBo.unshift({
            id: Date.now(),
            title,
            content,
            file: tempHopFile,
            fileName: fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0].name : "",
            author: currentUser ? currentUser.username : "Cán bộ"
        });
        await saveDB(); closeHopModal(); renderHopChiBo(); e.target.reset();
        showCustomConfirm("Thành Công", "Đăng lịch họp thành công!", false, () => {});
    };

    if(fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function(evt) {
            tempHopFile = evt.target.result;
            await saveRecord();
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
        showCustomConfirm("Lỗi", "Chỉ Cấp 1 và Cấp 2 mới có quyền xem nội bộ!", false, () => {});
        return; 
    }
    activeBqTab = tab;
    const btnCd = document.getElementById('btn-bq-congdong');
    const btnNb = document.getElementById('btn-bq-noibo');
    if(btnCd) btnCd.className = tab === 'congdong' ? "px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800" : "px-3 py-1 rounded-full text-xs font-bold text-gray-500";
    if(btnNb && currentUser && (currentUser.type === 'cap1' || currentUser.type === 'cap2' || currentUser.type === 'chu' || currentUser.type === 'andanh')) {
        btnNb.className = tab === 'noibo' ? "px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800" : "px-3 py-1 rounded-full text-xs font-bold text-gray-500";
    }
    renderBieuQuyet();
}

function openBqModal() { const m = document.getElementById('bq-modal'); if(m) m.classList.remove('hidden'); }
function closeBqModal() { const m = document.getElementById('bq-modal'); if(m) m.classList.add('hidden'); }
async function submitBieuQuyet(e) {
    e.preventDefault();
    if(currentUser && currentUser.type === 'cap2') {
        showCustomConfirm("Lỗi", "Cấp 2 không có quyền tạo!", false, () => {}); return;
    }
    db.bieuQuyet.unshift({
        id: Date.now(),
        title: document.getElementById('bq-title').value.trim(),
        options: document.getElementById('bq-options').value.split(',').map(o => o.trim()),
        type: document.getElementById('bq-type').value,
        votes: {}
    });
    await saveDB(); closeBqModal(); renderBieuQuyet(); e.target.reset();
    showCustomConfirm("Thành Công", "Đã phát động biểu quyết mới!", false, () => {});
}

async function voteBieuQuyet(bqId, optionIndex) {
    let bq = db.bieuQuyet.find(b => b.id === bqId);
    if(bq) {
        if(bq.type === 'noibo' && (!currentUser || (currentUser.type !== 'cap1' && currentUser.type !== 'cap2' && currentUser.type !== 'chu' && currentUser.type !== 'andanh'))) {
            showCustomConfirm("Lỗi", "Bạn không có quyền bình chọn nội bộ!", false, () => {});
            return;
        }
        if(!bq.votes) bq.votes = {};
        let voterName = currentUser ? currentUser.username : ('Khách_' + Math.floor(Math.random()*1000));
        bq.votes[voterName] = optionIndex;
        await saveDB();
        renderBieuQuyet();
        showCustomConfirm("Thành Công", "Đã bỏ phiếu thành công!", false, () => {});
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

async function sendChatMessage(e) {
    e.preventDefault();
    const nameEl = document.getElementById('chat-input-name');
    const msgEl = document.getElementById('chat-input-msg');
    const name = nameEl ? nameEl.value.trim() : '';
    const msg = msgEl ? msgEl.value.trim() : '';
    if(!name) { showCustomConfirm("Lỗi", "Vui lòng nhập tên!", false, () => {}); return; }
    db.chatMessages.push({ id: Date.now(), name, msg });
    await saveDB(); renderChatMessages();
    if(msgEl) msgEl.value = '';
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
    const queryEl = document.getElementById('ai-tt-query');
    const query = queryEl ? queryEl.value.trim() : '';
    const resultBox = document.getElementById('ai-search-result-box');
    if(!query) { showCustomConfirm("Lỗi", "Vui lòng nhập tên thủ tục!", false, () => {}); return; }

    if(resultBox) {
        resultBox.classList.remove('hidden');
        resultBox.innerHTML = `<p class="animate-pulse text-teal-700 font-bold"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang tra cứu...</p>`;
    }

    setTimeout(() => {
        if(resultBox) {
            resultBox.innerHTML = `
                <p class="font-bold text-travelPrimary"><i class="fa-solid fa-circle-check text-teal-600 mr-1"></i> Kết quả tra cứu: "${query}"</p>
                <div class="space-y-1 text-gray-700 dark:text-gray-300 mt-1">
                    <p><b>1. Hồ sơ:</b> Giấy tờ tùy thân bản chính.</p>
                    <p><b>2. Quy trình:</b> Nộp trực tuyến hoặc tại bộ phận một cửa.</p>
                    <p><b>3. Thời gian:</b> 01 - 03 ngày làm việc.</p>
                </div>
            `;
        }
    }, 800);
}

function officerUploadThuTuc(e) {
    e.preventDefault();
    if(currentUser && currentUser.type === 'cap2') {
        showCustomConfirm("Lỗi", "Cấp 2 chỉ có quyền xem!", false, () => {}); return;
    }
    const title = document.getElementById('off-tt-title').value.trim();
    const fileInput = document.getElementById('off-tt-file');

    if(fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function(evt) {
            db.thuTucDocs.unshift({
                id: Date.now(),
                title,
                file: evt.target.result,
                fileName: fileInput.files[0].name,
                uploader: currentUser ? currentUser.username : "Cán bộ"
            });
            await saveDB(); renderThuTucDocs(); e.target.reset();
            showCustomConfirm("Thành Công", "Đã tải lên biểu mẫu thành công!", false, () => {});
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
    const input = document.getElementById('tt-search-input');
    renderThuTucDocs(input ? input.value : "");
}

function toggleDarkMode() { document.documentElement.classList.toggle('dark'); }
function openContactModal() { const m = document.getElementById('contact-modal'); if(m) m.classList.remove('hidden'); }
function closeContactModal() { const m = document.getElementById('contact-modal'); if(m) m.classList.add('hidden'); }
