/**
 * Aboutページのアコーディオンモジュール
 * アコーディオンの開閉制御とボタン状態管理
 */

// セクション情報
export const SECTION_INFO = [
    { id: 'common', name: '共通', fullName: '共通コンテンツ' },
    { id: 'kevin', name: 'けびん', fullName: 'けびんケビンソン' },
    { id: 'ryo', name: 'リョウ', fullName: 'イイダリョウ' },
    { id: 'staff', name: 'Staff', fullName: 'スタッフ' },
    { id: 'family', name: 'Family', fullName: 'ファミリー' },
    { id: 'specialThanks', name: 'Thanks', fullName: 'スペシャルサンクス' }
];

// アコーディオン状態管理
export const accordionStates = {
    'common': true,
    'kevin': true,
    'ryo': true,
    'staff': false,
    'family': false,
    'specialThanks': false
};

// フィルタ前の状態を保存
export let preFilterStates = null;

/**
 * アコーディオンボタンの状態を更新
 * @param {string|null} currentFilterTag - 現在のフィルタタグ
 */
export function updateAccordionButtonStates(currentFilterTag) {
    const openAllBtn = document.getElementById('openAllBtn');
    const closeAllBtn = document.getElementById('closeAllBtn');
    const openAllBtnCompact = document.getElementById('openAllBtnCompact');
    const closeAllBtnCompact = document.getElementById('closeAllBtnCompact');
    
    // フィルタ中は両方のボタンをアウトライン表示
    if (currentFilterTag) {
        [openAllBtn, openAllBtnCompact].forEach(btn => {
            if (!btn) return;
            btn.className = 'btn btn-sm btn-outline-primary';
        });
        
        [closeAllBtn, closeAllBtnCompact].forEach(btn => {
            if (!btn) return;
            btn.className = 'btn btn-sm btn-outline-secondary';
        });
        return;
    }
    
    // 通常時：全てのアコーディオンの状態をチェック
    const allOpen = SECTION_INFO.every(info => accordionStates[info.id] === true);
    const allClosed = SECTION_INFO.every(info => accordionStates[info.id] === false);
    
    // 全てのアーカイブセクションの状態をチェック
    const archiveBodies = document.querySelectorAll('.archive-body');
    let allArchivesOpen = true;
    let allArchivesClosed = true;
    
    archiveBodies.forEach(body => {
        const isOpen = body.classList.contains('show');
        if (!isOpen) allArchivesOpen = false;
        if (isOpen) allArchivesClosed = false;
    });
    
    // 全開・全閉の判定（メインセクション + アーカイブセクション）
    const allCompletelyOpen = allOpen && allArchivesOpen;
    const allCompletelyClosed = allClosed && allArchivesClosed;
    
    // 全開ボタンの状態
    [openAllBtn, openAllBtnCompact].forEach(btn => {
        if (!btn) return;
        if (allCompletelyOpen) {
            btn.className = 'btn btn-sm btn-primary';
        } else {
            btn.className = 'btn btn-sm btn-outline-primary';
        }
    });
    
    // 全閉ボタンの状態
    [closeAllBtn, closeAllBtnCompact].forEach(btn => {
        if (!btn) return;
        if (allCompletelyClosed) {
            btn.className = 'btn btn-sm btn-secondary';
        } else {
            btn.className = 'btn btn-sm btn-outline-secondary';
        }
    });
}

/**
 * アコーディオンを切り替え
 * @param {string} sectionId - セクションID
 * @param {string|null} currentFilterTag - 現在のフィルタタグ
 */
export function toggleAccordion(sectionId, currentFilterTag) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const body = section.querySelector('.accordion-body-custom');
    const icon = section.querySelector('.accordion-toggle-icon');
    
    if (!body || !icon) return;
    
    if (body.classList.contains('show')) {
        body.classList.remove('show');
        icon.classList.add('collapsed');
        accordionStates[sectionId] = false;
    } else {
        body.classList.add('show');
        icon.classList.remove('collapsed');
        accordionStates[sectionId] = true;
    }
    
    updateAccordionButtonStates(currentFilterTag);
}

