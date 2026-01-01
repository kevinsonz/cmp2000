/**
 * Historyページのナビゲーションモジュール
 * ジャンプメニュー、スクロール機能の管理
 */

/**
 * ジャンプメニューを更新
 * @param {Object} state - 現在の状態
 * @param {Array} historyData - Historyデータ
 * @param {Function} scrollToFilterCallback - フィルタ設定へのスクロールコールバック
 * @param {Function} scrollToYearCallback - 年へのスクロールコールバック
 */
export function updateJumpMenu(state, historyData, scrollToFilterCallback, scrollToYearCallback) {
    const jumpMenuList = document.getElementById('jumpMenuList');
    if (!jumpMenuList) return;
    
    jumpMenuList.innerHTML = '';
    
    // ヘッダーへのジャンプ
    const headerItem = document.createElement('li');
    headerItem.innerHTML = '<a class="dropdown-item" href="#" onclick="window.scrollTo(0,0); return false;">ヘッダー</a>';
    jumpMenuList.appendChild(headerItem);
    
    // 区切り線
    const divider1 = document.createElement('li');
    divider1.innerHTML = '<hr class="dropdown-divider">';
    jumpMenuList.appendChild(divider1);
    
    // フィルタ設定へのジャンプ
    const filterItem = document.createElement('li');
    const filterLink = document.createElement('a');
    filterLink.className = 'dropdown-item';
    filterLink.href = '#';
    filterLink.textContent = 'フィルタ設定';
    filterLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (scrollToFilterCallback) {
            scrollToFilterCallback();
        }
    });
    filterItem.appendChild(filterLink);
    jumpMenuList.appendChild(filterItem);
    
    // 区切り線
    const divider2 = document.createElement('li');
    divider2.innerHTML = '<hr class="dropdown-divider">';
    jumpMenuList.appendChild(divider2);
    
    // 記事が存在する年を収集
    const yearsWithData = new Set();
    historyData.forEach(item => {
        if (item.year >= state.currentStartYear && item.year <= state.currentEndYear) {
            if (state.currentCategoryFilters.length === 0) {
                return;
            }
            if (!state.currentCategoryFilters.includes(item.category)) {
                return;
            }
            yearsWithData.add(item.year);
        }
    });
    
    // 開始年を基準に5年単位でジャンプポイントを生成
    const jumpYears = [];
    const sortedYears = Array.from(yearsWithData).sort((a, b) => a - b);
    
    if (sortedYears.length > 0) {
        for (let baseYear = state.currentStartYear; baseYear <= state.currentEndYear; baseYear += 5) {
            const yearInRange = sortedYears.find(y => y >= baseYear && y < baseYear + 5);
            if (yearInRange) {
                jumpYears.push(yearInRange);
            }
        }
    }
    
    // ソート順に応じて逆順にする
    if (state.currentSortNewestFirst) {
        jumpYears.reverse();
    }
    
    // ジャンプメニューに追加
    jumpYears.forEach(year => {
        const yearItem = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'dropdown-item';
        link.href = `#year-${year}`;
        link.textContent = `${year}年`;
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (scrollToYearCallback) {
                scrollToYearCallback(year);
            }
        });
        yearItem.appendChild(link);
        jumpMenuList.appendChild(yearItem);
    });
    
    // 区切り線
    const divider3 = document.createElement('li');
    divider3.innerHTML = '<hr class="dropdown-divider">';
    jumpMenuList.appendChild(divider3);
    
    // フッターへのジャンプ
    const footerItem = document.createElement('li');
    footerItem.innerHTML = '<a class="dropdown-item" href="#footer">フッター</a>';
    jumpMenuList.appendChild(footerItem);
}

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
