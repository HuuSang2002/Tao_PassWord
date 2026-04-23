
(function () {
    // DOM elements
    const totalSlider = document.getElementById('totalLengthSlider');
    const totalLengthDisplay = document.getElementById('totalLengthDisplay');

    // các ô đếm số lượng
    const lowerSpan = document.getElementById('lowerCount');
    const upperSpan = document.getElementById('upperCount');
    const numberSpan = document.getElementById('numberCount');
    const symbolSpan = document.getElementById('symbolCount');

    const warningDiv = document.getElementById('warningMsg');
    const generateBtn = document.getElementById('generateBtn');
    const passwordOutput = document.getElementById('passwordOutput');
    const copyBtn = document.getElementById('copyBtn');

    // lưu giá trị hiện tại
    let lower = 4;
    let upper = 3;
    let numbers = 3;
    let symbols = 2;

    // các bộ ký tự
    const LOWER_CHARS = "abcdefghijklmnopqrstuvwxyz";
    const UPPER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const NUMBER_CHARS = "0123456789";
    const SYMBOL_CHARS = "!@#$%^&*()_+[]{}<>?/|\\-=~";

    // Cập nhật tổng từ các giá trị hiện tại
    function getTotalFromCounters() {
        return lower + upper + numbers + symbols;
    }

    // Cập nhật thanh trượt tổng theo tổng hiện tại (không tạo vòng lặp)
    function syncSliderWithTotal() {
        let total = getTotalFromCounters();
        totalSlider.value = total;
        totalLengthDisplay.innerText = total;
    }

    // Kiểm tra ràng buộc: tổng tối thiểu >= 4, đồng thời đảm bảo không có loại nào âm
    function validateAndWarn() {
        let total = getTotalFromCounters();
        let isValid = true;
        let msg = "";

        if (total < 4) {
            isValid = false;
            msg = "⚠️ Tổng số ký tự phải từ 4 trở lên. Hãy tăng số lượng một vài loại.";
        } else if (total > 40) {
            isValid = false;
            msg = "⚠️ Tổng độ dài không được vượt quá 40. Giảm bớt số lượng ký tự.";
        } else if (lower < -1 || upper < -1 || numbers < -1 || symbols < -1){
            // không thể xảy ra do logic tăng giảm, nhưng phòng hờ
            isValid = false;
            msg = "Giá trị không hợp lệ.";
        }

        if (!isValid) {
            warningDiv.innerText = msg;
        } else {
            warningDiv.innerText = "";
        }
        return isValid && total >= 4 && total <= 40;
    }

    // Hàm cập nhật giao diện số, tổng, cảnh báo
    function refreshUI() {
        lowerSpan.innerText = lower;
        upperSpan.innerText = upper;
        numberSpan.innerText = numbers;
        symbolSpan.innerText = symbols;
        syncSliderWithTotal();
        validateAndWarn();
    }

    // Xử lý thay đổi số lượng (tăng/giảm) và đảm bảo tổng không vượt quá 40 và >=4, nhưng ưu tiên thoải mái
    function changeCounter(type, delta) {
        let oldVal;
        switch (type) {
            case 'lower': oldVal = lower; break;
            case 'upper': oldVal = upper; break;
            case 'number': oldVal = numbers; break;
            case 'symbol': oldVal = symbols; break;
            default: return;
        }
        let newVal = oldVal + delta;
        if (newVal < 0) return; // không cho âm

        // thử tạm thời set để xem tổng có vượt quá 40 không
        let tempLower = lower, tempUpper = upper, tempNum = numbers, tempSym = symbols;
        switch (type) {
            case 'lower': tempLower = newVal; break;
            case 'upper': tempUpper = newVal; break;
            case 'number': tempNum = newVal; break;
            case 'symbol': tempSym = newVal; break;
        }
        let tempTotal = tempLower + tempUpper + tempNum + tempSym;
        if (tempTotal > 40) {
            // hiện cảnh báo nhưng không thay đổi
            warningDiv.innerText = "⚠️ Tổng độ dài tối đa 40. Không thể tăng thêm.";
            return;
        }
        // Nếu vượt quá 40 thì chặn, nếu không thì chấp nhận
        if (tempTotal <= 40) {
            switch (type) {
                case 'lower': lower = newVal; break;
                case 'upper': upper = newVal; break;
                case 'number': numbers = newVal; break;
                case 'symbol': symbols = newVal; break;
            }
            warningDiv.innerText = ""; // xóa cảnh báo nếu hợp lệ
            refreshUI();
        } else {
            warningDiv.innerText = "⚠️ Tổng độ dài tối đa 40. Không thể tăng thêm.";
        }
    }

    // Sự kiện tăng giảm
    document.querySelectorAll('.dec').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const type = btn.getAttribute('data-type');
            changeCounter(type, -1);
        });
    });
    document.querySelectorAll('.inc').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const type = btn.getAttribute('data-type');
            changeCounter(type, 1);
        });
    });

    // Sự kiện thanh trượt tổng độ dài: khi kéo thanh trượt, sẽ phân bổ lại số lượng các loại một cách thông minh
    // giữ nguyên tỉ lệ tương đối nếu có thể, hoặc tăng ưu tiên cho những loại đang có
    totalSlider.addEventListener('input', (e) => {
        let newTotal = parseInt(e.target.value, 10);
        totalLengthDisplay.innerText = newTotal;
        let currentTotal = getTotalFromCounters();
        if (newTotal === currentTotal) return;

        // Nếu newTotal nhỏ hơn tổng hiện tại: cần giảm bớt
        if (newTotal < currentTotal) {
            let deficit = currentTotal - newTotal;
            // giảm dần từ các loại có số lượng lớn nhất, ưu tiên giảm nhưng không để âm
            let arr = [
                { type: 'lower', val: lower },
                { type: 'upper', val: upper },
                { type: 'number', val: numbers },
                { type: 'symbol', val: symbols }
            ];
            // giảm cho tới khi đủ deficit
            for (let step = 0; step < deficit; step++) {
                // tìm loại có giá trị > 0 lớn nhất để giảm (giữ cân bằng)
                let maxIdx = 0;
                for (let i = 1; i < arr.length; i++) {
                    if (arr[i].val > arr[maxIdx].val) maxIdx = i;
                }
                if (arr[maxIdx].val <= 0) break; // không thể giảm nữa
                arr[maxIdx].val--;
            }
            // gán lại
            lower = arr[0].val;
            upper = arr[1].val;
            numbers = arr[2].val;
            symbols = arr[3].val;
        }
        else { // newTotal > currentTotal : cần tăng thêm
            let increase = newTotal - currentTotal;
            // tăng dần cho các loại, ưu tiên tăng loại có số lượng nhỏ nhất để cân đối (hoặc theo thứ tự vòng tròn)
            let arr = [
                { type: 'lower', val: lower },
                { type: 'upper', val: upper },
                { type: 'number', val: numbers },
                { type: 'symbol', val: symbols }
            ];
            for (let step = 0; step < increase; step++) {
                // tìm loại có giá trị nhỏ nhất (để cân bằng)
                let minIdx = 0;
                for (let i = 1; i < arr.length; i++) {
                    if (arr[i].val < arr[minIdx].val) minIdx = i;
                }
                arr[minIdx].val++;
            }
            lower = arr[0].val;
            upper = arr[1].val;
            numbers = arr[2].val;
            symbols = arr[3].val;
        }

        // Đảm bảo không có giá trị âm (dự phòng)
        lower = Math.max(0, lower);
        upper = Math.max(0, upper);
        numbers = Math.max(0, numbers);
        symbols = Math.max(0, symbols);
        refreshUI();
    });

    // Hàm xáo trộn mảng (Fisher-Yates) để đảm bảo tính ngẫu nhiên vị trí
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // Tạo mật khẩu dựa trên số lượng chính xác từng loại
    function generatePrecisePassword() {
        // Lấy số lượng hiện tại
        let lowCount = lower;
        let upCount = upper;
        let numCount = numbers;
        let symCount = symbols;
        let totalLen = lowCount + upCount + numCount + symCount;

        if (totalLen < 4) {
            alert("❌ Tổng độ dài quá nhỏ (dưới 4). Hãy tăng số lượng ký tự.");
            return "";
        }
        if (totalLen > 40) {
            alert("❌ Tổng độ dài vượt quá 40. Giảm bớt số lượng ký tự.");
            return "";
        }

        // Dự trữ các ký tự theo từng loại
        let pool = [];

        // Lấy ngẫu nhiên từ bộ ký tự tương ứng (lấy đủ số lượng)
        function getRandomCharsFromSet(charSet, count) {
            let result = [];
            if (count === 0) return result;
            let setArr = charSet.split('');
            for (let i = 0; i < count; i++) {
                let randIndex = Math.floor(Math.random() * setArr.length);
                result.push(setArr[randIndex]);
            }
            return result;
        }

        // tạo từng nhóm
        let lowerChars = getRandomCharsFromSet(LOWER_CHARS, lowCount);
        let upperChars = getRandomCharsFromSet(UPPER_CHARS, upCount);
        let numberChars = getRandomCharsFromSet(NUMBER_CHARS, numCount);
        let symbolChars = getRandomCharsFromSet(SYMBOL_CHARS, symCount);

        // gộp tất cả
        let allChars = [...lowerChars, ...upperChars, ...numberChars, ...symbolChars];
        // xáo trộn toàn bộ mật khẩu
        let shuffled = shuffleArray([...allChars]);
        let password = shuffled.join('');

        // Kiểm tra an toàn (dự phòng nếu password rỗng)
        if (password.length === 0) {
            return "Error: không có ký tự nào!";
        }
        return password;
    }

    // Hàm tạo và hiển thị
    function generateAndShow() {
        if (!validateAndWarn()) {
            let total = getTotalFromCounters();
            if (total > 40) {
                alert("⚠️ Tổng số ký tự vượt quá 40. Hãy giảm số lượng ở các ô bên trên.");
            } else if (total < 4) {
                alert("⚠️ Tổng độ dài tối thiểu là 4. Hãy tăng số lượng ký tự.");
            } else {
                alert("⚠️ Cấu hình không hợp lệ, kiểm tra lại các lựa chọn.");
            }
            return;
        }
        let newPassword = generatePrecisePassword();
        if (newPassword && newPassword.length > 0) {
            passwordOutput.value = newPassword;
            // hiệu ứng nhẹ
            showToast("✅ Mật khẩu mới đã sẵn sàng!");
        } else {
            passwordOutput.value = "";
            showToast("❌ Không thể tạo mật khẩu, hãy kiểm tra số lượng.");
        }
    }

    // copy với clipboard API hiện đại
    async function copyToClipboard() {
        const pwd = passwordOutput.value;
        if (!pwd || pwd.trim() === "") {
            showToast("🔔 Chưa có mật khẩu, hãy tạo trước!");
            return;
        }
        try {
            await navigator.clipboard.writeText(pwd);
            showToast("📋 Đã sao chép mật khẩu vào clipboard!");
        } catch (err) {
            // fallback cũ
            passwordOutput.select();
            document.execCommand("copy");
            showToast("📋 Đã copy (phương thức dự phòng)");
        }
    }

    // Toast thông báo đẹp
    let toastEl = null;
    function showToast(message, duration = 2000) {
        if (toastEl) {
            toastEl.remove();
        }
        toastEl = document.createElement('div');
        toastEl.className = 'toast-msg';
        toastEl.innerText = message;
        document.body.appendChild(toastEl);
        setTimeout(() => {
            if (toastEl) toastEl.style.opacity = '0';
            setTimeout(() => {
                if (toastEl && toastEl.parentNode) toastEl.remove();
                toastEl = null;
            }, 300);
        }, duration);
    }

    // Khởi tạo các sự kiện
    generateBtn.addEventListener('click', generateAndShow);
    copyBtn.addEventListener('click', copyToClipboard);

    // Đặt giá trị mặc định: lower 4, upper 3, numbers 3, symbols 2 => tổng 12
    lower = 4;
    upper = 3;
    numbers = 3;
    symbols = 2;
    refreshUI();

    // Tạo mật khẩu mẫu khi tải trang (demo)
    setTimeout(() => {
        generateAndShow();
    }, 100);
})();
