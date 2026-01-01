/**
 * ジャンプメニューモジュール
 * ページ内ナビゲーション用のジャンプメニューを管理
 */

import { smoothScrollToTop, smoothScrollToElement } from '../shared/utils.js';
import { selectLatestDateOnHeatmap, selectLatestDateForTab } from './heatmap.js';

/**
 * タブごとのセクション情報を取得（order順、property対応）
 * @param {string} tabName - タブ名
 * @param {Array} basicInfoData - Basic Infoデータ
 * @param {Object} singleDataByKey - SingleデータをKeyでグループ化したオブジェクト
 * @returns {Array} セクション情報の配列
 */
function getSectionsForTab(tabName, basicInfoData, singleDataByKey) {
    console.log(`=== getSectionsForTab: ${tabName} (order順) ===`);
    console.log('basicInfoData:', basicInfoData ? `${basicInfoData.length} items` : 'null/undefined');
    console.log('singleDataByKey:', singleDataByKey ? `${Object.keys(singleDataByKey).length} keys` : 'null/undefined');
    
    // 該当タブのアイテムを取得
    let items = basicInfoData.filter(item => item.tabId === tabName);
    console.log(`Initial items for ${tabName}:`, items.length);
    
    // 各アイテムの詳細をログ出力
    items.forEach(item => {
        console.log(`  - ${item.key}: property='${item.property || 'none'}', siteTitle='${item.siteTitle}'`);
    });
    
    // property による表示制御
    items = items.filter(item => {
        console.log(`Checking item: ${item.key} (property: ${item.property || 'none'})`);
        
        // hidden は非表示
        if (item.property === 'hidden') {
            console.log(`  -> Filtered out (hidden)`);
            return false;
        }
        
        // conditional は記事がある場合のみ表示
        if (item.property === 'conditional') {
            if (!singleDataByKey) {
                console.log(`  -> singleDataByKey is null/undefined, filtering out`);
                return false;
            }
            const hasArticles = singleDataByKey[item.key] && singleDataByKey[item.key].length > 0;
            console.log(`  -> conditional check: hasArticles=${hasArticles}, articles count=${singleDataByKey[item.key] ? singleDataByKey[item.key].length : 0}`);
            if (!hasArticles) {
                console.log(`  -> Filtered out (conditional, no articles)`);
                return false;
            }
        }
        
        // MainX/SubX は非表示
        if (item.key.includes('MainX') || item.key.includes('SubX')) {
            console.log(`  -> Filtered out (MainX/SubX)`);
            return false;
        }
        
        // それ以外は表示
        console.log(`  -> Included`);
        return true;
    });
    
    console.log(`After filtering: ${items.length} items`);
    
    // order順にソート（数値として扱う）
    items.sort((a, b) => {
        const orderA = parseInt(a.order, 10) || 0;
        const orderB = parseInt(b.order, 10) || 0;
        return orderA - orderB;
    });
    
    const sections = items.map(item => ({
        id: item.key,
        name: item.abbreviation || item.siteTitle
    }));
    
    console.log(`=== getSectionsForTab 完了: ${sections.length}件 ===`);
    
    return sections;
}

/**
 * 現在のタブに応じてジャンプメニューを更新
 * @param {string} currentTab - 現在のタブ名
 * @param {string|null} currentFilterTag - 現在のフィルタタグ
 * @param {Array} basicInfoData - Basic Infoデータ（総合タブ用）
 * @param {Object} singleDataByKey - SingleデータをKeyでグループ化したオブジェクト
 */
