/**
 * Aboutページのナビゲーションモジュール
 * スクロール機能とURLハッシュ処理の管理
 */

import { accordionStates, SECTION_INFO } from './about-accordion.js';

/**
 * ヘッダーの高さを考慮してセクションにスクロール
 * @param {string} sectionId - セクションID
 */
export function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    // 固定ヘッダーの高さを取得
    const header = document.getElementById('main-header');
    const compactHeader = header ? header.querySelector('.header-compact') : null;
    
    let targetHeaderHeight = 0;
    if (compactHeader) {
        // 一時的にコンパクトヘッダーを表示して高さを測定
        const originalDisplay = compactHeader.style.display;
        const originalPosition = compactHeader.style.position;
        const originalOpacity = compactHeader.style.opacity;
        const originalVisibility = compactHeader.style.visibility;
        
        compactHeader.style.display = 'flex';
        compactHeader.style.position = 'relative';
        compactHeader.style.opacity = '1';
        compactHeader.style.visibility = 'visible';
        
        targetHeaderHeight = compactHeader.offsetHeight;
        
        // 元に戻す
        compactHeader.style.display = originalDisplay;
        compactHeader.style.position = originalPosition;
        compactHeader.style.opacity = originalOpacity;
        compactHeader.style.visibility = originalVisibility;
    } else if (header) {
        targetHeaderHeight = header.offsetHeight;
    }
    
    // 追加の余白
    const additionalOffset = 10;
    
    // 要素の位置を取得
    const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
    
    // スクロール先の位置を計算
    const offsetPosition = sectionTop - targetHeaderHeight - additionalOffset;
    
    // スムーズスクロール
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
    
    // スクロール完了後に位置を微調整
    setTimeout(() => {
        const currentHeader = document.getElementById('main-header');
        const currentHeaderHeight = currentHeader ? currentHeader.offsetHeight : 0;
        const currentSectionTop = section.getBoundingClientRect().top + window.pageYOffset;
        const adjustedPosition = currentSectionTop - currentHeaderHeight - additionalOffset;
        
        // 現在位置と理想位置のズレが大きい場合のみ再調整
        if (Math.abs(window.pageYOffset - adjustedPosition) > 5) {
            window.scrollTo({
                top: adjustedPosition,
                behavior: 'smooth'
            });
        }
    }, 600);
}

/**
 * ページ読み込み時にURLハッシュをチェックして該当セクションに移動
 * @param {Function} toggleCallback - アコーディオン切り替えコールバック
 */
export function handleInitialHash(toggleCallback) {
    const hash = window.location.hash.replace('#', '');
    
    // 有効なセクションIDのリスト
    const validSections = ['common', 'kevin', 'ryo', 'staff', 'family', 'specialThanks'];
    
    if (hash && validSections.includes(hash)) {
        // すべてのアコーディオンを閉じる
        SECTION_INFO.forEach(info => {
            const section = document.getElementById(info.id);
            if (!section) return;
            
            const body = section.querySelector('.accordion-body-custom');
            const icon = section.querySelector('.accordion-toggle-icon');
            
            if (body && icon) {
                body.classList.remove('show');
                icon.classList.add('collapsed');
                accordionStates[info.id] = false;
            }
        });
        
        // 該当セクションのメインアコーディオンを開く
        const targetSection = document.getElementById(hash);
        if (targetSection) {
            const body = targetSection.querySelector('.accordion-body-custom');
            const icon = targetSection.querySelector('.accordion-toggle-icon');
            
            if (body && icon) {
                body.classList.add('show');
                icon.classList.remove('collapsed');
                accordionStates[hash] = true;
            }
            
            // 少し遅延してからスクロール（DOM更新を待つ）
            setTimeout(() => {
                scrollToSection(hash);
            }, 500);
        }
    }
}

/**
 * セクションナビゲーションを更新
 * @param {string|null} filterTag - フィルタタグ
 */
export function updateSectionNavigation(filterTag = null) {
    // 必要に応じて実装
    // 現在のところ、他の機能で十分カバーされている
}
