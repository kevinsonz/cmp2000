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
    'CMP2000': '📁',
    'けびんケビンソン': '👤',
    'イイダリョウ': '💻',
    'その他': '📌'
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
let currentCategoryFilters = []; // 適用済みのフィルター（空=すべて表示）
let temporaryCategoryFilters = []; // 一時的な選択状態（適用前）

// 環境判定
const isLocalMode = window.location.protocol === 'file:' || (typeof HISTORY_DATA !== 'undefined');

// 初期化処理
if (isLocalMode && typeof HISTORY_DATA !== 'undefined') {
    console.log('ローカルモードで実行中（History）');
    historyData = parseHistoryCSV(HISTORY_DATA.HISTORY_CSV);
    initializePage();
} else {
    console.log('オンラインモードで実行中（History）');
    fetch(PUBLIC_HISTORY_CSV_URL)
        .then(response => response.text())
        .then(csvText => {
            historyData = parseHistoryCSV(csvText);
            initializePage();
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
    // スライダーの最大値を現在年に設定
    document.getElementById('startYearSlider').max = MAX_YEAR;
    document.getElementById('endYearSlider').max = MAX_YEAR;
    
    // スライダーの初期値を設定
    document.getElementById('startYearSlider').value = currentStartYear;
    document.getElementById('endYearSlider').value = currentEndYear;
    
    // スライダーの表示を更新
    updateYearDisplay();
    updateYearRangeLabel();
    
    // イベントリスナーの設定
    document.getElementById('startYearSlider').addEventListener('input', updateYearDisplay);
    document.getElementById('endYearSlider').addEventListener('input', updateYearDisplay);
    document.getElementById('applyYearRange').addEventListener('click', applyYearRange);
    document.getElementById('resetYearRange').addEventListener('click', resetYearRange);
    
    // 「すべて表示」ボタンのイベントリスナー
    document.getElementById('showAllBtn').addEventListener('click', showAllCategories);
    
    // 「適用」ボタンのイベントリスナー
    document.getElementById('applyCategoryFilter').addEventListener('click', applyCategoryFilter);
    
    // カテゴリフィルターボタンのイベントリスナー
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            toggleTemporaryCategoryFilter(category);
        });
    });
    
    // 折り畳みボタンのイベントリスナー
    const yearRangeCollapse = document.getElementById('yearRangeCollapse');
    const categoryFilterCollapse = document.getElementById('categoryFilterCollapse');
    
    yearRangeCollapse.addEventListener('shown.bs.collapse', function() {
        document.getElementById('yearRangeIcon').textContent = '－';
    });
    yearRangeCollapse.addEventListener('hidden.bs.collapse', function() {
        document.getElementById('yearRangeIcon').textContent = '＋';
    });
    
    categoryFilterCollapse.addEventListener('shown.bs.collapse', function() {
        document.getElementById('categoryFilterIcon').textContent = '－';
        // 開いたときに一時選択状態を現在の適用済み状態に同期
        temporaryCategoryFilters = [...currentCategoryFilters];
        updateCategoryButtonStates();
    });
    categoryFilterCollapse.addEventListener('hidden.bs.collapse', function() {
        document.getElementById('categoryFilterIcon').textContent = '＋';
    });
    
    // 初回テーブル生成
    generateHistoryTable();
    
    // その他の初期化
    updateCurrentYear();
    initHeaderScroll();
}

// 年表示の更新
function updateYearDisplay() {
    const startYear = parseInt(document.getElementById('startYearSlider').value);
    const endYear = parseInt(document.getElementById('endYearSlider').value);
    
    document.getElementById('startYearDisplay').textContent = startYear + '年';
    document.getElementById('endYearDisplay').textContent = endYear + '年';
}

// 年範囲ラベルの更新
function updateYearRangeLabel() {
    document.getElementById('yearRangeLabel').textContent = 
        `表示期間の設定 (${currentStartYear}年 ～ ${currentEndYear}年)`;
}

