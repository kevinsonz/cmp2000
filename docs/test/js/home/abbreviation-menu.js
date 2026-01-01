/**
 * Abbreviationメニュー生成モジュール
 * 各タブの3段目に表示されるabbreviationメニューを管理
 */

import { smoothScrollToElement } from '../shared/utils.js';

/**
 * Abbreviationメニューを生成
 * @param {string} tabName - タブ名（common, kevin, ryo）
 * @param {Array} basicInfoData - Basic Infoデータ
 * @param {Object} singleDataByKey - SingleデータをKeyでグループ化したオブジェクト
 */
export function generateAbbreviationMenu(tabName, basicInfoData, singleDataByKey) {
    const container = document.getElementById(`abbreviation-menu-${tabName}`);
    if (!container) {
        console.warn(`abbreviation-menu-${tabName} container not found`);
        return;
    }
    
    console.log(`=== generateAbbreviationMenu: ${tabName} ===`);
    console.log('basicInfoData:', basicInfoData ? `${basicInfoData.length} items` : 'null/undefined');
    console.log('singleDataByKey:', singleDataByKey ? `${Object.keys(singleDataByKey).length} keys` : 'null/undefined');
    
    // 該当タブのアイテムを取得
    let items = basicInfoData.filter(item => item.tabId === tabName);
    console.log('Initial items count:', items.length);
    
    // 各アイテムの詳細をログ出力
    items.forEach(item => {
        console.log(`  - ${item.key}: property='${item.property || 'none'}', abbreviation='${item.abbreviation || 'none'}', siteTitle='${item.siteTitle}'`);
    });
    
    // property による表示制御
    items = items.filter(item => {
        console.log(`Checking: ${item.key} (property: ${item.property || 'none'})`);
        
        // hidden は非表示
        if (item.property === 'hidden') {
            console.log(`  Filtered out (hidden): ${item.key} - ${item.siteTitle}`);
            return false;
        }
        
        // conditional は記事がある場合のみ表示
        if (item.property === 'conditional') {
            if (!singleDataByKey) {
                console.log(`  Filtered out (conditional, singleDataByKey is null): ${item.key} - ${item.siteTitle}`);
                return false;
            }
            const hasArticles = singleDataByKey && singleDataByKey[item.key] && singleDataByKey[item.key].length > 0;
            if (!hasArticles) {
                console.log(`  Filtered out (conditional, no articles): ${item.key} - ${item.siteTitle}`);
                return false;
            } else {
                console.log(`  Included (conditional, has articles): ${item.key} - ${item.siteTitle} (${singleDataByKey[item.key].length} articles)`);
            }
        }
        
        // MainX/SubX は非表示
        if (item.key.includes('MainX') || item.key.includes('SubX')) {
            console.log(`  Filtered out (MainX/SubX): ${item.key} - ${item.siteTitle}`);
            return false;
        }
        
        // それ以外は表示
        console.log(`  Included: ${item.key} - ${item.siteTitle} (property: ${item.property || 'none'})`);
        return true;
    });
    
    console.log('After filtering:', items.length);
    
    // order順にソート（数値として扱う）
    items.sort((a, b) => {
        const orderA = parseInt(a.order, 10) || 0;
        const orderB = parseInt(b.order, 10) || 0;
        return orderA - orderB;
    });
    
    console.log('Sorted items:', items.map(item => `${item.key} (order: ${item.order})`));
    
    // メニューボタンを生成
    const menuHTML = items.map(item => {
        const abbreviation = item.abbreviation || item.siteTitle;
        console.log(`  Button: ${item.key} -> "${abbreviation}"`);
        return `<button class="tab-button abbreviation-menu-button" data-target="${item.key}">${abbreviation}</button>`;
    }).join('');
    
    console.log('Generated menuHTML length:', menuHTML.length);
    
    const finalHTML = `
        <div class="abbreviation-menu-scroll-wrapper">
            <button class="scroll-arrow scroll-arrow-left hidden" aria-label="左にスクロール">‹</button>
            <div class="abbreviation-menu-container">
                ${menuHTML}
            </div>
            <button class="scroll-arrow scroll-arrow-right hidden" aria-label="右にスクロール">›</button>
        </div>
    `;
    
    console.log('Setting container.innerHTML...');
    container.innerHTML = finalHTML;
    console.log('Container.innerHTML set successfully');
    
    // スクロールコンテナと矢印ボタンを取得
    const scrollWrapper = container.querySelector('.abbreviation-menu-scroll-wrapper');
    const scrollContainer = container.querySelector('.abbreviation-menu-container');
    const leftArrow = container.querySelector('.scroll-arrow-left');
    const rightArrow = container.querySelector('.scroll-arrow-right');
    
    // 矢印ボタンのクリックイベント
    if (leftArrow && rightArrow && scrollContainer) {
        leftArrow.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
        });
        
        rightArrow.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
        });
        
        // スクロール位置を監視して矢印の表示/非表示を制御
        const updateArrows = () => updateScrollArrows(scrollContainer, leftArrow, rightArrow);
        
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
        setTimeout(updateArrows, 500); // 追加
        setTimeout(updateArrows, 1000); // 追加（広い画面での初期表示用）
        
        // スクロールイベント
        scrollContainer.addEventListener('scroll', updateArrows);
        
        // リサイズイベント
        window.addEventListener('resize', updateArrows);
        
        // タブが表示された時に矢印を更新（visibility changeイベント）
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(updateArrows, 100);
            }
        });
    }
    
    // クリックイベントを追加
    const buttons = container.querySelectorAll('.abbreviation-menu-button');
    console.log(`Adding click events to ${buttons.length} buttons`);
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetKey = button.getAttribute('data-target');
            smoothScrollToElement(targetKey);
        });
    });
    console.log('Click events added successfully');
    console.log(`=== generateAbbreviationMenu completed for ${tabName} ===\n`);
}

