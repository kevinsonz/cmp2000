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
    
    // TAB_CONFIGをインポート（動的インポートを避けるため、グローバルに保存されていることを想定）
    // config.jsからTAB_CONFIGを取得
    const TAB_CONFIG = window.TAB_CONFIG || {};
    
    // 各タブの3段目メニューを取得
    const abbreviationMenus = {
        common: document.getElementById('abbreviation-menu-common'),
        kevin: document.getElementById('abbreviation-menu-kevin'),
        ryo: document.getElementById('abbreviation-menu-ryo')
    };
    
    if (currentTab === 'general' || currentTab === 'filter') {
        // 総合タブ・フィルタタブの場合：タブナビゲーションを表示（ユニット・けびん・リョウにアイコン）
        const tabs = [
            { name: 'general', displayName: '総合', icon: null },
            { name: 'common', displayName: 'ユニット', icon: TAB_CONFIG.common?.icon },
            { name: 'kevin', displayName: 'けびん', icon: TAB_CONFIG.kevin?.icon },
            { name: 'ryo', displayName: 'リョウ', icon: TAB_CONFIG.ryo?.icon }
        ];
        
        const tabButtonsHTML = tabs.map(tab => {
            const isActive = currentTab === tab.name ? 'active' : '';
            const iconHTML = tab.icon ? 
                `<img src="${tab.icon}" alt="${tab.displayName} icon" class="tab-icon" style="width: 1.2em; height: 1.2em; margin-right: 0.3em; vertical-align: middle; border-radius: 50%; object-fit: cover;">` : '';
            return `<button class="tab-button ${isActive}" data-tab="${tab.name}">${iconHTML}${tab.displayName}</button>`;
        }).join('');
        
        row2.innerHTML = `
            <div class="tab-navigation-compact">
                ${tabButtonsHTML}
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
    } else {
        // 各タブの場合：左端にアイコン、その右に3段目メニューのコピーを表示
        const sourceMenu = abbreviationMenus[currentTab];
        const tabConfig = TAB_CONFIG[currentTab] || {};
        const iconHTML = tabConfig.icon ? 
            `<img src="${tabConfig.icon}" alt="${tabConfig.displayName || currentTab} icon" class="tab-icon-compact" style="width: 2em; height: 2em; margin-right: 0.5em; border-radius: 50%; object-fit: cover; flex-shrink: 0;">` : '';
        
        if (sourceMenu) {
            const menuContainer = sourceMenu.querySelector('.abbreviation-menu-container');
            if (menuContainer) {
                row2.innerHTML = `
                    <div class="abbreviation-menu-compact-wrapper" style="display: flex; align-items: center; width: 100%;">
                        ${iconHTML}
                        <button class="scroll-arrow scroll-arrow-left hidden" aria-label="左にスクロール">‹</button>
                        <div class="abbreviation-menu-compact" style="flex: 1;">
                            ${menuContainer.innerHTML}
                        </div>
                        <button class="scroll-arrow scroll-arrow-right hidden" aria-label="右にスクロール">›</button>
                    </div>
                `;
                
                // スクロールコンテナと矢印ボタンを取得
                const scrollContainer = row2.querySelector('.abbreviation-menu-compact');
                const leftArrow = row2.querySelector('.scroll-arrow-left');
                const rightArrow = row2.querySelector('.scroll-arrow-right');
                
                // 矢印ボタンのクリックイベント
                if (leftArrow && rightArrow && scrollContainer) {
                    leftArrow.addEventListener('click', () => {
                        scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
                    });
                    
                    rightArrow.addEventListener('click', () => {
                        scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
                    });
                    
                    // スクロール位置を監視して矢印の表示/非表示を制御
                    const updateArrows = () => updateCompactScrollArrows(scrollContainer, leftArrow, rightArrow);
                    
                    // 即座に実行
                    updateArrows();
                    
                    // requestAnimationFrameで次のフレームに実行
                    requestAnimationFrame(() => {
                        updateArrows();
                        // さらに次のフレームでも実行
                        requestAnimationFrame(updateArrows);
                    });
                    
                    // 複数のタイミングで実行（レンダリング完了を確実に捉える）
                    setTimeout(updateArrows, 50);
                    setTimeout(updateArrows, 100);
                    setTimeout(updateArrows, 200);
                    setTimeout(updateArrows, 500);
                    setTimeout(updateArrows, 1000); // スマホサイズ用に追加
                    setTimeout(updateArrows, 1500); // さらに追加
                    
                    // スクロールイベント
                    scrollContainer.addEventListener('scroll', updateArrows);
                    
                    // リサイズイベント（スマホサイズでの画面回転などに対応）
                    const resizeHandler = () => {
                        updateArrows();
                        setTimeout(updateArrows, 100);
                        setTimeout(updateArrows, 300);
                    };
                    window.addEventListener('resize', resizeHandler);
                    
                    // オリエンテーション変更イベント（スマホの画面回転）
                    window.addEventListener('orientationchange', () => {
                        setTimeout(updateArrows, 100);
                        setTimeout(updateArrows, 500);
                    });
                }
                
                // クリックイベントを再バインド
                row2.querySelectorAll('.abbreviation-menu-button').forEach(button => {
                    button.addEventListener('click', () => {
                        const targetKey = button.getAttribute('data-target');
                        
                        console.log('=== コンパクト版ボタンクリック ===');
                        console.log('Target key:', targetKey);
                        
                        // まず、アクティブなタブ内で要素を探す
                        const activeTab = document.querySelector('.tab-content.active');
                        let targetElement = null;
                        
                        if (activeTab) {
                            targetElement = activeTab.querySelector(`#${targetKey}`);
                            console.log('アクティブタブ内で検索:', activeTab.id);
                            console.log('アクティブタブ内で発見:', targetElement ? 'あり' : 'なし');
                        }
                        
                        // アクティブタブ内に見つからない場合は、全体から探す
                        if (!targetElement) {
                            targetElement = document.getElementById(targetKey);
                            console.log('全体から検索して発見:', targetElement ? 'あり' : 'なし');
                        }
                        
                        if (!targetElement) {
                            console.warn(`要素が見つかりません: ${targetKey}`);
                            return;
                        }
                        
                        // 要素が表示されているか確認
                        const isVisible = targetElement.offsetParent !== null;
                        console.log('Element is visible:', isVisible);
                        
                        // 非表示の要素の場合は警告して終了
                        if (!isVisible) {
                            console.warn(`要素は見つかりましたが、非表示です: ${targetKey}`);
                            console.warn('要素の親タブ:', targetElement.closest('.tab-content')?.id);
                            return;
                        }
                        
                        const header = document.getElementById('main-header');
                        
                        // スクロール後の最終的なヘッダー高さを使用
                        const currentScrollY = window.scrollY || window.pageYOffset;
                        const elementPosition = targetElement.getBoundingClientRect().top + currentScrollY;
                        const willScrollDown = elementPosition > currentScrollY + 100;
                        
                        // 下スクロールの場合はコンパクト化後の高さ（50px）
                        const finalHeaderHeight = willScrollDown ? 50 : (header ? header.offsetHeight : 50);
                        const offsetPosition = elementPosition - finalHeaderHeight - 30;
                        
                        console.log('Current scroll Y:', currentScrollY);
                        console.log('Element position:', elementPosition);
                        console.log('Will scroll down:', willScrollDown);
                        console.log('Final header height:', finalHeaderHeight);
                        console.log('Offset position:', offsetPosition);
                        
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                        
                        // スクロール完了後に位置を再調整
                        setTimeout(() => {
                            const currentHeader = document.getElementById('main-header');
                            const actualHeaderHeight = currentHeader ? currentHeader.offsetHeight : 50;
                            const currentElementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                            const adjustedPosition = currentElementPosition - actualHeaderHeight - 30;
                            
                            console.log('=== スクロール完了後の再調整 ===');
                            console.log('Actual header height:', actualHeaderHeight);
                            console.log('Adjusted position:', adjustedPosition);
                            
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
                        }, 800);
                    });
                });
            }
        }
    }
}

