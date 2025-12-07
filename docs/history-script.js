// ========================
// history.html用のスクリプト
// ========================

// カテゴリの定義（表示順）
const CATEGORIES = [
    '夕刊中年マカチン',
    'CMP2000',
    'けびんケビンソン',
    'イイダリョウ',
    'その他'
];

// カテゴリアイコンのマッピング
const CATEGORY_ICONS = {
    '夕刊中年マカチン': '📰',
    'CMP2000': '🏠',
    'けびんケビンソン': '👤',
    'イイダリョウ': '💻',
    'その他': '📌'
};

// カテゴリ略称のマッピング
const CATEGORY_ABBREVIATIONS = {
    '夕刊中年マカチン': '夕マカ',
    'CMP2000': 'CMP',
    'けびんケビンソン': 'けびん',
    'イイダリョウ': 'リョウ',
    'その他': 'etc.'
};

// 年の範囲設定
const MIN_YEAR = 1998;
const MAX_YEAR = new Date().getFullYear();
const DEFAULT_YEAR_RANGE = 10; // デフォルトで直近10年

// 公開スプレッドシートのCSV URL
const PUBLIC_HISTORY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=2103644132&single=true&output=csv';

// グローバル変数
let historyData = [];
let currentStartYear = MAX_YEAR - DEFAULT_YEAR_RANGE;
let currentEndYear = MAX_YEAR;
let currentCategoryFilters = [...CATEGORIES]; // すべて選択された状態で初期化
let currentShowEmptyYears = true; // デフォルトで空白年を表示
let currentSortNewestFirst = true; // デフォルトで新→古

// フィルタ設定の一時保存用
let tempStartYear = currentStartYear;
let tempEndYear = currentEndYear;
let tempCategoryFilters = [...currentCategoryFilters];
let tempShowEmptyYears = currentShowEmptyYears;
let tempSortNewestFirst = currentSortNewestFirst;

// 環境判定
const isLocalMode = window.location.protocol === 'file:' || (typeof HISTORY_DATA !== 'undefined');

// 初期化処理
if (isLocalMode && typeof HISTORY_DATA !== 'undefined') {
    console.log('ローカルモードで実行中（History）');
    historyData = parseHistoryCSV(HISTORY_DATA.HISTORY_CSV);
    // DOMContentLoadedイベントを待つ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePage);
    } else {
        initializePage();
    }
} else {
    console.log('オンラインモードで実行中（History）');
    
    fetch(PUBLIC_HISTORY_CSV_URL)
        .then(response => response.text())
        .then(csvText => {
            historyData = parseHistoryCSV(csvText);
            // DOMContentLoadedイベントを待つ
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializePage);
            } else {
                initializePage();
            }
        })
        .catch(error => {
            console.error('公開CSVの読み込みに失敗しました:', error);
        });
}

// 和暦変換関数
function getJapaneseEra(year) {
    if (year >= 2019) {
        return `令和${year - 2018}年`;
    } else if (year >= 1989) {
        return `平成${year - 1988}年`;
    } else if (year >= 1926) {
        return `昭和${year - 1925}年`;
    } else if (year >= 1912) {
        return `大正${year - 1911}年`;
    } else {
        return `明治${year - 1867}年`;
    }
}

// フィルタ設定ボタンの状態を更新
function updateFilterSettingsButtonState(isOpen) {
    // 通常時のボタン（filter-nav-wrapper内）
    const normalButton = document.querySelector('.filter-nav-wrapper .filter-controls button');
    // コンパクト版のボタン（header-compact-row2内）
    const compactButton = document.querySelector('.header-compact-row2 .filter-controls-compact button');
    
    [normalButton, compactButton].forEach(btn => {
        if (!btn) return;
        
        if (isOpen) {
            // 開いている状態: 塗りつぶし
            btn.className = 'btn btn-sm btn-primary';
        } else {
            // 閉じている状態: アウトライン
            btn.className = 'btn btn-sm btn-outline-primary';
        }
    });
}

// CSV解析関数
function parseHistoryCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const yearIndex = headers.indexOf('Year');
    const dateIndex = headers.indexOf('Date');
    const categoryIndex = headers.indexOf('Category');
    const contentsIndex = headers.indexOf('Contents');
    const linkIndex = headers.indexOf('Link');
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        // カンマ区切りの解析（コンテンツ内のカンマを考慮）
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        
        if (values[yearIndex] && values[categoryIndex] && values[contentsIndex]) {
            items.push({
                year: parseInt(values[yearIndex]),
                date: dateIndex >= 0 ? (values[dateIndex] || '') : '',
                category: values[categoryIndex],
                contents: values[contentsIndex],
                link: values[linkIndex] || ''
            });
        }
    }
    
    return items;
}

