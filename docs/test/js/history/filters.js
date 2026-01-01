/**
 * Historyページのフィルタ適用・キャンセル処理モジュール
 * フィルタ設定の適用、キャンセル、UI状態管理
 */

import { CATEGORIES } from './constants.js';
import { updateYearSelectOptions } from './year-controls.js';

/**
 * フィルタ設定ボタンの状態を更新
 * @param {boolean} isOpen - アコーディオンが開いているか
 */
export function updateFilterSettingsButtonState(isOpen) {
    const filterButton = document.querySelector('[data-bs-target="#filterSettings"]');
    const filterButtonCompact = document.querySelector('.header-compact .filter-controls-compact button');
    const filterButtonFixed = document.querySelector('.filter-nav-wrapper button');
    
    const buttons = [filterButton, filterButtonCompact, filterButtonFixed].filter(btn => btn);
    
    buttons.forEach(btn => {
        if (isOpen) {
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('btn-primary');
        } else {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-primary');
        }
    });
}

/**
 * フィルタを適用（新しい状態を返すのみ、コールバックは呼ばない）
 * @returns {Object} 更新された状態
 */
export function applyFilter() {
    console.log('[filters] === applyFilter 開始 ===');
    
    // 年の範囲を取得
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    
    const startYear = parseInt(startYearSelect.value);
    const endYear = parseInt(endYearSelect.value);
    
    console.log('[filters] 年範囲:', startYear, '〜', endYear);
    
    // カテゴリフィルタを取得
    const selectedCategories = [];
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        if (checkbox.checked) {
            selectedCategories.push(checkbox.dataset.category);
        }
    });
    
    console.log('[filters] 選択カテゴリ:', selectedCategories);
    
    // 表示オプションを取得
    const showEmptyYears = document.querySelector('input[name="showEmptyYears"]:checked').value === 'on';
    const sortNewestFirst = document.querySelector('input[name="sortOrder"]:checked').value === 'desc';
    
    console.log('[filters] 空白年表示:', showEmptyYears);
    console.log('[filters] ソート順（新→古）:', sortNewestFirst);
    
    // 新しい状態を作成
    const newState = {
        currentStartYear: startYear,
        currentEndYear: endYear,
        currentCategoryFilters: selectedCategories,
        currentShowEmptyYears: showEmptyYears,
        currentSortNewestFirst: sortNewestFirst
    };
    
    console.log('[filters] 新しい状態:', newState);
    
    // アコーディオンを閉じる
    const filterSettings = document.getElementById('filterSettings');
    const bsCollapse = bootstrap.Collapse.getInstance(filterSettings);
    if (bsCollapse) {
        bsCollapse.hide();
    } else {
        new bootstrap.Collapse(filterSettings, {toggle: false}).hide();
    }
    
    console.log('[filters] === applyFilter 完了 ===');
    
    return newState;
}

/**
 * フィルタをキャンセル
 * @param {Object} state - 現在の状態
 */
export function cancelFilter(state) {
    console.log('[filters] === cancelFilter 開始 ===');
    console.log('[filters] 現在の状態に戻す:', state);
    
    // セレクトボックスを現在の設定に戻す
    document.getElementById('startYearSelect').value = state.currentStartYear;
    document.getElementById('endYearSelect').value = state.currentEndYear;
    
    // ラジオボタンを現在の設定に戻す
    if (state.currentShowEmptyYears) {
        document.getElementById('showEmptyYearsOn').checked = true;
    } else {
        document.getElementById('showEmptyYearsOff').checked = true;
    }
    
    if (state.currentSortNewestFirst) {
        document.getElementById('sortNewestFirst').checked = true;
    } else {
        document.getElementById('sortOldestFirst').checked = true;
    }
    
    // カテゴリチェックボックスを現在の設定に戻す
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = state.currentCategoryFilters.includes(checkbox.dataset.category);
    });
    
    // 選択肢を更新
    updateYearSelectOptions();
    
    // アコーディオンを閉じる
    const filterSettings = document.getElementById('filterSettings');
    const bsCollapse = bootstrap.Collapse.getInstance(filterSettings);
    if (bsCollapse) {
        bsCollapse.hide();
    } else {
        new bootstrap.Collapse(filterSettings, {toggle: false}).hide();
    }
    
    console.log('[filters] === cancelFilter 完了 ===');
}