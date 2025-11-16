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

// フィルター設定の一時保存用
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

// CSV解析関数
function parseHistoryCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const yearIndex = headers.indexOf('Year');
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
                category: values[categoryIndex],
                contents: values[contentsIndex],
                link: values[linkIndex] || ''
            });
        }
    }
    
    return items;
}

// ページ初期化
function initializePage() {
    console.log('initializePage called');
    
    // 年の入力フィールドの設定
    const startYearInput = document.getElementById('startYearInput');
    const endYearInput = document.getElementById('endYearInput');
    
    if (startYearInput && endYearInput) {
        startYearInput.min = MIN_YEAR;
        startYearInput.max = MAX_YEAR;
        startYearInput.value = currentStartYear;
        
        endYearInput.min = MIN_YEAR;
        endYearInput.max = MAX_YEAR;
        endYearInput.value = currentEndYear;
    }
    
    // カテゴリーフィルターリストを生成
    generateCategoryFilterList();
    
    // 「すべて表示」ボタンのイベントリスナー
    document.getElementById('showAllBtn').addEventListener('click', showAllCategories);
    
    // フィルター設定内の「全選択」「全解除」ボタン
    document.getElementById('filterSelectAllBtn').addEventListener('click', selectAllInFilter);
    document.getElementById('filterDeselectAllBtn').addEventListener('click', deselectAllInFilter);
    
    // 「適用」「キャンセル」ボタン
    document.getElementById('filterApplyBtn').addEventListener('click', applyFilter);
    document.getElementById('filterCancelBtn').addEventListener('click', cancelFilter);
    
    // 初回テーブル生成
    generateHistoryTable();
    
    // 選択中アイコンの表示を更新
    updateSelectedCategoryIcons();
    
    // その他の初期化
    updateCurrentYear();
    initHeaderScroll();
    initHeaderTitleClick();
}

// カテゴリーフィルターリストを生成
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

// フィルター設定内の「全選択」
function selectAllInFilter() {
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });
}

// フィルター設定内の「全解除」
function deselectAllInFilter() {
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
}

// 「適用」ボタン
function applyFilter() {
    // 年の範囲を取得
    const startYearInput = document.getElementById('startYearInput');
    const endYearInput = document.getElementById('endYearInput');
    
    let startYear = parseInt(startYearInput.value);
    let endYear = parseInt(endYearInput.value);
    
    // バリデーション
    if (isNaN(startYear) || startYear < MIN_YEAR || startYear > MAX_YEAR) {
        startYear = MIN_YEAR;
        startYearInput.value = startYear;
    }
    if (isNaN(endYear) || endYear < MIN_YEAR || endYear > MAX_YEAR) {
        endYear = MAX_YEAR;
        endYearInput.value = endYear;
    }
    if (startYear > endYear) {
        const temp = startYear;
        startYear = endYear;
        endYear = temp;
        startYearInput.value = startYear;
        endYearInput.value = endYear;
    }
    
    // カテゴリーフィルターを取得
    const selectedCategories = [];
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        if (checkbox.checked) {
            selectedCategories.push(checkbox.dataset.category);
        }
    });
    
    // 表示オプションを取得
    const showEmptyYears = document.getElementById('showEmptyYearsCheck').checked;
    const sortNewestFirst = document.getElementById('sortNewestFirstCheck').checked;
    
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
    // 入力フィールドを現在の設定に戻す
    document.getElementById('startYearInput').value = currentStartYear;
    document.getElementById('endYearInput').value = currentEndYear;
    document.getElementById('showEmptyYearsCheck').checked = currentShowEmptyYears;
    document.getElementById('sortNewestFirstCheck').checked = currentSortNewestFirst;
    
    // カテゴリーチェックボックスを現在の設定に戻す
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = currentCategoryFilters.includes(checkbox.dataset.category);
    });
    
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
    
    // フィルター設定も更新
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = true;
    });
    
    // 年表を更新
    generateHistoryTable();
    updateSelectedCategoryIcons();
    updateJumpMenu();
}

// 単一カテゴリーを選択
function selectSingleCategory(category) {
    currentCategoryFilters = [category];
    
    // フィルター設定も更新
    document.querySelectorAll('.filter-category-checkbox').forEach(checkbox => {
        checkbox.checked = checkbox.dataset.category === category;
    });
    
    // 年表を更新
    generateHistoryTable();
    updateSelectedCategoryIcons();
    updateJumpMenu();
}

// 選択中カテゴリーアイコンを更新
function updateSelectedCategoryIcons() {
    const container = document.getElementById('selectedCategoryIcons');
    if (!container) return;
    
    if (currentCategoryFilters.length === 0) {
        container.textContent = '(フィルタなし)';
    } else {
        // カテゴリの順序を維持してアイコンを表示
        const icons = CATEGORIES
            .filter(cat => currentCategoryFilters.includes(cat))
            .map(cat => CATEGORY_ICONS[cat] || '')
            .join(' ');
        container.textContent = icons;
    }
}

// 年表テーブル生成
function generateHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    
    // データを年とカテゴリでグループ化
    const groupedData = {};
    
    historyData.forEach(item => {
        if (item.year >= currentStartYear && item.year <= currentEndYear) {
            // カテゴリフィルターを適用
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
    
    // 年ごとに行を生成
    yearsToDisplay.forEach(year => {
        const row = document.createElement('tr');
        row.id = `year-${year}`;
        
        // 年のセル
        const yearCell = document.createElement('td');
        yearCell.className = 'year-column fw-bold text-center';
        yearCell.textContent = year + '年';
        row.appendChild(yearCell);
        
        // Article列のセル
        const articleCell = document.createElement('td');
        articleCell.className = 'article-column';
        
        const items = groupedData[year];
        
        if (items && items.length > 0) {
            // 記事がある場合
            // カテゴリ順でソート
            items.sort((a, b) => {
                return CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category);
            });
            
            // 年内の記事の並び順を設定
            if (currentSortNewestFirst) {
                // 新→古なので、カテゴリ順のままでOK（データは既に新→古の順）
            } else {
                // 古→新なので、逆順にする
                items.reverse();
            }
            
            // 各アイテムを改行で表示
            items.forEach((item, index) => {
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
            // カテゴリフィルターを考慮
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

// ヘッダースクロール効果の初期化
function initHeaderScroll() {
    const header = document.getElementById('main-header');
    
    if (header) {
        let ticking = false;
        
        const updateHeader = () => {
            if (window.scrollY > 50 || window.pageYOffset > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            ticking = false;
        };
        
        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateHeader);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', onScroll, { passive: true });
        updateHeader();
    }
}

// タイトルクリックでスクロール機能
function initHeaderTitleClick() {
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
