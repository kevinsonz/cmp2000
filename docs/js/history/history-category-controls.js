/**
 * Historyページのカテゴリフィルタ UI管理モジュール
 * カテゴリ選択、チェックボックス、アイコン表示の制御
 */

import { CATEGORIES, CATEGORY_ICONS, CATEGORY_ABBREVIATIONS } from './history-constants.js';

/**
 * カテゴリフィルタリストを生成
 * @param {Array} tempCategoryFilters - 一時的なカテゴリフィルタ
 */
export function generateCategoryFilterList(tempCategoryFilters) {
    const container = document.getElementById('categoryFilterList');
    if (!container) return;
    
    container.innerHTML = '';
    
    CATEGORIES.forEach(category => {
        const filterItem = document.createElement('div');
        filterItem.className = 'form-check mb-2';
        
        const checkbox = document.createElement('input');
        checkbox.className = 'form-check-input filter-category-checkbox';
        checkbox.type = 'checkbox';
        checkbox.id = `filter-${category}`;
        checkbox.dataset.category = category;
        checkbox.checked = tempCategoryFilters.includes(category);
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `filter-${category}`;
        
        const icon = CATEGORY_ICONS[category] || '';
        const abbr = CATEGORY_ABBREVIATIONS[category] || category;
        
        label.innerHTML = `${icon} <strong>${category}</strong> （${abbr}）`;
        
        filterItem.appendChild(checkbox);
        filterItem.appendChild(label);
        
        container.appendChild(filterItem);
    });
}

/**
 * フィルタ設定内の全選択
 */
export function selectAllInFilter() {
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });
}

/**
 * フィルタ設定内の全解除
 */
export function deselectAllInFilter() {
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
}

/**
 * すべて表示ボタンの処理
 * @returns {Array} 全カテゴリ
 */
export function showAllCategories() {
    console.log('[category] showAllCategories 呼び出し');
    const allCategories = [...CATEGORIES];
    
    // フィルタ設定も更新
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });
    
    console.log('[category] showAllCategories 完了');
    return allCategories;
}

/**
 * 単一カテゴリを選択
 * @param {string} category - カテゴリ名
 * @returns {Array} 選択されたカテゴリ
 */
export function selectSingleCategory(category) {
    console.log('[category] selectSingleCategory 呼び出し:', category);
    
    // フィルタ設定も更新
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = checkbox.dataset.category === category;
    });
    
    console.log('[category] selectSingleCategory 完了');
    return [category];
}

/**
 * 選択中カテゴリアイコンを更新
 * @param {Array} currentCategoryFilters - 現在のカテゴリフィルタ
 * @param {Function} clickCallback - アイコンクリック時のコールバック
 */
export function updateSelectedCategoryIcons(currentCategoryFilters, clickCallback) {
    const container = document.getElementById('selectedCategoryIcons');
    if (!container) return;
    
    console.log('[category] updateSelectedCategoryIcons 呼び出し');
    console.log('[category] currentCategoryFilters:', currentCategoryFilters);
    
    container.innerHTML = '';
    
    if (currentCategoryFilters.length === 0) {
        container.textContent = '(フィルタなし)';
    } else {
        // カテゴリの順序を維持してアイコンを個別のspan要素として表示
        CATEGORIES
            .filter(cat => currentCategoryFilters.includes(cat))
            .forEach(cat => {
                const icon = CATEGORY_ICONS[cat] || '';
                if (icon) {
                    const iconSpan = document.createElement('span');
                    iconSpan.textContent = icon;
                    iconSpan.style.cursor = 'pointer';
                    iconSpan.style.userSelect = 'none';
                    iconSpan.style.padding = '0 2px';
                    iconSpan.title = `${cat}を非表示`;
                    iconSpan.dataset.category = cat;
                    
                    // クリックイベントを直接追加
                    iconSpan.addEventListener('click', function(e) {
                        console.log('[category] アイコンクリック:', cat);
                        e.preventDefault();
                        e.stopPropagation();
                        if (clickCallback) {
                            clickCallback(e, cat);
                        }
                    });
                    
                    container.appendChild(iconSpan);
                }
            });
    }
    
    console.log('[category] updateSelectedCategoryIcons 完了');
}

/**
 * カテゴリアイコンクリック時の処理（新しいフィルタを返すのみ）
 * @param {string} category - カテゴリ名
 * @param {Array} currentCategoryFilters - 現在のカテゴリフィルタ
 * @returns {Array|null} 更新されたカテゴリフィルタ（変更なしの場合はnull）
 */
export function handleCategoryIconClick(category, currentCategoryFilters) {
    console.log('[category] handleCategoryIconClick 呼び出し:', category);
    console.log('[category] 現在のフィルタ:', currentCategoryFilters);
    
    // そのカテゴリを除外する
    const newFilters = currentCategoryFilters.filter(cat => cat !== category);
    console.log('[category] 新しいフィルタ:', newFilters);
    
    // 何も選択されていない状態を防ぐ
    if (newFilters.length === 0) {
        console.log('[category] エラー: 少なくとも1つのカテゴリを選択してください');
        return null;
    }
    
    // フィルタ設定も更新
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = newFilters.includes(checkbox.dataset.category);
    });
    
    console.log('[category] handleCategoryIconClick 完了');
    return newFilters;
}