/**
 * 全てのアコーディオンを開く
 * @param {string|null} currentFilterTag - 現在のフィルタタグ
 * @param {Function} clearFilterCallback - フィルタクリア時のコールバック
 */
export function openAllAccordions(currentFilterTag, clearFilterCallback) {
    // フィルタが適用されている場合は解除
    if (currentFilterTag && clearFilterCallback) {
        clearFilterCallback();
    }
    
    // メインセクションを全て開く
    SECTION_INFO.forEach(info => {
        const section = document.getElementById(info.id);
        if (!section) return;
        
        const body = section.querySelector('.accordion-body-custom');
        const icon = section.querySelector('.accordion-toggle-icon');
        
        if (!body || !icon) return;
        
        body.classList.add('show');
        icon.classList.remove('collapsed');
        accordionStates[info.id] = true;
    });
    
    // 全てのアーカイブセクションも開く
    const archiveBodies = document.querySelectorAll('.archive-body');
    const archiveIcons = document.querySelectorAll('.archive-toggle-icon');
    
    archiveBodies.forEach(body => {
        body.classList.add('show');
        body.style.display = 'block';
    });
    
    archiveIcons.forEach(icon => {
        icon.classList.remove('collapsed');
    });
    
    updateAccordionButtonStates(null);
}

/**
 * 全てのアコーディオンを閉じる
 * @param {string|null} currentFilterTag - 現在のフィルタタグ
 * @param {Function} clearFilterCallback - フィルタクリア時のコールバック
 */
export function closeAllAccordions(currentFilterTag, clearFilterCallback) {
    // フィルタが適用されている場合は解除
    if (currentFilterTag && clearFilterCallback) {
        clearFilterCallback();
    }
    
    // メインセクションを全て閉じる
    SECTION_INFO.forEach(info => {
        const section = document.getElementById(info.id);
        if (!section) return;
        
        const body = section.querySelector('.accordion-body-custom');
        const icon = section.querySelector('.accordion-toggle-icon');
        
        if (!body || !icon) return;
        
        body.classList.remove('show');
        icon.classList.add('collapsed');
        accordionStates[info.id] = false;
    });
    
    // 全てのアーカイブセクションも閉じる
    const archiveBodies = document.querySelectorAll('.archive-body');
    const archiveIcons = document.querySelectorAll('.archive-toggle-icon');
    
    archiveBodies.forEach(body => {
        body.classList.remove('show');
        body.style.display = 'none';
    });
    
    archiveIcons.forEach(icon => {
        icon.classList.add('collapsed');
    });
    
    updateAccordionButtonStates(null);
}

/**
 * アコーディオンボタンのイベントリスナーを初期化
 * @param {Function} openCallback - 全開ボタンクリック時のコールバック
 * @param {Function} closeCallback - 全閉ボタンクリック時のコールバック
 */
export function initAccordionButtons(openCallback, closeCallback) {
    // 通常時のボタン
    const openAllBtn = document.getElementById('openAllBtn');
    const closeAllBtn = document.getElementById('closeAllBtn');
    
    // コンパクト版のボタン
    const openAllBtnCompact = document.getElementById('openAllBtnCompact');
    const closeAllBtnCompact = document.getElementById('closeAllBtnCompact');
    
    [openAllBtn, openAllBtnCompact].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', openCallback);
        }
    });
    
    [closeAllBtn, closeAllBtnCompact].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', closeCallback);
        }
    });
}

/**
 * セクションジャンプボタンを生成
 * @param {HTMLElement} container - コンテナ要素
 */
