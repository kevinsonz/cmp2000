/**
 * Historyページのナビゲーションモジュール
 * スクロール機能の管理
 */

/**
 * 指定した年にスクロール
 * @param {number} year - 年
 */
export function scrollToYear(year) {
    const element = document.getElementById(`year-${year}`);
    if (!element) return;
    
    // コンパクトヘッダーの高さを取得
    const header = document.getElementById('main-header');
    const compactHeader = header ? header.querySelector('.header-compact') : null;
    
    let targetHeaderHeight = 0;
    if (compactHeader) {
        const originalDisplay = compactHeader.style.display;
        const originalPosition = compactHeader.style.position;
        const originalOpacity = compactHeader.style.opacity;
        const originalVisibility = compactHeader.style.visibility;
        
        compactHeader.style.display = 'flex';
        compactHeader.style.position = 'relative';
        compactHeader.style.opacity = '1';
        compactHeader.style.visibility = 'visible';
        
        targetHeaderHeight = compactHeader.offsetHeight;
        
        compactHeader.style.display = originalDisplay;
        compactHeader.style.position = originalPosition;
        compactHeader.style.opacity = originalOpacity;
        compactHeader.style.visibility = originalVisibility;
    } else if (header) {
        targetHeaderHeight = header.offsetHeight;
    }
    
    // テーブルヘッダーの高さを取得
    const tableHeader = document.querySelector('.history-table thead');
    const tableHeaderHeight = tableHeader ? tableHeader.offsetHeight : 0;
    
    const additionalOffset = 10;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - targetHeaderHeight - tableHeaderHeight - additionalOffset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
    
    // スクロール完了後に位置を微調整
    setTimeout(() => {
        const currentHeader = document.getElementById('main-header');
        const currentHeaderHeight = currentHeader ? currentHeader.offsetHeight : 0;
        const currentTableHeader = document.querySelector('.history-table thead');
        const currentTableHeaderHeight = currentTableHeader ? currentTableHeader.offsetHeight : 0;
        const currentElementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const adjustedPosition = currentElementPosition - currentHeaderHeight - currentTableHeaderHeight - additionalOffset;
        
        if (Math.abs(window.pageYOffset - adjustedPosition) > 5) {
            window.scrollTo({
                top: adjustedPosition,
                behavior: 'smooth'
            });
        }
    }, 600);
}

/**
 * フィルタ設定へスクロール
 */
export function scrollToFilterSettings() {
    const filterSettings = document.getElementById('filterSettings');
    if (!filterSettings) return;
    
    const filterCard = filterSettings.closest('.card');
    if (!filterCard) return;
    
    const isOpen = filterSettings.classList.contains('show');
    
    // コンパクトヘッダーの高さを取得
    const header = document.getElementById('main-header');
    const compactHeader = header ? header.querySelector('.header-compact') : null;
    
    let targetHeaderHeight = 0;
    if (compactHeader) {
        const originalDisplay = compactHeader.style.display;
        const originalPosition = compactHeader.style.position;
        const originalOpacity = compactHeader.style.opacity;
        const originalVisibility = compactHeader.style.visibility;
        
        compactHeader.style.display = 'flex';
        compactHeader.style.position = 'relative';
        compactHeader.style.opacity = '1';
        compactHeader.style.visibility = 'visible';
        
        targetHeaderHeight = compactHeader.offsetHeight;
        
        compactHeader.style.display = originalDisplay;
        compactHeader.style.position = originalPosition;
        compactHeader.style.opacity = originalOpacity;
        compactHeader.style.visibility = originalVisibility;
    } else if (header) {
        targetHeaderHeight = header.offsetHeight;
    }
    
    const additionalOffset = 20;
    
    if (!isOpen) {
        // 閉じている場合は開く
        const collapseElement = new bootstrap.Collapse(filterSettings, {
            show: true
        });
        
        setTimeout(() => {
            const elementPosition = filterCard.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - targetHeaderHeight - additionalOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            setTimeout(() => {
                const currentHeader = document.getElementById('main-header');
                const currentHeaderHeight = currentHeader ? currentHeader.offsetHeight : 0;
                const currentElementPosition = filterCard.getBoundingClientRect().top + window.pageYOffset;
                const adjustedPosition = currentElementPosition - currentHeaderHeight - additionalOffset;
                
                if (Math.abs(window.pageYOffset - adjustedPosition) > 5) {
                    window.scrollTo({
                        top: adjustedPosition,
                        behavior: 'smooth'
                    });
                }
            }, 600);
        }, 300);
    } else {
        // 既に開いている場合はスクロールのみ
        const elementPosition = filterCard.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - targetHeaderHeight - additionalOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
        
        setTimeout(() => {
            const currentHeader = document.getElementById('main-header');
            const currentHeaderHeight = currentHeader ? currentHeader.offsetHeight : 0;
            const currentElementPosition = filterCard.getBoundingClientRect().top + window.pageYOffset;
            const adjustedPosition = currentElementPosition - currentHeaderHeight - additionalOffset;
            
            if (Math.abs(window.pageYOffset - adjustedPosition) > 5) {
                window.scrollTo({
                    top: adjustedPosition,
                    behavior: 'smooth'
                });
            }
        }, 600);
    }
}
