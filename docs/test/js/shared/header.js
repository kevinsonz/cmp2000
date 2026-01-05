/**
 * ヘッダー処理モジュール
 * スクロール時のヘッダー切り替えとタイトルクリック処理
 */

/**
 * ヘッダーのスクロール処理を初期化
 * スクロール時に通常ヘッダーとコンパクトヘッダーを切り替える
 */
export function initHeaderScroll() {
    const header = document.getElementById('main-header');
    const body = document.body;
    const normalHeader = header ? header.querySelector('.header-title-normal') : null;
    const compactHeader = header ? header.querySelector('.header-compact') : null;
    
    console.log('initHeaderScroll called');
    console.log('header:', header);
    console.log('normalHeader:', normalHeader);
    console.log('compactHeader:', compactHeader);
    
    if (header && normalHeader && compactHeader) {
        let ticking = false;
        let lastScrollY = window.scrollY || window.pageYOffset;
        
        // 各ヘッダーの高さを取得（初回のみ）
        let normalHeight = null;
        let compactHeight = null;
        
        const measureHeights = () => {
            // 通常ヘッダーの高さを測定
            normalHeader.style.position = 'relative';
            normalHeader.style.opacity = '1';
            normalHeader.style.visibility = 'visible';
            compactHeader.style.position = 'absolute';
            compactHeader.style.opacity = '0';
            compactHeader.style.visibility = 'hidden';
            // 強制的にレイアウト再計算
            normalHeight = normalHeader.offsetHeight;
            
            // コンパクトヘッダーの高さを測定
            normalHeader.style.position = 'absolute';
            normalHeader.style.opacity = '0';
            normalHeader.style.visibility = 'hidden';
            compactHeader.style.position = 'relative';
            compactHeader.style.opacity = '1';
            compactHeader.style.visibility = 'visible';
            // 強制的にレイアウト再計算
            compactHeight = compactHeader.offsetHeight;
            
            // 位置を元に戻す（両方absoluteに）
            normalHeader.style.position = 'absolute';
            compactHeader.style.position = 'absolute';
            
            // 初期状態を設定（通常ヘッダー表示）
            normalHeader.style.opacity = '1';
            normalHeader.style.visibility = 'visible';
            compactHeader.style.opacity = '0';
            compactHeader.style.visibility = 'hidden';
            header.style.height = normalHeight + 'px';
            
            console.log('normalHeight:', normalHeight);
            console.log('compactHeight:', compactHeight);
        };
        
        // 初回測定
        measureHeights();
        
        const updateHeader = () => {
            const currentScrollY = window.scrollY || window.pageYOffset;
            const scrollingDown = currentScrollY > lastScrollY;
            
            // 画面幅を取得
            const windowWidth = window.innerWidth;
            
            // スマホサイズ（768px以下）では閾値を低くする
            let thresholdDown, thresholdUp;
            if (windowWidth <= 576) {
                // 最小サイズ（スマホ縦）
                thresholdDown = 20;
                thresholdUp = 10;
            } else if (windowWidth <= 768) {
                // タブレット縦
                thresholdDown = 30;
                thresholdUp = 20;
            } else {
                // PC・タブレット横
                thresholdDown = 60;
                thresholdUp = 40;
            }
            
            // ヒステリシス実装：スクロール方向によって異なる閾値を使用
            const threshold = scrollingDown ? thresholdDown : thresholdUp;
            
            console.log('updateHeader - scrollY:', currentScrollY, 'threshold:', threshold, 'width:', windowWidth);
            
            if (currentScrollY > threshold) {
                header.classList.add('scrolled');
                body.classList.add('header-scrolled');
                // コンパクトヘッダーを表示
                normalHeader.style.opacity = '0';
                normalHeader.style.visibility = 'hidden';
                compactHeader.style.opacity = '1';
                compactHeader.style.visibility = 'visible';
                // コンパクトヘッダーの高さに変更
                if (compactHeight !== null) {
                    header.style.height = compactHeight + 'px';
                }
                console.log('Added scrolled class');
                console.log('compactHeader styles:', {
                    opacity: compactHeader.style.opacity,
                    visibility: compactHeader.style.visibility,
                    position: compactHeader.style.position,
                    display: window.getComputedStyle(compactHeader).display
                });
            } else {
                header.classList.remove('scrolled');
                body.classList.remove('header-scrolled');
                // 通常ヘッダーを表示
                normalHeader.style.opacity = '1';
                normalHeader.style.visibility = 'visible';
                compactHeader.style.opacity = '0';
                compactHeader.style.visibility = 'hidden';
                // 通常ヘッダーの高さに変更
                if (normalHeight !== null) {
                    header.style.height = normalHeight + 'px';
                }
                console.log('Removed scrolled class');
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        };
        
        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateHeader);
                ticking = true;
            }
        };
        
        // リサイズ時に高さを再測定
        let resizeTimeout;
        const onResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                measureHeights();
                updateHeader();
            }, 100);
        };
        
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        updateHeader();
    } else {
        console.error('Header elements not found!');
    }
}

