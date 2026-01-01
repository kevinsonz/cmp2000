/**
 * Historyページのエントリーポイント
 * 全モジュールを統合し、ページの初期化を管理
 */

import { updateCurrentYear } from '../shared/utils.js';
import { initHeaderScroll, initHeaderTitleClick } from '../shared/header.js';
import { fetchCSV, parseBasicInfoCSV } from '../shared/csv-loader.js';
import { CATEGORIES, MIN_YEAR, MAX_YEAR, DEFAULT_YEAR_RANGE, CSV_URLS } from './constants.js';
import { parseHistoryCSV } from './timeline.js';

import { 
    initializeYearSelects,
    initializeYearSliders,
    initializeYearButtons,
    setAllPeriod,
    updateYearRangeDisplay
} from './year-controls.js';

import { 
    generateCategoryFilterList,
    selectAllInFilter,
    deselectAllInFilter,
    showAllCategories,
    selectSingleCategory,
    updateSelectedCategoryIcons,
    handleCategoryIconClick
} from './category-controls.js';

import { 
    updateFilterSettingsButtonState,
    applyFilter,
    cancelFilter
} from './filters.js';

import { 
    generateHistoryTable,
    updateHeaderIndicators
} from './table-generator.js';

import { 
    updateJumpMenu,
    scrollToYear,
    scrollToFilterSettings
} from './navigation.js';

// グローバル状態
let historyData = [];
let basicInfoData = [];
let currentStartYear = MAX_YEAR - DEFAULT_YEAR_RANGE;
let currentEndYear = MAX_YEAR;
let currentCategoryFilters = [...CATEGORIES];
let currentShowEmptyYears = true;
let currentSortNewestFirst = true;

// 一時保存用
let tempStartYear = currentStartYear;
let tempEndYear = currentEndYear;
let tempCategoryFilters = [...currentCategoryFilters];
let tempShowEmptyYears = currentShowEmptyYears;
let tempSortNewestFirst = currentSortNewestFirst;

/**
 * 現在の状態を取得
 */
function getState() {
    return {
        currentStartYear,
        currentEndYear,
        currentCategoryFilters,
        currentShowEmptyYears,
        currentSortNewestFirst
    };
}

/**
 * テーブル生成のラッパー
 */
function generateTableWrapper() {
    generateHistoryTable(
        getState(),
        historyData,
        basicInfoData,
        scrollToFilterSettings,
        selectSingleCategoryWrapper,
        updateJumpMenuWrapper
    );
}

/**
 * ジャンプメニュー更新のラッパー
 */
function updateJumpMenuWrapper() {
    updateJumpMenu(
        getState(),
        historyData,
        scrollToFilterSettings,
        scrollToYear
    );
}

/**
 * カテゴリアイコン更新のラッパー
 */
function updateCategoryIconsWrapper() {
    updateSelectedCategoryIcons(
        currentCategoryFilters,
        (event, category) => {
            console.log('[main] カテゴリアイコンクリックコールバック:', category);
            
            // 新しいフィルタを取得
            const newFilters = handleCategoryIconClick(category, currentCategoryFilters);
            
            // フィルタが変更された場合のみ更新
            if (newFilters !== null) {
                console.log('[main] フィルタ更新:', newFilters);
                currentCategoryFilters = newFilters;
                
                // テーブルとアイコンを更新
                generateTableWrapper();
                updateCategoryIconsWrapper();
                updateJumpMenuWrapper();
            } else {
                console.log('[main] フィルタ変更なし（最後の1つ）');
            }
        }
    );
}

/**
 * フィルタ適用のラッパー
 */
function applyFilterWrapper() {
    console.log('[main] === applyFilterWrapper 開始 ===');
    console.log('[main] 適用前の状態:', getState());
    
    // 新しい状態を取得
    const newState = applyFilter();
    
    console.log('[main] 新しい状態:', newState);
    
    // 先に状態を更新
    currentStartYear = newState.currentStartYear;
    currentEndYear = newState.currentEndYear;
    currentCategoryFilters = newState.currentCategoryFilters;
    currentShowEmptyYears = newState.currentShowEmptyYears;
    currentSortNewestFirst = newState.currentSortNewestFirst;
    
    console.log('[main] 状態更新完了:', getState());
    
    // その後でテーブルを再生成
    generateTableWrapper();
    updateCategoryIconsWrapper();
    updateJumpMenuWrapper();
    updateHeaderIndicators(currentShowEmptyYears, currentSortNewestFirst);
    
    console.log('[main] === applyFilterWrapper 完了 ===');
}

/**
 * フィルタキャンセルのラッパー
 */
function cancelFilterWrapper() {
    cancelFilter(getState());
}

/**
 * すべて表示のラッパー
 */
function showAllCategoriesWrapper() {
    console.log('[main] showAllCategoriesWrapper 呼び出し');
    
    // 新しいフィルタを取得
    currentCategoryFilters = showAllCategories();
    
    // テーブルとアイコンを更新
    generateTableWrapper();
    updateCategoryIconsWrapper();
    updateJumpMenuWrapper();
    
    console.log('[main] showAllCategoriesWrapper 完了');
}

/**
 * 単一カテゴリ選択のラッパー
 */
function selectSingleCategoryWrapper(category) {
    console.log('[main] selectSingleCategoryWrapper 呼び出し:', category);
    
    // 新しいフィルタを取得
    currentCategoryFilters = selectSingleCategory(category);
    
    // テーブルとアイコンを更新
    generateTableWrapper();
    updateCategoryIconsWrapper();
    updateJumpMenuWrapper();
    
    console.log('[main] selectSingleCategoryWrapper 完了');
}