// 年範囲の適用
function applyYearRange() {
    const startYear = parseInt(document.getElementById('startYearSlider').value);
    const endYear = parseInt(document.getElementById('endYearSlider').value);
    
    if (startYear > endYear) {
        alert('開始年は終了年より前に設定してください。');
        return;
    }
    
    currentStartYear = startYear;
    currentEndYear = endYear;
    
    updateYearRangeLabel();
    generateHistoryTable();
    updateJumpMenu();
    
    // 折り畳む
    const yearRangeCollapse = bootstrap.Collapse.getInstance(document.getElementById('yearRangeCollapse'));
    if (yearRangeCollapse) {
        yearRangeCollapse.hide();
    }
}

// 年範囲のリセット
function resetYearRange() {
    currentStartYear = MAX_YEAR - DEFAULT_YEAR_RANGE;
    currentEndYear = MAX_YEAR;
    
    document.getElementById('startYearSlider').value = currentStartYear;
    document.getElementById('endYearSlider').value = currentEndYear;
    
    updateYearDisplay();
    updateYearRangeLabel();
    generateHistoryTable();
    updateJumpMenu();
    
    // 折り畳む
    const yearRangeCollapse = bootstrap.Collapse.getInstance(document.getElementById('yearRangeCollapse'));
    if (yearRangeCollapse) {
        yearRangeCollapse.hide();
    }
}

// すべて表示
function showAllCategories() {
    currentCategoryFilters = [];
    temporaryCategoryFilters = [];
    
    // ボタンのアクティブ状態をすべて解除
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // ラベルを更新
    updateCategoryFilterLabel();
    
    // テーブルを再生成
    generateHistoryTable();
    
    // 折り畳む
    const categoryFilterCollapse = bootstrap.Collapse.getInstance(document.getElementById('categoryFilterCollapse'));
    if (categoryFilterCollapse) {
        categoryFilterCollapse.hide();
    }
}

// 一時的なカテゴリフィルターのトグル（複数選択対応、まだ適用しない）
function toggleTemporaryCategoryFilter(category) {
    const index = temporaryCategoryFilters.indexOf(category);
    
    if (index === -1) {
        // カテゴリを追加
        temporaryCategoryFilters.push(category);
    } else {
        // カテゴリを削除
        temporaryCategoryFilters.splice(index, 1);
    }
    
    // ボタンのアクティブ状態を更新（一時的な選択状態に基づく）
    updateCategoryButtonStates();
}

// カテゴリフィルターを適用
function applyCategoryFilter() {
    // 一時選択を実際のフィルターに反映
    currentCategoryFilters = [...temporaryCategoryFilters];
    
    // ラベルを更新
    updateCategoryFilterLabel();
    
    // テーブルを再生成
    generateHistoryTable();
    
    // 折り畳む
    const categoryFilterCollapse = bootstrap.Collapse.getInstance(document.getElementById('categoryFilterCollapse'));
    if (categoryFilterCollapse) {
        categoryFilterCollapse.hide();
    }
}

// カテゴリを単一選択（アイコンクリック時用）
function selectSingleCategory(category) {
    currentCategoryFilters = [category];
    temporaryCategoryFilters = [category];
    
    // ボタンのアクティブ状態を更新
    updateCategoryButtonStates();
    
    // ラベルを更新
    updateCategoryFilterLabel();
    
    // テーブルを再生成
    generateHistoryTable();
}