export function generateSectionJumpButtons(container) {
    if (!container) return;
    
    // 既存のセクションジャンプボタンを削除
    const existingButtons = container.querySelectorAll('.section-jump-btn');
    existingButtons.forEach(btn => btn.remove());
    
    // セクションジャンプボタンを生成してコンテナに追加
    SECTION_INFO.forEach(section => {
        const btn = document.createElement('button');
        btn.className = 'abbreviation-menu-button section-jump-btn';
        btn.textContent = section.name;
        btn.setAttribute('data-section', section.id);
        
        btn.addEventListener('click', () => {
            const targetElement = document.getElementById(`accordion-${section.id}`);
            if (targetElement) {
                const header = document.getElementById('main-header');
                const headerHeight = header ? header.offsetHeight : 0;
                const menuWrapper = document.getElementById('section-nav-wrapper');
                const menuHeight = menuWrapper ? menuWrapper.offsetHeight : 0;
                const offset = headerHeight + menuHeight + 10;
                
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
        
        container.appendChild(btn);
    });
}

/**
 * セクションメニューの初期化
 */
export function initSectionMenu() {
    // アイコンクリックイベント（通常モード）
    const icon = document.getElementById('aboutIcon');
    if (icon) {
        icon.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // アイコンクリックイベント（コンパクトモード）
    const iconCompact = document.getElementById('aboutIconCompact');
    if (iconCompact) {
        iconCompact.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    // セクションジャンプボタンを生成
    const containerNormal = document.getElementById('sectionNavContainer');
    const containerCompact = document.getElementById('sectionNavContainerCompact');
    
    if (containerNormal) {
        generateSectionJumpButtons(containerNormal);
    }
    
    if (containerCompact) {
        generateSectionJumpButtons(containerCompact);
    }
}

/**
 * スクロール矢印の表示/非表示を更新
 */
function updateScrollArrows(container, leftArrow, rightArrow) {
    if (!container || !leftArrow || !rightArrow) {
        console.log('updateScrollArrows: 要素が見つかりません', { container, leftArrow, rightArrow });
        return;
    }
    
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    const threshold = window.innerWidth <= 768 ? 1 : 5;
    
    // デバッグログ
    console.log('updateScrollArrows:', {
        containerId: container.id,
        scrollLeft,
        scrollWidth,
        clientWidth,
        threshold,
        needsScroll: scrollWidth > clientWidth + threshold,
        leftArrowHidden: leftArrow.classList.contains('hidden'),
        rightArrowHidden: rightArrow.classList.contains('hidden')
    });
    
    // スクロール不要な場合は両方非表示
    if (scrollWidth <= clientWidth + threshold) {
        leftArrow.classList.add('hidden');
        rightArrow.classList.add('hidden');
        console.log('→ スクロール不要: 両方非表示');
        return;
    }
    
    // 左端
    if (scrollLeft <= threshold) {
        leftArrow.classList.add('hidden');
        rightArrow.classList.remove('hidden');
        console.log('→ 左端: < 非表示、> 表示');
    }
    // 右端
    else if (scrollLeft + clientWidth >= scrollWidth - threshold) {
        leftArrow.classList.remove('hidden');
        rightArrow.classList.add('hidden');
        console.log('→ 右端: < 表示、> 非表示');
    }
    // 中間
    else {
        leftArrow.classList.remove('hidden');
        rightArrow.classList.remove('hidden');
        console.log('→ 中間: 両方表示');
    }
}

/**
 * justify-contentを動的に切り替える
 */
function updateJustifyContent(container) {
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    // 余裕を持たせて判定（スクロールバーやパディングの誤差を考慮）
    const threshold = 10;
    
    console.log('updateJustifyContent:', {
        containerId: container.id,
        scrollWidth,
        clientWidth,
        threshold,
        needsScroll: scrollWidth > clientWidth + threshold,
        currentJustifyContent: container.style.justifyContent
    });
    
    if (scrollWidth > clientWidth + threshold) {
        container.style.justifyContent = 'flex-start';
        console.log('→ flex-start (左寄せ)');
    } else {
        container.style.justifyContent = 'center';
        console.log('→ center (中央寄せ)');
    }
}

/**
 * スクロール矢印ボタンの初期化
 */
export function initScrollArrows() {
    console.log('=== initScrollArrows 開始 ===');
    
    // 通常メニューの矢印ボタン
    const scrollContainer = document.getElementById('sectionNavContainer');
    const leftArrow = document.getElementById('scrollLeftBtn');
    const rightArrow = document.getElementById('scrollRightBtn');
    
    console.log('通常メニューの要素:', {
        scrollContainer,
        leftArrow,
        rightArrow,
        scrollContainerExists: !!scrollContainer,
        leftArrowExists: !!leftArrow,
        rightArrowExists: !!rightArrow
    });
    
    if (scrollContainer && leftArrow && rightArrow) {
        console.log('✓ 通常メニューの要素が見つかりました');
        leftArrow.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
        });
        
        rightArrow.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
        });
        
        const updateArrows = () => {
            updateJustifyContent(scrollContainer);
            updateScrollArrows(scrollContainer, leftArrow, rightArrow);
        };
        
        // 即座に実行
        console.log('通常メニュー: updateArrows を即座に実行');
        updateArrows();
        
        // requestAnimationFrameで次のフレームに実行
        requestAnimationFrame(() => {
            updateArrows();
            requestAnimationFrame(updateArrows);
        });
        
        // 複数のタイミングで実行
        setTimeout(updateArrows, 50);
        setTimeout(updateArrows, 100);
        setTimeout(updateArrows, 200);
        setTimeout(updateArrows, 500);
        setTimeout(updateArrows, 1000);
        setTimeout(updateArrows, 1500);
        setTimeout(updateArrows, 2000);
        
        // スクロールイベント
        scrollContainer.addEventListener('scroll', updateArrows);
        
        // リサイズイベント
        window.addEventListener('resize', updateArrows);
        
        // window.loadイベントでも実行
        window.addEventListener('load', updateArrows);
    } else {
        console.log('✗ 通常メニューの要素が見つかりません');
    }
    
    // コンパクトメニューの矢印ボタン
    const scrollContainerCompact = document.getElementById('sectionNavContainerCompact');
    const leftArrowCompact = document.getElementById('scrollLeftBtnCompact');
    const rightArrowCompact = document.getElementById('scrollRightBtnCompact');
    
    console.log('コンパクトメニューの要素:', {
        scrollContainerCompact,
        leftArrowCompact,
        rightArrowCompact,
        scrollContainerCompactExists: !!scrollContainerCompact,
        leftArrowCompactExists: !!leftArrowCompact,
        rightArrowCompactExists: !!rightArrowCompact
    });
    
    if (scrollContainerCompact && leftArrowCompact && rightArrowCompact) {
        console.log('✓ コンパクトメニューの要素が見つかりました');
        leftArrowCompact.addEventListener('click', () => {
            scrollContainerCompact.scrollBy({ left: -200, behavior: 'smooth' });
        });
        
        rightArrowCompact.addEventListener('click', () => {
            scrollContainerCompact.scrollBy({ left: 200, behavior: 'smooth' });
        });
        
        const updateArrowsCompact = () => {
            updateJustifyContent(scrollContainerCompact);
            updateScrollArrows(scrollContainerCompact, leftArrowCompact, rightArrowCompact);
        };
        
        // 即座に実行
        console.log('コンパクトメニュー: updateArrowsCompact を即座に実行');
        updateArrowsCompact();
        
        // requestAnimationFrameで次のフレームに実行
        requestAnimationFrame(() => {
            updateArrowsCompact();
            requestAnimationFrame(updateArrowsCompact);
        });
        
        // 複数のタイミングで実行
        setTimeout(updateArrowsCompact, 50);
        setTimeout(updateArrowsCompact, 100);
        setTimeout(updateArrowsCompact, 200);
        setTimeout(updateArrowsCompact, 500);
        setTimeout(updateArrowsCompact, 1000);
        setTimeout(updateArrowsCompact, 1500);
        setTimeout(updateArrowsCompact, 2000);
        
        // スクロールイベント
        scrollContainerCompact.addEventListener('scroll', updateArrowsCompact);
        
        // リサイズイベント
        window.addEventListener('resize', updateArrowsCompact);
        
        // window.loadイベントでも実行
        window.addEventListener('load', updateArrowsCompact);
    } else {
        console.log('✗ コンパクトメニューの要素が見つかりません');
    }
    
    console.log('=== initScrollArrows 完了 ===');
}