/**
 * コンパクトヘッダー用のスクロール矢印更新
 * @param {HTMLElement} container - スクロールコンテナ要素
 * @param {HTMLElement} leftArrow - 左矢印ボタン
 * @param {HTMLElement} rightArrow - 右矢印ボタン
 */
function updateCompactScrollArrows(container, leftArrow, rightArrow) {
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    // スマホサイズでは判定を厳密に（1pxの差でも検出）
    const threshold = window.innerWidth <= 768 ? 1 : 5;
    
    console.log('updateCompactScrollArrows:', {
        scrollWidth,
        clientWidth,
        scrollLeft,
        threshold,
        needsScroll: scrollWidth > clientWidth + threshold
    });
    
    // スクロール不要な場合は両方非表示
    if (scrollWidth <= clientWidth + threshold) {
        leftArrow.classList.add('hidden');
        rightArrow.classList.add('hidden');
        return;
    }
    
    // 左端
    if (scrollLeft <= threshold) {
        leftArrow.classList.add('hidden');
        rightArrow.classList.remove('hidden');
    }
    // 右端
    else if (scrollLeft + clientWidth >= scrollWidth - threshold) {
        leftArrow.classList.remove('hidden');
        rightArrow.classList.add('hidden');
    }
    // 中間
    else {
        leftArrow.classList.remove('hidden');
        rightArrow.classList.remove('hidden');
    }
}