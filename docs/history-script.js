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
    
    // イベントリスナーの設定
    document.getElementById('startYearSlider').addEventListener('input', updateYearDisplay);
    document.getElementById('endYearSlider').addEventListener('input', updateYearDisplay);
    document.getElementById('applyYearRange').addEventListener('click', applyYearRange);
    document.getElementById('resetYearRange').addEventListener('click', resetYearRange);
    
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
    
    generateHistoryTable();
    updateJumpMenu();
}

// 年範囲のリセット
function resetYearRange() {
    currentStartYear = MAX_YEAR - DEFAULT_YEAR_RANGE;
    currentEndYear = MAX_YEAR;
    
    document.getElementById('startYearSlider').value = currentStartYear;
    document.getElementById('endYearSlider').value = currentEndYear;
    
    updateYearDisplay();
    generateHistoryTable();
    updateJumpMenu();
}

// 年表テーブル生成
function generateHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    
    // データを年とカテゴリでグループ化
    const groupedData = {};
    
    historyData.forEach(item => {
        if (item.year >= currentStartYear && item.year <= currentEndYear) {
            if (!groupedData[item.year]) {
                groupedData[item.year] = {};
                CATEGORIES.forEach(cat => {
                    groupedData[item.year][cat] = [];
                });
            }
            groupedData[item.year][item.category].push(item);
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
        yearCell.className = 'year-column fw-bold text-center';
        yearCell.textContent = year + '年';
        row.appendChild(yearCell);
        
        // 各カテゴリのセル
        CATEGORIES.forEach(category => {
            const cell = document.createElement('td');
            const items = groupedData[year][category];
            
            if (items.length > 0) {
                const ul = document.createElement('ul');
                ul.className = 'history-list';
                
                items.forEach(item => {
                    const li = document.createElement('li');
                    
                    if (item.link) {
                        const link = document.createElement('a');
                        link.href = item.link;
                        link.target = '_blank';
                        link.textContent = item.contents;
                        link.className = 'history-link';
                        li.appendChild(link);
                    } else {
                        li.textContent = item.contents;
                    }
                    
                    ul.appendChild(li);
                });
                
                cell.appendChild(ul);
            } else {
                // 空のセルにクラスを追加
                cell.className = 'empty-cell';
            }
            
            row.appendChild(cell);
        });
        
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
