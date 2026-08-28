document.addEventListener('DOMContentLoaded', () => {
    // Default Configuration Fallback
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

    let appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

    // Canvas & Context Setup
    const bgCanvas = document.getElementById('bg-canvas');
    const bgCtx = bgCanvas.getContext('2d');

    const bottomCanvas = document.getElementById('heart-bottom-canvas');
    const bottomCtx = bottomCanvas.getContext('2d');

    const heartCanvas = document.getElementById('heart-canvas');
    const heartCtx = heartCanvas.getContext('2d');

    // UI Elements
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const btnSubmit = document.getElementById('btn-submit');
    const envelopeWrapper = document.getElementById('envelope-wrapper');
    const envelope = document.getElementById('envelope');
    const chatTooltip = document.getElementById('chat-tooltip');
    const tooltipText = chatTooltip.querySelector('.tooltip-text');
    const dragHint = document.getElementById('drag-hint');
    const letterModal = document.getElementById('letter-modal');
    const modalClose = document.getElementById('modal-close');

    // Progress Bar UI Elements
    const progressContainer = document.getElementById('progress-container');
    const progressPercent = document.getElementById('progress-percent');
    const progressBarFill = document.getElementById('progress-bar-fill');

    // Window dimensions
    let width = window.innerWidth;
    let height = window.innerHeight;

    function resizeCanvases() {
        width = window.innerWidth;
        height = window.innerHeight;
        bgCanvas.width = width;
        bgCanvas.height = height;
        bottomCanvas.width = width;
        bottomCanvas.height = height;
        heartCanvas.width = width;
        heartCanvas.height = height;
    }
    resizeCanvases();
    window.addEventListener('resize', () => {
        resizeCanvases();
        reinitHeartPile();
    });

    /**
     * Nạp dữ liệu cấu hình: Ưu tiên LocalStorage (khi người dùng vừa tùy chỉnh) -> data.json -> DEFAULT_CONFIG
     */
    async function initConfig() {
        let loaded = false;

        // 1. Kiểm tra cấu hình tùy chỉnh từ LocalStorage
        try {
            const saved = localStorage.getItem('love_custom_config');
            if (saved) {
                const data = JSON.parse(saved);
                appConfig = {
                    pageTitle: data.pageTitle || DEFAULT_CONFIG.pageTitle,
                    welcomeScreen: { ...DEFAULT_CONFIG.welcomeScreen, ...(data.welcomeScreen || {}) },
                    interactiveScreen: { ...DEFAULT_CONFIG.interactiveScreen, ...(data.interactiveScreen || {}) },
                    letterModal: {
                        ...DEFAULT_CONFIG.letterModal,
                        ...(data.letterModal || {}),
                        paragraphs: Array.isArray(data.letterModal?.paragraphs) ? data.letterModal.paragraphs : DEFAULT_CONFIG.letterModal.paragraphs
                    },
                    audio: { ...DEFAULT_CONFIG.audio, ...(data.audio || {}) }
                };
                loaded = true;
            }
        } catch (e) {
            console.warn('Cannot read from localStorage:', e);
        }

        // 2. Nếu chưa có trong LocalStorage, nạp từ file data.json
        if (!loaded) {
            try {
                const res = await fetch('data.json');
                if (res.ok) {
                    const data = await res.json();
                    appConfig = {
                        pageTitle: data.pageTitle || DEFAULT_CONFIG.pageTitle,
                        welcomeScreen: { ...DEFAULT_CONFIG.welcomeScreen, ...(data.welcomeScreen || {}) },
                        interactiveScreen: { ...DEFAULT_CONFIG.interactiveScreen, ...(data.interactiveScreen || {}) },
                        letterModal: {
                            ...DEFAULT_CONFIG.letterModal,
                            ...(data.letterModal || {}),
                            paragraphs: Array.isArray(data.letterModal?.paragraphs) ? data.letterModal.paragraphs : DEFAULT_CONFIG.letterModal.paragraphs
                        },
                        audio: { ...DEFAULT_CONFIG.audio, ...(data.audio || {}) }
                    };
                }
            } catch (e) {
                console.warn('Using default configuration due to fetch limitation:', e);
            }
        }

        applyConfigToDOM();
    }

    function applyConfigToDOM() {
        if (appConfig.pageTitle) {
            document.title = appConfig.pageTitle;
        }

        // Welcome screen
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg && appConfig.welcomeScreen.message) {
            welcomeMsg.textContent = appConfig.welcomeScreen.message;
        }
        const welcomeSub = document.querySelector('.welcome-submessage');
        if (welcomeSub && appConfig.welcomeScreen.submessage) {
            welcomeSub.textContent = appConfig.welcomeScreen.submessage;
        }
        const btnText = btnSubmit ? btnSubmit.querySelector('.btn-text') : null;
        if (btnText && appConfig.welcomeScreen.buttonText) {
            btnText.textContent = appConfig.welcomeScreen.buttonText;
        }

        // Interactive Screen
        const hintText = dragHint ? dragHint.querySelector('.hint-text') : null;
        if (hintText && appConfig.interactiveScreen.dragHint) {
            hintText.textContent = appConfig.interactiveScreen.dragHint;
        }
        const letterPreviewText = document.querySelector('.letter-preview-text');
        if (letterPreviewText && appConfig.interactiveScreen.envelopeLabel) {
            letterPreviewText.textContent = appConfig.interactiveScreen.envelopeLabel;
        }
        const letterSubtext = document.querySelector('.letter-subtext');
        if (letterSubtext && appConfig.interactiveScreen.envelopeSublabel) {
            letterSubtext.textContent = appConfig.interactiveScreen.envelopeSublabel;
        }

        // Letter Modal
        const letterTitle = document.querySelector('.letter-title');
        if (letterTitle && appConfig.letterModal.title) {
            letterTitle.textContent = appConfig.letterModal.title;
        }
        const photoImg = document.querySelector('.photo-img');
        if (photoImg && appConfig.letterModal.image) {
            photoImg.src = appConfig.letterModal.image;
        }
        const photoCaption = document.querySelector('.photo-caption');
        if (photoCaption && appConfig.letterModal.imageCaption) {
            photoCaption.textContent = appConfig.letterModal.imageCaption;
        }
        const letterGreeting = document.querySelector('.letter-greeting');
        if (letterGreeting && appConfig.letterModal.greeting) {
            letterGreeting.textContent = appConfig.letterModal.greeting;
        }

        const letterContent = document.querySelector('.letter-content');
        if (letterContent && Array.isArray(appConfig.letterModal.paragraphs)) {
            letterContent.innerHTML = '';
            if (appConfig.letterModal.greeting) {
                const greetingP = document.createElement('p');
                greetingP.className = 'letter-greeting';
                greetingP.textContent = appConfig.letterModal.greeting;
                letterContent.appendChild(greetingP);
            }
            appConfig.letterModal.paragraphs.forEach(pText => {
                const pEl = document.createElement('p');
                pEl.textContent = pText;
                letterContent.appendChild(pEl);
            });
        }

        const signatureName = document.querySelector('.signature-name');
        if (signatureName && appConfig.letterModal.signature) {
            signatureName.textContent = appConfig.letterModal.signature;
        }

        // Typewriter text sync
        if (appConfig.welcomeScreen.typewriterText) {
            fullText = appConfig.welcomeScreen.typewriterText;
        }
    }


    /* ==========================================================================
       1. AMBIENT BACKGROUND BOKEH & FLOATING HEARTS
       ========================================================================== */
    const bgParticles = [];
    const bgParticleCount = 35;

    class BgParticle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = height + Math.random() * 100;
            this.size = Math.random() * 24 + 10;
            this.speedY = Math.random() * 0.7 + 0.3;
            this.speedX = Math.sin(Math.random() * Math.PI) * 0.4;
            this.opacity = Math.random() * 0.45 + 0.15;
            this.isHeart = Math.random() > 0.35;
            this.color = ['#ff4d6d', '#ff758f', '#c9184a', '#a4133c', '#ff8fa3', '#ff2a5f'][Math.floor(Math.random() * 6)];
        }

        update() {
            this.y -= this.speedY;
            this.x += Math.sin(this.y * 0.01) * 0.4;
            if (this.y < -50) {
                this.reset();
            }
        }

        draw() {
            bgCtx.save();
            bgCtx.globalAlpha = this.opacity;
            bgCtx.fillStyle = this.color;
            bgCtx.shadowBlur = 12;
            bgCtx.shadowColor = this.color;

            if (this.isHeart) {
                drawHeartPath(bgCtx, this.x, this.y, this.size);
                bgCtx.fill();
            } else {
                bgCtx.beginPath();
                bgCtx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
                bgCtx.fill();
            }
            bgCtx.restore();
        }
    }

    for (let i = 0; i < bgParticleCount; i++) {
        const p = new BgParticle();
        p.y = Math.random() * height;
        bgParticles.push(p);
    }

    function animateBg() {
        bgCtx.clearRect(0, 0, width, height);
        bgParticles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateBg);
    }
    animateBg();

    /* ==========================================================================
       2. HELPER: DRAW SVG HEART PATH ON CANVAS
       ========================================================================== */
    function drawHeartPath(ctx, x, y, size) {
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(x, y + topCurveHeight);
        ctx.bezierCurveTo(
            x, y,
            x - size / 2, y,
            x - size / 2, y + topCurveHeight
        );
        ctx.bezierCurveTo(
            x - size / 2, y + (size + topCurveHeight) / 2,
            x, y + size,
            x, y + size
        );
        ctx.bezierCurveTo(
            x, y + size,
            x + size / 2, y + (size + topCurveHeight) / 2,
            x + size / 2, y + topCurveHeight
        );
        ctx.bezierCurveTo(
            x + size / 2, y,
            x, y,
            x, y + topCurveHeight
        );
        ctx.closePath();
    }

    /* ==========================================================================
       3. OFFSCREEN SPRITE CACHING FOR 60 FPS ULTRA SMOOTH CANVAS PERFORMANCE
       ========================================================================== */
    const spriteCache = new Map();

    function getHeartSprite(size, color, isBottomLayer) {
        const roundedSize = Math.round(size);
        const key = `${color}_${roundedSize}_${isBottomLayer ? 'bot' : 'top'}`;

        if (spriteCache.has(key)) {
            return spriteCache.get(key);
        }

        const padding = 20;
        const offCanvas = document.createElement('canvas');
        offCanvas.width = roundedSize + padding * 2;
        offCanvas.height = roundedSize + padding * 2;
        const offCtx = offCanvas.getContext('2d');

        const cx = offCanvas.width / 2;
        const cy = offCanvas.height / 2;

        offCtx.save();
        if (isBottomLayer) {
            offCtx.globalAlpha = 0.85;
            offCtx.shadowBlur = 6;
            offCtx.shadowColor = 'rgba(0, 0, 0, 0.35)';
            offCtx.fillStyle = color;
        } else {
            offCtx.globalAlpha = 1.0;
            offCtx.shadowBlur = 10;
            offCtx.shadowColor = color;
            offCtx.fillStyle = color;
        }

        drawHeartPath(offCtx, cx, cy - roundedSize / 2, roundedSize);
        offCtx.fill();

        if (!isBottomLayer) {
            offCtx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            offCtx.beginPath();
            offCtx.arc(cx - roundedSize * 0.15, cy - roundedSize * 0.15, roundedSize * 0.12, 0, Math.PI * 2);
            offCtx.fill();
        } else {
            offCtx.fillStyle = 'rgba(255, 255, 255, 0.16)';
            offCtx.beginPath();
            offCtx.arc(cx - roundedSize * 0.15, cy - roundedSize * 0.15, roundedSize * 0.12, 0, Math.PI * 2);
            offCtx.fill();
        }

        offCtx.restore();

        spriteCache.set(key, offCanvas);
        return offCanvas;
    }

    /* ==========================================================================
       4. INTERACTIVE HEART CLASS & HEARTS GENERATION
       ========================================================================== */
    let topHearts = [];
    let bottomHearts = [];
    let initialEnvelopeHeartsCount = 0;
    let isEnvelopeUnlocked = false;
    let isEnvelopeWiggling = false;
    let isOverlayDismissed = false;

    class InteractiveHeart {
        constructor(id, x, y, scale, color, isInteractive = true, isBottomLayer = false) {
            this.id = id;
            this.targetX = x;   // Vị trí đích trong hình trái tim
            this.targetY = y;
            this.scale = scale;
            this.color = color;
            this.rotation = (Math.random() - 0.5) * 0.5;
            this.isInteractive = isInteractive;
            this.isBottomLayer = isBottomLayer;

            this.vx = 0;
            this.vy = 0;
            this.isDragging = false;
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.02 + Math.random() * 0.02;

            // Fly-in animation: bắt đầu từ rìa màn hình
            this.flyProgress = 0;   // 0 → 1
            this.flyDelay = Math.random() * 0.45; // mỗi heart bay vào lệch thời gian một chút
            this.flyDuration = 0.55 + Math.random() * 0.3;
            // Spawn tại rìa màn hình ngẫu nhiên
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { this.x = Math.random() * width; this.y = -60; }
            else if (edge === 1) { this.x = width + 60; this.y = Math.random() * height; }
            else if (edge === 2) { this.x = Math.random() * width; this.y = height + 60; }
            else { this.x = -60; this.y = Math.random() * height; }
            this.startX = this.x;  // Lưu điểm spawn để lerp
            this.startY = this.y;
            this.opacity = 0;
        }

        update(globalFlyT) {
            this.pulsePhase += this.pulseSpeed;

            // Fly-in: di chuyển về targetX/targetY
            if (this.flyProgress < 1) {
                // Nếu đang bị drag hoặc bị push → snap về target ngay, kết thúc fly-in
                if (this.isDragging || Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
                    this.flyProgress = 1;
                    if (!this.isDragging) {
                        this.x = this.targetX;
                        this.y = this.targetY;
                    }
                    this.opacity = 1;
                } else {
                    // Thời gian cá nhân sau khi trừ delay
                    const t = Math.max(0, (globalFlyT - this.flyDelay) / this.flyDuration);
                    this.flyProgress = Math.min(1, t);

                    // Cubic ease-out: easeP = 0→1
                    const easeP = 1 - Math.pow(1 - this.flyProgress, 3);

                    // Lerp x,y từ spawn edge về target
                    this.x = this.startX + (this.targetX - this.startX) * easeP;
                    this.y = this.startY + (this.targetY - this.startY) * easeP;
                    this.opacity = Math.min(1, easeP * 2);

                    // Snap chính xác khi xong
                    if (this.flyProgress >= 1) {
                        this.x = this.targetX;
                        this.y = this.targetY;
                        this.opacity = 1;
                    }
                    return; // Không apply inertia khi đang fly-in bình thường
                }
            }

            if (this.isInteractive && !this.isDragging) {
                this.x += this.vx;
                this.y += this.vy;

                this.vx *= 0.88;
                this.vy *= 0.88;

                if (Math.abs(this.vx) < 0.05) this.vx = 0;
                if (Math.abs(this.vy) < 0.05) this.vy = 0;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.opacity !== undefined ? this.opacity : 1;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            if (this.isDragging) {
                // Khi đang kéo: vẽ trực tiếp với hiệu ứng phát sáng
                const dragSize = this.scale * 1.15;
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ffffff';
                ctx.fillStyle = this.color;
                drawHeartPath(ctx, 0, -dragSize / 2, dragSize);
                ctx.fill();
            } else {
                // Dùng sprite cố định theo this.scale (không thay đổi), áp dụng ctx.scale cho hiệu ứng pulse
                // → Sprite cache luôn HIT, không tạo thêm canvas mỗi frame → 60 FPS ổn định
                const pulse = this.flyProgress >= 1 ? (Math.sin(this.pulsePhase) * 0.04 + 1) : 1;
                ctx.scale(pulse, pulse);
                const sprite = getHeartSprite(this.scale, this.color, this.isBottomLayer);
                ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
            }

            ctx.restore();
        }

        distanceTo(px, py) {
            const dx = px - this.x;
            const dy = py - this.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
    }

    function createHeartPile() {
        topHearts = [];
        bottomHearts = [];

        const centerX = width / 2;
        const centerY = height / 2;

        const S = Math.min(width, height) * 0.38; // Bán kính khối trái tim lớn (pixel)

        const topColorPalette = [
            '#ff2a5f', '#ff4d6d', '#ff758f', '#c9184a', '#a4133c',
            '#ff8fa3', '#e60049', '#ff3366', '#d90429', '#ff6584'
        ];
        const bottomColorPalette = [
            '#cc1144', '#b3003b', '#990033', '#d92659', '#a60838', '#c41c4d', '#8c0029'
        ];

        // ---------------------------------------------------------------
        // Hàm chuyển tọa độ chuẩn hóa [-1,1] → pixel
        // Heart parametric: x = 16sin³t, y = -(13cost-5cos2t-2cos3t-cos4t)
        // Bounding box: rawX ∈ [-16,16], rawY ∈ [-13, ~6.7]
        // Normalize: divide by 16 for x, 14 for y (so both ≈ ±1)
        // ---------------------------------------------------------------
        const HW = 16;   // half-width of raw heart
        const HH = 14;   // half-height of raw heart

        function rawToPixel(rawX, rawY) {
            return {
                x: centerX + (rawX / HW) * S,
                y: centerY + (rawY / HH) * S * 0.9
            };
        }

        // Kiểm tra điểm (px, py) pixel có nằm trong hình trái tim không
        function isInsideHeart(px, py) {
            // Chuyển về tọa độ chuẩn hóa raw
            const rx = ((px - centerX) / S) * HW;
            const ry = ((py - centerY) / (S * 0.9)) * HH;
            // Soft bottom correction inverse (approximate)
            const adjustedRy = ry;

            // Kiểm tra bằng cách thử nhiều góc t và tìm xem điểm có nằm trong contour không
            // Dùng thuật toán winding / raycasting đơn giản trên heart parametric
            // Số điểm biên lấy mẫu
            const STEPS = 120;
            let inside = false;
            let prevPt = getHeartRaw(0);
            for (let i = 1; i <= STEPS; i++) {
                const t = (i / STEPS) * Math.PI * 2;
                const curPt = getHeartRaw(t);
                // Ray casting: horizontal ray từ (rx, ry) sang phải
                if (
                    (prevPt.y > adjustedRy) !== (curPt.y > adjustedRy) &&
                    rx < prevPt.x + ((adjustedRy - prevPt.y) / (curPt.y - prevPt.y)) * (curPt.x - prevPt.x)
                ) {
                    inside = !inside;
                }
                prevPt = curPt;
            }
            return inside;
        }

        function getHeartRaw(t) {
            let rawX = 16 * Math.pow(Math.sin(t), 3);
            let rawY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            // Soften bottom tip
            if (rawY > 4) {
                const bf = (rawY - 4) / 13;
                rawY -= Math.pow(bf, 1.6) * 4.5;
            }
            return { x: rawX, y: rawY };
        }

        function getHeartPoint(t, rMultiplier) {
            const raw = getHeartRaw(t);
            return rawToPixel(raw.x * rMultiplier, raw.y * rMultiplier);
        }

        // Tính bounding box hình trái tim trong pixel
        const heartBBox = {
            minX: centerX - S,
            maxX: centerX + S,
            minY: centerY - S * 0.9,
            maxY: centerY + S * 0.9
        };

        // Hàm tạo điểm ngẫu nhiên bên trong heart bằng rejection sampling
        function randomPointInsideHeart(maxTries = 30) {
            for (let i = 0; i < maxTries; i++) {
                const px = heartBBox.minX + Math.random() * (heartBBox.maxX - heartBBox.minX);
                const py = heartBBox.minY + Math.random() * (heartBBox.maxY - heartBBox.minY);
                if (isInsideHeart(px, py)) return { x: px, y: py };
            }
            return null; // fallback nếu thất bại
        }

        let heartId = 0;
        const JITTER = 4; // Jitter cực nhỏ để hình giữ được viền sắc nét

        // A) BOTTOM HEARTS BED — rejection sampling, 350 hearts
        let bCount = 0;
        let bAttempts = 0;
        while (bCount < 350 && bAttempts < 8000) {
            bAttempts++;
            const pt = randomPointInsideHeart();
            if (!pt) continue;
            const jx = (Math.random() - 0.5) * JITTER;
            const jy = (Math.random() - 0.5) * JITTER;
            const scale = Math.random() * 14 + 26; // 26–40px
            const color = bottomColorPalette[Math.floor(Math.random() * bottomColorPalette.length)];
            bottomHearts.push(new InteractiveHeart(heartId++, pt.x + jx, pt.y + jy, scale, color, false, true));
            bCount++;
        }

        // B1) TOP BOUNDARY — 130 hearts bám sát viền ngoài
        for (let i = 0; i < 130; i++) {
            const t = Math.random() * Math.PI * 2;
            const r = 0.95 + Math.random() * 0.06; // [0.95 .. 1.01]
            const pt = getHeartPoint(t, r);
            const jx = (Math.random() - 0.5) * JITTER;
            const jy = (Math.random() - 0.5) * JITTER;
            const scale = Math.random() * 12 + 28; // 28–40px
            const color = topColorPalette[Math.floor(Math.random() * topColorPalette.length)];
            topHearts.push(new InteractiveHeart(heartId++, pt.x + jx, pt.y + jy, scale, color, true, false));
        }

        // B2) TOP INNER FILL — rejection sampling đều đặn, 420 hearts
        let tCount = 0;
        let tAttempts = 0;
        while (tCount < 420 && tAttempts < 12000) {
            tAttempts++;
            const pt = randomPointInsideHeart();
            if (!pt) continue;
            const jx = (Math.random() - 0.5) * JITTER;
            const jy = (Math.random() - 0.5) * JITTER;
            const scale = Math.random() * 14 + 24; // 24–38px
            const color = topColorPalette[Math.floor(Math.random() * topColorPalette.length)];
            topHearts.push(new InteractiveHeart(heartId++, pt.x + jx, pt.y + jy, scale, color, true, false));
            tCount++;
        }

        // B3) Phủ kín khu vực phong bì (180x120px)
        for (let i = 0; i < 60; i++) {
            const rx = (Math.random() - 0.5) * 180;
            const ry = (Math.random() - 0.5) * 120;
            const scale = Math.random() * 12 + 24; // 24–36px
            const color = topColorPalette[Math.floor(Math.random() * topColorPalette.length)];
            topHearts.push(new InteractiveHeart(heartId++, centerX + rx, centerY + ry, scale, color, true, false));
        }

        topHearts.sort(() => Math.random() - 0.5);
        bottomHearts.sort(() => Math.random() - 0.5);

        initialEnvelopeHeartsCount = countHeartsOverEnvelopeRect(centerX, centerY);
        if (initialEnvelopeHeartsCount === 0) initialEnvelopeHeartsCount = 1;
    }

    function reinitHeartPile() {
        createHeartPile();
    }
    createHeartPile();

    function countHeartsOverEnvelopeRect(cx, cy) {
        let count = 0;
        const halfW = 105;
        const halfH = 70;
        topHearts.forEach(h => {
            if (Math.abs(h.x - cx) <= halfW && Math.abs(h.y - cy) <= halfH) {
                count++;
            }
        });
        return count;
    }

    /* ==========================================================================
       5. ANIMATION LOOP & REVEAL CALCULATION
       ========================================================================== */
    let frameCount = 0;
    let lastRevealPercent = -1;
    let bottomNeedsUpdate = true; // Bottom hearts chỉ cần vẽ 1 lần nếu không có animation
    let flyInStartTime = null; // Thời điểm bắt đầu fly-in animation (ms)
    let isEnvelopeAppeared = false; // Trạng thái lá thư xuất hiện sau khi xếp trái tim xong
    const FLY_IN_TOTAL_DURATION = 1800; // Tổng thời gian fly-in (ms)

    // Kích hoạt fly-in: reset thời điểm bắt đầu
    function startFlyInAnimation() {
        flyInStartTime = performance.now();
    }

    function animateHearts() {
        frameCount++;

        // Tính globalFlyT (0→1) cho toàn bộ fly-in
        let globalFlyT = 0;
        if (flyInStartTime !== null) {
            globalFlyT = Math.min(1, (performance.now() - flyInStartTime) / FLY_IN_TOTAL_DURATION);
        }

        heartCtx.clearRect(0, 0, width, height);
        topHearts.forEach(h => {
            h.update(globalFlyT);
            h.draw(heartCtx);
        });

        // Bottom hearts fly-in + redraw
        bottomCtx.clearRect(0, 0, width, height);
        bottomHearts.forEach(h => {
            h.update(globalFlyT);
            h.draw(bottomCtx);
        });

        // Khi các trái tim nhỏ đã bay vào quy tụ xong hoàn toàn (globalFlyT >= 1) -> Lá thư mới bừng hiện ra bên trong
        if (flyInStartTime !== null && globalFlyT >= 1 && !isEnvelopeAppeared) {
            isEnvelopeAppeared = true;
            // Tính số lượng trái tim đè lên lá thư ngay khi đã xếp xong để tiến trình bắt đầu chuẩn từ 0%
            const cx = width / 2;
            const cy = height / 2;
            initialEnvelopeHeartsCount = countHeartsOverEnvelopeRect(cx, cy);
            if (initialEnvelopeHeartsCount === 0) initialEnvelopeHeartsCount = 1;
            lastRevealPercent = -1;

            if (envelopeWrapper) {
                envelopeWrapper.classList.add('visible');
            }
        }

        // Kiểm tra tiến trình chỉ mỗi 8 frame (khoảng 7-8 lần/giây) → đủ smooth, giảm tải CPU
        if (isOverlayDismissed && isEnvelopeAppeared && frameCount % 8 === 0) {
            checkEnvelopeRevealProgress();
        }

        requestAnimationFrame(animateHearts);
    }
    animateHearts();

    function checkEnvelopeRevealProgress() {
        if (!isEnvelopeAppeared) return;

        const centerX = width / 2;
        const centerY = height / 2;
        const currentHeartsOverEnvelope = countHeartsOverEnvelopeRect(centerX, centerY);

        const revealedRatio = 1 - (currentHeartsOverEnvelope / initialEnvelopeHeartsCount);
        let revealPercentage = Math.max(0, Math.min(100, Math.round(revealedRatio * 100)));

        // Chỉ cập nhật DOM khi % thực sự thay đổi → tránh reflow/repaint mỗi 8 frame
        if (revealPercentage !== lastRevealPercent && progressBarFill && progressPercent) {
            lastRevealPercent = revealPercentage;
            if (revealPercentage >= 100) {
                progressBarFill.style.width = '100%';
                progressPercent.textContent = "100%";
                progressContainer.classList.add('completed');
            } else {
                progressBarFill.style.width = `${revealPercentage}%`;
                progressPercent.textContent = `${revealPercentage}%`;
                progressContainer.classList.remove('completed');
            }
        }

        if (revealPercentage >= 25 && revealPercentage < 100 && !isEnvelopeUnlocked) {
            if (!isEnvelopeWiggling) {
                isEnvelopeWiggling = true;
                envelope.classList.add('wiggle');
            }
            chatTooltip.classList.add('show');
            const searchingTpl = appConfig.interactiveScreen?.tooltipSearching || "Hãy tìm đủ 100% trái tim để xem thư nhé! ({percent}%) 💖";
            tooltipText.textContent = searchingTpl.replace('{percent}', revealPercentage);
        }

        if (revealPercentage >= 100 && !isEnvelopeUnlocked) {
            isEnvelopeUnlocked = true;
            isEnvelopeWiggling = false;
            envelope.classList.remove('wiggle');
            envelope.classList.add('ready-to-click');

            // Đẩy tooltip lên cao hơn để không chồng lên lá thư đang nhô ra
            chatTooltip.classList.add('show', 'envelope-open');
            tooltipText.textContent = appConfig.interactiveScreen?.tooltipUnlocked || "Click vào bức thư để mở nè! 💌";
            dragHint.style.opacity = '0';

            // Nâng phong bì lên trên canvas trái tim để hiển thị rõ
            envelopeWrapper.classList.add('unlocked');

            // Đẩy văng vật lý các trái tim còn nằm trên vùng phong bì
            blastHeartsAwayFromEnvelope();

            // Tự động ẩn tooltip sau 4 giây (lá thư tự nói lên tất cả 💌)
            setTimeout(() => {
                chatTooltip.classList.remove('show');
                setTimeout(() => chatTooltip.classList.remove('envelope-open'), 500);
            }, 4000);
        }
    }

    /**
     * Tạo lực nổ vật lý đẩy bất kỳ trái tim nhỏ nào còn đè lên phong bì
     * văng ra theo hướng từ tâm phong bì → vị trí tim → ra ngoài
     */
    function blastHeartsAwayFromEnvelope() {
        const cx = width / 2;
        const cy = height / 2;
        const blastRadius = 140; // Vùng blast rộng hơn vùng phong bì

        topHearts.forEach(h => {
            const dx = h.x - cx;
            const dy = h.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < blastRadius) {
                // Tính lực đẩy theo khoảng cách: gần tâm → mạnh hơn
                const force = (blastRadius - dist) / blastRadius;
                const dirX = dist > 0 ? dx / dist : (Math.random() - 0.5);
                const dirY = dist > 0 ? dy / dist : (Math.random() - 0.5);
                const speed = 12 + force * 22;

                h.vx += dirX * speed;
                h.vy += dirY * speed - 3; // Đẩy hơi lên trên thêm 1 chút
                h.flyProgress = 1; // Kết thúc fly-in để physics hoạt động ngay
            }
        });
    }

    /* ==========================================================================
       6. SINGLE ITEM DRAGGING & PHYSICS INTERACTION (TOP HEARTS)
       ========================================================================== */
    let selectedHeart = null;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let pointerVelX = 0;
    let pointerVelY = 0;

    function getPointerPos(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    function isPointerOverEnvelope(px, py) {
        const centerX = width / 2;
        const centerY = height / 2;
        return (px >= centerX - 100 && px <= centerX + 100 && py >= centerY - 70 && py <= centerY + 70);
    }

    function onPointerDown(e) {
        if (!isOverlayDismissed) return;

        const pos = getPointerPos(e);
        lastPointerX = pos.x;
        lastPointerY = pos.y;
        pointerVelX = 0;
        pointerVelY = 0;

        let closestHeart = null;
        let minDistance = Infinity;

        for (let i = topHearts.length - 1; i >= 0; i--) {
            const h = topHearts[i];
            // Chỉ cho phép chọn hearts đã bay vào đích (flyProgress >= 1)
            if (h.flyProgress < 1) continue;
            const dist = h.distanceTo(pos.x, pos.y);
            const selectionThreshold = h.scale * 1.1;

            if (dist < selectionThreshold && dist < minDistance) {
                minDistance = dist;
                closestHeart = h;
            }
        }

        if (!closestHeart && isPointerOverEnvelope(pos.x, pos.y)) {
            if (isEnvelopeUnlocked) {
                letterModal.classList.add('active');
                triggerHeartConfetti();
                return;
            } else {
                envelope.classList.add('wiggle');
                chatTooltip.classList.add('show');
                tooltipText.textContent = appConfig.interactiveScreen?.tooltipNeedMore || "Hãy bới đủ 100% trái tim để mở thư nhé! 💖";
                setTimeout(() => {
                    if (!isEnvelopeWiggling) envelope.classList.remove('wiggle');
                }, 800);
            }
        }

        if (closestHeart) {
            selectedHeart = closestHeart;
            selectedHeart.isDragging = true;

            const idx = topHearts.indexOf(selectedHeart);
            if (idx > -1) {
                topHearts.splice(idx, 1);
                topHearts.push(selectedHeart);
            }
        }
    }

    function onPointerMove(e) {
        if (!isOverlayDismissed) return;

        const pos = getPointerPos(e);
        const dx = pos.x - lastPointerX;
        const dy = pos.y - lastPointerY;

        pointerVelX = dx;
        pointerVelY = dy;

        lastPointerX = pos.x;
        lastPointerY = pos.y;

        if (selectedHeart) {
            selectedHeart.x = pos.x;
            selectedHeart.y = pos.y;

            // Fast Bounding Box Collision Check
            topHearts.forEach(h => {
                if (h !== selectedHeart && !h.isDragging) {
                    const diffX = h.x - selectedHeart.x;
                    const diffY = h.y - selectedHeart.y;
                    if (Math.abs(diffX) < 50 && Math.abs(diffY) < 50) {
                        const dist = Math.sqrt(diffX * diffX + diffY * diffY);
                        if (dist < 50 && dist > 0) {
                            const pushForce = (50 - dist) * 0.12;
                            h.vx += (diffX / dist) * pushForce;
                            h.vy += (diffY / dist) * pushForce;
                        }
                    }
                }
            });
        }
    }

    function onPointerUp() {
        if (selectedHeart) {
            selectedHeart.isDragging = false;
            selectedHeart.vx = pointerVelX * 1.5;
            selectedHeart.vy = pointerVelY * 1.5;
            selectedHeart = null;
        }
    }

    heartCanvas.addEventListener('mousedown', onPointerDown);
    heartCanvas.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    heartCanvas.addEventListener('touchstart', onPointerDown, { passive: true });
    heartCanvas.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    /* ==========================================================================
       7. OVERLAY DISMISSAL (LAYER 1 -> LAYER 2) & INTERACTIVE EFFECTS
       ========================================================================== */
    const welcomeCard = document.getElementById('welcome-card');
    const typewriterTextEl = document.getElementById('typewriter-text');
    let fullText = "Mo shi mo shiii!";
    let textIndex = 0;

    // Typewriter Phase 1 (gõ chữ tĩnh) -> Phase 2 (bật nhảy lò xo + ẩn cursor)
    const typewriterCursor = document.getElementById('typewriter-cursor');

    function typeWriter() {
        if (typewriterTextEl && textIndex < fullText.length) {
            const char = fullText.charAt(textIndex);
            const span = document.createElement('span');
            span.className = 'typewriter-char' + (char === ' ' ? ' space' : '');
            span.textContent = char === ' ' ? '\u00A0' : char;
            // Map thời gian ngẫu nhiên khác nhau cho từng chữ (không nhảy theo dải sóng)
            const randomDelays = [0.2, 1.1, 0.5, 1.7, 0.1, 0.9, 1.4, 0.3, 1.6, 0.7, 1.2, 0.0, 1.5, 0.8, 0.4];
            const delay = randomDelays[textIndex % randomDelays.length];
            span.style.setProperty('--delay', `${delay}s`);

            typewriterTextEl.appendChild(span);
            textIndex++;
            setTimeout(typeWriter, 100);
        } else if (textIndex >= fullText.length) {
            // 1. Biến mất hoàn toàn vạch con trỏ |
            if (typewriterCursor) {
                typewriterCursor.style.display = 'none';
            }
            // 2. Kích hoạt hiệu ứng từng chữ nhún nhảy lò xo vui nhộn!
            setTimeout(() => {
                const charSpans = typewriterTextEl.querySelectorAll('.typewriter-char');
                charSpans.forEach(span => span.classList.add('bouncy'));
            }, 100);
        }
    }
    
    // Nạp cấu hình từ data.json trước, sau đó kích hoạt hiệu ứng Typewriter
    initConfig().then(() => {
        setTimeout(typeWriter, 400);
    });

    // 3D Tilt Parallax Card Effect (Ultra-Smooth LERP Engine with 60-120 FPS rAF)
    if (welcomeOverlay && welcomeCard) {
        let isHovered = false;
        let tiltFrameId = null;
        let cardRect = null;

        let targetRotateX = 0;
        let targetRotateY = 0;
        let targetScale = 1;

        let currentRotateX = 0;
        let currentRotateY = 0;
        let currentScale = 1;

        function updateCardRect() {
            if (welcomeCard && !isOverlayDismissed) {
                cardRect = welcomeCard.getBoundingClientRect();
            }
        }

        function renderTilt() {
            if (isOverlayDismissed || welcomeCard.classList.contains('no-tilt') || welcomeCard.classList.contains('card-flip-flat')) {
                tiltFrameId = null;
                return;
            }

            // Smooth linear interpolation (LERP factor 0.1)
            currentRotateX += (targetRotateX - currentRotateX) * 0.1;
            currentRotateY += (targetRotateY - currentRotateY) * 0.1;
            currentScale += (targetScale - currentScale) * 0.1;

            welcomeCard.style.transform = `rotateX(${currentRotateX.toFixed(2)}deg) rotateY(${currentRotateY.toFixed(2)}deg) scale(${currentScale.toFixed(3)})`;

            // Continue loop if mouse is hovering or if animation hasn't settled
            const delta = Math.abs(targetRotateX - currentRotateX) + Math.abs(targetRotateY - currentRotateY) + Math.abs(targetScale - currentScale);
            if (isHovered || delta > 0.01) {
                tiltFrameId = requestAnimationFrame(renderTilt);
            } else {
                tiltFrameId = null;
            }
        }

        function startTiltLoop() {
            if (!tiltFrameId) {
                tiltFrameId = requestAnimationFrame(renderTilt);
            }
        }

        function handlePointerMove(clientX, clientY) {
            if (isOverlayDismissed || welcomeCard.classList.contains('no-tilt') || welcomeCard.classList.contains('card-flip-flat')) return;
            if (!cardRect) updateCardRect();

            const centerX = cardRect.left + cardRect.width / 2;
            const centerY = cardRect.top + cardRect.height / 2;
            const dx = Math.min(Math.max((clientX - centerX) / (cardRect.width / 2), -1), 1);
            const dy = Math.min(Math.max((clientY - centerY) / (cardRect.height / 2), -1), 1);

            targetRotateX = -dy * 12;
            targetRotateY = dx * 12;
            targetScale = 1.03;
            isHovered = true;

            startTiltLoop();
        }

        welcomeOverlay.addEventListener('mouseenter', () => {
            updateCardRect();
            isHovered = true;
        });

        window.addEventListener('resize', () => {
            cardRect = null;
        });

        welcomeOverlay.addEventListener('mousemove', (e) => {
            handlePointerMove(e.clientX, e.clientY);
        });

        welcomeOverlay.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches[0]) {
                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        function onDeviceOrientationCard(e) {
            if (isOverlayDismissed || welcomeCard.classList.contains('no-tilt') || welcomeCard.classList.contains('card-flip-flat')) return;
            if (e.beta === null || e.gamma === null) return;
            const dy = Math.min(Math.max((e.beta - 45) / 30, -1), 1);
            const dx = Math.min(Math.max(e.gamma / 30, -1), 1);
            targetRotateX = -dy * 12;
            targetRotateY = dx * 12;
            targetScale = 1.02;
            isHovered = true;
            startTiltLoop();
        }

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', onDeviceOrientationCard, true);
        }

        welcomeOverlay.addEventListener('mouseleave', () => {
            if (isOverlayDismissed || welcomeCard.classList.contains('no-tilt') || welcomeCard.classList.contains('card-flip-flat')) return;
            isHovered = false;
            targetRotateX = 0;
            targetRotateY = 0;
            targetScale = 1;
            startTiltLoop();
        });
    }

    // =========================================================================
    // 7b. BLACK HOLE TRANSITION — 4-Phase Animation on "Khám Phá Ngay" click
    // =========================================================================

    /**
     * Tính offset translate từ trung tâm element đến điểm hút (suck point)
     * @param {Element} el - element cần hút
     * @param {number} suckX - toạ độ X điểm hút (viewport)
     * @param {number} suckY - toạ độ Y điểm hút (viewport)
     * @param {number} [extraRotate=0] - góc xoay thêm (deg)
     */
    function applySuckTransform(el, suckX, suckY, extraRotate = 0) {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = suckX - cx;
        const dy = suckY - cy;
        // Chỉ di chuyển transform — opacity được xử lý riêng (snap ận khi tới điểm hút)
        el.style.transform = `translate(${dx}px, ${dy}px) scale(0.05) rotate(${extraRotate}deg)`;
    }

    /**
     * Kích hoạt 3D interactive rotation trên trái tim theo chuột / touch
     */
    function initHeart3DInteraction(heartEl) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;

        function onMouseMove(e) {
            const dx = (e.clientX - cx) / cx;   // -1 → +1
            const dy = (e.clientY - cy) / cy;
            const ry = dx * 35;   // rotateY
            const rx = -dy * 25;   // rotateX
            heartEl.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.08)`;
        }

        function onTouchMove(e) {
            const t = e.touches[0];
            const dx = (t.clientX - cx) / cx;
            const dy = (t.clientY - cy) / cy;
            heartEl.style.transform = `perspective(800px) rotateX(${-dy * 25}deg) rotateY(${dx * 35}deg) scale(1.08)`;
        }

        function onMouseLeave() {
            heartEl.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('mouseleave', onMouseLeave);

        // Cleanup khi overlay ẩn
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('mouseleave', onMouseLeave);
        };
    }

    /**
     * MAIN: Orchestrate toàn bộ 4-phase transition
     */
    function triggerBlackHoleTransition() {
        btnSubmit.disabled = true;

        // Xin quyền cảm biến nghiêng thiết bị trên iOS Safari nếu cần
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().catch(() => {});
        }

        // Nếu hiệu ứng gõ chữ chưa hoàn thành xong mà người dùng bấm ngay -> Đổ hết tất cả ký tự chữ còn lại ra ngay lập tức
        if (textIndex < fullText.length) {
            if (typewriterTextEl) {
                typewriterTextEl.innerHTML = '';
                for (let i = 0; i < fullText.length; i++) {
                    const char = fullText.charAt(i);
                    const span = document.createElement('span');
                    span.className = 'typewriter-char' + (char === ' ' ? ' space' : '');
                    span.textContent = char === ' ' ? '\u00A0' : char;
                    typewriterTextEl.appendChild(span);
                }
            }
            if (typewriterCursor) typewriterCursor.style.display = 'none';
            textIndex = fullText.length;
        }

        // ── Snapshot & refs ────────────────────────────────────────────────────
        const heartContainer = document.querySelector('.heart-container');
        const heartIcon = document.querySelector('.pulsing-heart-icon');
        const cardRect = welcomeCard.getBoundingClientRect();

        // Điểm hút: giữa-dưới card
        const suckX = cardRect.left + cardRect.width / 2;
        const suckY = cardRect.top + cardRect.height - 36;

        // Tắt mousemove tilt trên card và khóa chiều cao cố định để card không bị sụp dáng khi chữ bay đi
        welcomeCard.style.height = `${cardRect.height}px`;
        welcomeCard.style.minHeight = `${cardRect.height}px`;
        welcomeCard.classList.add('transitioning', 'no-tilt');

        // ── Tách heart-container ra document.body (fixed pos) ─────────────────
        const hRect = heartContainer.getBoundingClientRect();

        // Tạo spacer để giữ khoảng không gian cũ trong card, tránh làm dòng chữ phía dưới nhảy vị trí
        const heartSpacer = document.createElement('div');
        heartSpacer.className = 'heart-spacer';
        heartSpacer.style.width = `${hRect.width}px`;
        heartSpacer.style.height = `${hRect.height}px`;
        heartSpacer.style.marginBottom = window.getComputedStyle(heartContainer).marginBottom;
        heartContainer.parentNode.insertBefore(heartSpacer, heartContainer);

        heartContainer.style.position = 'fixed';
        heartContainer.style.top = hRect.top + 'px';
        heartContainer.style.left = hRect.left + 'px';
        heartContainer.style.width = hRect.width + 'px';
        heartContainer.style.height = hRect.height + 'px';
        heartContainer.style.margin = '0';
        heartContainer.style.zIndex = '9999';
        heartContainer.style.transform = 'none';
        document.body.appendChild(heartContainer);   // thoát khỏi card DOM để giữ trái tim luôn hiển thị rực rỡ

        // ── PHASE 1: Suck TEXT theo từng KÝ TỰ ngẫu nhiên ──────────────────────

        /**
         * Tách text nodes trong container thành từng <span> ký tự riêng biệt
         * Trả về mảng các span đã insert vào DOM
         */
        function splitToCharSpans(container) {
            // Lấy tất cả text nodes lá (bỏ qua các node trống)
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
                acceptNode: n => n.textContent.length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
            });
            const textNodes = [];
            let n;
            while ((n = walker.nextNode())) textNodes.push(n);

            const spans = [];
            textNodes.forEach(textNode => {
                const chars = [...textNode.textContent];  // Unicode-safe split
                const frag = document.createDocumentFragment();
                chars.forEach(char => {
                    const sp = document.createElement('span');
                    sp.style.display = 'inline-block';
                    sp.textContent = char;
                    frag.appendChild(sp);
                    spans.push(sp);
                });
                textNode.parentNode.replaceChild(frag, textNode);
            });
            return spans;
        }

        /**
         * Fisher-Yates shuffle
         */
        function shuffle(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        // Thu thập tất cả elements cần suck (ký tự + decorative)
        const allSuckItems = [];

        // 1. Toàn bộ tiêu đề "Xin chào bạn! ✨" (các spans ký tự + icon emoji ✨ trong tiêu đề + con trỏ cursor)
        const welcomeTitle = document.querySelector('#welcome-title');
        if (welcomeTitle) {
            splitToCharSpans(welcomeTitle).forEach(sp => allSuckItems.push({ el: sp, isChar: true }));
        }

        // 2. Các ký tự trong card-body paragraphs
        const msgEls = document.querySelectorAll('.welcome-message, .welcome-submessage');
        msgEls.forEach(p => {
            splitToCharSpans(p).forEach(sp => allSuckItems.push({ el: sp, isChar: true }));
        });

        // 3. Khung nút Submit & các chi tiết trang trí bên trong nút (btn-glow, btn-shimmer)
        if (btnSubmit) {
            allSuckItems.push({ el: btnSubmit, isChar: false });
        }

        // 4. Orbit particles & sparkles — suck theo element
        Array.from(document.querySelectorAll('.orbit-particle, .sparkle'))
            .forEach(el => allSuckItems.push({ el, isChar: false }));

        // 5. EKG wrapper — element level
        const ekgEl = document.querySelector('.ekg-wrapper');
        if (ekgEl) allSuckItems.push({ el: ekgEl, isChar: false });

        // Shuffle toàn bộ — mỗi ký tự bay vào ngẫu nhiên
        shuffle(allSuckItems);

        // Pre-compute delay/duration cho từng item — dùng để tính maxSuckEnd
        const SUCK_WINDOW = 800;
        let maxSuckEnd = 0;

        const suckParams = allSuckItems.map(({ el }) => {
            const delay = Math.random() * SUCK_WINDOW;               // 0–800ms
            const dur = 0.60 + Math.random() * 0.40;               // 0.60s–1.00s (chậm và nhìn rõ hơn)
            const rot = (Math.random() - 0.5) * 200;               // –100° → +100°
            const endMs = delay + dur * 1000;                         // thời điểm kết thúc
            if (endMs > maxSuckEnd) maxSuckEnd = endMs;
            return { el, delay, dur, rot };
        });

        // Áp dụng animation cho từng item
        suckParams.forEach(({ el, delay, dur, rot }) => {
            // Tắt animation tự do ban đầu để không đè transform hút
            el.classList.add('suck-in');

            // Cubic-bezier gia tốc hướng về tâm hút mượt mà
            el.style.transition = `transform ${dur}s cubic-bezier(0.5, 0, 0.8, 0.4) ${delay}ms`;
            el.style.willChange = 'transform';
            el.style.pointerEvents = 'none';

            // Lắng nghe chính xác thời điểm transform chạm đích (điểm hút cuối cùng) mới cho ẩn chữ
            const onArrival = (e) => {
                if (e.propertyName === 'transform') {
                    el.style.opacity = '0';
                    el.style.visibility = 'hidden';
                    el.removeEventListener('transitionend', onArrival);
                }
            };
            el.addEventListener('transitionend', onArrival);

            setTimeout(() => {
                applySuckTransform(el, suckX, suckY, rot);
            }, delay);
        });

        // ── Timing động: các phase bắt đầu SAU KHI ký tự cuối đã vào xong ──────
        const BUFFER = 1000;                   // Chờ đúng 1 giây (1000ms) sau khi toàn bộ chữ hút xong
        const P2_START = maxSuckEnd + BUFFER;    // phase 2: card flip
        const P3_START = P2_START + 500;         // phase 3: heart expand (sau 500ms flip)
        const P4_START = P3_START + 1000;        // phase 4: fade out (sau 1000ms 3D)

        // ── PHASE 2: Hút text xong -> Card xoay ngang 3D & trượt về trung tâm ──
        setTimeout(() => {
            // 1. Card xoay lật phẳng 3D
            welcomeCard.style.height = '';
            welcomeCard.style.minHeight = '';
            welcomeCard.classList.add('card-flip-flat');

            // 2. Thêm transition NHANH MƯỢT cho heartContainer để nó trượt về trung tâm
            heartContainer.style.transition = 'top 0.35s cubic-bezier(0.2, 0, 0.2, 1), left 0.35s cubic-bezier(0.2, 0, 0.2, 1), width 0.35s cubic-bezier(0.2, 0, 0.2, 1), height 0.35s cubic-bezier(0.2, 0, 0.2, 1), transform 0.35s cubic-bezier(0.2, 0, 0.2, 1)';
            heartContainer.classList.add('heart-3d-mode');

            // Dùng rAF để đảm bảo transition style đã được ghi nhận trước khi thay đổi vị trí
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    heartContainer.style.top = '48%';
                    heartContainer.style.left = '50%';
                    heartContainer.style.width = '480px';
                    heartContainer.style.height = '480px';
                    heartContainer.style.transform = 'translate(-50%, -50%)';
                });
            });

            // 3. Đợi đúng 1 giây (1000ms) SAU KHI card đã xoay nằm ngang
            setTimeout(() => {
                // Kích hoạt hiệu ứng icon trái tim rung rung lắc tích năng lượng
                heartIcon.classList.add('heart-vibrate');

                // Card ẩn biến mất đi ngay khi trái tim bắt đầu rung lắc
                welcomeCard.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
                welcomeCard.style.opacity = '0';
                welcomeCard.style.transform = welcomeCard.style.transform + ' scale(0.8)';
                setTimeout(() => { welcomeCard.style.visibility = 'hidden'; }, 350);

                // Rung rung trong 800ms rồi mới bừng nổ chuyển sang trái tim 3D dots
                setTimeout(() => {
                    // Tạo Three.js container với opacity 0 để fade in mượt mà
                    const threeBox = document.createElement('div');
                    threeBox.style.position = 'absolute';
                    threeBox.style.inset = '0';
                    threeBox.style.opacity = '0';
                    threeBox.style.transform = 'scale(0.6)';
                    threeBox.style.transition = 'opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
                    heartContainer.appendChild(threeBox);

                    // Cross-fade: Ẩn emoji icon đang rung với hiệu ứng phóng to nổ mờ
                    heartIcon.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    heartIcon.style.opacity = '0';
                    heartIcon.style.transform = 'scale(1.6)';
                    setTimeout(() => { heartIcon.style.display = 'none'; }, 300);

                    // Kích hoạt Fade in cho Three.js Heart
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            threeBox.style.opacity = '1';
                            threeBox.style.transform = 'scale(1)';
                        });
                    });

                // 1. Khoi tao Three.js Scene, Camera, Renderer (kích thước lớn 480x480)
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
                camera.position.z = 40; // Đưa camera lại gần hơn để trái tim hiển thị to rực rỡ hơn

                const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                renderer.setSize(480, 480);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.setClearColor(0x000000, 0);
                threeBox.appendChild(renderer.domElement);

                const group = new THREE.Group();
                scene.add(group);

                // 2. Thuật toán 3D Heart Volume chuẩn từ demoV10.html
                function isInsideHeart3D(x, y, z) {
                    const nx = x / 14;
                    const ny = (y + 4) / 14;
                    const nz = z / 9;
                    const eq = Math.pow(nx * nx + ny * ny + nz * nz - 1, 3) - nx * nx * Math.pow(ny, 3) - nz * nz * Math.pow(ny, 3) * 0.1;
                    return eq <= 0;
                }

                const geo = new THREE.BufferGeometry();
                const pos = [];
                const col = [];
                const numDots = 5500;

                for (let i = 0; i < numDots; i++) {
                    let x, y, z;
                    let attempts = 0;
                    do {
                        x = (Math.random() - 0.5) * 38;
                        y = (Math.random() - 0.5) * 38;
                        z = (Math.random() - 0.5) * 24;
                        attempts++;
                    } while (!isInsideHeart3D(x, y, z) && attempts < 100);

                    if (attempts < 100) {
                        pos.push(x, y, z);
                        col.push(1.0, 0.15 + Math.random() * 0.4, 0.4 + Math.random() * 0.4);
                    }
                }

                geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
                geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));

                // 3. Texture phát sáng Radial Gradient Glow từ demoV10.html
                const canvas = document.createElement('canvas');
                canvas.width = 64;
                canvas.height = 64;
                const ctx = canvas.getContext('2d');
                const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                gradient.addColorStop(0.25, 'rgba(255, 100, 130, 0.85)');
                gradient.addColorStop(0.55, 'rgba(255, 42, 95, 0.35)');
                gradient.addColorStop(1, 'rgba(255, 42, 95, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 64, 64);

                const texture = new THREE.CanvasTexture(canvas);
                const mat = new THREE.PointsMaterial({
                    size: 0.85,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.95,
                    map: texture,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });

                const points = new THREE.Points(geo, mat);
                group.add(points);

                // 4. Hiệu ứng Morphing Transition mượt từ điểm nổ ban đầu -> tụ thành hình khối Trái Tim 3D
                const currentPos = new Float32Array(pos.length);
                for (let i = 0; i < pos.length; i += 3) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 8;
                    currentPos[i] = Math.cos(angle) * radius;
                    currentPos[i + 1] = Math.sin(angle) * radius;
                    currentPos[i + 2] = (Math.random() - 0.5) * 6;
                }
                geo.setAttribute("position", new THREE.Float32BufferAttribute(currentPos, 3));

                let time = 0;
                let morphProgress = 0; // 0 -> 1 mượt mà

                function animateThree() {
                    requestAnimationFrame(animateThree);
                    time += 0.025;

                    // Tăng tốc độ morphing tụ hạt (0.048/frame ~ 0.35s)
                    if (morphProgress < 1) {
                        morphProgress += 0.048;
                        if (morphProgress > 1) morphProgress = 1;

                        // Cubic easing cho tiến trình morphing tụ hạt
                        const easeP = 1 - Math.pow(1 - morphProgress, 3);
                        const positionAttribute = geo.attributes.position;

                        for (let i = 0; i < pos.length; i += 3) {
                            positionAttribute.array[i] = currentPos[i] + (pos[i] - currentPos[i]) * easeP;
                            positionAttribute.array[i + 1] = currentPos[i + 1] + (pos[i + 1] - currentPos[i + 1]) * easeP;
                            positionAttribute.array[i + 2] = currentPos[i + 2] + (pos[i + 2] - currentPos[i + 2]) * easeP;
                        }
                        positionAttribute.needsUpdate = true;
                    }

                    // Xoay 3D
                    group.rotation.y += 0.012;

                    // Nhịp tim bập bùng (beat)
                    const beat = 1 + Math.sin(time * 3) * 0.08 + Math.sin(time * 7.5) * 0.03;
                    group.scale.set(beat, beat, beat);

                    renderer.render(scene, camera);
                }
                animateThree();

                // Gắn cursor pointer và tooltip gợi ý click vào trái tim để tiếp tục
                heartContainer.style.cursor = 'pointer';
                heartContainer.title = 'Click vào trái tim 3D để khám phá bí mật!';

                // Interactive Tilt theo con trỏ chuột, Touch & Nghiêng điện thoại (Gyroscope)
                function onMouseMove3D(e) {
                    const cx = window.innerWidth / 2;
                    const cy = window.innerHeight / 2;
                    const dx = (e.clientX - cx) / cx;
                    const dy = (e.clientY - cy) / cy;
                    group.rotation.x = dy * 0.45;
                    group.rotation.z = -dx * 0.25;
                }

                function onTouchMove3D(e) {
                    if (!e.touches[0]) return;
                    const cx = window.innerWidth / 2;
                    const cy = window.innerHeight / 2;
                    const t = e.touches[0];
                    const dx = (t.clientX - cx) / cx;
                    const dy = (t.clientY - cy) / cy;
                    group.rotation.x = dy * 0.45;
                    group.rotation.z = -dx * 0.25;
                }

                function onDeviceOrientation3D(e) {
                    if (e.beta === null || e.gamma === null) return;
                    const dy = Math.min(Math.max((e.beta - 45) / 30, -1), 1);
                    const dx = Math.min(Math.max(e.gamma / 30, -1), 1);
                    group.rotation.x = dy * 0.55;
                    group.rotation.z = -dx * 0.35;
                }

                document.addEventListener('mousemove', onMouseMove3D);
                document.addEventListener('touchmove', onTouchMove3D, { passive: true });
                if (window.DeviceOrientationEvent) {
                    window.addEventListener('deviceorientation', onDeviceOrientation3D, true);
                }

                // ── PHASE 4: Click vào trái tim dot → Dots NỔ TUNG từ đúng vị trí → Hearts fly-in ──
                heartContainer.addEventListener('click', () => {
                    // Dừng mouse, touch & orientation tilt
                    document.removeEventListener('mousemove', onMouseMove3D);
                    document.removeEventListener('touchmove', onTouchMove3D);
                    if (window.DeviceOrientationEvent) {
                        window.removeEventListener('deviceorientation', onDeviceOrientation3D, true);
                    }

                    // ── Bước 1: Project 3D dots → toạ độ màn hình 2D ──────────────────────────
                    const containerRect = heartContainer.getBoundingClientRect();
                    const rendW = 480;  // kích thước renderer 480x480
                    const rendH = 480;

                    // Cập nhật matrixWorld để projection chính xác
                    group.updateMatrixWorld(true);
                    camera.updateMatrixWorld(true);

                    const posAttr = geo.attributes.position;
                    const colAttr = geo.attributes.color;
                    const particles2D = [];
                    const vw = window.innerWidth;
                    const vh = window.innerHeight;
                    const cxScreen = containerRect.left + containerRect.width / 2;
                    const cyScreen = containerRect.top + containerRect.height / 2;

                    // Sample mỗi 4 dot (~1300 particles) để vừa phô diễn hiệu ứng dày đặc vừa mượt chuẩn 60 FPS
                    for (let i = 0; i < posAttr.count; i += 4) {
                        const x3D = posAttr.array[i * 3];
                        const y3D = posAttr.array[i * 3 + 1];
                        const z3D = posAttr.array[i * 3 + 2];

                        // Chuyển local → world space (áp dụng rotation/scale của group)
                        const vec = new THREE.Vector3(x3D, y3D, z3D);
                        vec.applyMatrix4(group.matrixWorld);

                        // World → NDC (-1..1)
                        vec.project(camera);

                        // NDC → toạ độ pixel trong renderer (360×360)
                        const localPx = (vec.x + 1) / 2 * rendW;
                        const localPy = (-vec.y + 1) / 2 * rendH;

                        // Pixel renderer → toạ độ màn hình (renderer nằm giữa container)
                        const scaleX = containerRect.width / rendW;
                        const scaleY = containerRect.height / rendH;
                        const screenX = containerRect.left + localPx * scaleX;
                        const screenY = containerRect.top + localPy * scaleY;

                        // Lấy màu từ vertex color array
                        const r = Math.round((colAttr ? colAttr.array[i * 3] : 1.0) * 255);
                        const g = Math.round((colAttr ? colAttr.array[i * 3 + 1] : 0.3) * 255);
                        const b = Math.round((colAttr ? colAttr.array[i * 3 + 2] : 0.5) * 255);

                        // ── Hiệu ứng Nổ Rộng & Cực Mạnh Outward ──
                        const dx = screenX - cxScreen;
                        const dy = screenY - cyScreen;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                        const outX = dx / dist;
                        const outY = dy / dist;

                        // Vận tốc cực đại (35-80px/frame) đẩy hạt văng rộng ra ngoài màn hình
                        const randAngle = Math.random() * Math.PI * 2;
                        const randSpeed = 12 + Math.random() * 25;
                        const blastSpeed = 35 + Math.random() * 45;

                        const vx = outX * blastSpeed + Math.cos(randAngle) * randSpeed;
                        const vy = outY * blastSpeed + Math.sin(randAngle) * randSpeed - 2;

                        particles2D.push({
                            x: screenX,
                            y: screenY,
                            prevX: screenX,
                            prevY: screenY,
                            vx,
                            vy,
                            drag: 0.985 + Math.random() * 0.01, // Giảm ma sát để hạt giữ gia tốc bắn ra xa ngoài screen
                            r, g, b,
                            colorStr: `rgb(${r},${g},${b})`,
                            opacity: 1.0,
                            size: 3 + Math.random() * 4,
                            shrink: 0.982 + Math.random() * 0.01
                        });
                    }

                    // ── Bước 2: Tạo fullscreen 2D canvas để animate explosion ────────────────
                    const expCanvas = document.createElement('canvas');
                    expCanvas.style.cssText = `
                    position: fixed; top: 0; left: 0;
                    width: ${vw}px; height: ${vh}px;
                    z-index: 99999; pointer-events: none;
                `;
                    expCanvas.width = vw;
                    expCanvas.height = vh;
                    document.body.appendChild(expCanvas);
                    const ctx2D = expCanvas.getContext('2d');

                    // Ẩn Three.js renderer
                    heartContainer.style.opacity = '0';

                    // Shockwave flash mềm mại
                    let shockR = 30;
                    let shockAlpha = 0.9;

                    // ── Bước 3: Animate explosion Siêu Tốc & Mượt 60 FPS (Zero Shadow Lag) ──
                    let frame = 0;
                    const MAX_FRAMES = 42;        // Nổ nhanh, sắc nét trong 42 frame (~0.7s)
                    const OVERLAY_FADE_FRAME = 12; // Smooth fade overlay từ frame 12

                    function animateExplosion() {
                        ctx2D.clearRect(0, 0, vw, vh);

                        // Sóng xung kích Shockwave tỏa ra trong 10 frame đầu
                        if (shockAlpha > 0.02) {
                            shockR += (Math.max(vw, vh) * 0.9 - shockR) * 0.22;
                            shockAlpha *= 0.82;

                            ctx2D.save();
                            ctx2D.globalAlpha = shockAlpha;
                            const grad = ctx2D.createRadialGradient(cxScreen, cyScreen, 0, cxScreen, cyScreen, shockR);
                            grad.addColorStop(0, 'rgba(255, 200, 220, 0.7)');
                            grad.addColorStop(0.35, 'rgba(255, 80, 140, 0.4)');
                            grad.addColorStop(1, 'rgba(255, 40, 95, 0)');
                            ctx2D.fillStyle = grad;
                            ctx2D.beginPath();
                            ctx2D.arc(cxScreen, cyScreen, shockR, 0, Math.PI * 2);
                            ctx2D.fill();
                            ctx2D.restore();
                        }

                        // Tối ưu hóa render loop: KHÔNG dùng save/restore & shadowBlur trong loop để đạt 60 FPS
                        for (let idx = 0; idx < particles2D.length; idx++) {
                            const p = particles2D[idx];
                            p.prevX = p.x;
                            p.prevY = p.y;

                            p.vx *= p.drag;
                            p.vy *= p.drag;
                            p.vy += 0.15; // Gravity rất nhẹ

                            p.x += p.vx;
                            p.y += p.vy;

                            p.size *= p.shrink;
                            p.opacity *= 0.94; // Mờ mịn màng

                            if (p.opacity <= 0.01 || p.size < 0.2) continue;

                            // Render vệt đường thẳng mượt trực tiếp
                            ctx2D.globalAlpha = p.opacity;
                            ctx2D.strokeStyle = p.colorStr;
                            ctx2D.lineWidth = p.size;
                            ctx2D.lineCap = 'round';

                            ctx2D.beginPath();
                            ctx2D.moveTo(p.prevX, p.prevY);
                            ctx2D.lineTo(p.x, p.y);
                            ctx2D.stroke();
                        }

                        frame++;
                        if (frame === OVERLAY_FADE_FRAME) {
                            welcomeOverlay.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                            welcomeOverlay.style.opacity = '0';
                        }

                        if (frame < MAX_FRAMES) {
                            requestAnimationFrame(animateExplosion);
                        } else {
                            // Kết thúc explosion -> Dọn dẹp DOM & kích hoạt lớp 2 bay vào
                            expCanvas.style.transition = 'opacity 0.2s ease';
                            expCanvas.style.opacity = '0';

                            setTimeout(() => {
                                expCanvas.remove();
                                heartContainer.remove();
                                welcomeOverlay.classList.add('dismissed');
                                isOverlayDismissed = true;

                                // ── Bước 4: Trigger hearts fly-in animation ──
                                startFlyInAnimation();
                                setTimeout(() => { dragHint.style.opacity = '1'; }, 1500);
                            }, 250);
                        }
                    }

                    requestAnimationFrame(animateExplosion);
                }, { once: true });

            }, 800); // Rung lắc 800ms rồi bừng bung thành 3D dots
        }, 1000); // Đợi đúng 1 giây sau khi card xoay ngang

    }, P2_START);
}

    // Gắn vào nút bắt đầu
    btnSubmit.addEventListener('click', () => {
        triggerBlackHoleTransition();
    });



    /* ==========================================================================
       8. ENVELOPE CLICK & ROMANTIC LETTER MODAL
       ========================================================================== */
    envelope.addEventListener('click', () => {
        if (!isEnvelopeUnlocked) {
            envelope.classList.add('wiggle');
            chatTooltip.classList.add('show');
            tooltipText.textContent = appConfig.interactiveScreen?.tooltipNeedMore || "Hãy bới đủ 100% trái tim để mở thư nhé! 💖";
            setTimeout(() => {
                if (!isEnvelopeWiggling) envelope.classList.remove('wiggle');
            }, 800);
            return;
        }

        letterModal.classList.add('active');
        triggerHeartConfetti();
    });

    modalClose.addEventListener('click', () => {
        letterModal.classList.remove('active');
    });

    document.querySelector('.modal-backdrop').addEventListener('click', () => {
        letterModal.classList.remove('active');
    });

    function triggerHeartConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 120,
                origin: { y: 0.6 },
                colors: ['#ff2a5f', '#ff758f', '#ffffff', '#ffd166', '#ff8fa3']
            });
        }
    }
});
