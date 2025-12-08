let editingId = null;
function updateClock() {
const clockEl = document.getElementById('clock');
const now = new Date();
const opts = {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
};
clockEl.textContent = now.toLocaleString('vi-VN', opts);
}

setInterval(updateClock, 1000);
updateClock();
/* --- HÀM CHUYỂN ĐỔI NGÀY THÁNG THÂN THIỆN --- */
function getFriendlyDate(dateStr) {
if (!dateStr) return '-';

// Lấy ngày hiện tại và các mốc so sánh
const today = new Date(todayStr());
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

// Lấy ngày của task và chuẩn hóa (bỏ giờ phút)
const [y, m, d] = dateStr.split('-').map(Number);
const taskDate = new Date(y, m - 1, d); // Đảm bảo so sánh chỉ ngày

if (taskDate.getTime() === today.getTime()) return 'Hôm nay';
if (taskDate.getTime() === tomorrow.getTime()) return 'Ngày mai';
if (taskDate.getTime() === yesterday.getTime()) return 'Hôm qua';

// Định dạng cho các ngày khác (VD: Thứ 5, 28/11)
const formatter = new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
return formatter.format(taskDate);
}
function todayStr() {
const d = new Date();
const y = d.getFullYear();
const m = String(d.getMonth() + 1).padStart(2, '0');
const day = String(d.getDate()).padStart(2, '0');
return `${y}-${m}-${day}`;
}

function buildDateTime(dateStr, timeStr) {
if (!dateStr || !timeStr) return null;
const [year, month, day] = dateStr.split('-').map(Number);
const [h, m] = timeStr.split(':').map(Number);
return new Date(year, month - 1, day, h, m);
}

// ==========================
// Lưu trữ công việc (localStorage)
// ==========================

const STORAGE_KEY = 'timefocus_tasks_v1';
// --- KHAI BÁO ÂM THANH ---
/* ================================================= */
/* --- KHAI BÁO ÂM THANH (LINK ỔN ĐỊNH) --- */
/* ================================================= */
/* ================================================= */
/* --- HỆ THỐNG ÂM THANH (DÙNG WEB AUDIO API - KHÔNG CẦN LINK) --- */
/* ================================================= */

// 1. Khởi tạo "Dàn nhạc"
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// 2. Hàm tự tạo tiếng động (Synth)
function playTone(freq, type, duration) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; // 'sine', 'square', 'triangle'
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime); // Âm lượng nhỏ vừa
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// 3. Hàm phát âm thanh theo tên hành động
function playSound(name) {
    try {
        switch (name) {
            case 'click':
                // Tiếng "Tách" nhẹ (Click chuột)
                playTone(600, 'sine', 0.1);
                break;
                
            case 'start':
                // Tiếng "Tu-tút" (Bắt đầu - Giống game Mario)
                playTone(400, 'triangle', 0.1);
                setTimeout(() => playTone(600, 'triangle', 0.2), 100);
                break;
                
            case 'trash':
                // Tiếng "Bụp" trầm (Xóa)
                playTone(150, 'square', 0.15);
                break;
                
            case 'success':
                // Tiếng "Ting Ting" (Hoàn thành - Link ngoài vì khó giả lập hay)
                const successSound = new Audio('https://www.soundjay.com/misc/sounds/magic-chime-01.mp3');
                successSound.volume = 0.5;
                successSound.play().catch(e => console.log('Chặn play:', e));
                break;
        }
    } catch (e) {
        console.error("Lỗi âm thanh:", e);
    }
}


const IMPORTANT_TASKS_KEY = 'timefocus_important_tasks_v1';
let tasks = [];
let importantTasks = [];
// --- BIẾN CHO CHẾ ĐỘ CÔNG VIỆC (MỚI) ---
let taskTimerInterval = null; // Biến đếm giờ riêng cho công việc
let activeTaskId = null;      // ID của công việc đang làm
// [MỚI] Hàm chuyển Tab hiển thị
function switchTimerTab(tabName) {
const pomoContainer = document.getElementById('pomodoroContainer');
const taskContainer = document.getElementById('taskTimerContainer');
const tabPomo = document.getElementById('tabPomodoroBtn');
const tabTask = document.getElementById('tabTaskBtn');

if (tabName === 'pomodoro') {
    pomoContainer.style.display = 'block';
    taskContainer.style.display = 'none';
    tabPomo.classList.add('active');
    tabTask.classList.remove('active');
} else {
    pomoContainer.style.display = 'none';
    taskContainer.style.display = 'block';
    tabPomo.classList.remove('active');
    tabTask.classList.add('active');
}
}
function loadTasks() {
try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
} catch (e) {
    console.error('Lỗi đọc localStorage', e);
    tasks = [];
}
}

function loadImportantTasks() {
try {
    const raw = localStorage.getItem(IMPORTANT_TASKS_KEY);
    importantTasks = raw ? JSON.parse(raw) : [];
    // Migrate old tasks without done property
    importantTasks = importantTasks.map(task => ({
    ...task,
    done: task.done ?? false
    }));
} catch (e) {
    console.error('Lỗi đọc important tasks', e);
    importantTasks = [];
}
}

function saveTasks() {
localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function saveImportantTasks() {
localStorage.setItem(IMPORTANT_TASKS_KEY, JSON.stringify(importantTasks));
}

// ==========================
// Render danh sách công việc
// ==========================

let currentFilter = 'today';
/* ============================================================ */
/* --- 3. LOGIC XỬ LÝ BỘ LỌC (DÁN CÁI NÀY VÀO ĐỂ NÚT CHẠY) --- */
/* ============================================================ */

/* ============================================================ */
/* --- LOGIC BỘ LỌC & SẮP XẾP (UPDATE: SORT TIME) --- */
/* ============================================================ */

/* ============================================================ */
/* --- LOGIC BỘ LỌC & SẮP XẾP (ULTIMATE VERSION) --- */
/* ============================================================ */

// 1. Cấu hình mặc định (ĐÃ THÊM SORT: 'desc')
let filterConfig = {
    dateType: 'today', 
    dateValue: todayStr(), 
    status: 'all',
    sort: 'desc' // desc: Giảm dần (Mới -> Cũ), asc: Tăng dần (Cũ -> Mới)
};

// 2. Lấy phần tử (ĐÃ GỘP TẤT CẢ VÀO ĐÂY)
const filterToggleBtn = document.getElementById('filterToggleBtn');
const filterDropdown = document.getElementById('filterDropdown');
const dateOptions = document.querySelectorAll('#dateFilters .filter-chip');
const statusOptions = document.querySelectorAll('#statusFilters .filter-chip');
const sortOptions = document.querySelectorAll('#sortFilters .filter-chip');
const specificDateInput = document.getElementById('filterSpecificDate');

// 3. Sự kiện bật tắt menu (Sử dụng logic Toggling đơn giản)
if (filterToggleBtn) {
    filterToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterDropdown.classList.toggle('show');
    });
}

// Logic đóng menu khi click ra ngoài
document.addEventListener('click', (e) => {
    if (filterDropdown && filterToggleBtn) {
        if (!filterDropdown.contains(e.target) && e.target !== filterToggleBtn) {
            filterDropdown.classList.remove('show');
        }
    }
});

// 4. Hàm xử lý khi chọn một chip (Thời gian, Trạng thái, Sắp xếp)
function handleFilterChipClick(options, configKey) {
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            // Reset active class cho tất cả
            options.forEach(d => d.classList.remove('active'));
            // Set active class cho chip vừa bấm
            opt.classList.add('active');
            
            filterConfig[configKey] = opt.dataset.val;

            // Xử lý riêng cho Date Filter
            if (configKey === 'dateType') {
                if(specificDateInput) {
                    const isSpecific = opt.dataset.val === 'specific';
                    specificDateInput.disabled = !isSpecific;
                    if (!isSpecific) {
                        filterConfig.dateValue = todayStr(); // Reset giá trị ngày cụ thể khi chuyển mode
                    }
                }
            }

            // Bấm vào chip thì đóng menu (Tùy chọn)
            // filterDropdown.classList.remove('show'); 
            
            // Render lại danh sách
            renderTasks();
            playSound('click'); // (Tuỳ chọn: Thêm âm thanh click)
        });
    });
}

// Gắn sự kiện cho các nhóm
if (dateOptions) handleFilterChipClick(dateOptions, 'dateType');
if (statusOptions) handleFilterChipClick(statusOptions, 'status');
if (sortOptions) handleFilterChipClick(sortOptions, 'sort');

// 5. Xử lý chọn Ngày cụ thể
if (specificDateInput) {
    specificDateInput.addEventListener('change', (e) => {
        if (filterConfig.dateType === 'specific') {
            filterConfig.dateValue = e.target.value;
            renderTasks();
        }
    });
}

// Hàm cập nhật nhãn nút "⚡ Bộ lọc: ..."
function updateFilterButtonLabel() {
    let dateLabel = '';
    const dateType = filterConfig.dateType;
    if (dateType === 'today') dateLabel = 'Hôm nay';
    else if (dateType === 'week') dateLabel = 'Tuần này';
    else if (dateType === 'month') dateLabel = 'Tháng này';
    else if (dateType === 'all') dateLabel = 'Tất cả';
    else if (dateType === 'specific') dateLabel = 'Ngày cụ thể';

    if(filterToggleBtn) {
        filterToggleBtn.innerHTML = `⚡ Bộ lọc: ${dateLabel}`;
    }

    // [MỚI] Thêm/Xóa class active cho nút Toggle dựa trên Filter đang là Mặc định hay không
    const isDefault = dateType === 'today' && filterConfig.status === 'all' && filterConfig.sort === 'desc';
    if(filterToggleBtn) {
        if (isDefault) filterToggleBtn.classList.remove('active');
        else filterToggleBtn.classList.add('active');
    }
}