// 年のセレクトボックスを初期化
function initializeYearSelects() {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    
    if (!startYearSelect || !endYearSelect) return;
    
    // 選択肢を生成（新しい年から古い年の順）
    for (let year = MAX_YEAR; year >= MIN_YEAR; year--) {
        const startOption = document.createElement('option');
        startOption.value = year;
        startOption.textContent = `${year}年`;
        startYearSelect.appendChild(startOption);
        
        const endOption = document.createElement('option');
        endOption.value = year;
        endOption.textContent = `${year}年`;
        endYearSelect.appendChild(endOption);
    }
    
    // 初期値を設定
    startYearSelect.value = currentStartYear;
    endYearSelect.value = currentEndYear;
    
    // 変更イベントリスナーを追加
    startYearSelect.addEventListener('change', onStartYearChange);
    endYearSelect.addEventListener('change', onEndYearChange);
    
    // 初期状態で選択肢を更新
    updateYearSelectOptions();
}

// 開始年が変更された時の処理
function onStartYearChange() {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    
    const startYear = parseInt(startYearSelect.value);
    const endYear = parseInt(endYearSelect.value);
    
    // 開始年 > 終了年 の場合、終了年を開始年に合わせる
    if (startYear > endYear) {
        endYearSelect.value = startYear;
    }
    
    updateYearSelectOptions();
}

// 終了年が変更された時の処理
function onEndYearChange() {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    
    const startYear = parseInt(startYearSelect.value);
    const endYear = parseInt(endYearSelect.value);
    
    // 開始年 > 終了年 の場合、開始年を終了年に合わせる
    if (startYear > endYear) {
        startYearSelect.value = endYear;
    }
    
    updateYearSelectOptions();
}

// セレクトボックスの選択肢を更新（有効な年のみ選択可能に）
function updateYearSelectOptions() {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    
    if (!startYearSelect || !endYearSelect) return;
    
    const startYear = parseInt(startYearSelect.value);
    const endYear = parseInt(endYearSelect.value);
    
    // 開始年の選択肢を更新（終了年以前のみ有効）
    Array.from(startYearSelect.options).forEach(option => {
        const year = parseInt(option.value);
        option.disabled = year > endYear;
    });
    
    // 終了年の選択肢を更新（開始年以降のみ有効）
    Array.from(endYearSelect.options).forEach(option => {
        const year = parseInt(option.value);
        option.disabled = year < startYear;
    });
}

// スライダーと年選択の同期機能
function initializeYearSliders() {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    const startYearSlider = document.getElementById('startYearSlider');
    const endYearSlider = document.getElementById('endYearSlider');
    
    if (!startYearSelect || !endYearSelect || !startYearSlider || !endYearSlider) return;
    
    // スライダーの範囲を設定
    startYearSlider.min = MIN_YEAR;
    startYearSlider.max = MAX_YEAR;
    endYearSlider.min = MIN_YEAR;
    endYearSlider.max = MAX_YEAR;
    
    // 初期値を設定
    startYearSlider.value = tempStartYear;
    endYearSlider.value = tempEndYear;
    
    // 開始年スライダーのイベントリスナー
    startYearSlider.addEventListener('input', function() {
        const year = parseInt(this.value);
        startYearSelect.value = year;
        // 終了年より後にならないように制限
        if (year > parseInt(endYearSelect.value)) {
            endYearSelect.value = year;
            endYearSlider.value = year;
        }
        updateYearSelectOptions();
    });
    
    // 終了年スライダーのイベントリスナー
    endYearSlider.addEventListener('input', function() {
        const year = parseInt(this.value);
        endYearSelect.value = year;
        // 開始年より前にならないように制限
        if (year < parseInt(startYearSelect.value)) {
            startYearSelect.value = year;
            startYearSlider.value = year;
        }
        updateYearSelectOptions();
    });
    
    // 開始年プルダウンのイベントリスナー
    startYearSelect.addEventListener('change', function() {
        startYearSlider.value = this.value;
    });
    
    // 終了年プルダウンのイベントリスナー
    endYearSelect.addEventListener('change', function() {
        endYearSlider.value = this.value;
    });
}