// カテゴリボタンのアクティブ状態を更新（一時選択状態に基づく）
function updateCategoryButtonStates() {
    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        const category = btn.getAttribute('data-category');
        if (temporaryCategoryFilters.includes(category)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// カテゴリフィルターラベルの更新（適用済みフィルターに基づく）
function updateCategoryFilterLabel() {
    let labelText = '';
    
    if (currentCategoryFilters.length === 0) {
        labelText = 'カテゴリフィルター (すべて表示中)';
    } else if (currentCategoryFilters.length === 1) {
        const icon = CATEGORY_ICONS[currentCategoryFilters[0]] || '';
        labelText = `カテゴリフィルター (${icon} ${currentCategoryFilters[0]})`;
    } else {
        const icons = currentCategoryFilters.map(cat => CATEGORY_ICONS[cat] || '').join(' ');
        labelText = `カテゴリフィルター (${icons} ${currentCategoryFilters.length}件選択中)`;
    }
    
    document.getElementById('categoryFilterLabel').textContent = labelText;
}

// 年表テーブル生成（2列形式）
function generateHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    
    // データを年とカテゴリでグループ化
    const groupedData = {};
    
    historyData.forEach(item => {
        if (item.year >= currentStartYear && item.year <= currentEndYear) {
            // カテゴリフィルターを適用
            if (currentCategoryFilters.length > 0 && !currentCategoryFilters.includes(item.category)) {
                return;
            }
            
            if (!groupedData[item.year]) {
                groupedData[item.year] = [];
            }
            groupedData[item.year].push(item);
        }
    });
    
    // 年を昇順でソート
    const years = Object.keys(groupedData).map(y => parseInt(y)).sort((a, b) => a - b);
    
    // テーブル行を生成
    years.forEach(year => {
        const row = document.createElement('tr');
        row.id = `year-${year}`;
        
        // 年のセル
        const yearCell = document.createElement('td');
        yearCell.className = 'year-column monospace-font fw-bold text-center';
        yearCell.textContent = year + '年';
        row.appendChild(yearCell);
        
        // Article列のセル
        const articleCell = document.createElement('td');
        articleCell.className = 'article-column monospace-font';
        
        const items = groupedData[year];
        
        // カテゴリ順でソート
        items.sort((a, b) => {
            return CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category);
        });
        
        // 各アイテムを「｜」で区切って表示
        const articleText = items.map(item => {
            const icon = CATEGORY_ICONS[item.category] || '';
            const iconSpan = document.createElement('span');
            iconSpan.textContent = icon;
            iconSpan.className = 'category-icon clickable';
            iconSpan.style.cursor = 'pointer';
            iconSpan.setAttribute('data-category', item.category);
            iconSpan.setAttribute('title', `${item.category}のみ表示`);
            iconSpan.addEventListener('click', function(e) {
                e.preventDefault();
                selectSingleCategory(item.category);
            });
            
            const wrapper = document.createElement('span');
            wrapper.appendChild(iconSpan);
            
            if (item.link) {
                const link = document.createElement('a');
                link.href = item.link;
                link.target = '_blank';
                link.textContent = item.contents;
                link.className = 'history-link';
                wrapper.appendChild(link);
            } else {
                const text = document.createTextNode(item.contents);
                wrapper.appendChild(text);
            }
            
            return wrapper;
        });
        
        // 各アイテムを「｜」で区切って追加
        articleText.forEach((itemElement, index) => {
            articleCell.appendChild(itemElement);
            if (index < articleText.length - 1) {
                const separator = document.createElement('span');
                separator.textContent = ' ｜ ';
                separator.className = 'separator';
                articleCell.appendChild(separator);
            }
        });
        
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
    
    // 5年刻みのジャンプポイントを生成
    const jumpYears = [];
    
    // 開始年から5年刻みで追加
    let currentJumpYear = Math.ceil(currentStartYear / 5) * 5;
    
    while (currentJumpYear <= currentEndYear) {
        // 表示範囲内の年のみ追加
        if (currentJumpYear >= currentStartYear) {
            jumpYears.push(currentJumpYear);
        }
        currentJumpYear += 5;
    }
    
    // 終了年が5の倍数でない場合、終了年も追加
    if (currentEndYear % 5 !== 0 && jumpYears[jumpYears.length - 1] !== currentEndYear) {
        jumpYears.push(currentEndYear);
    }
    
    // ジャンプメニューに追加
    jumpYears.forEach(year => {
        const yearItem = document.createElement('li');
        yearItem.innerHTML = `<a class="dropdown-item" href="#year-${year}">${year}年</a>`;
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