// Helper ngày tháng (KHÔNG CẦN THAY THẾ, CHỈ ĐỂ BẠN KIỂM TRA)
function isDateInThisWeek(d) {
    const today = new Date();
    const currentDay = today.getDay(); 
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); 
    const monday = new Date(today.setDate(diff));
    monday.setHours(0,0,0,0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);
    const check = new Date(d);
    return check >= monday && check <= sunday;
}
function isDateInThisMonth(d) {
    const today = new Date();
    const check = new Date(d);
    return check.getMonth() === today.getMonth() && check.getFullYear() === today.getFullYear();
}
// END OF LOGIC FILTER
// --- HÀM RENDER TASKS (CÓ SẮP XẾP) ---
function renderTasks() {
    // ======================================================================
    // FIX LOGIC: TỰ ĐỘNG DỪNG CÁC CÔNG VIỆC ĐANG CHẠY ĐÃ QUÁ HẠN
    // ======================================================================

    (function() {
        let tasksUpdated = false;
        const now = new Date();

        tasks = tasks.map(t => {
            if (t.done || !t.endTime) return t; // Bỏ qua nếu đã xong hoặc không có giờ kết thúc
            const endDateTime = buildDateTime(t.date, t.endTime);
            if (t.started && endDateTime && now.getTime() >= endDateTime.getTime()) {
                t.started = false; // BUỘC PHẢI DỪNG
                tasksUpdated = true;
            }
            return t;
        });

        if (tasksUpdated) {
            saveTasks(); // Lưu trạng thái đã sửa vào localStorage
        }
    })();
    // ----------------------------------------------------------------------
    const container = document.getElementById('tasksContainer');
    const totalTaskCount = tasks.length;
    let filtered = [];

    // Nếu không có công việc nào trong DB, hiển thị thông báo trống.
    if (!totalTaskCount) {
        container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
            <div style="font-size: 4rem; margin-bottom: 10px; opacity: 0.6;">📝</div>
            <h3 style="margin: 0; color: #475569;">Danh sách trống trơn!</h3>
            <p style="margin-top: 5px; font-size: 0.9rem;">Hãy thêm một công việc nhỏ để bắt đầu ngày mới năng suất nhé.</p>
        </div>
        `;
        // Cập nhật nhãn TỔNG và nhãn NÚT LỌC
        const sumEl = document.getElementById('taskSummary');
        if(sumEl) sumEl.textContent = `Hiển thị: 0 / Tổng: 0`;
        updateFilterButtonLabel();
        return; // DỪNG Ở ĐÂY NẾU KHÔNG CÓ CÔNG VIỆC NÀO
    }
    
    // --- LỌC (Chỉ chạy nếu có task trong DB) ---
    filtered = tasks.filter(t => {
        // Lọc thời gian
        let dateMatch = false;
        if (filterConfig.dateType === 'all') dateMatch = true;
        else if (filterConfig.dateType === 'today') dateMatch = t.date === todayStr();
        else if (filterConfig.dateType === 'specific') dateMatch = t.date === filterConfig.dateValue;
        else if (filterConfig.dateType === 'week') dateMatch = isDateInThisWeek(t.date);
        else if (filterConfig.dateType === 'month') dateMatch = isDateInThisMonth(t.date);

        // Lọc trạng thái
        let statusMatch = false;
        const now = new Date();
        const end = t.endTime ? buildDateTime(t.date, t.endTime) : null;
        const isOverdue = end && now > end;

        if (filterConfig.status === 'all') statusMatch = true;
        else if (filterConfig.status === 'done') statusMatch = t.done;
        else if (filterConfig.status === 'pending') statusMatch = !t.done && !t.started && !isOverdue;
        else if (filterConfig.status === 'in-progress') statusMatch = t.started && !t.done;

        return dateMatch && statusMatch;
    });

    // --- SẮP XẾP ---
    filtered.sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.startTime}`).getTime();
        const timeB = new Date(`${b.date}T${b.startTime}`).getTime();

        if (filterConfig.sort === 'desc') {
            return timeB - timeA; // Giảm dần (Lớn -> Nhỏ)
        } else {
            return timeA - timeB; // Tăng dần (Nhỏ -> Lớn)
        }
    });

    // Cập nhật nhãn nút bộ lọc
    updateFilterButtonLabel();

    // 💡 SỬA LỖI #3: HIỂN THỊ NẾU CÓ CÔNG VIỆC NHƯNG KHÔNG CÓ CÔNG VIỆC NÀO PHÙ HỢP
    if (!filtered.length) {
        container.innerHTML = '<p class="tasks-empty" style="text-align:center; padding: 20px 0;">Không có công việc nào phù hợp với bộ lọc hiện tại.</p>';
    } else {
        let html = '<div class="table-wrapper"><table><thead><tr>' +
        '<th>Công việc</th>' +
        '<th>Ngày</th>' +
        '<th>Bắt đầu</th>' +
        '<th>Kết thúc</th>' +
        '<th>🏆 Phần thưởng</th>' +
        '<th>Nhắc trước</th>' +
        '<th>Trạng thái</th>' +
        '<th>Hành động</th>' +
        '</tr></thead><tbody>';

        const now = new Date();

        for (const t of filtered) { 
        const start = buildDateTime(t.date, t.startTime);
        const end = t.endTime ? buildDateTime(t.date, t.endTime) : null;
        
        const isOverDue = end && now > end && !t.done; 
        
        let rowClass = '';
        if (t.done) {
            rowClass = 'task-done';
        } else if (isOverDue) {
            rowClass = 'task-overdue';
        }
        let statusContent = ''; 
        if (t.done) statusContent = '<span class="badge badge-done">ĐÃ HOÀN THÀNH</span>';
        else if (t.started) statusContent = '<span class="badge badge-in-progress">ĐANG THỰC HIỆN</span>';
        else if (end && now > end) statusContent = '<span class="badge badge-late">QUÁ HẠN</span>';
        else statusContent = '<span class="badge badge-pending">CHƯA BẮT ĐẦU</span>';

        let actionButtons = '';
        actionButtons += `<button class="btn-small btn-outline" onclick="loadTaskForEdit(${t.id})" title="Sửa công việc">✏️</button>`;
        if (t.link) {
            let safeLink = t.link.startsWith('http') ? t.link : 'https://' + t.link;
            
            // [UPDATE MỚI] Kiểm tra xem có chế độ Auto Open không
            let linkIcon = '🔗'; // Mặc định là cái xích
            let linkTitle = 'Mở tài liệu';
            let extraClass = '';

            if (t.autoOpen) {
                linkIcon = '⚡'; // Nếu tự động mở -> Đổi thành tia sét
                linkTitle = 'Link này sẽ TỰ ĐỘNG mở khi đến giờ!';
                extraClass = 'auto-link'; // Thêm class để tô màu vàng
            }

            // Thêm class ${extraClass} vào thẻ a
            actionButtons += `<a href="${safeLink}" target="_blank" class="btn-link-action ${extraClass}" title="${linkTitle}">${linkIcon}</a>`;
        }
        const isOverdue = end && now > end; 
        if (!t.done) {
            if (!isOverdue && !t.started) actionButtons += `<button class="btn-small btn-start" onclick="startTask(${t.id})" title="Bắt đầu">▶</button>`;
            if (!isOverdue) actionButtons += `<button class="btn-small btn-success" onclick="markDone(${t.id})" title="Hoàn thành">✓</button>`;
        }
        actionButtons += `<button class="btn-small btn-danger" onclick="deleteTask(${t.id})" title="Xóa">✕</button>`;

        html += `<tr class="${rowClass} task-item" draggable="true" data-id="${t.id}"
            ondragstart="onDragStart(event)" ondragend="onDragEnd(event)"
            ondragover="onDragOver(event)" ondragleave="onDragLeave(event)" ondrop="onDrop(event)">
            <td><div style="font-weight:600;">${t.title}</div></td>
            <td>${getFriendlyDate(t.date) || '-'}</td>
            <td>${t.startTime || '-'}</td>
            <td>${t.endTime || '-'}</td>
            <td><div class="reward-box" title="${t.reward || 'Chưa chọn'}">${t.reward || '-'}</div></td>
            <td>${t.reminderMinutes} phút</td>
            <td>${statusContent}</td>
            <td><div class="task-actions">${actionButtons}</div></td>
        </tr>`;
        }
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }

    // Cập nhật nhãn TỔNG
    const sumEl = document.getElementById('taskSummary');
    if(sumEl) sumEl.textContent = `Hiển thị: ${filtered.length} / Tổng: ${totalTaskCount}`;
}

function markDone(id) {
// 1. Cập nhật dữ liệu
tasks = tasks.map(t => t.id === id ? { ...t, done: true } : t);
saveTasks();
renderTasks();

gainXP(20);

// 2. KÍCH HOẠT PHÁO HOA
// Bắn bên trái
confetti({
    origin: { x: 0.3, y: 0.8 },
    angle: 60,
    spread: 55,
    particleCount: 60,
    colors: ['#6366f1', '#ec4899', '#f59e0b']
});
// Bắn bên phải
confetti({
    origin: { x: 0.7, y: 0.8 },
    angle: 120,
    spread: 55,
    particleCount: 60,
    colors: ['#6366f1', '#ec4899', '#f59e0b']
});

// Âm thanh ting ting (Tùy chọn)
// const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-09.mp3');
// audio.play();
}
window.markDone = markDone;

function deleteTask(id) {
playSound('trash');
if (!confirm('Xoá công việc này?')) return;

// Tìm dòng cần xóa trong bảng để thêm hiệu ứng
const btn = document.querySelector(`button[onclick="deleteTask(${id})"]`);
if (btn) {
    const row = btn.closest('tr');
    if (row) {
        row.classList.add('slide-out'); // Kích hoạt hiệu ứng CSS
        
        // Đợi 400ms cho hiệu ứng chạy xong rồi mới xóa dữ liệu thật
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
        }, 350);
        return;
    }
}

// Fallback nếu không tìm thấy dòng (xóa ngay)
tasks = tasks.filter(t => t.id !== id);
saveTasks();
renderTasks();
}
window.deleteTask = deleteTask;
// [CẬP NHẬT] Hàm Bắt đầu công việc -> Kích hoạt Tab Công việc
function startTask(id) {
playSound('start');
const task = tasks.find(t => t.id === id);
if (!task) return;

// 1. Nếu Pomodoro đang chạy thì dừng lại để tập trung vào Task
if (pomodoroRunning) {
    pausePomodoro(); // Hoặc resetPomodoro() nếu muốn tắt hẳn
}

// 2. Cập nhật dữ liệu Task (Start time = Now)
const now = new Date();
const h = String(now.getHours()).padStart(2, '0');
const m = String(now.getMinutes()).padStart(2, '0');
const timeString = `${h}:${m}`;

// Lưu giờ bắt đầu vào task (nếu chưa có)
tasks = tasks.map(t => {
    if (t.id === id) {
        // Nếu chưa có giờ bắt đầu thì gán giờ hiện tại
        // Nếu đã có rồi thì giữ nguyên để tính đúng tiến độ
        const newStart = t.startTime ? t.startTime : timeString;
        return { ...t, started: true, startTime: newStart }; 
    }
    // Dừng các task khác đang chạy (chỉ làm 1 việc 1 lúc)
    if (t.id !== id && t.started) {
            return { ...t, started: false };
    }
    return t;
});

saveTasks();
renderTasks();

// 3. CHUYỂN SANG TAB CÔNG VIỆC VÀ ĐẾM NGƯỢC
activeTaskId = id;
switchTimerTab('task'); // Chuyển giao diện
runTaskTimer(task);     // Gọi hàm đếm ngược
}
// [MỚI] Logic đếm ngược cho Công việc cụ thể
// [CẬP NHẬT VIP] Hàm đếm ngược công việc + Thanh Deadline + Pháo hoa
function runTaskTimer(task) {
const titleEl = document.getElementById('activeTaskLabel');
const displayEl = document.getElementById('taskTimerDisplay');
const statusEl = document.getElementById('taskTimerStatus');
const progressBar = document.getElementById('taskProgressBar'); // Lấy thanh tiến độ

// 1. Cập nhật giao diện nút bấm
document.getElementById('btnSelectTask').style.display = 'none';
const btnStop = document.getElementById('btnStopTask');
btnStop.style.display = 'inline-flex';
btnStop.innerHTML = "⏹ Dừng làm việc";
btnStop.className = "btn-small btn-danger"; 
btnStop.setAttribute('onclick', 'stopTaskTimer()');
displayEl.style.opacity = "1";

titleEl.textContent = `Đang làm: ${task.title}`;

if (taskTimerInterval) clearInterval(taskTimerInterval);

// Kiểm tra dữ liệu giờ
if (!task.endTime || !task.startTime) {
    displayEl.textContent = "00:00:00";
    if(progressBar) progressBar.style.width = "0%";
    return;
}

// Parse thời gian (Giả định cùng ngày)
const nowRef = new Date();
const [sH, sM] = task.startTime.split(':').map(Number);
const [eH, eM] = task.endTime.split(':').map(Number);

const startDate = new Date(nowRef.getFullYear(), nowRef.getMonth(), nowRef.getDate(), sH, sM, 0);
const endDate = new Date(nowRef.getFullYear(), nowRef.getMonth(), nowRef.getDate(), eH, eM, 0);

// Tổng thời gian dự kiến (Total Duration)
const totalDuration = endDate - startDate;

function updateTimer() {
    const current = new Date();
    const diff = endDate - current; // Thời gian còn lại
    const elapsed = current - startDate; // Thời gian đã trôi qua

    // --- A. XỬ LÝ HẾT GIỜ ---
    if (diff <= 0) {
        clearInterval(taskTimerInterval);
        displayEl.textContent = "00:00:00";
        statusEl.textContent = "⚠️ Đã hết thời gian dự kiến!";
        
        // Full thanh đỏ
        if(progressBar) {
            progressBar.style.width = "100%";
            progressBar.style.backgroundColor = "#ef4444";
        }
        
        playSound('success'); 
        sendNotification("HẾT GIỜ!", `Công việc "${task.title}" đã đến hạn.`);
        
        // Tự động bắn pháo hoa chúc mừng (hoặc cảnh báo)
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        
        updateBrowserTitle(null);
        return;
    }

    // --- B. HIỂN THỊ SỐ ---
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const timeString = String(hours).padStart(2, '0') + ':' + 
                        String(minutes).padStart(2, '0') + ':' + 
                        String(seconds).padStart(2, '0');

    displayEl.textContent = timeString;
    updateBrowserTitle(timeString, 'task');
    statusEl.textContent = `Hãy hoàn thành trước ${task.endTime}`;

    // --- C. XỬ LÝ THANH TIẾN ĐỘ (DEADLINE VISUALIZER) ---
    if (progressBar && totalDuration > 0) {
        // Tính % đã trôi qua
        let percent = (elapsed / totalDuration) * 100;
        percent = Math.max(0, Math.min(100, percent)); // Giới hạn 0-100%
        
        progressBar.style.width = `${percent}%`;

        // Logic đổi màu theo mức độ "Cháy"
        if (percent < 50) {
            // < 50%: Màu Xanh dương (Thư thái)
            progressBar.style.backgroundColor = '#3b82f6'; 
            progressBar.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.4)';
        } else if (percent < 85) {
            // 50% - 85%: Màu Vàng (Cảnh báo)
            progressBar.style.backgroundColor = '#f59e0b';
            progressBar.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.4)';
        } else {
            // > 85%: Màu Đỏ (Sắp hết giờ!)
            progressBar.style.backgroundColor = '#ef4444'; 
            progressBar.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.6)';
        }
    }
}