/**
 * 空白年表示切り替え
 */
function toggleEmptyYearWrapper() {
    currentShowEmptyYears = !currentShowEmptyYears;
    
    // ラジオボタンも更新
    if (currentShowEmptyYears) {
        document.getElementById('showEmptyYearsOn').checked = true;
    } else {
        document.getElementById('showEmptyYearsOff').checked = true;
    }
    
    // 年表を更新
    generateTableWrapper();
    updateHeaderIndicators(currentShowEmptyYears, currentSortNewestFirst);
    updateJumpMenuWrapper();
}

/**
 * ソート順切り替え
 */
function toggleSortOrderWrapper() {
    currentSortNewestFirst = !currentSortNewestFirst;
    
    // ラジオボタンも更新
    if (currentSortNewestFirst) {
        document.getElementById('sortNewestFirst').checked = true;
    } else {
        document.getElementById('sortOldestFirst').checked = true;
    }
    
    // 年表を更新
    generateTableWrapper();
    updateHeaderIndicators(currentShowEmptyYears, currentSortNewestFirst);
    updateJumpMenuWrapper();
}

/**
 * ページ初期化
 */
async function initializePage() {
    console.log('=== History ページ初期化開始 ===');
    
    // ヘッダーとフッターの初期化
    initHeaderScroll();
    initHeaderTitleClick();
    updateCurrentYear();
    
    try {
        // CSVデータを読み込み
        const [basicCsvText, historyCsvText] = await Promise.all([
            fetchCSV(CSV_URLS.BASIC_INFO),
            fetchCSV(CSV_URLS.HISTORY)
        ]);
        
        console.log('=== 公開CSV読み込み成功 ===');
        
        // CSVをパース
        basicInfoData = parseBasicInfoCSV(basicCsvText);
        historyData = parseHistoryCSV(historyCsvText);
        
        console.log('パース後のデータ件数:');
        console.log('- basicInfoData:', basicInfoData.length);
        console.log('- historyData:', historyData.length);
        
        // UIを初期化
        initializeYearSelects(currentStartYear, currentEndYear);
        initializeYearSliders(tempStartYear, tempEndYear);
        initializeYearButtons();
        generateCategoryFilterList(tempCategoryFilters);
        
        // イベントリスナーを設定
        const allPeriodBtn = document.getElementById('allPeriodBtn');
        if (allPeriodBtn) {
            allPeriodBtn.addEventListener('click', setAllPeriod);
        }
        
        const filterSelectAllBtn = document.getElementById('filterSelectAllBtn');
        if (filterSelectAllBtn) {
            filterSelectAllBtn.addEventListener('click', selectAllInFilter);
        }
        
        const filterDeselectAllBtn = document.getElementById('filterDeselectAllBtn');
        if (filterDeselectAllBtn) {
            filterDeselectAllBtn.addEventListener('click', deselectAllInFilter);
        }
        
        const filterApplyBtn = document.getElementById('filterApplyBtn');
        if (filterApplyBtn) {
            console.log('[init] filterApplyBtn 要素見つかった:', filterApplyBtn);
            filterApplyBtn.addEventListener('click', function(e) {
                console.log('[click] filterApplyBtn がクリックされました');
                e.preventDefault();
                e.stopPropagation();
                applyFilterWrapper();
            });
        } else {
            console.error('[init] filterApplyBtn 要素が見つかりません！');
        }
        
        const filterCancelBtn = document.getElementById('filterCancelBtn');
        if (filterCancelBtn) {
            filterCancelBtn.addEventListener('click', cancelFilterWrapper);
        }
        
        const showAllBtn = document.getElementById('showAllBtn');
        if (showAllBtn) {
            console.log('[init] showAllBtn 要素見つかった:', showAllBtn);
            showAllBtn.addEventListener('click', function(e) {
                console.log('[click] showAllBtn がクリックされました');
                e.preventDefault();
                e.stopPropagation();
                showAllCategoriesWrapper();
            });
        } else {
            console.error('[init] showAllBtn 要素が見つかりません！');
        }
        
        const emptyYearIndicator = document.getElementById('emptyYearIndicator');
        if (emptyYearIndicator) {
            emptyYearIndicator.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleEmptyYearWrapper();
            });
        }
        
        const sortOrderIndicator = document.getElementById('sortOrderIndicator');
        if (sortOrderIndicator) {
            sortOrderIndicator.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleSortOrderWrapper();
            });
        }
        
        // フィルタ設定の開閉を監視
        const filterSettings = document.getElementById('filterSettings');
        if (filterSettings) {
            filterSettings.addEventListener('show.bs.collapse', () => {
                updateFilterSettingsButtonState(true);
            });
            filterSettings.addEventListener('hide.bs.collapse', () => {
                updateFilterSettingsButtonState(false);
            });
        }
        
        // テーブルとメニューを生成
        generateTableWrapper();
        updateCategoryIconsWrapper();
        updateJumpMenuWrapper();
        updateHeaderIndicators(currentShowEmptyYears, currentSortNewestFirst);
        
        console.log('=== History ページ初期化完了 ===');
    } catch (error) {
        console.error('公開CSVの読み込みに失敗しました:', error);
    }
}

// グローバルスコープに公開（HTML内のonclickから呼ばれるため）
window.scrollToFilterSettings = scrollToFilterSettings;

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', initializePage);