// 年の増減ボタンの機能を初期化
function initializeYearButtons() {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    const startYearSlider = document.getElementById('startYearSlider');
    const endYearSlider = document.getElementById('endYearSlider');
    
    const startYearMinus = document.getElementById('startYearMinus');
    const startYearPlus = document.getElementById('startYearPlus');
    const endYearMinus = document.getElementById('endYearMinus');
    const endYearPlus = document.getElementById('endYearPlus');
    
    if (!startYearSelect || !endYearSelect || !startYearSlider || !endYearSlider) return;
    if (!startYearMinus || !startYearPlus || !endYearMinus || !endYearPlus) return;
    
    // 長押し用のID管理
    let intervalId = null;
    let timeoutId = null;
    let isPressed = false;
    
    // 年を変更する共通関数
    function changeYear(selectElement, sliderElement, delta) {
        let currentYear = parseInt(selectElement.value);
        let newYear = currentYear + delta;
        
        // 範囲チェック
        if (newYear < MIN_YEAR) newYear = MIN_YEAR;
        if (newYear > MAX_YEAR) newYear = MAX_YEAR;
        
        // 開始年と終了年の関係チェック（ループを防ぐため、必要な場合のみ連動）
        if (selectElement === startYearSelect) {
            const endYear = parseInt(endYearSelect.value);
            // 開始年を増やしているときのみ、終了年も連動して増やす
            if (delta > 0 && newYear > endYear) {
                endYearSelect.value = newYear;
                endYearSlider.value = newYear;
            }
            // 開始年が既に終了年を超えている場合は、開始年を終了年に合わせる
            else if (newYear > endYear) {
                newYear = endYear;
            }
        } else if (selectElement === endYearSelect) {
            const startYear = parseInt(startYearSelect.value);
            // 終了年を減らしているときのみ、開始年も連動して減らす
            if (delta < 0 && newYear < startYear) {
                startYearSelect.value = newYear;
                startYearSlider.value = newYear;
            }
            // 終了年が既に開始年を下回っている場合は、終了年を開始年に合わせる
            else if (newYear < startYear) {
                newYear = startYear;
            }
        }
        
        // 値を更新
        selectElement.value = newYear;
        sliderElement.value = newYear;
        updateYearSelectOptions();
    }
    
    // 長押し開始
    function startContinuousChange(selectElement, sliderElement, delta) {
        // フラグをセット
        isPressed = true;
        
        // 最初の1回を実行
        changeYear(selectElement, sliderElement, delta);
        
        // 500ms後から連続変更開始（ただし、まだ押されている場合のみ）
        timeoutId = setTimeout(() => {
            if (isPressed) {
                intervalId = setInterval(() => {
                    changeYear(selectElement, sliderElement, delta);
                }, 100); // 100msごとに変更
            }
        }, 500);
    }
    
    // 長押し停止
    function stopContinuousChange() {
        // フラグをクリア
        isPressed = false;
        
        // タイムアウトをクリア（まだインターバルが開始されていない場合）
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        
        // インターバルをクリア
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }
    
    // 開始年マイナスボタン
    startYearMinus.addEventListener('mousedown', () => startContinuousChange(startYearSelect, startYearSlider, -1));
    startYearMinus.addEventListener('mouseup', stopContinuousChange);
    startYearMinus.addEventListener('mouseleave', stopContinuousChange);
    startYearMinus.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startContinuousChange(startYearSelect, startYearSlider, -1);
    });
    startYearMinus.addEventListener('touchend', stopContinuousChange);
    startYearMinus.addEventListener('touchcancel', stopContinuousChange);
    
    // 開始年プラスボタン
    startYearPlus.addEventListener('mousedown', () => startContinuousChange(startYearSelect, startYearSlider, 1));
    startYearPlus.addEventListener('mouseup', stopContinuousChange);
    startYearPlus.addEventListener('mouseleave', stopContinuousChange);
    startYearPlus.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startContinuousChange(startYearSelect, startYearSlider, 1);
    });
    startYearPlus.addEventListener('touchend', stopContinuousChange);
    startYearPlus.addEventListener('touchcancel', stopContinuousChange);
    
    // 終了年マイナスボタン
    endYearMinus.addEventListener('mousedown', () => startContinuousChange(endYearSelect, endYearSlider, -1));
    endYearMinus.addEventListener('mouseup', stopContinuousChange);
    endYearMinus.addEventListener('mouseleave', stopContinuousChange);
    endYearMinus.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startContinuousChange(endYearSelect, endYearSlider, -1);
    });
    endYearMinus.addEventListener('touchend', stopContinuousChange);
    endYearMinus.addEventListener('touchcancel', stopContinuousChange);
    
    // 終了年プラスボタン
    endYearPlus.addEventListener('mousedown', () => startContinuousChange(endYearSelect, endYearSlider, 1));
    endYearPlus.addEventListener('mouseup', stopContinuousChange);
    endYearPlus.addEventListener('mouseleave', stopContinuousChange);
    endYearPlus.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startContinuousChange(endYearSelect, endYearSlider, 1);
    });
    endYearPlus.addEventListener('touchend', stopContinuousChange);
    endYearPlus.addEventListener('touchcancel', stopContinuousChange);
}

