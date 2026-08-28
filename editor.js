/**
 * LOVE WEB - EDITOR LOGIC (editor.js)
 * Manages form state, live preview, manual save button to data.json, JSON export/import and image uploads
 */

document.addEventListener('DOMContentLoaded', () => {
    // Default Schema Data
    const DEFAULT_CONFIG = {
        pageTitle: "Gửi Em ❤️",
        welcomeScreen: {
            typewriterText: "Mo shi mo shiii!",
            message: "Có một món quà bí mật nhỏ đang được giấu giữa rừng trái tim ngọt ngào...",
            submessage: "Bạn có muốn khám phá điều bí mật đang chờ đón bạn không?",
            buttonText: "Bắt đầu thôi"
        },
        interactiveScreen: {
            dragHint: "Dùng tay/chuột kéo trái tim ra để tìm bí mật nhé!",
            envelopeLabel: "Gửi người thương",
            envelopeSublabel: "Nhấn để mở",
            tooltipSearching: "Hãy tìm đủ 100% trái tim để xem thư nhé! ({percent}%) 💖",
            tooltipUnlocked: "Click vào bức thư để mở nè! 💌",
            tooltipNeedMore: "Hãy bới đủ 100% trái tim để mở thư nhé! 💖"
        },
        letterModal: {
            title: "Gửi Người Thương",
            image: "image.webp",
            imageCaption: "Người Thương",
            greeting: "Gửi cô gái đáng yêu,",
            paragraphs: [
                "Cảm ơn em đã kiên nhẫn tìm thấy lá thư này... Giống như giữa muôn vàn trái tim ngoài kia, ánh mắt anh ngay từ đầu đã luôn hướng về em.",
                "Từ ngày có em xuất hiện, thế giới của anh bỗng trở nên ấm áp và rực rỡ hơn rất nhiều. Mỗi nụ cười, từng ánh mắt của em đều làm tim anh xao xuyến.",
                "Anh đã ấp ủ tình cảm này từ rất lâu, và hôm nay anh muốn dành trọn dũng khí để hỏi em một điều: Em làm người yêu anh nhé?"
            ],
            signature: "Chàng Trai Thương Em"
        },
        audio: {
            enabled: false,
            url: ""
        }
    };

    let currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

    // UI DOM Elements
    // Tab Navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Inputs
    const inputWelcomeTypewriter = document.getElementById('input-welcome-typewriter');
    const inputWelcomeMessage = document.getElementById('input-welcome-message');
    const inputWelcomeSubmessage = document.getElementById('input-welcome-submessage');
    const inputWelcomeButton = document.getElementById('input-welcome-button');

    const inputInteractiveDrag = document.getElementById('input-interactive-drag');
    const inputEnvelopeLabel = document.getElementById('input-envelope-label');
    const inputEnvelopeSublabel = document.getElementById('input-envelope-sublabel');
    const inputTooltipSearching = document.getElementById('input-tooltip-searching');
    const inputTooltipUnlocked = document.getElementById('input-tooltip-unlocked');
    const inputTooltipNeedMore = document.getElementById('input-tooltip-needmore');

    const inputLetterImage = document.getElementById('input-letter-image');
    const inputLetterCaption = document.getElementById('input-letter-caption');
    const imageFileInput = document.getElementById('image-file-input');
    const btnChooseFile = document.getElementById('btn-choose-file');
    const formImgPreview = document.getElementById('form-img-preview');

    const inputLetterTitle = document.getElementById('input-letter-title');
    const inputLetterGreeting = document.getElementById('input-letter-greeting');
    const paragraphsContainer = document.getElementById('paragraphs-container');
    const btnAddParagraph = document.getElementById('btn-add-paragraph');
    const inputLetterSignature = document.getElementById('input-letter-signature');

    // Live Preview Elements
    const previewPolaroidImg = document.getElementById('preview-polaroid-img');
    const previewPolaroidCaption = document.getElementById('preview-polaroid-caption');
    const previewLetterTitle = document.getElementById('preview-letter-title');
    const previewLetterGreeting = document.getElementById('preview-letter-greeting');
    const previewLetterBody = document.getElementById('preview-letter-body');
    const previewLetterSig = document.getElementById('preview-letter-sig');

    // Header Actions
    const btnSaveData = document.getElementById('btn-save-data');
    const saveBtnText = document.getElementById('save-btn-text');
    const btnResetDefault = document.getElementById('btn-reset-default');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    /* ==========================================================================
       1. TAB NAVIGATION
       ========================================================================== */
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    const JSONBIN_ID = "6a91c49bda38895dfe1d27c4";
    const JSONBIN_KEY = "$2a$10$/XYZ7oQhPs.V4PZvMNf0GOrNQS6oKhZsp22FhHLk0CDFGGfym9EYe";

    /* ==========================================================================
       2. INITIAL DATA LOADING
       ========================================================================== */
    async function loadInitialData() {
        let loaded = false;

        // 1. Fetch từ JSONBin Cloud (đồng bộ realtime mọi nơi)
        if (JSONBIN_ID) {
            try {
                const resCloud = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest?t=${Date.now()}`, {
                    headers: { 'X-Master-Key': JSONBIN_KEY }
                });
                if (resCloud.ok) {
                    const jsonResult = await resCloud.json();
                    const data = jsonResult.record || jsonResult;
                    currentConfig = mergeConfig(DEFAULT_CONFIG, data);
                    loaded = true;
                }
            } catch (e) {
                console.warn('Cannot fetch from JSONBin cloud, fallback:', e);
            }
        }

        // 2. Fetch trực tiếp từ data.json (kèm query timestamp)
        if (!loaded) {
            try {
                const response = await fetch(`data.json?t=${Date.now()}`);
                if (response.ok) {
                    const data = await response.json();
                    currentConfig = mergeConfig(DEFAULT_CONFIG, data);
                    loaded = true;
                }
            } catch (e) {
                console.warn('Cannot fetch data.json directly, checking fallback:', e);
            }
        }

        // 3. Thử đọc LocalStorage nếu fetch không thành công
        if (!loaded) {
            try {
                const savedLocal = localStorage.getItem('love_custom_config');
                if (savedLocal) {
                    const parsed = JSON.parse(savedLocal);
                    currentConfig = mergeConfig(DEFAULT_CONFIG, parsed);
                    loaded = true;
                }
            } catch (e) {
                console.warn('Cannot read from localStorage:', e);
            }
        }

        if (!loaded) {
            currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }

        populateForm(currentConfig);
        updateLivePreview();
        saveToLocalStorage();
    }

    function mergeConfig(defaults, incoming) {
        return {
            pageTitle: incoming.pageTitle || defaults.pageTitle,
            welcomeScreen: { ...defaults.welcomeScreen, ...(incoming.welcomeScreen || {}) },
            interactiveScreen: { ...defaults.interactiveScreen, ...(incoming.interactiveScreen || {}) },
            letterModal: {
                ...defaults.letterModal,
                ...(incoming.letterModal || {}),
                paragraphs: Array.isArray(incoming.letterModal?.paragraphs) ? incoming.letterModal.paragraphs : defaults.letterModal.paragraphs
            },
            audio: { ...defaults.audio, ...(incoming.audio || {}) }
        };
    }

    /* ==========================================================================
       3. POPULATE FORM WITH DATA
       ========================================================================== */
    function populateForm(config) {
        inputWelcomeTypewriter.value = config.welcomeScreen.typewriterText || '';
        inputWelcomeMessage.value = config.welcomeScreen.message || '';
        inputWelcomeSubmessage.value = config.welcomeScreen.submessage || '';
        inputWelcomeButton.value = config.welcomeScreen.buttonText || '';

        inputInteractiveDrag.value = config.interactiveScreen.dragHint || '';
        inputEnvelopeLabel.value = config.interactiveScreen.envelopeLabel || '';
        inputEnvelopeSublabel.value = config.interactiveScreen.envelopeSublabel || '';
        inputTooltipSearching.value = config.interactiveScreen.tooltipSearching || '';
        inputTooltipUnlocked.value = config.interactiveScreen.tooltipUnlocked || '';
        inputTooltipNeedMore.value = config.interactiveScreen.tooltipNeedMore || '';

        inputLetterImage.value = config.letterModal.image || 'image.webp';
        if (inputLetterCaption) inputLetterCaption.value = config.letterModal.imageCaption || '';
        formImgPreview.src = config.letterModal.image || 'image.webp';
        inputLetterTitle.value = config.letterModal.title || '';
        inputLetterGreeting.value = config.letterModal.greeting || '';
        inputLetterSignature.value = config.letterModal.signature || '';

        renderParagraphsInputs(config.letterModal.paragraphs || []);
    }

    function renderParagraphsInputs(paragraphs) {
        paragraphsContainer.innerHTML = '';
        paragraphs.forEach((text, index) => {
            const item = document.createElement('div');
            item.className = 'paragraph-item';
            item.innerHTML = `
                <div class="paragraph-header">
                    <span>Đoạn văn ${index + 1}</span>
                    <button type="button" class="btn btn-danger btn-sm btn-delete-para" data-index="${index}">
                        <i data-lucide="trash-2"></i>
                        <span>Xóa</span>
                    </button>
                </div>
                <textarea class="form-textarea para-text" data-index="${index}" rows="2">${escapeHtml(text)}</textarea>
            `;
            paragraphsContainer.appendChild(item);
        });

        if (window.lucide) lucide.createIcons();

        // Add event listeners for textareas
        paragraphsContainer.querySelectorAll('.para-text').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (currentConfig.letterModal.paragraphs[idx] !== undefined) {
                    currentConfig.letterModal.paragraphs[idx] = e.target.value;
                    onConfigChanged();
                }
            });
        });

        // Add event listeners for delete buttons
        paragraphsContainer.querySelectorAll('.btn-delete-para').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index, 10);
                if (currentConfig.letterModal.paragraphs.length <= 1) {
                    showToast('Bức thư cần ít nhất 1 đoạn văn bạn nhé!', 'alert-circle');
                    return;
                }
                currentConfig.letterModal.paragraphs.splice(idx, 1);
                renderParagraphsInputs(currentConfig.letterModal.paragraphs);
                onConfigChanged();
            });
        });
    }

    btnAddParagraph.addEventListener('click', () => {
        currentConfig.letterModal.paragraphs.push('Thêm lời nhắn ngọt ngào của bạn vào đây...');
        renderParagraphsInputs(currentConfig.letterModal.paragraphs);
        onConfigChanged();
    });

    /* ==========================================================================
       4. FORM CHANGE (REALTIME PREVIEW + LOCAL MEMORY ONLY)
       ========================================================================== */
    function onConfigChanged() {
        updateLivePreview();
        saveToLocalStorage();
    }

    function saveToLocalStorage() {
        try {
            localStorage.setItem('love_custom_config', JSON.stringify(currentConfig));
        } catch (e) {
            console.warn('Error saving to localStorage:', e);
        }
    }

    /* ==========================================================================
       5. MANUAL SAVE (LƯU LÊN JSONBIN CLOUD & LOCAL SERVER)
       ========================================================================== */
    async function saveDataToFile() {
        if (!btnSaveData) return;

        if (saveBtnText) saveBtnText.textContent = 'Đang lưu lên Cloud...';
        btnSaveData.disabled = true;

        const payload = JSON.stringify(currentConfig, null, 2);
        let cloudSaved = false;
        let localSaved = false;

        // 1. Lưu lên JSONBin Cloud (để cập nhật realtime trực tiếp trên Vercel)
        if (JSONBIN_ID) {
            try {
                const resCloud = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_KEY
                    },
                    body: payload
                });
                if (resCloud.ok) cloudSaved = true;
            } catch (e) {
                console.warn('Lỗi lưu JSONBin Cloud:', e);
            }
        }

        // 2. Lưu vào local server /api/save nếu đang chạy server Node/Python local
        try {
            const res = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload
            });
            if (res.ok) localSaved = true;
        } catch (e) {}

        if (!localSaved) {
            try {
                const res3000 = await fetch('http://localhost:3000/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload
                });
                if (res3000.ok) localSaved = true;
            } catch (e) {}
        }

        // 3. Luôn cập nhật LocalStorage
        saveToLocalStorage();

        btnSaveData.disabled = false;

        if (cloudSaved || localSaved) {
            if (saveBtnText) saveBtnText.textContent = 'Đã Lưu!';
            showToast(cloudSaved ? 'Đã lưu lên Cloud thành công! Web cập nhật ngay tức thì.' : 'Đã lưu vào data.json cục bộ!', '🎉');
            setTimeout(() => {
                if (saveBtnText) saveBtnText.textContent = 'Lưu Thay Đổi';
            }, 2000);
        } else {
            if (saveBtnText) saveBtnText.textContent = 'Lưu Thay Đổi';
            showToast('Đã lưu vào bộ nhớ trình duyệt của bạn!', 'ℹ️');
        }
    }

    if (btnSaveData) {
        btnSaveData.addEventListener('click', saveDataToFile);
    }

    /* ==========================================================================
       6. FORM INPUT LISTENERS
       ========================================================================== */
    inputWelcomeTypewriter.addEventListener('input', (e) => { currentConfig.welcomeScreen.typewriterText = e.target.value; onConfigChanged(); });
    inputWelcomeMessage.addEventListener('input', (e) => { currentConfig.welcomeScreen.message = e.target.value; onConfigChanged(); });
    inputWelcomeSubmessage.addEventListener('input', (e) => { currentConfig.welcomeScreen.submessage = e.target.value; onConfigChanged(); });
    inputWelcomeButton.addEventListener('input', (e) => { currentConfig.welcomeScreen.buttonText = e.target.value; onConfigChanged(); });

    inputInteractiveDrag.addEventListener('input', (e) => { currentConfig.interactiveScreen.dragHint = e.target.value; onConfigChanged(); });
    inputEnvelopeLabel.addEventListener('input', (e) => { currentConfig.interactiveScreen.envelopeLabel = e.target.value; onConfigChanged(); });
    inputEnvelopeSublabel.addEventListener('input', (e) => { currentConfig.interactiveScreen.envelopeSublabel = e.target.value; onConfigChanged(); });
    inputTooltipSearching.addEventListener('input', (e) => { currentConfig.interactiveScreen.tooltipSearching = e.target.value; onConfigChanged(); });
    inputTooltipUnlocked.addEventListener('input', (e) => { currentConfig.interactiveScreen.tooltipUnlocked = e.target.value; onConfigChanged(); });
    inputTooltipNeedMore.addEventListener('input', (e) => { currentConfig.interactiveScreen.tooltipNeedMore = e.target.value; onConfigChanged(); });

    inputLetterImage.addEventListener('input', (e) => {
        const val = e.target.value.trim() || 'image.webp';
        currentConfig.letterModal.image = val;
        formImgPreview.src = val;
        onConfigChanged();
    });

    if (inputLetterCaption) {
        inputLetterCaption.addEventListener('input', (e) => {
            currentConfig.letterModal.imageCaption = e.target.value;
            onConfigChanged();
        });
    }

    inputLetterTitle.addEventListener('input', (e) => { currentConfig.letterModal.title = e.target.value; onConfigChanged(); });
    inputLetterGreeting.addEventListener('input', (e) => { currentConfig.letterModal.greeting = e.target.value; onConfigChanged(); });
    inputLetterSignature.addEventListener('input', (e) => { currentConfig.letterModal.signature = e.target.value; onConfigChanged(); });

    /* ==========================================================================
       7. IMAGE UPLOAD HANDLING (COMPRESS TO BASE64)
       ========================================================================== */
    btnChooseFile.addEventListener('click', () => {
        imageFileInput.click();
    });

    imageFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showToast('Vui lòng chọn file hình ảnh hợp lệ!', '⚠️');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let w = img.width;
                let h = img.height;
                const maxDim = 800;

                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }

                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                currentConfig.letterModal.image = dataUrl;
                inputLetterImage.value = dataUrl;
                formImgPreview.src = dataUrl;
                onConfigChanged();
                showToast('Đã nạp và tối ưu hóa hình ảnh thành công!', '🎉');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    /* ==========================================================================
       8. LIVE PREVIEW UPDATE
       ========================================================================== */
    function updateLivePreview() {
        const modal = currentConfig.letterModal;
        previewPolaroidImg.src = modal.image || 'image.webp';
        previewPolaroidImg.onerror = function () { this.src = 'image.webp'; };

        if (previewPolaroidCaption) {
            previewPolaroidCaption.textContent = modal.imageCaption || 'Người Thương';
        }

        previewLetterTitle.textContent = modal.title || 'Gửi Người Thương';
        previewLetterGreeting.textContent = modal.greeting || 'Gửi cô gái đáng yêu,';
        previewLetterSig.textContent = modal.signature || 'Chàng Trai Thương Em';

        previewLetterBody.innerHTML = '';
        if (Array.isArray(modal.paragraphs)) {
            modal.paragraphs.forEach(p => {
                const pEl = document.createElement('p');
                pEl.textContent = p;
                previewLetterBody.appendChild(pEl);
            });
        }
    }

    /* ==========================================================================
       9. JSON DOWNLOAD & IMPORT & RESET
       ========================================================================== */
    // Reset to Default
    if (btnResetDefault) {
        btnResetDefault.addEventListener('click', () => {
            if (confirm('Bạn có chắc chắn muốn khôi phục về nội dung mặc định ban đầu không?')) {
                localStorage.removeItem('love_custom_config');
                currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
                populateForm(currentConfig);
                onConfigChanged();
                showToast('Đã khôi phục nội dung mặc định!', 'rotate-ccw');
            }
        });
    }

    /* ==========================================================================
       10. TOAST NOTIFICATION UTILITY
       ========================================================================== */
    let toastTimeout = null;
    function showToast(message, iconName = 'check-circle') {
        toastMessage.textContent = message;
        if (toastIcon) {
            toastIcon.setAttribute('data-lucide', iconName);
            if (window.lucide) lucide.createIcons();
        }
        toast.classList.add('show');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3200);
    }

    function escapeHtml(string) {
        return String(string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Start loading
    loadInitialData();
});