updateTimer(); 
taskTimerInterval = setInterval(updateTimer, 1000);
}
window.startTask = startTask;
window.startTask = startTask;
// [MỚI] Dừng đếm giờ công việc
// [SỬA LẠI] Dừng đếm giờ nhưng GIỮ NGUYÊN số hiển thị
// [CẬP NHẬT] Dừng đếm giờ -> Hiện lại nút chọn
// [CẬP NHẬT] Hàm Dừng: Biến nút Dừng thành nút Tiếp tục
function stopTaskTimer() {
// 1. Ngừng đếm giờ
if (taskTimerInterval) {
    clearInterval(taskTimerInterval);
    taskTimerInterval = null;
}

document.getElementById('taskTimerStatus').textContent = "⏸ Đã tạm dừng. Bấm Tiếp tục hoặc chọn việc khác.";
document.getElementById('taskTimerDisplay').style.opacity = "0.6"; 

// 2. Xử lý Nút "Chọn việc" (Chỉ hiện chữ chọn việc)
const btnSelect = document.getElementById('btnSelectTask');
btnSelect.style.display = 'inline-flex';
btnSelect.textContent = "📋 Chọn việc khác"; 

// 3. Xử lý Nút "Dừng" -> Biến thành "Tiếp tục"
const btnStop = document.getElementById('btnStopTask');
btnStop.style.display = 'inline-flex'; // Vẫn cho hiện
btnStop.innerHTML = "▶ Tiếp tục";      // Đổi chữ
btnStop.className = "btn-small btn-success"; // Đổi sang màu Xanh (btn-success) cho đẹp
btnStop.setAttribute('onclick', 'resumeTaskTimer()'); // Gán hàm mới
// [MỚI] Reset tiêu đề về mặc định
updateBrowserTitle(null);
}
// [MỚI] Hàm Tiếp tục: Gọi lại hàm chạy giờ
function resumeTaskTimer() {
// activeTaskId là biến toàn cục lưu ID công việc đang làm (đã khai báo ở các bước trước)
const task = tasks.find(t => t.id === activeTaskId);

if (task) {
    runTaskTimer(task); // Chạy lại đồng hồ
} else {
    alert("Không tìm thấy công việc đang làm dở. Vui lòng chọn lại.");
}
}


const taskForm = document.getElementById('taskForm');
const dateInput = document.getElementById('date');
dateInput.value = todayStr();

// Xử lý dropdown phần thưởng
let selectedReward = '';
const rewardTrigger = document.getElementById('rewardTrigger');
const rewardMenu = document.getElementById('rewardMenu');
const customRewardInput = document.getElementById('customRewardInput');
const rewardItems = document.querySelectorAll('.reward-menu-item:not(.reward-custom-input-wrapper)');

rewardTrigger.addEventListener('click', (e) => {
e.preventDefault();
rewardMenu.classList.toggle('show');
});

rewardItems.forEach(item => {
item.addEventListener('click', () => {
    selectedReward = item.getAttribute('data-reward');
    rewardTrigger.textContent = item.getAttribute('data-reward');
    customRewardInput.value = '';
    rewardMenu.classList.remove('show');
});
});

customRewardInput.addEventListener('keyup', () => {
if (customRewardInput.value.trim()) {
    selectedReward = customRewardInput.value.trim();
    rewardTrigger.textContent = customRewardInput.value.trim();
}
});

document.addEventListener('click', (e) => {
if (!rewardTrigger.contains(e.target) && !rewardMenu.contains(e.target)) {
    rewardMenu.classList.remove('show');
}
});

/* ================================================= */
/* --- HÀM HIỂN THỊ HỘP THOẠI XÁC NHẬN (NEW) --- */
/* ================================================= */
function showConfirmDialog(title, message, onYes, onNo) {
    const modal = document.getElementById('confirmModal');
    const titleEl = modal.querySelector('.confirm-title');
    const msgEl = document.getElementById('confirmMessage');
    const btnYes = document.getElementById('btnConfirmYes');
    const btnNo = document.getElementById('btnConfirmNo');

    // 1. Điền nội dung
    if(title) titleEl.textContent = title;
    if(msgEl) msgEl.textContent = message;

    // 2. Hiện Modal
    modal.classList.add('show');

    // 3. Xử lý sự kiện (Dùng cloneNode để xóa sạch event cũ tránh bị lặp)
    const newYes = btnYes.cloneNode(true);
    const newNo = btnNo.cloneNode(true);
    btnYes.parentNode.replaceChild(newYes, btnYes);
    btnNo.parentNode.replaceChild(newNo, btnNo);

    // Nút YES
    newYes.addEventListener('click', () => {
        modal.classList.remove('show');
        if (onYes) onYes();
    });

    // Nút NO
    newNo.addEventListener('click', () => {
        modal.classList.remove('show');
        if (onNo) onNo();
    });
}


/* ================================================= */
/* --- XỬ LÝ FORM: SỬ DỤNG CONFIRM MỚI --- */
/* ================================================= */
taskForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // 1. Lấy dữ liệu từ Form
    const title = document.getElementById('title').value.trim();
    const taskLink = document.getElementById('taskLink').value.trim();
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const reminderVal = document.getElementById('reminder').value;
    const customRewardInput = document.getElementById('customRewardInput');
    const rewardTrigger = document.getElementById('rewardTrigger');

    // 2. Validate cơ bản
    if (!title || !date || !startTime) {
        if(typeof showToast === 'function') showToast('Thiếu thông tin', 'Vui lòng nhập tên, ngày và giờ!', 'error');
        else alert("Thiếu thông tin!");
        return;
    }

    const reminderMinutes = Math.max(0, Number(reminderVal) || 0);

    // 3. Xử lý phần thưởng
    let finalReward = customRewardInput.value.trim() || rewardTrigger.textContent;
    if (finalReward === 'Chọn phần thưởng' || finalReward.trim() === '') {
        finalReward = 'Không có thưởng';
    }

    // --- HÀM CON ĐỂ LƯU DỮ LIỆU (Được gọi sau khi người dùng chọn Yes/No) ---
    const processSaveTask = (autoOpenChoice) => {
        const taskData = {
            title, 
            link: taskLink,
            autoOpen: autoOpenChoice, // True/False tùy người dùng chọn
            linkOpened: false,
            date, startTime, endTime: endTime || '', reminderMinutes,
            reward: finalReward,
        };

        if (editingId) {
            // Chế độ Sửa
            tasks = tasks.map(t => {
                if (t.id === editingId) {
                    // Nếu link hoặc giờ thay đổi -> Reset trạng thái đã mở link
                    const isLinkChanged = (t.link !== taskLink) || (t.startTime !== startTime);
                    return { 
                        ...t, 
                        ...taskData, 
                        linkOpened: isLinkChanged ? false : t.linkOpened 
                    };
                }
                return t;
            });
            if(typeof showToast === 'function') showToast('Thành công', 'Đã cập nhật công việc!', 'success');
        } else {
            // Chế độ Thêm mới
            const newTask = {
                id: Date.now() + Math.random(), 
                ...taskData,
                done: false, 
                started: false, 
                notified: false
            };
            tasks.push(newTask);
            if(typeof showToast === 'function') showToast('Thành công', 'Đã thêm công việc mới!', 'success');
        }

        saveTasks();
        renderTasks();
        resetTaskFormUI(); 
        
        // Đóng Modal nhập liệu
        const taskModal = document.getElementById('taskModal');
        if(taskModal) taskModal.classList.remove('show');
    };

    // 4. LOGIC QUYẾT ĐỊNH: CÓ HIỆN CONFIRM KHÔNG?
    // Nếu có nhập Link -> Hiện Confirm Dialog xịn
    if (taskLink) {
        showConfirmDialog(
            "Tự động mở Link?", 
            "Bạn có muốn hệ thống TỰ ĐỘNG mở tab mới tới link này khi đến giờ học không?",
            () => { processSaveTask(true); },  // Bấm YES -> Lưu với autoOpen = true
            () => { processSaveTask(false); }  // Bấm NO -> Lưu với autoOpen = false
        );
    } else {
        // Không có link -> Lưu luôn (autoOpen = false)
        processSaveTask(false);
    }
});
// ==========================
// Xử lý nhiệm vụ quan trọng
// ==========================

const importantTaskInput = document.getElementById('importantTaskInput');
const addImportantTaskBtn = document.getElementById('addImportantTaskBtn');
const importantTasksList = document.getElementById('importantTasksList');

function renderImportantTasks() {
if (!importantTasks.length) {
    importantTasksList.innerHTML = '<div class="important-tasks-empty">Chưa có nhiệm vụ quan trọng. Thêm các việc cần ưu tiên hôm nay!</div>';
    return;
}

let html = '';
importantTasks.forEach((task, index) => {
    // top-priority for first 3
    const topCls = index < 3 ? 'top-priority' : '';
    html += `
    <div class="important-task-item ${task.done ? 'completed' : ''} ${topCls}" draggable="true" data-id="${task.id}"
            ondragstart="onImportantDragStart(event)" ondragend="onImportantDragEnd(event)"
            ondragover="onImportantDragOver(event)" ondragleave="onImportantDragLeave(event)" ondrop="onImportantDrop(event)">
        <div class="important-task-index">${index + 1}</div>
        <div class="important-task-text" title="${escapeHtml(task.text)}">${task.text}</div>
        <div class="important-task-actions">
        <button type="button" class="important-task-done" onclick="markImportantDone(${task.id})" ${task.done ? 'style="display:none"' : ''}>✓ Xong</button>
        <button type="button" class="important-task-delete" onclick="deleteImportantTask(${task.id})">✕ Xoá</button>
        </div>
    </div>
    `;
});
importantTasksList.innerHTML = html;
}

