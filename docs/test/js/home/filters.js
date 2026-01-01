/**
 * フィルタ管理モジュール
 * ハッシュタグフィルタの適用と解除を管理
 */

import { showFilterUI, hideFilterUI } from '../shared/hashtag.js';
import { smoothScrollToElement } from '../shared/utils.js';

/**
 * ハッシュタグフィルタを適用
 * @param {string} tag - フィルタタグ
 * @param {string} currentTab - 現在のタブ
 * @param {Function} generateCardsCallback - カード生成コールバック
 * @param {Function} updateJumpMenuCallback - ジャンプメニュー更新コールバック
 * @param {Function} clearFilterCallback - クリアコールバック（フィルタUI用）
 * @returns {Object} - { currentTab: string, currentFilterTag: string }
 */
export function applyHashTagFilter(tag, currentTab, generateCardsCallback, updateJumpMenuCallback, clearFilterCallback) {
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
    
    // DOMの更新を待ってからジャンプメニューを更新
    setTimeout(() => {
        console.log('Updating jump menu for filter mode');
        if (updateJumpMenuCallback) {
            updateJumpMenuCallback('filter'); // フィルタタブを明示的に渡す
        }
        
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
    
    // 元のタブに戻る
    const targetTab = window.previousTab || 'general';
    console.log('Switching back to tab:', targetTab);
    
    // タブ切り替えを実行（この中でジャンプメニューも更新される）
    if (switchTabCallback) {
        switchTabCallback(targetTab);
    }
    
    console.log('Filter cleared - returning to tab:', targetTab);
    return {
        currentTab: targetTab,
        currentFilterTag: null
    };
}
