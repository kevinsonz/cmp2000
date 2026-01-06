/**
 * 共通ユーティリティ関数
 * 全ページで使用される基本的な処理をまとめたモジュール
 */

/**
 * 現在の年を取得してフッターに表示
 */
export function updateCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

/**
 * スムーズスクロールでページトップに移動
 */
export function smoothScrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * 指定した要素までスムーズスクロール
 * @param {string} elementId - スクロール先の要素ID
 */
export function smoothScrollToElement(elementId) {
    console.log('=== smoothScrollToElement 開始 ===');
    console.log('Target elementId:', elementId);
    
    // まず、アクティブなタブ内で要素を探す
    const activeTab = document.querySelector('.tab-content.active');
    let element = null;
    
    if (activeTab) {
        element = activeTab.querySelector(`#${elementId}`);
        console.log('アクティブタブ内で検索:', activeTab.id);
        console.log('アクティブタブ内で発見:', element ? 'あり' : 'なし');
    }
    
    // アクティブタブ内に見つからない場合は、全体から探す
    if (!element) {
        element = document.getElementById(elementId);
        console.log('全体から検索して発見:', element ? 'あり' : 'なし');
    }
    
    if (!element) {
        console.warn(`要素が見つかりません: ${elementId}`);
        return;
    }

    // 要素が表示されているか確認
    const isVisible = element.offsetParent !== null;
    console.log('Element is visible:', isVisible);
    
    // 非表示の要素の場合は警告して終了
    if (!isVisible) {
        console.warn(`要素は見つかりましたが、非表示です: ${elementId}`);
        console.warn('要素の親タブ:', element.closest('.tab-content')?.id);
        return;
    }

    const header = document.getElementById('main-header');
    
    // スクロール後の最終的なヘッダー高さを使用
    // 下にスクロールする場合、ヘッダーはコンパクト化される（50px）
    const currentScrollY = window.scrollY || window.pageYOffset;
    const elementPosition = element.getBoundingClientRect().top + currentScrollY;
    const willScrollDown = elementPosition > currentScrollY + 100; // 下にスクロールするか判定
    
    // 下スクロールの場合はコンパクト化後の高さ、上スクロールの場合は通常の高さ
    const finalHeaderHeight = willScrollDown ? 50 : (header ? header.offsetHeight : 80);
    console.log('Current scroll Y:', currentScrollY);
    console.log('Element position:', elementPosition);
    console.log('Will scroll down:', willScrollDown);
    console.log('Final header height:', finalHeaderHeight);
    
    // 十分な余裕を持たせる（30px）
    const offsetPosition = elementPosition - finalHeaderHeight - 30;
    console.log('Offset position (target scroll):', offsetPosition);

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
    
    // スクロール完了後に位置を再調整（ヘッダーのコンパクト化のアニメーションを考慮）
    setTimeout(() => {
        const currentHeader = document.getElementById('main-header');
        const actualHeaderHeight = currentHeader ? currentHeader.offsetHeight : 50;
        const currentElementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const adjustedPosition = currentElementPosition - actualHeaderHeight - 30;
        
        console.log('=== スクロール完了後の再調整 ===');
        console.log('Actual header height:', actualHeaderHeight);
        console.log('Adjusted position:', adjustedPosition);
        
        // 位置がずれている場合のみ再調整
        const currentScroll = window.scrollY || window.pageYOffset;
        if (Math.abs(currentScroll - adjustedPosition) > 10) {
            console.log('位置を再調整します');
            window.scrollTo({
                top: adjustedPosition,
                behavior: 'smooth'
            });
        } else {
            console.log('位置調整は不要です');
        }
    }, 800); // スクロールアニメーションの完了を待つ
    
    console.log('=== smoothScrollToElement 完了 ===');
}

/**
 * 日付文字列をフォーマット（YYYY-MM-DD → YYYY年MM月DD日）
 * @param {string} dateString - YYYY-MM-DD形式の日付文字列
 * @returns {string} フォーマットされた日付文字列
 */
export function formatDateJapanese(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    return `${year}年${month}月${day}日`;
}

/**
 * X（Twitter）の投稿日時をフォーマット
 * @param {string} dateString - ISO 8601形式の日付文字列
 * @returns {string} フォーマットされた日付文字列
 */
export function formatXPostDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

/**
 * URLからX（Twitter）のユーザー名を抽出
 * @param {string} siteUrl - X（Twitter）のURL
 * @returns {string|null} ユーザー名（@付き）またはnull
 */
export function extractXUsername(siteUrl) {
    if (!siteUrl) return null;
    const match = siteUrl.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/);
    return match ? `@${match[1]}` : null;
}

/**
 * NEW!!バッジを表示すべきかチェック
 * @param {string} dateString - YYYY-MM-DD形式の日付文字列
 * @param {number} days - 何日以内をNEWとするか
 * @returns {boolean} NEW!!バッジを表示する場合true
 */
export function shouldShowNewBadge(dateString, days = 30) {
    if (!dateString) return false;
    
    const itemDate = new Date(dateString);
    const today = new Date();
    const diffTime = today - itemDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= days;
}

/**
 * デバウンス処理
 * @param {Function} func - 実行する関数
 * @param {number} wait - 待機時間（ミリ秒）
 * @returns {Function} デバウンスされた関数
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 和暦を取得
 * @param {number} year - 西暦年
 * @returns {string} 和暦表記
 */
export function getJapaneseEra(year) {
    if (year >= 2019) {
        return `令和${year - 2018}年`;
    } else if (year >= 1989) {
        return `平成${year - 1988}年`;
    } else if (year >= 1926) {
        return `昭和${year - 1925}年`;
    } else if (year >= 1912) {
        return `大正${year - 1911}年`;
    } else {
        return `明治${year - 1867}年`;
    }
}