// small helper to avoid breaking attributes when text contains quotes
function escapeHtml(str) {
return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function markImportantDone(id) {
importantTasks = importantTasks.map(t => t.id === id ? { ...t, done: true } : t);
saveImportantTasks();
renderImportantTasks();
}

function deleteImportantTask(id) {
importantTasks = importantTasks.filter(t => t.id !== id);
saveImportantTasks();
renderImportantTasks();
}

// Drag & drop handlers for reordering important tasks
function onImportantDragStart(e) {
const el = e.currentTarget;
const id = el.dataset.id;
e.dataTransfer.setData('text/plain', id);
// show dragging style
el.classList.add('dragging');
}

function onImportantDragEnd(e) {
const el = e.currentTarget;
el.classList.remove('dragging');
// remove any lingering drag-over classes
document.querySelectorAll('.important-task-item.drag-over').forEach(x => x.classList.remove('drag-over'));
}

function onImportantDragOver(e) {
e.preventDefault(); // allow drop
const el = e.currentTarget;
if (!el.classList.contains('drag-over')) el.classList.add('drag-over');
}

function onImportantDragLeave(e) {
const el = e.currentTarget;
el.classList.remove('drag-over');
}

function onImportantDrop(e) {
e.preventDefault();
const targetEl = e.currentTarget;
targetEl.classList.remove('drag-over');
const draggedId = parseInt(e.dataTransfer.getData('text/plain'), 10);
const targetId = parseInt(targetEl.dataset.id, 10);
if (!draggedId || !targetId || draggedId === targetId) return;
reorderImportant(draggedId, targetId);
}

function reorderImportant(draggedId, targetId) {
const from = importantTasks.findIndex(t => t.id === draggedId);
const to = importantTasks.findIndex(t => t.id === targetId);
if (from === -1 || to === -1) return;
const [moved] = importantTasks.splice(from, 1);
importantTasks.splice(to, 0, moved);
saveImportantTasks();
renderImportantTasks();
}

window.markImportantDone = markImportantDone;
window.deleteImportantTask = deleteImportantTask;

addImportantTaskBtn.addEventListener('click', () => {
const text = importantTaskInput.value.trim();
if (!text) {
    alert('Vui lòng nhập nhiệm vụ quan trọng.');
    return;
}

importantTasks.push({
    id: Date.now(),
    text: text,
    done: false
});

saveImportantTasks();
renderImportantTasks();
importantTaskInput.value = '';
importantTaskInput.focus();
});

importantTaskInput.addEventListener('keypress', (e) => {
if (e.key === 'Enter') {
    addImportantTaskBtn.click();
}
});

// ==========================
// Thông báo trình duyệt (Modal Icon)
// ==========================

const noticeBtn = document.getElementById('noticeBtn');
const noticeModal = document.getElementById('noticeModal');
const noticeCloseBtn = document.getElementById('noticeCloseBtn');
const noticeStatusDisplay = document.getElementById('noticeStatusDisplay');
const noticeButtonGroup = document.getElementById('noticeButtonGroup');

function updateNotifyStatus() {
if (!('Notification' in window)) {
    noticeStatusDisplay.innerHTML = '<strong>⚠️ Trình duyệt không hỗ trợ Notification API.</strong>';
    noticeStatusDisplay.className = 'notice-status disabled';
    noticeButtonGroup.innerHTML = '';
    return;
}

if (Notification.permission === 'granted') {
    noticeStatusDisplay.innerHTML = '<strong>✅ Thông báo đã được bật</strong>';
    noticeStatusDisplay.className = 'notice-status enabled';
    noticeButtonGroup.innerHTML = '<button class="btn-outline" onclick="location.reload()">Đã bật - Đóng</button>';
} else if (Notification.permission === 'denied') {
    noticeStatusDisplay.innerHTML = '<strong>❌ Thông báo bị chặn</strong><br><small>Hãy kiểm tra cài đặt trình duyệt</small>';
    noticeStatusDisplay.className = 'notice-status disabled';
    noticeButtonGroup.innerHTML = '<button class="btn-outline" onclick="alert(\'Kiểm tra cài đặt quyền truy cập của trình duyệt\')">Kiểm tra cài đặt</button>';
} else {
    noticeStatusDisplay.innerHTML = '<strong>⏳ Chưa bật thông báo</strong><br><small>Bấm nút bên dưới để bật</small>';
    noticeStatusDisplay.className = 'notice-status disabled';
    noticeButtonGroup.innerHTML = '<button class="btn-primary" id="enableNotifyBtn">🔔 Bật thông báo</button>';
    
    const enableBtn = document.getElementById('enableNotifyBtn');
    if (enableBtn) {
    enableBtn.addEventListener('click', () => {
        Notification.requestPermission().then(updateNotifyStatus);
    });
    }
}
}

noticeBtn.addEventListener('click', (e) => {
e.preventDefault();
updateNotifyStatus();
noticeModal.classList.add('show');
});

noticeCloseBtn.addEventListener('click', () => {
noticeModal.classList.remove('show');
});

noticeModal.addEventListener('click', (e) => {
if (e.target === noticeModal) {
    noticeModal.classList.remove('show');
}
});

updateNotifyStatus();

function sendNotification(title, body) {
if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
} else {
    alert(title + '\n\n' + body);
}
}

function showTaskNotification(task) {
const title = 'Nhắc việc: ' + task.title;
const body =
    (task.date ? `Ngày: ${task.date}\n` : '') +
    (task.startTime ? `Giờ bắt đầu: ${task.startTime}\n` : '') +
    `Bạn đã đặt nhắc trước ${task.reminderMinutes} phút.`;

sendNotification(title, body);
}

// ==========================
// Kiểm tra để gửi thông báo
// ==========================

// --- HÀM KIỂM TRA THÔNG BÁO (ĐÃ CẬP NHẬT: BÁO QUÁ HẠN) ---
// --- HÀM KIỂM TRA THÔNG BÁO (NHẮC VIỆC & QUÁ HẠN) ---
function checkNotifications() {
const now = new Date();
let hasChanges = false;

tasks.forEach(task => {
    if (task.done) return; // Xong rồi thì thôi
    if (!task.date || !task.startTime) return;

    const start = buildDateTime(task.date, task.startTime);
    if (!start) return;

    // 1. LOGIC NHẮC VIỆC (UPCOMING)
    // Tính thời điểm cần nhắc. Ví dụ: Làm lúc 9:00, nhắc trước 10p -> Nhắc lúc 8:50
    const reminderMinutes = task.reminderMinutes || 0;
    const reminderTime = new Date(start.getTime() - reminderMinutes * 60000);
    
    // Khoảng cách từ bây giờ đến giờ nhắc
    const diff = now.getTime() - reminderTime.getTime();

    // Nếu giờ hiện tại vừa bước qua giờ nhắc (trong vòng 60 giây) VÀ chưa nhắc lần nào
    if (diff >= 0 && diff <= 60000 && !task.notified) {
        sendNotification(
        "⏰ SẮP ĐẾN GIỜ LÀM!", 
        `Chuẩn bị làm: "${task.title}" vào lúc ${task.startTime} (${reminderMinutes} phút nữa).`
        );
        task.notified = true; // Đánh dấu là đã nhắc rồi
        hasChanges = true;
    }

    // 2. LOGIC QUÁ HẠN (OVERDUE) - Báo 1 lần khi vừa hết giờ
    if (task.endTime && !task.overdueNotified) {
        const end = buildDateTime(task.date, task.endTime);
        if (end && now > end) {
        sendNotification(
            "⚠️ ĐÃ QUÁ HẠN!", 
            `Công việc "${task.title}" đã kết thúc lúc ${task.endTime}.`
        );
        task.overdueNotified = true;
        hasChanges = true;
        }
    }
});

if (hasChanges) {
    saveTasks();
    // Không cần render lại để tránh giật giao diện, chỉ cần lưu trạng thái đã nhắc
}
}
// -----------------------------------------------------------
setInterval(checkNotifications, 30 * 1000);

// ==========================
// Bộ lọc
// ==========================

const filterButtons = document.querySelectorAll('.filter-row button[data-filter]');
filterButtons.forEach(btn => {
btn.addEventListener('click', () => {
    currentFilter = btn.getAttribute('data-filter');
    renderTasks();
});
});

// ==========================
// Pomodoro 25–50 phút (REAL-TIME FIX)
// ==========================

/* --- KHAI BÁO BIẾN --- */
let pomodoroDuration = 25 * 60;
let pomodoroRemaining = pomodoroDuration;
let pomodoroTimer = null;
let pomodoroRunning = false;
let pomodoroStartTime = null;
let currentWorkMode = 25;

// [MỚI] Biến này để theo dõi: true là đang làm, false là đang nghỉ
let isWorkSession = true;
// Hàm này dùng để tua nhanh thời gian (chạy trong Console F12: warpTime(60))
function warpTime(secondsToSkip) {
    if (!pomodoroRunning) {
        alert("⚠️ Hãy bấm nút 'Bắt đầu' trước khi tua thời gian!");
        return;
    }
    // Mẹo: Dời thời điểm bắt đầu về quá khứ => Thời gian trôi qua sẽ tăng lên
    pomodoroStartTime -= (secondsToSkip * 1000);

    // Tính toán lại ngay lập tức để cập nhật màn hình
    const now = new Date().getTime();
    const elapsed = Math.floor((now - pomodoroStartTime) / 1000);
    pomodoroRemaining = pomodoroDuration - elapsed;

    if (pomodoroRemaining <= 0) pomodoroRemaining = 0;

    renderPomodoro();
    console.log(`🚀 Đã tua nhanh ${secondsToSkip} giây!`);
}
// Đưa hàm này ra global để bạn gọi được từ Console
window.warpTime = warpTime;
function switchMode() {
playSound('success'); 

if (pomodoroTimer) clearInterval(pomodoroTimer);
pomodoroRunning = false;
pomodoroStartTime = null;

if (isWorkSession) {
    // --- KẾT THÚC GIỜ LÀM -> CHUYỂN SANG NGHỈ ---
    
    // [LOGIC MỚI] Tự động tính giờ nghỉ dựa trên chế độ làm
    let breakMins = (currentWorkMode === 50) ? 10 : 5;
    
    sendNotification("🔔 HẾT GIỜ LÀM!", `Bạn làm tốt lắm. Bấm Start để nghỉ ${breakMins} phút nhé!`);
    
    isWorkSession = false; 
    pomodoroDuration = breakMins * 60; // Set giờ nghỉ tương ứng
    pomodoroRemaining = pomodoroDuration; 
    
    statusEl.textContent = `☕ Sẵn sàng nghỉ giải lao (${breakMins} phút). Bấm Bắt đầu để đếm ngược.`;
} else {
    // --- KẾT THÚC GIỜ NGHỈ -> CHUYỂN VỀ LÀM ---
    
    // Quay lại đúng chế độ cũ (25 hoặc 50)
    let workMins = currentWorkMode;
    
    sendNotification("🔔 HẾT GIỜ NGHỈ!", `Đã nạp đủ năng lượng chưa? Bấm Start để chiến tiếp ${workMins} phút!`);
    
    isWorkSession = true; 
    pomodoroDuration = workMins * 60; 
    pomodoroRemaining = pomodoroDuration; 
    
    statusEl.textContent = `🔥 Sẵn sàng làm việc (${workMins} phút). Bấm Bắt đầu để tập trung.`;
}

renderPomodoro();
updateButtonUI('start'); 
}

const startBtn = document.getElementById('pomodoroStartBtn');
const display = document.getElementById('pomodoroDisplay');
const statusEl = document.getElementById('pomodoroStatus');

/* --- CÁC HÀM XỬ LÝ --- */
function formatSeconds(sec) {
const m = Math.floor(sec / 60);
const s = sec % 60;
return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// [CẬP NHẬT] Render Pomodoro + Update Title Tab
// [CẬP NHẬT] Render Pomodoro + Thanh Tiến Độ "VIP"
function renderPomodoro() {
const displayEl = document.getElementById('pomodoroDisplay');
const progressBar = document.getElementById('timerProgressBar');

// 1. Hiển thị số
if(displayEl) displayEl.textContent = formatSeconds(pomodoroRemaining);
// THÊM: CẬP NHẬT TIÊU ĐỀ TAB BẰNG JAVASCRIPT
// ===================================
const timeString = formatSeconds(pomodoroRemaining);
// Kiểm tra nếu đồng hồ đang chạy, thì cập nhật tiêu đề
if (pomodoroRunning) {
    // Mode: 'work' nếu đang làm, 'break' nếu đang nghỉ
    const mode = isWorkSession ? 'work' : 'break';
    updateBrowserTitle(timeString, mode);
} else {
    // Nếu không chạy (đã dừng hoặc reset), trả về mặc định
    updateBrowserTitle(null); 
}
// ------------------------------------

// 2. Tính toán phần trăm (Còn lại / Tổng số)
if (progressBar && pomodoroDuration > 0) {
    const percent = (pomodoroRemaining / pomodoroDuration) * 100;
    progressBar.style.width = `${percent}%`;

    // 3. Logic Đổi màu thông minh
    // > 50%: Màu Xanh (Thư thái)
    // 20% - 50%: Màu Vàng (Cảnh báo nhẹ)
    // < 20%: Màu Đỏ (Khẩn cấp - Sắp hết giờ)
    
    if (percent > 50) {
        progressBar.style.backgroundColor = '#22c55e'; // Xanh lá
        progressBar.style.boxShadow = '0 0 10px rgba(34, 197, 94, 0.4)';
    } else if (percent > 20) {
        progressBar.style.backgroundColor = '#f59e0b'; // Vàng cam
        progressBar.style.boxShadow = '0 0 10px rgba(245, 158, 11, 0.4)';
    } else {
        progressBar.style.backgroundColor = '#ef4444'; // Đỏ rực
        progressBar.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.6)';
    }
}
}