export function updateJumpMenuForCurrentTab(currentTab, currentFilterTag, basicInfoData, singleDataByKey) {
    const jumpMenuList = document.getElementById('jumpMenuList');
    if (!jumpMenuList) return;
    
    console.log('updateJumpMenuForCurrentTab - currentFilterTag:', currentFilterTag, 'currentTab:', currentTab);
    
    if (currentFilterTag) {
        // フィルタモード
        console.log('=== フィルタモード: ジャンプメニュー生成デバッグ ===');
        console.log('currentFilterTag:', currentFilterTag);
        
        let menuItems = '<li><a class="dropdown-item jump-menu-item" data-target="top" href="#">ヘッダー</a></li>';
        menuItems += '<li><hr class="dropdown-divider"></li>';
        
        const filterContainer = document.getElementById('card-content-container-filter');
        if (filterContainer) {
            const cardWrappers = filterContainer.querySelectorAll('.card-wrapper');
            console.log('カード数:', cardWrappers.length);
            
            cardWrappers.forEach((cardWrapper, index) => {
                const cardId = cardWrapper.id;
                const siteTitle = cardWrapper.getAttribute('data-site-title') || '(タイトルなし)';
                const summary = cardWrapper.getAttribute('data-summary') || '';
                
                const displayText = summary ? `${siteTitle} (${summary})` : siteTitle;
                
                console.log(`メニュー項目 ${index + 1}: ${displayText} (ID: ${cardId})`);
                
                menuItems += `<li><a class="dropdown-item jump-menu-item" data-target="${cardId}" href="#">${displayText}</a></li>`;
            });
        } else {
            console.warn('filterContainer が見つかりません');
        }
        
        menuItems += '<li><hr class="dropdown-divider"></li>';
        menuItems += '<li><a class="dropdown-item jump-menu-item" data-target="footer" href="#">フッター</a></li>';
        
        console.log('=== ジャンプメニュー生成完了 ===');
        
        jumpMenuList.innerHTML = menuItems;
    } else {
        // タブモード
        let menuItems = '<li><a class="dropdown-item jump-menu-item" data-target="top" href="#">ヘッダー</a></li>';
        menuItems += '<li><hr class="dropdown-divider"></li>';
        
        if (currentTab === 'general') {
            // 総合タブ
            const tabNames = ['common', 'kevin', 'ryo'];
            const tabKeyPrefixMap = {
                'common': 'cmp',
                'kevin': 'kevin',
                'ryo': 'ryo'
            };
            
            console.log('=== 総合タブ: ジャンプメニュー生成 ===');
            
            // 「ユニット活動」を追加
            const unitActivityItem = basicInfoData.find(item => 
                item.summary === 'ユニット活動' && item.key.startsWith('cmp')
            );
            if (unitActivityItem) {
                console.log('ユニット活動アイテム発見:', unitActivityItem.key, unitActivityItem.siteTitle);
                menuItems += `<li><a class="dropdown-item jump-menu-item" data-target="${unitActivityItem.key}" href="#">ユニット活動</a></li>`;
            } else {
                console.warn('ユニット活動アイテムが見つかりません');
            }
            
            // 各タブの代表アイテムを追加
            tabNames.forEach(tabName => {
                const keyPrefix = tabKeyPrefixMap[tabName] || tabName;
                const tabItems = basicInfoData.filter(item => item.key.startsWith(keyPrefix));
                
                console.log(`${tabName}タブのアイテム数:`, tabItems.length);
                
                if (tabItems.length > 0) {
                    const validItem = tabItems.find(item => {
                        const displayText = item.summary || item.category;
                        
                        if (item.summary === 'ユニット活動') {
                            console.log(`除外（ユニット活動）: ${item.key} - ${displayText}`);
                            return false;
                        }
                        
                        return displayText && displayText.trim() !== '' && displayText !== '-';
                    });
                    
                    if (validItem) {
                        const displayText = validItem.summary || validItem.category;
                        console.log(`有効なアイテム発見: ${validItem.key} - ${displayText}`);
                        menuItems += `<li><a class="dropdown-item jump-menu-item" data-target="${validItem.key}" href="#">${displayText}</a></li>`;
                    } else {
                        console.warn(`${tabName}タブで有効なアイテムが見つかりません`);
                    }
                }
            });
            
            console.log('=== 総合タブ: ジャンプメニュー生成完了 ===');
            
            menuItems += '<li><hr class="dropdown-divider"></li>';
            menuItems += '<li><a class="dropdown-item jump-menu-item" data-target="contribution-graph" href="#">ヒートマップ</a></li>';
        } else {
            // 各タブ（common, kevin, ryo）のカードセクションへのリンク（order順）
            const sections = getSectionsForTab(currentTab, basicInfoData, singleDataByKey);
            
            // ヒートマップを最初に追加
            menuItems += `<li><a class="dropdown-item jump-menu-item" data-target="contribution-graph-${currentTab}" href="#">ヒートマップ</a></li>`;
            
            if (sections.length > 0) {
                sections.forEach(section => {
                    menuItems += `<li><a class="dropdown-item jump-menu-item" data-target="${section.id}" href="#">${section.name}</a></li>`;
                });
            } else {
                console.warn(`${currentTab}タブにカードが見つかりません`);
            }
        }
        
        menuItems += '<li><hr class="dropdown-divider"></li>';
        menuItems += '<li><a class="dropdown-item jump-menu-item" data-target="footer" href="#">フッター</a></li>';
        
        jumpMenuList.innerHTML = menuItems;
    }
    
    // イベントリスナーを追加
    jumpMenuList.querySelectorAll('.jump-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            
            if (target === 'top') {
                smoothScrollToTop();
            } else if (target === 'contribution-graph') {
                // 総合タブのヒートマップへのジャンプ：特別処理
                smoothScrollToElement(target);
                
                // スクロール完了後、ヒートマップを最新にスクロール + 最新セル選択
                setTimeout(() => {
                    selectLatestDateOnHeatmap();
                }, 300);
            } else if (target.startsWith('contribution-graph-')) {
                // 各タブのヒートマップへのジャンプ：特別処理
                const tabName = target.replace('contribution-graph-', '');
                smoothScrollToElement(target);
                
                // スクロール完了後、ヒートマップを最新にスクロール + 最新セル選択
                setTimeout(() => {
                    selectLatestDateForTab(tabName);
                }, 300);
            } else {
                smoothScrollToElement(target);
            }
        });
    });
}