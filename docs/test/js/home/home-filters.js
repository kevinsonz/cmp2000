/**
 * フィルタ管理モジュール
 * ハッシュタグフィルタの適用と解除を管理
 */

import { showFilterUI, hideFilterUI } from '../shared/hashtag.js';
import { smoothScrollToElement } from '../shared/utils.js';
import { updateCompactHeaderRow2 } from '../shared/header.js';

/**
 * ハッシュタグフィルタを適用
 * @param {string} tag - フィルタタグ
 * @param {string} currentTab - 現在のタブ
 * @param {Function} generateCardsCallback - カード生成コールバック
 * @param {Function} clearFilterCallback - クリアコールバック（フィルタUI用）
 * @returns {Object} - { currentTab: string, currentFilterTag: string }
 */
export function applyHashTagFilter(tag, currentTab, generateCardsCallback, clearFilterCallback) {
    console.log('=== applyHashTagFilter ===');
    console.log('Tag:', tag);
    console.log('Current tab:', currentTab);
    
    // 現在のタブを保存（フィルタモードでない場合のみ）
    if (currentTab !== 'filter') {
        window.previousTab = currentTab;
    }
    
    // フィルタを適用
    generateCardsCallback(tag);
    showFilterUI(tag, clearFilterCallback);
    
    // filterタブに切り替え
    console.log('Switching to filter tab');
    
    // すべてのタブボタンとコンテンツからactiveクラスを削除
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('filtering');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // filterタブをアクティブにする
    const filterContent = document.getElementById('tab-filter');
    if (filterContent) {
        filterContent.classList.add('active');
        console.log('Filter tab activated');
    } else {
        console.error('Filter tab not found (tab-filter)');
    }
    
    // フィルタモード時はすべてのメニューを非表示
    // 1. 2段目メニュー「ユニット｜けびん｜リョウ」を非表示
    document.body.classList.add('hide-tab-navigation');
    
    // 2. 3段目メニュー（略称メニュー）を非表示
    const allAbbreviationMenus = document.querySelectorAll('.abbreviation-menu-wrapper');
    allAbbreviationMenus.forEach(menu => {
        menu.style.display = 'none';
    });
    
    // 3. コンパクトヘッダーの2段目をfilter専用表示に更新
    updateCompactHeaderRow2('filter');
    
    console.log('Filter mode: All menus hidden, compact header shows filter mode');
    
    // DOMの更新を待ってからフィルタタブの先頭にスクロール
    setTimeout(() => {
        console.log('Scrolling to filter tab');
        
        // フィルタタブの先頭にスクロール
        const filterTab = document.getElementById('tab-filter');
        if (filterTab) {
            const header = document.getElementById('main-header');
            const headerHeight = header ? header.offsetHeight : 0;
            const filterTabTop = filterTab.offsetTop;
            const scrollPosition = Math.max(0, filterTabTop - headerHeight - 20);
            
            console.log('Scrolling to filter tab:', {
                filterTab: filterTab.id,
                filterTabTop,
                headerHeight,
                scrollPosition
            });
            
            window.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        } else {
            console.error('Filter tab not found (tab-filter)');
        }
    }, 50);
    
    console.log('Filter applied - returning filter mode');
    return {
        currentTab: 'filter',
        currentFilterTag: tag
    };
}

/**
 * フィルタをクリア
 * @param {Function} generateCardsCallback - カード生成コールバック（フィルタなし）
 * @param {Function} switchTabCallback - タブ切り替えコールバック
 * @returns {Object} - { currentTab: string, currentFilterTag: null }
 */
export function clearHashTagFilter(generateCardsCallback, switchTabCallback) {
    console.log('=== clearHashTagFilter called ===');
    
    // フィルタタブのコンテンツをクリア
    const filterContainer = document.getElementById('card-content-container-filter');
    if (filterContainer) {
        filterContainer.innerHTML = '';
    }
    
    // フィルタタブのハッシュタグ一覧もクリア
    const filterHashTagContainer = document.getElementById('hashtag-list-container-filter');
    if (filterHashTagContainer) {
        filterHashTagContainer.innerHTML = '';
    }
    
    // フィルタなしでカードを再生成
    console.log('Regenerating cards without filter...');
    generateCardsCallback(null);
    hideFilterUI();
    
    // すべてのメニューを元に戻す
    // 1. 3段目メニュー（略称メニュー）を元に戻す
    const allAbbreviationMenus = document.querySelectorAll('.abbreviation-menu-wrapper');
    allAbbreviationMenus.forEach(menu => {
        menu.style.display = '';
    });
    
    // 元のタブに戻る
    const targetTab = window.previousTab || 'general';
    console.log('Switching back to tab:', targetTab);
    
    // タブ切り替えを実行
    if (switchTabCallback) {
        switchTabCallback(targetTab);
    }
    
    // 2. コンパクトヘッダーを元のタブに応じて復元
    // タブ切り替え後に実行するため、少し遅延させる
    setTimeout(() => {
        updateCompactHeaderRow2(targetTab);
    }, 50);
    
    console.log('Filter cleared - returning to tab:', targetTab);
    return {
        currentTab: targetTab,
        currentFilterTag: null
    };
}