// Lưu trạng thái vào localStorage
function savePomodoroState() {
const state = {
    running: pomodoroRunning,
    startTime: pomodoroStartTime,
    duration: pomodoroDuration,
    remaining: pomodoroRemaining
};
localStorage.setItem('timefocus_pomodoro', JSON.stringify(state));
}

// Tải trạng thái khi mở lại web
function loadPomodoroState() {
const raw = localStorage.getItem('timefocus_pomodoro');
if (!raw) return;

const state = JSON.parse(raw);
pomodoroDuration = state.duration || 25 * 60;

if (state.running && state.startTime) {
    const now = new Date().getTime();
    const elapsed = Math.floor((now - state.startTime) / 1000);
    const currentRemaining = state.duration - elapsed;

    if (currentRemaining > 0) {
        pomodoroRunning = true;
        pomodoroStartTime = state.startTime;
        pomodoroRemaining = currentRemaining;
        startTimerInterval();
        updateButtonUI('pause');
        statusEl.textContent = 'Đang khôi phục phiên tập trung...';
    } else {
        finishPomodoro();
    }
} else if (!state.running && state.remaining < state.duration) {
    pomodoroRunning = false;
    pomodoroRemaining = state.remaining;
    pomodoroStartTime = null;
    updateButtonUI('resume');
    statusEl.textContent = 'Bạn đang tạm dừng phiên trước đó.';
    renderPomodoro();
}
}

// THAY THẾ HÀM startTimerInterval() BẰNG HÀM MỚI (FIXED)
function startTimerInterval() {
if (pomodoroTimer) clearInterval(pomodoroTimer);
pomodoroTimer = setInterval(() => {
    const now = new Date().getTime();
    const elapsed = Math.floor((now - pomodoroStartTime) / 1000);
    pomodoroRemaining = pomodoroDuration - elapsed;

    // NẾU HẾT GIỜ
    if (pomodoroRemaining <= 0) {
        clearInterval(pomodoroTimer);
        pomodoroTimer = null;
        pomodoroRunning = false;
        pomodoroRemaining = 0;
        renderPomodoro();

        // [QUAN TRỌNG] TỰ ĐỘNG CHUYỂN CHẾ ĐỘ
        switchMode();
    } else {
        renderPomodoro();
    }
}, 500);
}

function togglePomodoro() {
if (pomodoroRunning) {
    pausePomodoro(); 
} else {
    startPomodoro(); 
}
}

function startPomodoro() {
if (pomodoroRunning) return;
pomodoroRunning = true;

// Logic: Nếu là bắt đầu mới hay tiếp tục sau khi pause
if (pomodoroRemaining >= pomodoroDuration) {
    pomodoroStartTime = new Date().getTime();
} else {
    // Tính ngược lại thời điểm bắt đầu giả định để khớp với thời gian còn lại
    pomodoroStartTime = new Date().getTime() - ((pomodoroDuration - pomodoroRemaining) * 1000);
}

startTimerInterval();
updateButtonUI('pause');
// Cập nhật dòng chữ trạng thái dựa trên chế độ Làm hay Nghỉ
statusEl.textContent = isWorkSession ? 'Đang tập trung... Cố lên!' : 'Đang nghỉ ngơi... Thư giãn nhé.';
}

function pausePomodoro() {
if (!pomodoroRunning) return;
pomodoroRunning = false;

if (pomodoroTimer) {
clearInterval(pomodoroTimer);
pomodoroTimer = null;
}

// [QUAN TRỌNG] Lưu lại chính xác thời gian còn lại
if (pomodoroStartTime) {
    const now = new Date().getTime();
    const elapsed = Math.floor((now - pomodoroStartTime) / 1000);
    pomodoroRemaining = Math.max(0, pomodoroDuration - elapsed);
}

pomodoroStartTime = null;
renderPomodoro();
updateButtonUI('resume');
statusEl.textContent = 'Đã tạm dừng.';
}

function resetPomodoro() {
pomodoroRemaining = pomodoroDuration;
pomodoroRunning = false;
pomodoroStartTime = null;
if (pomodoroTimer) clearInterval(pomodoroTimer);

renderPomodoro();
updateButtonUI('start');
statusEl.textContent = 'Sẵn sàng.';
localStorage.removeItem('timefocus_pomodoro');
}

// ĐỔI TÊN HÀM: Hàm finishPomodoro() cũ chỉ nên là hàm thông báo
function notifyFinish() {
    // Logic gửi notification desktop
    const minutes = Math.floor(pomodoroDuration / 60);
    sendNotification("🎉 HOÀN THÀNH!", `Bạn đã tập trung tuyệt vời trong ${minutes} phút.`);
}
// ...

function updateButtonUI(state) {
const btn = document.getElementById('pomodoroStartBtn');
if (!btn) return;

if (state === 'pause') {
    btn.innerHTML = '⏸ Tạm dừng';
    btn.classList.add('is-running');
} else if (state === 'resume') {
    btn.innerHTML = '▶ Tiếp tục';
    btn.classList.remove('is-running');
} else {
    btn.innerHTML = '▶ Bắt đầu';
    btn.classList.remove('is-running'); 
}
}

// [MỚI] Hàm này để xử lý khi bấm nút "25 phút" hoặc "50 phút"
function setPomodoroDuration(mins) {
// [MỚI] Lưu lại chế độ vừa chọn (25 hoặc 50)
currentWorkMode = mins; 

pomodoroDuration = mins * 60;
pomodoroRemaining = pomodoroDuration;

isWorkSession = true; 
resetPomodoro();

statusEl.textContent = `Sẵn sàng (${mins} phút)`;
}
function renderTopTasks() {
return;
} 
/* --- HÀM TẠO LỜI CHÀO VÀ QUOTE (ĐÃ SỬA LỖI HIỂN THỊ) --- */
const MOTIVATIONAL_QUOTES = ["Giảm trì hoãn từng bước nhỏ, mỗi việc một thời điểm.  "]; // Giữ nguyên array quotes

/* --- HÀM TẠO LỜI CHÀO (ĐÃ FIX XUNG ĐỘT) --- */
function updateGreetingAndQuote() {
const hour = (new Date()).getHours();
let greeting = (hour < 12) ? "Chào buổi sáng!" : (hour < 18) ? "Chào buổi chiều!" : "Chào buổi tối!";
const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

// NHẮM ĐẾN THẺ MỚI (chỉ chứa lời chào)
const greetingTarget = document.getElementById('smallGreeting'); 

// NHẮM ĐẾN THẺ TAGLINE (chứa châm ngôn)
const quoteTarget = document.getElementById('subGreeting'); 

// GÁN NỘI DUNG
if (greetingTarget) greetingTarget.textContent = `${greeting}!`;
if (quoteTarget) quoteTarget.textContent = randomQuote;

// QUAN TRỌNG: Không đụng vào mainTitle nữa
}

/* --- KHỞI TẠO NÚT BẤM (FIX LỖI EVENT) --- */
const oldBtn = document.getElementById('pomodoroStartBtn');
if (oldBtn) {
const newBtn = oldBtn.cloneNode(true);
oldBtn.parentNode.replaceChild(newBtn, oldBtn);
newBtn.addEventListener('click', togglePomodoro);
}

document.getElementById('pomodoro25Btn').addEventListener('click', () => setPomodoroDuration(25));
document.getElementById('pomodoro50Btn').addEventListener('click', () => setPomodoroDuration(50));
document.getElementById('pomodoroResetBtn').addEventListener('click', resetPomodoro);

// Load lại trạng thái cũ nếu có
loadPomodoroState();
renderPomodoro();
updateGreetingAndQuote();

loadTasks();
loadImportantTasks();
renderTasks();
renderTopTasks();
renderImportantTasks();

// Re-render tasks every minute to update status in real-time
setInterval(() => {
if (document.getElementById('tasksContainer')) {
    renderTasks();
}
}, 60000);
// --- XỬ LÝ DARK MODE ---
const darkModeBtn = document.getElementById('darkModeBtn');
const body = document.body;

// Kiểm tra cài đặt cũ
if (localStorage.getItem('timefocus_darkmode') === 'enabled') {
    body.classList.add('dark-mode');
    darkModeBtn.textContent = '☀️';
}

if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('timefocus_darkmode', 'enabled');
            darkModeBtn.textContent = '☀️'; // Đổi thành mặt trời
        } else {
            localStorage.setItem('timefocus_darkmode', 'disabled');
            darkModeBtn.textContent = '🌙'; // Đổi thành mặt trăng
        }
    });
}
/* ================================================= */
/* --- XỬ LÝ NHẠC NỀN (AMBIENT SOUNDS) --- */
/* ================================================= */
/* ================================================= */
/* --- LINK NHẠC NỀN (MP3 - TƯƠNG THÍCH MỌI MÁY) --- */
/* ================================================= */
const ambienceTracks = {
    // Tiếng mưa rơi tí tách (MP3)
    rain: 'https://assets.mixkit.co/active_storage/sfx/2515/2515-preview.mp3',
    
    // Tiếng lửa trại (ĐÃ ĐỔI LINK KHÁC - Internet Archive)
    fire: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/217233/fire.mp3',
    
    // Tiếng dế kêu đêm hè (MP3)
    night: 'https://assets.mixkit.co/active_storage/sfx/1242/1242-preview.mp3'
};

/* ================================================= */
/* --- XỬ LÝ PHÁT NHẠC (PHIÊN BẢN MƯỢT - KHÔNG LAG) --- */
/* ================================================= */

let currentAmbience = null;
const ambienceAudio = new Audio();
ambienceAudio.loop = true; // Tự động lặp lại

// Đăng ký sự kiện một lần duy nhất để cập nhật giao diện
const statusText = document.getElementById('nowPlaying');

// Khi bắt đầu tải (hiện chữ Đang tải)
ambienceAudio.addEventListener('loadstart', () => {
    if(statusText) statusText.textContent = '⏳ Đang kết nối...';
});

// Khi đang tải dữ liệu (hiện % nếu cần, ở đây hiện loading)
ambienceAudio.addEventListener('waiting', () => {
    if(statusText) statusText.textContent = '⏳ Đang tải dữ liệu...';
});

// Khi bắt đầu phát nhạc thành công
ambienceAudio.addEventListener('playing', () => {
    if(statusText) {
        let name = '';
        if (currentAmbience === 'rain') name = 'Tiếng Mưa Rơi';
        else if (currentAmbience === 'fire') name = 'Lửa Trại Ấm Áp';
        else if (currentAmbience === 'night') name = 'Đêm Tĩnh Lặng';
        statusText.textContent = '🎵 Đang phát: ' + name;
    }
});

// Khi gặp lỗi
ambienceAudio.addEventListener('error', (e) => {
    console.error("Lỗi tải nhạc:", e);
    if(statusText) statusText.textContent = '❌ Lỗi kết nối. Vui lòng thử lại.';
    stopAmbience(); // Tắt nút active đi
});