// [全期間]ボタンの処理
function setAllPeriod() {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    const startYearSlider = document.getElementById('startYearSlider');
    const endYearSlider = document.getElementById('endYearSlider');
    
    if (!startYearSelect || !endYearSelect || !startYearSlider || !endYearSlider) return;
    
    // 全期間を設定
    startYearSelect.value = MIN_YEAR;
    endYearSelect.value = MAX_YEAR;
    startYearSlider.value = MIN_YEAR;
    endYearSlider.value = MAX_YEAR;
    
    // 選択肢を更新
    updateYearSelectOptions();
    
    console.log('全期間設定:', MIN_YEAR, '〜', MAX_YEAR);
}

// ページ初期化
function initializePage() {
    console.log('initializePage called');
    
    // 年のセレクトボックスの初期化
    initializeYearSelects();
    
    // スライダーと年選択の同期機能の初期化
    initializeYearSliders();
    
    // 年の増減ボタンの初期化
    initializeYearButtons();
    
    // [全期間]ボタンのイベントリスナー
    document.getElementById('allPeriodBtn').addEventListener('click', setAllPeriod);
    
    // カテゴリフィルタリストを生成
    generateCategoryFilterList();
    
    // 「全表示」ボタンのイベントリスナー
    document.getElementById('showAllBtn').addEventListener('click', showAllCategories);
    
    // フィルタ設定内の「全選択」「全解除」ボタン
    document.getElementById('filterSelectAllBtn').addEventListener('click', selectAllInFilter);
    document.getElementById('filterDeselectAllBtn').addEventListener('click', deselectAllInFilter);
    
    // 「適用」「キャンセル」ボタン
    document.getElementById('filterApplyBtn').addEventListener('click', applyFilter);
    document.getElementById('filterCancelBtn').addEventListener('click', cancelFilter);
    
    // 年表の見出しアイコンのクリックイベント
    document.getElementById('emptyYearIndicator').addEventListener('click', toggleEmptyYearDisplay);
    document.getElementById('sortOrderIndicator').addEventListener('click', toggleSortOrder);
    
    // カテゴリアイコンのクリックイベント（delegationで実装）
    document.getElementById('selectedCategoryIcons').addEventListener('click', handleCategoryIconClick);
    
    // 初回テーブル生成
    generateHistoryTable();
    
    // 選択中アイコンの表示を更新
    updateSelectedCategoryIcons();
    
    // 見出しインジケーターを更新
    updateHeaderIndicators();
    
    // その他の初期化
    updateCurrentYear();
    initHeaderScroll();
    
    // フィルタ設定のcollapseイベントリスナーを追加
    const filterSettings = document.getElementById('filterSettings');
    if (filterSettings) {
        // 開いた時
        filterSettings.addEventListener('shown.bs.collapse', function() {
            updateFilterSettingsButtonState(true);
        });
        
        // 閉じた時
        filterSettings.addEventListener('hidden.bs.collapse', function() {
            updateFilterSettingsButtonState(false);
        });
        
        // 初期状態を反映
        const isOpen = filterSettings.classList.contains('show');
        updateFilterSettingsButtonState(isOpen);
    }
}

// カテゴリフィルタリストを生成
function generateCategoryFilterList() {
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

// フィルタ設定内の「全選択」
function selectAllInFilter() {
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });
}

// フィルタ設定内の「全解除」
function deselectAllInFilter() {
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
}

