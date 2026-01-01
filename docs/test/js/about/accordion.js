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