// --- HÀM BẬT/TẮT ---
function toggleAmbience(type) {
    // 1. Nếu đang nghe đúng bài đó -> TẮT
    if (currentAmbience === type && !ambienceAudio.paused) {
        stopAmbience();
        return;
    }

    // 2. Reset giao diện các nút
    document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
    
    // 3. Active nút mới bấm
    const btn = document.querySelector(`.sound-btn[onclick="toggleAmbience('${type}')"]`);
    if(btn) btn.classList.add('active');

    // 4. Cập nhật nguồn nhạc
    currentAmbience = type;
    ambienceAudio.src = ambienceTracks[type];
    
    // 5. Phát nhạc (Dùng Promise để bắt lỗi Autoplay)
    // Lưu ý: Không cần gọi .load(), để trình duyệt tự lo
    const playPromise = ambienceAudio.play();

    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.warn("Trình duyệt chặn tự động phát:", error);
            if(statusText) statusText.textContent = '⚠️ Bấm lại lần nữa để phát';
            stopAmbience(); // Tắt nút active nếu bị chặn
        });
    }
}

function stopAmbience() {
    ambienceAudio.pause();
    // Reset nút
    document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
    
    if(statusText) statusText.textContent = 'Đã tắt nhạc nền';
    currentAmbience = null;
}

// Đưa hàm ra ngoài window
window.toggleAmbience = toggleAmbience;
window.stopAmbience = stopAmbience;
// Hàm: Nạp dữ liệu công việc lên Form để sửa
// Tìm hàm loadTaskForEdit cũ và thay thế bằng hàm này:
function loadTaskForEdit(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // 1. Gán ID đang sửa
    editingId = id;

    // 2. Nạp dữ liệu vào các ô Input
    document.getElementById('title').value = task.title;
    document.getElementById('date').value = task.date;
    document.getElementById('startTime').value = task.startTime;
    document.getElementById('endTime').value = task.endTime;
    document.getElementById('reminder').value = task.reminderMinutes;
    document.getElementById('taskLink').value = task.link || '';

    // 3. Xử lý phần thưởng (nạp vào ô custom hoặc hiển thị text)
    const rewardTrigger = document.getElementById('rewardTrigger');
    const customRewardInput = document.getElementById('customRewardInput');
    
    customRewardInput.value = ''; // Reset ô nhập tay
    rewardTrigger.textContent = task.reward; // Hiển thị phần thưởng cũ

    // 4. Đổi nút "Thêm" thành nút "Lưu thay đổi"
    const submitBtn = document.querySelector('#taskForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = '💾 Lưu thay đổi';
        submitBtn.classList.add('btn-warning'); 
        submitBtn.classList.remove('btn-primary');
    }

    // --- [QUAN TRỌNG NHẤT] MỞ MODAL LÊN ---
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.classList.add('show'); // <--- Dòng này giúp Pop-up hiện ra
    }
}
window.loadTaskForEdit = loadTaskForEdit;

// HÀM RESET FORM MỚI
function resetTaskFormUI() {
// Hàm này được gọi sau khi lưu thành công
document.getElementById('title').value = '';
document.getElementById('startTime').value = '';
document.getElementById('endTime').value = '';
document.getElementById('reminder').value = '10';
document.getElementById('date').value = todayStr();
document.getElementById('taskLink').value = '';

const customRewardInput = document.getElementById('customRewardInput');
const rewardTrigger = document.getElementById('rewardTrigger');
const submitBtn = document.querySelector('#taskForm button[type="submit"]');

customRewardInput.value = '';
rewardTrigger.textContent = 'Chọn phần thưởng';

// Đổi nút về trạng thái "Thêm công việc"
if (submitBtn) {
    submitBtn.textContent = '+ Thêm công việc';
    submitBtn.classList.remove('btn-warning');
    submitBtn.classList.add('btn-primary');
}

document.getElementById('title').focus();
editingId = null; // Rất quan trọng: Thoát khỏi chế độ sửa
// [MỚI] Reset trạng thái lỗi khi form được làm mới
document.getElementById('timeError').style.display = 'none';
document.getElementById('endTime').style.borderColor = '#e5e7eb';

// Mở lại nút submit (đề phòng bị khóa từ lần nhập lỗi trước)
const btn = document.querySelector('#taskForm button[type="submit"]');
if(btn) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
}
}
/* ================================================= */
/* --- HÀM HỖ TRỢ KÉO & THẢ (DRAG & DROP) --- */
/* ================================================= */

let draggedId = null; // Biến tạm lưu ID của dòng đang kéo

function onDragStart(e) {
const el = e.currentTarget;
draggedId = parseInt(el.dataset.id, 10);
e.dataTransfer.setData('text/plain', draggedId);

// Thêm hiệu ứng kéo
setTimeout(() => el.classList.add('dragging'), 0);
// Tạm thời hiển thị toàn bộ bảng để dễ kéo (chỉ dành cho Tabbed View nếu có)
// if(document.getElementById('taskFilter')) document.getElementById('taskFilter').value = 'all';
// renderTasks(); 
}

function onDragEnd(e) {
e.currentTarget.classList.remove('dragging');
draggedId = null;
// Xóa hiệu ứng nơi thả
document.querySelectorAll('tr.drag-over').forEach(x => x.classList.remove('drag-over'));
}

function onDragOver(e) {
e.preventDefault(); // Cho phép thả
const targetEl = e.currentTarget;
if (targetEl.dataset.id && parseInt(targetEl.dataset.id, 10) !== draggedId) {
    if (!targetEl.classList.contains('drag-over')) {
        document.querySelectorAll('tr.drag-over').forEach(x => x.classList.remove('drag-over'));
        targetEl.classList.add('drag-over');
    }
}
}

function onDragLeave(e) {
e.currentTarget.classList.remove('drag-over');
}

function onDrop(e) {
e.preventDefault();
const targetEl = e.currentTarget;
targetEl.classList.remove('drag-over');

const sourceId = parseInt(e.dataTransfer.getData('text/plain'), 10);
const targetId = parseInt(targetEl.dataset.id, 10);

if (sourceId && targetId && sourceId !== targetId) {
    reorderTasks(sourceId, targetId);
}
}

// Hàm quan trọng nhất: Thay đổi vị trí trong mảng tasks
function reorderTasks(sourceId, targetId) {
const fromIndex = tasks.findIndex(t => t.id === sourceId);
const toIndex = tasks.findIndex(t => t.id === targetId);

if (fromIndex === -1 || toIndex === -1) return;

// Di chuyển phần tử
const [movedTask] = tasks.splice(fromIndex, 1);
tasks.splice(toIndex, 0, movedTask);

// Đặt lại sort tạm thời về 'created' để giữ thứ tự thủ công
currentSort = 'created'; 

saveTasks();
renderTasks();
}

/* --- JAVASCRIPT FIX: TÁI KHỞI TẠO SỰ KIỆN AN TOÀN --- */

// Đảm bảo chạy sau khi toàn bộ HTML đã được tải (DOM ready)
/* ================================================= */
/* --- LOGIC KHỞI TẠO VÀ XỬ LÝ SỰ KIỆN HEADER (FIX FINAL) --- */
/* ================================================= */

window.addEventListener('DOMContentLoaded', () => {
// 1. Khai báo các phần tử DOM (Chắc chắn phải có)
const settingsToggleEl = document.getElementById('settingsToggle');
const settingsMenuEl = document.getElementById('settingsMenu');
const darkModeBtn = document.getElementById('darkModeBtn');
const noticeBtn = document.getElementById('noticeBtn');
const body = document.body;

if (!settingsToggleEl || !settingsMenuEl) {
    console.error("LỖI CẤU TRÚC: Không tìm thấy nút Settings Toggle hoặc Menu Dropdown.");
    return; 
}

// --- LOGIC GẮN SỰ KIỆN CLICK (MENU TOGGLE) ---
const toggleMenu = (e) => {
    if (e) e.stopPropagation();
    console.log("DEBUG: Settings button CLICKED. Toggling menu."); 
    settingsMenuEl.classList.toggle('show');
};

// Gắn listener cho nút ⚙️
settingsToggleEl.addEventListener('click', toggleMenu); 

// Logic đóng menu khi click ra ngoài
document.addEventListener('click', (e) => {
    if (!settingsMenuEl.contains(e.target) && e.target !== settingsToggleEl) {
        settingsMenuEl.classList.remove('show');
    }
});

// --- LOGIC NÚT BÊN TRONG (DARK MODE & NOTIFICATION) ---

// 1. Dark Mode Toggle
// --- Khối logic cho Nút Dark Mode (Thay thế logic toggle cũ) ---
if (darkModeBtn) {
    // Khôi phục trạng thái icon ban đầu
    const isDarkMode = localStorage.getItem('timefocus_darkmode') === 'enabled';
    if (isDarkMode) { body.classList.add('dark-mode'); darkModeBtn.innerHTML = '☀️ Chế độ hiển thị'; } 
    else { darkModeBtn.innerHTML = '🌙 Chế độ hiển thị'; }

    // GẮN SỰ KIỆN: Bấm mở Popup lựa chọn
    darkModeBtn.addEventListener('click', () => {
        showDarkModeSelection(); // Mở Popup lựa chọn Sáng/Tối
        settingsMenuEl.classList.remove('show'); // Đóng menu cài đặt
    });
}

// 2. Notification Button
if (noticeBtn) {
    noticeBtn.addEventListener('click', () => {
        // Mở Modal Thông báo trình duyệt
        const noticeModal = document.getElementById('noticeModal');
        if (noticeModal) {
            if (typeof updateNotifyStatus === 'function') updateNotifyStatus(); 
            noticeModal.classList.add('show');
        }
        settingsMenuEl.classList.remove('show'); // Đóng menu cài đặt
    });
}
});
/* --- JAVASCRIPT FIX: CHUYỂN SANG HOVER (TỰ ĐỘNG HIỆN) --- */

window.addEventListener('DOMContentLoaded', () => {
const settingsToggleEl = document.getElementById('settingsToggle');
const settingsMenuEl = document.getElementById('settingsMenu');
let timeout; // Biến này để tạo độ trễ khi rời chuột

if (settingsToggleEl && settingsMenuEl) {
    // 1. SHOW MENU: Khi di chuột vào nút
    settingsToggleEl.addEventListener('mouseenter', () => {
        clearTimeout(timeout);
        settingsMenuEl.classList.add('show');
    });

    // 2. HIDE MENU: Khi rời chuột khỏi nút (có độ trễ)
    settingsToggleEl.addEventListener('mouseleave', () => {
        timeout = setTimeout(() => {
            settingsMenuEl.classList.remove('show');
        }, 250); // 250ms delay
    });

    // 3. GIỮ MENU: Khi di chuột vào menu
    settingsMenuEl.addEventListener('mouseenter', () => {
        clearTimeout(timeout); // Hủy lệnh ẩn
    });

    // 4. HIDE MENU: Khi rời chuột khỏi menu
    settingsMenuEl.addEventListener('mouseleave', () => {
        timeout = setTimeout(() => {
            settingsMenuEl.classList.remove('show');
        }, 300); // 300ms delay để đóng menu
    });

    // 5. Logic cho nút Bật/Tắt (Dark Mode/Notification) vẫn dùng click
    document.getElementById('darkModeBtn').addEventListener('click', () => {
    const body = document.body;
    const btn = document.getElementById('darkModeBtn'); // Lấy lại nút để thao tác
    
    // 1. Chuyển đổi class Dark Mode
    body.classList.toggle('dark-mode');
    
    // 2. Cập nhật icon và text
    const isDarkMode = body.classList.contains('dark-mode');

    if (isDarkMode) {
        // Kích hoạt Dark Mode
        localStorage.setItem('timefocus_darkmode', 'enabled');
        btn.innerHTML = '☀️ Chế độ hiển thị'; // Icon Mặt trời
    } else {
        // Kích hoạt Light Mode
        localStorage.setItem('timefocus_darkmode', 'disabled');
        btn.innerHTML = '🌙 Chế độ hiển thị'; // Icon Mặt trăng
    }
    
    // 3. Tắt menu sau khi chọn
    const settingsMenuEl = document.getElementById('settingsMenu');
    if (settingsMenuEl) settingsMenuEl.classList.remove('show');
});

    document.getElementById('noticeBtn').addEventListener('click', (e) => {
            // ... (Chạy logic Notification của bạn) ...
            settingsMenuEl.classList.remove('show'); // Đóng menu sau khi click
    });

    // Bổ sung: Nếu bạn có code đóng menu khi click ra ngoài, hãy đảm bảo nó còn đó.
}
});