// 「適用」ボタン
function applyFilter() {
    // 年の範囲を取得（セレクトボックスの連動により矛盾は発生しない）
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    
    const startYear = parseInt(startYearSelect.value);
    const endYear = parseInt(endYearSelect.value);
    
    // カテゴリフィルタを取得
    const selectedCategories = [];
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        if (checkbox.checked) {
            selectedCategories.push(checkbox.dataset.category);
        }
    });
    
    // 表示オプションを取得
    const showEmptyYears = document.querySelector('input[name="showEmptyYears"]:checked').value === 'on';
    const sortNewestFirst = document.querySelector('input[name="sortOrder"]:checked').value === 'desc';
    
    // 現在の設定を更新
    currentStartYear = startYear;
    currentEndYear = endYear;
    currentCategoryFilters = selectedCategories;
    currentShowEmptyYears = showEmptyYears;
    currentSortNewestFirst = sortNewestFirst;
    
    // 年表を更新
    generateHistoryTable();
    updateSelectedCategoryIcons();
    updateJumpMenu();
    
    // アコーディオンを閉じる
    const filterSettings = document.getElementById('filterSettings');
    const bsCollapse = bootstrap.Collapse.getInstance(filterSettings);
    if (bsCollapse) {
        bsCollapse.hide();
    } else {
        new bootstrap.Collapse(filterSettings, {toggle: false}).hide();
    }
}

// 「キャンセル」ボタン
function cancelFilter() {
    // セレクトボックスを現在の設定に戻す
    document.getElementById('startYearSelect').value = currentStartYear;
    document.getElementById('endYearSelect').value = currentEndYear;
    
    // ラジオボタンを現在の設定に戻す
    if (currentShowEmptyYears) {
        document.getElementById('showEmptyYearsOn').checked = true;
    } else {
        document.getElementById('showEmptyYearsOff').checked = true;
    }
    
    if (currentSortNewestFirst) {
        document.getElementById('sortNewestFirst').checked = true;
    } else {
        document.getElementById('sortOldestFirst').checked = true;
    }
    
    // カテゴリチェックボックスを現在の設定に戻す
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = currentCategoryFilters.includes(checkbox.dataset.category);
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
}

// すべて表示ボタン
function showAllCategories() {
    currentCategoryFilters = [...CATEGORIES];
    
    // フィルタ設定も更新
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });
    
    // 年表を更新
    generateHistoryTable();
    updateSelectedCategoryIcons();
    updateJumpMenu();
}

// 単一カテゴリを選択
function selectSingleCategory(category) {
    currentCategoryFilters = [category];
    
    // フィルタ設定も更新
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = checkbox.dataset.category === category;
    });
    
    // 年表を更新
    generateHistoryTable();
    updateSelectedCategoryIcons();
    updateJumpMenu();
}

// 選択中カテゴリアイコンを更新
function updateSelectedCategoryIcons() {
    const container = document.getElementById('selectedCategoryIcons');
    if (!container) return;
    
    container.innerHTML = ''; // 内容をクリア
    
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
                    container.appendChild(iconSpan);
                }
            });
    }
}