/**
 * タイトルクリックでページトップにスクロール
 */
export function initHeaderTitleClick() {
    const header = document.getElementById('main-header');
    const h1 = header ? header.querySelector('h1') : null;
    
    if (h1) {
        h1.style.cursor = 'pointer';
        h1.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * コンパクトヘッダーの2行目を更新（タブに応じて表示を切り替え）
 * @param {string} currentTab - 現在のタブ名
 */
export function updateCompactHeaderRow2(currentTab) {
    const row2 = document.querySelector('.header-compact-row2');
    if (!row2) return;
    
    console.log('updateCompactHeaderRow2 - currentTab:', currentTab);
    
    // filterタブの場合は「CMP2000 Official Portal」のみを表示
    if (currentTab === 'filter') {
        row2.innerHTML = `
            <a href="./" class="filter-compact-header" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 0; cursor: pointer; text-decoration: none; color: inherit;">
                <img src="./images/cmp2000-icon.gif" alt="CMP2000 Icon" style="height: 1.5rem; width: auto; vertical-align: middle;">
                <span style="font-size: 1.1rem; font-weight: 500; color: #333;">CMP2000 Official Portal</span>
            </a>
        `;
        return;
    }
    
    // generalタブの場合は通常のタブボタンを表示
    if (currentTab === 'general') {
        // window.tabOrderがあればその順序で、なければデフォルト順序
        const tabOrder = window.tabOrder || ['common', 'kevin', 'ryo'];
        
        const tabLabels = {
            'common': 'ユニット',
            'kevin': 'けびん',
            'ryo': 'リョウ'
        };
        
        const buttonsHTML = tabOrder.map(tabId => {
            const label = tabLabels[tabId] || tabId;
            // NEWバッジがある場合は赤い丸を追加
            const hasNew = window.tabsWithNewBadge && window.tabsWithNewBadge.includes(tabId);
            const newIndicator = hasNew ? '<span class="tab-button-new-indicator"></span>' : '';
            return `<button class="tab-button" data-tab="${tabId}">${newIndicator}${label}</button>`;
        }).join('');
        
        row2.innerHTML = `
            <div class="tab-navigation-compact">
                ${buttonsHTML}
            </div>
        `;
        
        // タブボタンのイベントリスナーを再バインド
        row2.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                console.log('Compact header tab button clicked:', targetTab);
                
                // カスタムイベントを発火してmain.jsに通知
                const event = new CustomEvent('tabSwitch', { detail: { tab: targetTab } });
                document.dispatchEvent(event);
            });
        });
        return;
    }
    
    // common, kevin, ryoタブの場合は3段目メニューを表示
    if (['common', 'kevin', 'ryo'].includes(currentTab)) {
        // home-abbreviation-menu.jsから関数を取得
        // グローバルに保存されていることを想定
        const generateCompactAbbreviationMenuHTML = window.generateCompactAbbreviationMenuHTML;
        const setupCompactAbbreviationMenuEvents = window.setupCompactAbbreviationMenuEvents;
        const basicInfoData = window.basicInfoData;
        const singleDataByKey = window.singleDataByKey;
        
        if (!generateCompactAbbreviationMenuHTML || !setupCompactAbbreviationMenuEvents) {
            console.error('generateCompactAbbreviationMenuHTML or setupCompactAbbreviationMenuEvents not found in window');
            return;
        }
        
        if (!basicInfoData || !singleDataByKey) {
            console.error('basicInfoData or singleDataByKey not found in window');
            return;
        }
        
        // コンパクトメニューのHTMLを生成
        const menuHTML = generateCompactAbbreviationMenuHTML(currentTab, basicInfoData, singleDataByKey);
        
        // row2にHTMLを設定
        row2.innerHTML = menuHTML;
        
        // イベントリスナーを設定
        setupCompactAbbreviationMenuEvents(row2);
        
        console.log('Compact abbreviation menu set up successfully');
    }
}