/* --- HÀM ẨN/HIỆN POPUP CHỌN CHẾ ĐỘ --- */
function showDarkModeSelection() {
    const modal = document.getElementById('noticeModal');
    const titleEl = modal.querySelector('.notice-modal-header h3');
    const contentEl = document.getElementById('noticeStatusDisplay');
    const btnGroup = document.getElementById('noticeButtonGroup');

    if (modal && titleEl && contentEl && btnGroup) {
        titleEl.textContent = "Chọn Chế độ Hiển thị";
        contentEl.innerHTML = `
            <p style="margin:0;">Tùy chỉnh giao diện để có trải nghiệm tốt nhất.</p>
            <p style="font-size: 0.9rem; margin-top: 10px; color: #94a3b8;">Lựa chọn này sẽ được lưu lại.</p>
        `;

        btnGroup.innerHTML = `
            <button class="btn-outline" onclick="setDarkMode(false)">🌙 Mode Sáng</button>
            <button class="btn-primary" onclick="setDarkMode(true)">☀️ Mode Tối</button>
        `;
        
        modal.classList.add('show');
    }
}

/* --- HÀM ĐẶT CHẾ ĐỘ (THAY CHO HÀM TOGGLE CŨ) --- */
function setDarkMode(isDark) {
    const body = document.body;
    const darkModeBtn = document.getElementById('darkModeBtn');
    
    // 1. Áp dụng class và lưu storage
    if (isDark) {
        body.classList.add('dark-mode');
        localStorage.setItem('timefocus_darkmode', 'enabled');
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('timefocus_darkmode', 'disabled');
    }
    
    // 2. Cập nhật icon của nút trong Menu Cài đặt
    if (darkModeBtn) {
        darkModeBtn.innerHTML = isDark ? '☀️ Chế độ hiển thị' : '🌙 Chế độ hiển thị';
    }

    document.getElementById('noticeModal').classList.remove('show');
} 

window.setDarkMode = setDarkMode; // Đưa hàm ra global để nút bấm trong Modal gọi được

function toggleInlineTaskMenu() {
const menu = document.getElementById('inlineTaskMenu');


if (menu.style.display === 'block') {
    menu.style.display = 'none';
    return;
}

const now = new Date(); 

const validTasks = tasks.filter(t => {
    if (t.done) return false;
    if (t.date && t.endTime) {
        const [y, m, d] = t.date.split('-').map(Number);
        const [h, min] = t.endTime.split(':').map(Number);
        const taskEnd = new Date(y, m - 1, d, h, min);
        if (now > taskEnd) return false;
    }
    return true;
});

if (validTasks.length === 0) {
    menu.innerHTML = '<div style="text-align:center; padding:20px; color:#999; font-size:0.9rem;">Không có công việc nào phù hợp.</div>';
} else {
    menu.innerHTML = validTasks.map(t => `
        <div class="inline-task-item" onclick="selectInlineTask(${t.id})">
            <div style="flex: 1; padding-right: 10px;">
                <div style="font-weight:700; font-size:0.95rem; margin-bottom:4px;" class="item-title">
                    ${t.title} ${t.started ? '<span style="color:#22c55e; font-weight:800; font-size:0.8em; -webkit-text-fill-color: #4ade80;">(ĐANG LÀM)</span>' : ''}
                </div>
                <div style="font-size:0.85rem;" class="item-sub">
                    ${t.reward ? '🎁 '+t.reward : '✨ Chưa có thưởng'}
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                <div class="time-badge start-time">
                    🚀 ${t.startTime || '--:--'}
                </div>
                ${t.endTime ? `
                <div class="time-badge end-time">
                    🏁 ${t.endTime}
                </div>` : ''}
            </div>
        </div>
    `).join('');
}

menu.style.display = 'block';
}

// [MỚI] Hàm chọn task từ menu inline
function selectInlineTask(id) {
// 1. Ẩn menu đi
document.getElementById('inlineTaskMenu').style.display = 'none';

// 2. Bắt đầu tính giờ
startTask(id);
}
/* ================================================= */
/* --- TÍNH NĂNG VIP: SMART TITLE & ANTI-CLOSE --- */
/* ================================================= */

// 1. Hàm cập nhật tiêu đề Tab trình duyệt
function updateBrowserTitle(timeString, mode) {
const defaultTitle = "TimeFocus – Quản lý thời gian";

if (timeString) {
    // Nếu có thời gian -> Hiện: [24:59] 🍅 Đang làm
    let icon = mode === 'work' ? '🍅' : (mode === 'break' ? '☕' : '💼');
    document.title = `${timeString} ${icon} - TimeFocus`;
} else {
    // Trả về mặc định
    document.title = defaultTitle;
}
}

// 2. Chặn tắt trình duyệt khi đang chạy giờ (Tránh lỡ tay)
window.onbeforeunload = function() {
if (pomodoroRunning || taskTimerInterval) {
    return "Đồng hồ đang chạy, bạn có chắc muốn thoát không?";
}
};
// [MỚI] Hàm Bật/Tắt hiển thị thanh Volume
function toggleVolumePanel() {
const panel = document.getElementById('volumeControlPanel');
const btn = document.getElementById('btnVolumeToggle');

if (panel.style.display === 'none') {
    panel.style.display = 'flex'; // Đổi thành flex để dàn ngang
    btn.classList.add('active'); 
} else {
    panel.style.display = 'none';
    btn.classList.remove('active');
}
}
// [QUAN TRỌNG] Hàm này giúp thanh trượt điều khiển được âm lượng thật
function changeVolume(val) {
if (ambienceAudio) {
    ambienceAudio.volume = val; // Gán giá trị từ thanh trượt (0.0 -> 1.0) vào loa
}
}
/* ================================================= */
/* --- FIX FINAL: BẤM RA NGOÀI TỰ TẮT VOLUME --- */
/* ================================================= */

document.addEventListener('click', function(event) {
    const panel = document.getElementById('volumeControlPanel');
    const btn = document.getElementById('btnVolumeToggle');

    // Kiểm tra xem panel và btn có tồn tại không để tránh lỗi
    if (!panel || !btn) return;

    // Nếu thanh volume đang MỞ (display không phải none)
    if (panel.style.display !== 'none') {
        
        // Logic: Nếu chỗ bạn click chuột KHÔNG nằm trong cái khung Volume
        // VÀ cũng KHÔNG phải là cái nút bấm bật tắt
        if (!panel.contains(event.target) && !btn.contains(event.target)) {
            
            // Thì ẩn nó đi
            panel.style.display = 'none';
            btn.classList.remove('active');
        }
    }
});
// [MỚI] Logic Validate Giờ Bắt đầu < Giờ Kết thúc
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const timeErrorMsg = document.getElementById('timeError');
const submitBtn = document.querySelector('#taskForm button[type="submit"]');

function validateTimes() {
    const start = startTimeInput.value;
    const end = endTimeInput.value;

    // Chỉ kiểm tra khi cả 2 ô đều đã có dữ liệu
    if (start && end) {
        if (end <= start) {
            // Lỗi: Hiện thông báo, viền đỏ, khóa nút
            timeErrorMsg.style.display = 'block';
            endTimeInput.style.borderColor = '#ef4444';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
        } else {
            // Hợp lệ: Ẩn lỗi, reset viền, mở nút
            timeErrorMsg.style.display = 'none';
            endTimeInput.style.borderColor = '#e5e7eb'; // Màu viền gốc
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    } else {
        // Chưa nhập đủ thì cứ để yên (hoặc reset về bình thường)
        timeErrorMsg.style.display = 'none';
        endTimeInput.style.borderColor = '#e5e7eb';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    }
}

// Gắn sự kiện: Cứ thay đổi là kiểm tra ngay
startTimeInput.addEventListener('input', validateTimes);
endTimeInput.addEventListener('input', validateTimes);
// ================================================= */
// --- HÀM ZEN MODE & FULLSCREEN (HỢP NHẤT) ---
// ================================================= */

function toggleZenMode() {
const body = document.body;
const isZenActive = body.classList.contains('zen-active');

// 1. TẮT ZEN MODE (Nút bấm chuột)
if (isZenActive) {
    body.classList.remove('zen-active');
    if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch((e) => {});
    }
    updateGlowOnZenMode(); // <--- GỌI HÀM CẬP NHẬT (TẮT HIỆU ỨNG)
} 

// 2. BẬT ZEN MODE (Nút bấm chuột)
else {
    body.classList.add('zen-active');
    sendNotification("🧘 ZEN MODE", "Đã bật chế độ tập trung tuyệt đối.");
    if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e) => {});
    }
    updateGlowOnZenMode(); // <--- GỌI HÀM CẬP NHẬT (BẬT HIỆU ỨNG)
}
}

// ================================================= */
// --- CHỈ GẮN MỘT LISTENER DUY NHẤT (FIX F11/ESC) ---
// ================================================= */

document.addEventListener('fullscreenchange', function() {
const body = document.body;
const isZenActive = body.classList.contains('zen-active');
const isFullscreen = document.fullscreenElement;

// Logic 1: TỰ ĐỘNG BẬT ZEN MODE khi vào Fullscreen (bằng F11)
if (isFullscreen && !isZenActive) {
    body.classList.add('zen-active');
    sendNotification("🧘 ZEN MODE", "Đã bật chế độ tập trung tuyệt đối.");
    
    updateGlowOnZenMode(); // <--- RẤT QUAN TRỌNG: KÍCH HOẠT MÀU ĐỒNG HỒ
} 

// Logic 2: TỰ ĐỘNG TẮT ZEN MODE khi thoát Fullscreen (bằng Esc/F11)
else if (!isFullscreen && isZenActive) {
    body.classList.remove('zen-active');
    
    // Khôi phục UI
    const exitBtn = document.getElementById('exitZenBtn');
    if (exitBtn) exitZenBtn.style.display = 'none';
    if (typeof renderTasks === 'function') renderTasks();
    
    updateGlowOnZenMode(); // <--- QUAN TRỌNG: XÓA MÀU ĐỒNG HỒ
}
});
// ================================================= */
// --- FIX CUỐI CÙNG: BẮT PHÍM F11 BẰNG KEYDOWN ---
// ================================================= */

document.addEventListener('keydown', function(event) {
if (event.key === 'F11' || event.keyCode === 122) {
    event.preventDefault(); // Ngăn trình duyệt tự vào Fullscreen (Quan trọng)
    
    const body = document.body;
    
    // 1. Logic BẬT (Giữ nguyên)
    if (!body.classList.contains('zen-active')) {
        body.classList.add('zen-active');
        sendNotification("🧘 ZEN MODE", "Đã bật chế độ tập trung tuyệt đối.");
        
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((e) => {});
        }
        updateGlowOnZenMode(); // <--- Kích hoạt hiệu ứng
    }
    
    // 2. Logic TẮT (SỬA LẠI: Xử lý Manual)
    else {
        // Xử lý TẮT Zen Mode ngay lập tức mà KHÔNG GỌI toggleZenMode()
        body.classList.remove('zen-active');
        
        // Tắt Fullscreen (sẽ kích hoạt fullscreenchange -> Logic 2)
        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen().catch((e) => {});
        }
        
        // HÀM NÀY SẼ ĐƯỢC CHẠY BỞI LISTENER KHÁC (Logic 2)
        // updateGlowOnZenMode(); 
    }
}
});
// ================================================= */
// --- FIX BÓNG ĐỒNG HỒ BẰNG JAVASCRIPT (FINAL - BẮT BUỘC HIỂN THỊ) ---
// ================================================= */