// 年表テーブル生成
function generateHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    
    // 年表の範囲表示を更新
    updateYearRangeDisplay();
    
    // データを年とカテゴリでグループ化
    const groupedData = {};
    
    historyData.forEach(item => {
        if (item.year >= currentStartYear && item.year <= currentEndYear) {
            // カテゴリフィルタを適用
            if (currentCategoryFilters.length === 0) {
                // 空配列の場合は何も表示しない
                return;
            }
            if (!currentCategoryFilters.includes(item.category)) {
                // 選択されていないカテゴリはスキップ
                return;
            }
            
            if (!groupedData[item.year]) {
                groupedData[item.year] = [];
            }
            groupedData[item.year].push(item);
        }
    });
    
    // 表示する年のリストを作成
    let yearsToDisplay = [];
    
    if (currentShowEmptyYears) {
        // 全ての年を表示
        for (let year = currentStartYear; year <= currentEndYear; year++) {
            yearsToDisplay.push(year);
        }
    } else {
        // 記事がある年のみ表示
        yearsToDisplay = Object.keys(groupedData).map(y => parseInt(y)).sort((a, b) => a - b);
    }
    
    // 並び順の設定
    if (currentSortNewestFirst) {
        yearsToDisplay.sort((a, b) => b - a);
    } else {
        yearsToDisplay.sort((a, b) => a - b);
    }
    
    // 表示年の範囲が全体範囲より狭い場合に「...」行を追加
    // データの有無は関係なく、純粋に年の範囲だけで判定
    const hasYearsBeforeStart = currentStartYear > MIN_YEAR;
    const hasYearsAfterEnd = currentEndYear < MAX_YEAR;
    
    // デバッグ情報
    console.log('=== 省略行判定 ===');
    console.log('全体範囲:', MIN_YEAR, '〜', MAX_YEAR);
    console.log('表示範囲:', currentStartYear, '〜', currentEndYear);
    console.log('ソート:', currentSortNewestFirst ? '降順（新→古）' : '昇順（古→新）');
    console.log('過去に続きがある:', hasYearsBeforeStart);
    console.log('未来に続きがある:', hasYearsAfterEnd);
    console.log('==================');
    
    // 最初に「...」行を追加（新→古の場合は未来に続きがある、古→新の場合は過去に続きがある）
    if (currentSortNewestFirst && hasYearsAfterEnd) {
        const dotRow = document.createElement('tr');
        dotRow.className = 'ellipsis-row';
        const dotYearCell = document.createElement('td');
        dotYearCell.className = 'year-column text-center text-muted';
        dotYearCell.textContent = '…';
        const dotArticleCell = document.createElement('td');
        dotArticleCell.className = 'article-column text-muted text-center fst-italic';
        dotArticleCell.textContent = '(未来に続く)';
        dotRow.appendChild(dotYearCell);
        dotRow.appendChild(dotArticleCell);
        tbody.appendChild(dotRow);
    } else if (!currentSortNewestFirst && hasYearsBeforeStart) {
        const dotRow = document.createElement('tr');
        dotRow.className = 'ellipsis-row';
        const dotYearCell = document.createElement('td');
        dotYearCell.className = 'year-column text-center text-muted';
        dotYearCell.textContent = '…';
        const dotArticleCell = document.createElement('td');
        dotArticleCell.className = 'article-column text-muted text-center fst-italic';
        dotArticleCell.textContent = '(過去に続く)';
        dotRow.appendChild(dotYearCell);
        dotRow.appendChild(dotArticleCell);
        tbody.appendChild(dotRow);
    }
    
    // 年ごとに行を生成
    yearsToDisplay.forEach(year => {
        const row = document.createElement('tr');
        row.id = `year-${year}`;
        
        // 年のセル
        const yearCell = document.createElement('td');
        yearCell.className = 'year-column fw-bold text-center';
        
        // 西暦と和暦を表示
        const yearDiv = document.createElement('div');
        yearDiv.textContent = year + '年';
        yearCell.appendChild(yearDiv);
        
        const eraDiv = document.createElement('div');
        eraDiv.className = 'text-muted small';
        eraDiv.textContent = getJapaneseEra(year);
        yearCell.appendChild(eraDiv);
        
        row.appendChild(yearCell);
        
        // Article列のセル
        const articleCell = document.createElement('td');
        articleCell.className = 'article-column';
        
        const items = groupedData[year];
        
        if (items && items.length > 0) {
            // 記事がある場合
            // Date列を基準にソート（currentSortNewestFirstに応じて昇順・降順を切り替え）
            const sortedItems = [...items].sort((a, b) => {
                // dateが空の場合は最後に配置
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                
                // dateを文字列として比較（YYYY-MM-DD形式を想定）
                if (currentSortNewestFirst) {
                    // 降順：新しい日付が上
                    return b.date.localeCompare(a.date);
                } else {
                    // 昇順：古い日付が上
                    return a.date.localeCompare(b.date);
                }
            });
            
            // 各アイテムを改行で表示
            sortedItems.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'article-item';
                
                const icon = CATEGORY_ICONS[item.category] || '';
                const abbr = CATEGORY_ABBREVIATIONS[item.category] || item.category;
                
                // カテゴリ略称（ボタンスタイル、アイコンを含む）
                const abbrBtn = document.createElement('button');
                abbrBtn.className = 'btn btn-outline-primary btn-sm category-abbr-btn';
                abbrBtn.style.cursor = 'pointer';
                abbrBtn.style.marginRight = '0.5rem';
                abbrBtn.setAttribute('title', `${item.category}のみ表示`);
                
                // アイコンと略称を含める
                abbrBtn.innerHTML = `${icon} ${abbr}`;
                
                abbrBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    selectSingleCategory(item.category);
                });
                itemDiv.appendChild(abbrBtn);
                
                // 記事内容
                if (item.link) {
                    const link = document.createElement('a');
                    link.href = item.link;
                    link.target = '_blank';
                    link.textContent = item.contents;
                    link.className = 'history-link';
                    itemDiv.appendChild(link);
                } else {
                    const text = document.createTextNode(item.contents);
                    itemDiv.appendChild(text);
                }
                
                articleCell.appendChild(itemDiv);
            });
        } else {
            // 記事がない場合は空のセルで背景色を薄い灰色に
            articleCell.classList.add('empty-year-cell');
        }
        
        row.appendChild(articleCell);
        tbody.appendChild(row);
    });
    
    // 最後に「...」行を追加（新→古の場合は過去に続きがある、古→新の場合は未来に続きがある）
    if (currentSortNewestFirst && hasYearsBeforeStart) {
        const dotRow = document.createElement('tr');
        dotRow.className = 'ellipsis-row';
        const dotYearCell = document.createElement('td');
        dotYearCell.className = 'year-column text-center text-muted';
        dotYearCell.textContent = '…';
        const dotArticleCell = document.createElement('td');
        dotArticleCell.className = 'article-column text-muted text-center fst-italic';
        dotArticleCell.textContent = '(過去に続く)';
        dotRow.appendChild(dotYearCell);
        dotRow.appendChild(dotArticleCell);
        tbody.appendChild(dotRow);
    } else if (!currentSortNewestFirst && hasYearsAfterEnd) {
        const dotRow = document.createElement('tr');
        dotRow.className = 'ellipsis-row';
        const dotYearCell = document.createElement('td');
        dotYearCell.className = 'year-column text-center text-muted';
        dotYearCell.textContent = '…';
        const dotArticleCell = document.createElement('td');
        dotArticleCell.className = 'article-column text-muted text-center fst-italic';
        dotArticleCell.textContent = '(未来に続く)';
        dotRow.appendChild(dotYearCell);
        dotRow.appendChild(dotArticleCell);
        tbody.appendChild(dotRow);
    }
    
    // ジャンプメニューを更新
    updateJumpMenu();
}

