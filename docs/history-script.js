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
let currentCategoryFilters = null; // 適用済みのフィルター（null=すべて表示、空配列=何も表示しない）
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
    
    // 「全て選択」ボタンのイベントリスナー
    document.getElementById('selectAllCategoriesBtn').addEventListener('click', selectAllCategories);
    
    // 「全て解除」ボタンのイベントリスナー
    document.getElementById('deselectAllCategoriesBtn').addEventListener('click', deselectAllCategories);
    
    // チェックボックスのイベントリスナー
    document.querySelectorAll('.category-filter-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
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
        if (currentCategoryFilters === null) {
            temporaryCategoryFilters = [...CATEGORIES];
        } else {
            temporaryCategoryFilters = [...currentCategoryFilters];
        }
        updateCheckboxStates();
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
    currentCategoryFilters = null; // nullは全て表示を意味する
    temporaryCategoryFilters = [];
    
    // チェックボックスをすべて解除
    document.querySelectorAll('.category-filter-checkbox').forEach(checkbox => {
        checkbox.checked = false;
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

// 全て選択（一時選択のみ、適用しない）
function selectAllCategories() {
    temporaryCategoryFilters = [...CATEGORIES];
    updateCheckboxStates();
}

// 全て解除（一時選択のみ、適用しない）
function deselectAllCategories() {
    temporaryCategoryFilters = [];
    updateCheckboxStates();
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

// カテゴリを単一選択（カテゴリ略称クリック時用）
function selectSingleCategory(category) {
    currentCategoryFilters = [category];
    temporaryCategoryFilters = [category];
    
    // チェックボックスの状態を更新
    updateCheckboxStates();
    
    // ラベルを更新
    updateCategoryFilterLabel();
    
    // テーブルを再生成
    generateHistoryTable();
}

// チェックボックスの状態を更新（一時選択状態に基づく）
function updateCheckboxStates() {
    document.querySelectorAll('.category-filter-checkbox').forEach(checkbox => {
        const category = checkbox.getAttribute('data-category');
        checkbox.checked = temporaryCategoryFilters.includes(category);
    });
}

// カテゴリフィルターラベルの更新（適用済みフィルターに基づく）
function updateCategoryFilterLabel() {
    let labelText = '';
    
    if (currentCategoryFilters === null) {
        labelText = 'カテゴリフィルター (すべて表示中)';
    } else if (currentCategoryFilters.length === 0) {
        labelText = 'カテゴリフィルター (何も選択されていません)';
    } else if (currentCategoryFilters.length === 1) {
        const icon = CATEGORY_ICONS[currentCategoryFilters[0]] || '';
        labelText = `カテゴリフィルター (${icon} ${currentCategoryFilters[0]})`;
    } else {
        const icons = currentCategoryFilters.map(cat => CATEGORY_ICONS[cat] || '').join(' ');
        labelText = `カテゴリフィルター (${icons} ${currentCategoryFilters.length}件選択中)`;
    }
    
    document.getElementById('categoryFilterLabel').textContent = labelText;
}

// 年表テーブル生成（改行スタイル、記事がない年も表示）
function generateHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    
    // データを年とカテゴリでグループ化
    const groupedData = {};
    
    historyData.forEach(item => {
        if (item.year >= currentStartYear && item.year <= currentEndYear) {
            // カテゴリフィルターを適用
            if (currentCategoryFilters !== null) {
                if (currentCategoryFilters.length === 0) {
                    // 空配列の場合は何も表示しない
                    return;
                }
                if (!currentCategoryFilters.includes(item.category)) {
                    // 選択されていないカテゴリはスキップ
                    return;
                }
            }
            
            if (!groupedData[item.year]) {
                groupedData[item.year] = [];
            }
            groupedData[item.year].push(item);
        }
    });
    
    // 表示範囲の全ての年を生成（記事がない年も含む）
    for (let year = currentStartYear; year <= currentEndYear; year++) {
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
            
            // 各アイテムを改行で表示
            items.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'article-item';
                
                const icon = CATEGORY_ICONS[item.category] || '';
                const abbr = CATEGORY_ABBREVIATIONS[item.category] || item.category;
                
                // アイコン
                const iconSpan = document.createElement('span');
                iconSpan.textContent = icon;
                iconSpan.className = 'category-icon';
                itemDiv.appendChild(iconSpan);
                
                // カテゴリ略称（ボタンスタイル）
                const abbrBtn = document.createElement('span');
                abbrBtn.textContent = abbr;
                abbrBtn.className = 'btn btn-outline-primary btn-sm category-abbr-btn';
                abbrBtn.style.cursor = 'pointer';
                abbrBtn.style.marginLeft = '0.25rem';
                abbrBtn.style.marginRight = '0.5rem';
                abbrBtn.setAttribute('title', `${item.category}のみ表示`);
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
    }
    
    // ジャンプメニューを更新
    updateJumpMenu();
}

// ジャンプメニューの更新（記事が存在する年を対象、開始年から5年単位）
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
            if (currentCategoryFilters !== null) {
                if (currentCategoryFilters.length === 0) {
                    return;
                }
                if (!currentCategoryFilters.includes(item.category)) {
                    return;
                }
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

// 指定した年にスクロール（年の頭の文字が見える位置）
function scrollToYear(year) {
    const element = document.getElementById(`year-${year}`);
    if (element) {
        const headerHeight = document.getElementById('main-header').offsetHeight;
        const tableHeaderHeight = document.querySelector('.history-table thead').offsetHeight;
        const offset = headerHeight + tableHeaderHeight + 10; // 余裕を持たせる
        
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