function applyGlowToDisplay(id) {
const display = document.getElementById(id);
const isDarkMode = document.body.classList.contains('dark-mode');

let primaryColor, rgbaColor;

// --- LỰA CHỌN MÀU SẮC DỰA TRÊN CHẾ ĐỘ ---
if (isDarkMode) {
    // CHẾ ĐỘ TỐI: MÀU HỒNG RỰC RỠ (Neon Pomodoro Gốc)
    primaryColor = '#ff4081'; 
    rgbaColor = '255, 64, 129';
} else {
    // CHẾ ĐỘ SÁNG: MÀU XANH CYAN (Màu bạn chọn gần đây)
    primaryColor = '#06b6d4'; 
    rgbaColor = '6, 182, 212';
}

if (display) {
    // Áp dụng màu và hiệu ứng bóng cho đồng hồ
    display.style.cssText = `
        color: ${primaryColor} !important;
        
        text-shadow: 
            0 0 5px rgba(${rgbaColor}, 0.5), 
            0 0 15px rgba(${rgbaColor}, 0.7), 
            0 0 25px rgba(${rgbaColor}, 0.9) !important;
        
        /* Dùng filter màu nhẹ hơn để tránh quá chói */
        filter: drop-shadow(0 0 4px rgba(${rgbaColor}, 0.6)) !important; 
    `;
}
}

function applyNeonGlow() {
// Áp dụng Glow cho đồng hồ Pomodoro
applyGlowToDisplay('pomodoroDisplay');

// Áp dụng Glow cho đồng hồ Công việc
applyGlowToDisplay('taskTimerDisplay'); 
}
// LƯU Ý: Hàm updateGlowOnZenMode() sẽ gọi hàm applyNeonGlow() này.

function updateGlowOnZenMode() {
const isZen = document.body.classList.contains('zen-active');

if (isZen) {
    applyNeonGlow(); // Gọi hàm áp dụng cho cả 2 đồng hồ
} else {
    // Xóa hiệu ứng khi Zen Mode tắt
    document.getElementById('pomodoroDisplay').style.cssText = ''; 
    
    const taskDisplay = document.getElementById('taskTimerDisplay');
    if (taskDisplay) {
        taskDisplay.style.cssText = ''; // Xóa hiệu ứng của đồng hồ Task
    }
}
}
// LƯU Ý: Đảm bảo bạn gọi hàm applyNeonGlow() khi cần, ví dụ: 
/* ================================================= */
/* --- JS FIX MODAL (CLEAN VERSION) --- */
/* ================================================= */

document.addEventListener('DOMContentLoaded', () => {
const modal = document.getElementById('taskModal');
const openBtn = document.getElementById('openTaskModalBtn');
const closeBtn = document.getElementById('closeTaskModalBtn');
const content = modal ? modal.querySelector('.task-modal-content') : null;

if (openBtn && modal) {
    // Gỡ bỏ các sự kiện cũ (bằng cách clone nút bấm)
    const newOpenBtn = openBtn.cloneNode(true);
    openBtn.parentNode.replaceChild(newOpenBtn, openBtn);

    newOpenBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Reset vị trí (Xóa code cũ nếu nó lỡ thêm vào)
        if (content) {
            content.style.top = '';
            content.style.left = '';
            content.style.position = '';
            content.style.transform = '';
        }

        // 2. Reset Form
        if (typeof resetTaskFormUI === 'function') resetTaskFormUI();
        
        // 3. Hiện Modal
        modal.classList.add('show');
    });
}

// Nút đóng
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });
}

// Click ra ngoài vùng đen thì đóng
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}
});
// ======================================================================
// [UPDATE] HÀM TÁI GẮN LISTENER CHO TASK MODAL (Đảm bảo hoạt động)
// ======================================================================
function setupTaskModalListeners() {
const modal = document.getElementById('taskModal');
const openBtn = document.getElementById('openTaskModalBtn');
const closeBtn = document.getElementById('closeTaskModalBtn');

if (!modal) return; // Không tìm thấy modal thì dừng

// 1. Logic MỞ Modal (Nút "+ Thêm công việc")
if (openBtn) {
    // Tái gắn sự kiện cho nút mở (dùng addEventListener cho an toàn)
    openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof resetTaskFormUI === 'function') resetTaskFormUI(); // Reset form
        modal.classList.add('show');
    });
}

// 2. Logic ĐÓNG Modal (Nút "X")
if (closeBtn) {
    // Gắn sự kiện click cho nút đóng
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show'); // Xóa class 'show' để ẩn modal
    });
}

// 3. Logic ĐÓNG khi click ra ngoài
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});
}


// KHU VỰC KHỞI TẠO CÁC LISTENER CHÍNH (ĐẢM BẢO GỌI HÀM)
document.addEventListener('DOMContentLoaded', () => {
// ... (Các lệnh khởi tạo khác của bạn)

// 👇👇👇 GỌI HÀM MỚI TẠI ĐÂY 👇👇👇
setupTaskModalListeners();
// ... (Các lệnh khởi tạo khác của bạn)
});

/* ================================================= */
/* --- TÍNH NĂNG TỰ ĐỘNG MỞ LINK (AUTO OPEN) --- */
/* ================================================= */

function checkAutoOpenLinks() {
    const now = new Date();
    // Tạo chuỗi ngày giờ hiện tại để so sánh: "YYYY-MM-DD HH:mm"
    const currentYMD = todayStr(); // Hàm có sẵn lấy YYYY-MM-DD
    const currentH = String(now.getHours()).padStart(2, '0');
    const currentM = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentH}:${currentM}`;

    let hasChanges = false;

    tasks.forEach(task => {
        // 1. Chỉ kiểm tra task chưa xong, có link, và người dùng ĐÃ CHỌN tự động mở
        if (!task.done && task.link && task.autoOpen && !task.linkOpened) {
            
            // 2. Kiểm tra đúng ngày và đúng giờ (hoặc quá giờ trong vòng 1 phút)
            if (task.date === currentYMD) {
                // So sánh giờ: Nếu giờ hiện tại >= giờ bắt đầu
                // (Để chắc chắn không bị lỡ nhịp đếm giây)
                if (currentTimeStr === task.startTime) {
                    
                    // 3. THỰC HIỆN MỞ LINK
                    // Thêm https nếu thiếu
                    let safeLink = task.link.startsWith('http') ? task.link : 'https://' + task.link;
                    
                    // Mở tab mới
                    const newWindow = window.open(safeLink, '_blank');
                    
                    // Kiểm tra xem trình duyệt có chặn không
                    if (newWindow) {
                        console.log(`🚀 Đã tự động mở link cho task: ${task.title}`);
                        task.linkOpened = true; // Đánh dấu đã mở để không mở lại lần nữa
                        hasChanges = true;
                        
                        // Gửi thông báo
                        sendNotification("🚀 ĐANG MỞ LINK HỌC", `Đã mở link cho "${task.title}". Chúc bạn học tốt!`);
                        
                        // Nếu đang ở Zen Mode, có thể bạn muốn thoát ra hoặc giữ nguyên (tùy chọn)
                    } else {
                        // Nếu bị chặn
                        console.warn("⚠️ Trình duyệt đã chặn Pop-up mở link.");
                        sendNotification("⚠️ KHÔNG THỂ MỞ LINK", `Trình duyệt đã chặn. Vui lòng bấm vào link thủ công trong danh sách.`);
                    }
                }
            }
        }
    });

    if (hasChanges) {
        saveTasks();
    }
}

// Chạy kiểm tra mỗi 5 giây (đủ nhanh để bắt kịp phút, không quá nặng máy)
setInterval(checkAutoOpenLinks, 5000);

/* ================================================= */
/* --- HÀM THÔNG BÁO TOAST (THAY THẾ ALERT) --- */
/* ================================================= */

function showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // 1. Tạo phần tử HTML
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Chọn icon dựa trên loại thông báo
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    // 2. Thêm vào giao diện
    container.appendChild(toast);
    
    // Phát âm thanh nhẹ (nếu muốn)
    if (type === 'success') playSound('click');
    if (type === 'error') playSound('trash');

    // 3. Tự động xóa sau 3.5 giây
    const autoRemoveId = setTimeout(() => {
        removeToast(toast);
    }, 3500);

    // 4. Click để xóa ngay lập tức
    toast.onclick = () => {
        clearTimeout(autoRemoveId);
        removeToast(toast);
    };
}

function removeToast(toast) {
    toast.style.animation = 'slideOutToast 0.4s forwards';
    toast.addEventListener('animationend', () => {
        toast.remove();
    });
}

// Thay thế hàm alert mặc định (Optional - để bắt các alert cũ nếu còn sót)
// window.alert = (msg) => showToast('Thông báo', msg, 'info');

/* ================================================= */
/* --- HỆ THỐNG GAMIFICATION (LEVEL UP) --- */
/* ================================================= */

let userXP = 0;
let userLevel = 1;
const XP_PER_LEVEL = 100; // Cứ 100 XP là lên cấp

function loadGamification() {
    const savedXP = localStorage.getItem('timefocus_xp');
    const savedLevel = localStorage.getItem('timefocus_level');
    
    if (savedXP) userXP = parseInt(savedXP);
    if (savedLevel) userLevel = parseInt(savedLevel);
    
    updateLevelUI();
}

function updateLevelUI() {
    document.getElementById('userLevel').textContent = userLevel;
    document.getElementById('userLevelText').textContent = userLevel;
    
    // Tính % thanh XP
    const percent = (userXP / XP_PER_LEVEL) * 100;
    document.getElementById('xpFill').style.width = `${percent}%`;
    document.getElementById('levelBadge').title = `XP: ${userXP} / ${XP_PER_LEVEL}`;
}

function gainXP(amount) {
    userXP += amount;
    
    // Kiểm tra lên cấp
    if (userXP >= XP_PER_LEVEL) {
        userLevel++;
        userXP = userXP - XP_PER_LEVEL; // Reset XP dư
        
        // Hiệu ứng lên cấp
        playSound('success');
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        
        // Thông báo Toast xịn
        if(typeof showToast === 'function') {
            showToast('LÊN CẤP ĐỘ ' + userLevel + '! 🚀', 'Bạn đã trở nên năng suất hơn!', 'success');
        }
    }
    
    // Lưu và cập nhật
    localStorage.setItem('timefocus_xp', userXP);
    localStorage.setItem('timefocus_level', userLevel);
    updateLevelUI();
}

// KHỞI CHẠY GAMIFICATION
loadGamification();

/* ================================================= */
/* --- PHÍM TẮT (KEYBOARD SHORTCUTS) --- */
/* ================================================= */

document.addEventListener('keydown', (e) => {
    // Nếu đang nhập liệu trong ô input thì KHÔNG kích hoạt phím tắt
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Phím N: Thêm công việc mới (New)
    if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        document.getElementById('openTaskModalBtn').click();
    }

    // Phím Space: Bắt đầu/Tạm dừng Pomodoro
    if (e.code === 'Space') {
        e.preventDefault();
        togglePomodoro();
    }
    
    // Phím Esc: Đóng tất cả Modal
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.task-modal.show, .notice-modal.show, .settings-dropdown.show, .confirm-modal.show');
        modals.forEach(m => m.classList.remove('show'));
    }
    
    // Phím Z: Bật/Tắt Zen Mode
    if (e.key.toLowerCase() === 'z') {
        toggleZenMode();
    }
});
// Tắt màn hình chờ sau khi tải xong
window.addEventListener('load', () => {
    const loader = document.getElementById('app-loader');
    if (loader) {
        // Đợi 0.8 giây cho ngầu rồi mới tắt
        setTimeout(() => {
            loader.classList.add('loader-hidden');
            // Xóa hẳn khỏi DOM sau khi hiệu ứng mờ kết thúc
            setTimeout(() => { loader.remove(); }, 500);
        }, 800);
    }
});