// ジャンプメニューの更新
function updateJumpMenu() {
    const jumpMenuList = document.getElementById('jumpMenuList');
    jumpMenuList.innerHTML = '';
    
    // ヘッダーへのジャンプ
    const headerItem = document.createElement('li');
    headerItem.innerHTML = '<a class="dropdown-item" href="#" onclick="window.scrollTo(0,0); return false;">ヘッダー</a>';
    jumpMenuList.appendChild(headerItem);
    
    // 区切り線
    const divider1 = document.createElement('li');
    divider1.innerHTML = '<hr class="dropdown-divider">';
    jumpMenuList.appendChild(divider1);
    
    // 記事が存在する年を収集
    const yearsWithData = new Set();
    historyData.forEach(item => {
        if (item.year >= currentStartYear && item.year <= currentEndYear) {
            // カテゴリフィルタを考慮
            if (currentCategoryFilters.length === 0) {
                return;
            }
            if (!currentCategoryFilters.includes(item.category)) {
                return;
            }
            yearsWithData.add(item.year);
        }
    });
    
    // 開始年を基準に5年単位でジャンプポイントを生成
    const jumpYears = [];
    const sortedYears = Array.from(yearsWithData).sort((a, b) => a - b);
    
    if (sortedYears.length > 0) {
        // 開始年から5年ごとにチェック
        for (let baseYear = currentStartYear; baseYear <= currentEndYear; baseYear += 5) {
            // この5年間に記事がある年を探す
            const yearInRange = sortedYears.find(y => y >= baseYear && y < baseYear + 5);
            if (yearInRange) {
                jumpYears.push(yearInRange);
            }
        }
    }
    
    // ソート順に応じて逆順にする
    if (currentSortNewestFirst) {
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
            scrollToYear(year);
        });
        yearItem.appendChild(link);
        jumpMenuList.appendChild(yearItem);
    });
    
    // 区切り線
    const divider2 = document.createElement('li');
    divider2.innerHTML = '<hr class="dropdown-divider">';
    jumpMenuList.appendChild(divider2);
    
    // フッターへのジャンプ
    const footerItem = document.createElement('li');
    footerItem.innerHTML = '<a class="dropdown-item" href="#footer">フッター</a>';
    jumpMenuList.appendChild(footerItem);
}