/**
 * スクロール位置に応じて矢印ボタンの表示を更新
 * @param {HTMLElement} container - スクロールコンテナ要素
 * @param {HTMLElement} leftArrow - 左矢印ボタン
 * @param {HTMLElement} rightArrow - 右矢印ボタン
 */
function updateScrollArrows(container, leftArrow, rightArrow) {
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    // スマホサイズでは判定を厳密に（1pxの差でも検出）
    const threshold = window.innerWidth <= 768 ? 1 : 5;
    
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

/**
 * すべてのタブの矢印ボタンを更新（外部から呼び出し可能）
 */
export function updateAllScrollArrows() {
    const tabs = ['common', 'kevin', 'ryo'];
    
    tabs.forEach(tabName => {
        const container = document.querySelector(`#abbreviation-menu-${tabName} .abbreviation-menu-container`);
        const wrapper = document.querySelector(`#abbreviation-menu-${tabName} .abbreviation-menu-scroll-wrapper`);
        
        if (container && wrapper) {
            const leftArrow = wrapper.querySelector('.scroll-arrow-left');
            const rightArrow = wrapper.querySelector('.scroll-arrow-right');
            
            if (leftArrow && rightArrow) {
                updateScrollArrows(container, leftArrow, rightArrow);
            }
        }
    });
}

// タブ切り替え時に矢印ボタンを更新
document.addEventListener('DOMContentLoaded', () => {
    // タブボタンのクリックイベントを監視
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // タブ切り替え後に矢印ボタンを更新
            setTimeout(() => {
                updateAllScrollArrows();
            }, 100);
            
            // さらに遅延させて確実に更新
            setTimeout(() => {
                updateAllScrollArrows();
            }, 500);
        });
    });
    
    // ページ読み込み完了後にも実行
    setTimeout(() => {
        updateAllScrollArrows();
    }, 1500);
});

/**
 * AboutとSNSリンクセクションを生成
 * @param {string} tabName - タブ名（common, kevin, ryo）
 * @param {Array} basicInfoData - Basic Infoデータ
 */
export function generateAboutSnsSection(tabName, basicInfoData) {
    const container = document.getElementById(`about-sns-section-${tabName}`);
    if (!container) return;
    
    // 該当タブのアイテムを取得
    const tabItems = basicInfoData.filter(item => item.tabId === tabName);
    
    // Aboutボタンのリンク先を決定
    const aboutHashMap = {
        'common': 'common',
        'kevin': 'kevin',
        'ryo': 'ryo'
    };
    const aboutLink = `about.html#${aboutHashMap[tabName] || tabName}`;
    
    // SNSボタンを生成
    let snsButtonsHTML = '';
    
    const mainXItem = tabItems.find(item => item.key.includes('MainX'));
    if (mainXItem && mainXItem.siteUrl) {
        snsButtonsHTML += `<a href="${mainXItem.siteUrl}" target="_blank" class="btn btn-outline-danger btn-sm">${mainXItem.siteTitle}</a> `;
    }
    
    const subXItem = tabItems.find(item => item.key.includes('SubX'));
    if (subXItem && subXItem.siteUrl) {
        snsButtonsHTML += `<a href="${subXItem.siteUrl}" target="_blank" class="btn btn-outline-danger btn-sm">${subXItem.siteTitle}</a>`;
    }
    
    container.innerHTML = `
        <div class="text-center mb-3" style="padding: 0.5rem 1rem; background-color: rgba(220, 53, 69, 0.08); border-top: 1px solid rgba(220, 53, 69, 0.15); border-bottom: 1px solid rgba(220, 53, 69, 0.15);">
            <a href="${aboutLink}" class="btn btn-outline-danger btn-sm">About</a>
            ${snsButtonsHTML}
        </div>
    `;
}