// 指定した年にスクロール
function scrollToYear(year) {
    const element = document.getElementById(`year-${year}`);
    if (element) {
        const headerHeight = document.getElementById('main-header').offsetHeight;
        const tableHeaderHeight = document.querySelector('.history-table thead').offsetHeight;
        const offset = headerHeight + tableHeaderHeight + 10;
        
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// 現在年を更新
function updateCurrentYear() {
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = MAX_YEAR;
    }
}

// 年表の範囲表示を更新
function updateYearRangeDisplay() {
    const displayElement = document.getElementById('year-range-display');
    if (!displayElement) return;
    
    displayElement.textContent = `表示期間 ${currentStartYear}〜${currentEndYear}年 (全${MIN_YEAR}〜${MAX_YEAR}年)`;
}

// ヘッダースクロール効果の初期化
function initHeaderScroll() {
    const header = document.getElementById('main-header');
    const normalHeader = header ? header.querySelector('.header-title-normal') : null;
    const compactHeader = header ? header.querySelector('.header-compact') : null;
    
    console.log('initHeaderScroll called (History)');
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
            
            // ヒステリシス実装：スクロール方向によって異なる閾値を使用
            const threshold = scrollingDown ? 60 : 40;
            
            console.log('updateHeader - scrollY:', currentScrollY, 'threshold:', threshold);
            
            if (currentScrollY > threshold) {
                header.classList.add('scrolled');
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
        console.error('Header elements not found! (History)');
    }
}

// フィルタ設定へスクロールする関数
function scrollToFilterSettings() {
    const filterSettings = document.getElementById('filterSettings');
    if (filterSettings) {
        const isOpen = filterSettings.classList.contains('show');
        
        if (!isOpen) {
            // 閉じている場合は開く
            const collapseElement = new bootstrap.Collapse(filterSettings, {
                show: true
            });
            
            // アコーディオンが開いた後にスクロール
            setTimeout(() => {
                const headerHeight = document.getElementById('main-header').offsetHeight;
                const elementPosition = filterSettings.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerHeight - 20; // 余白を追加
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }, 300); // アニメーション時間を考慮
        } else {
            // 既に開いている場合はスクロールのみ
            const headerHeight = document.getElementById('main-header').offsetHeight;
            const elementPosition = filterSettings.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerHeight - 20; // 余白を追加
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }
}

// タイトルクリックでスクロール機能

// 空白年表示の切り替え
function toggleEmptyYearDisplay() {
    currentShowEmptyYears = !currentShowEmptyYears;
    
    // ラジオボタンも更新
    if (currentShowEmptyYears) {
        document.getElementById('showEmptyYearsOn').checked = true;
    } else {
        document.getElementById('showEmptyYearsOff').checked = true;
    }
    
    // 年表を更新
    generateHistoryTable();
    updateHeaderIndicators();
    updateJumpMenu();
}

// ソート順の切り替え
function toggleSortOrder() {
    currentSortNewestFirst = !currentSortNewestFirst;
    
    // ラジオボタンも更新
    if (currentSortNewestFirst) {
        document.getElementById('sortNewestFirst').checked = true;
    } else {
        document.getElementById('sortOldestFirst').checked = true;
    }
    
    // 年表を更新
    generateHistoryTable();
    updateHeaderIndicators();
    updateJumpMenu();
}

// カテゴリアイコンのクリック処理
function handleCategoryIconClick(event) {
    const clickedText = event.target.textContent.trim();
    
    // クリックされたアイコンに対応するカテゴリを見つける
    let clickedCategory = null;
    for (const [category, icon] of Object.entries(CATEGORY_ICONS)) {
        if (icon === clickedText) {
            clickedCategory = category;
            break;
        }
    }
    
    if (clickedCategory && currentCategoryFilters.includes(clickedCategory)) {
        // そのカテゴリをフィルタから除外
        currentCategoryFilters = currentCategoryFilters.filter(cat => cat !== clickedCategory);
        
        // フィルタ設定も更新
        document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
            if (checkbox.dataset.category === clickedCategory) {
                checkbox.checked = false;
            }
        });
        
        // 年表を更新
        generateHistoryTable();
        updateSelectedCategoryIcons();
        updateJumpMenu();
    }
}

// 見出しインジケーターを更新
function updateHeaderIndicators() {
    const emptyYearIndicator = document.getElementById('emptyYearIndicator');
    const sortOrderIndicator = document.getElementById('sortOrderIndicator');
    
    if (emptyYearIndicator) {
        emptyYearIndicator.textContent = currentShowEmptyYears ? '[+]' : '[-]';
    }
    
    if (sortOrderIndicator) {
        sortOrderIndicator.textContent = currentSortNewestFirst ? '▼' : '▲';
    }
}