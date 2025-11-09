const multiMaxLength = 20;
const singleMaxLength = 10;

// NEW!!バッジを表示する日数（変更可能なパラメータ）
const NEW_BADGE_DAYS = 30;

// 公開スプレッドシートのCSV URL
const PUBLIC_BASIC_INFO_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=0&single=true&output=csv';
const PUBLIC_MULTI_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=195059601&single=true&output=csv';
const PUBLIC_SINGLE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=900915820&single=true&output=csv';
const PUBLIC_CONTRIBUTION_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=928202728&single=true&output=csv';

// 環境判定：file://プロトコルまたはTEST_DATAが存在する場合はローカルモード
const isLocalMode = window.location.protocol === 'file:' || (typeof TEST_DATA !== 'undefined');

if (isLocalMode && typeof TEST_DATA !== 'undefined') {
    console.log('ローカルモードで実行中（test-data.js使用）');
    const basicInfo = parseBasicInfoCSV(TEST_DATA.BASIC_INFO_CSV);
    const multiData = parseMultiCSV(TEST_DATA.MULTI_CSV);
    const singleData = parseSingleCSV(TEST_DATA.SINGLE_CSV);
    const contributionData = parseContributionCSV(TEST_DATA.CONTRIBUTION_CSV);
    generateCards(basicInfo, singleData);
    loadFeeds(multiData, singleData);
    generateContributionGraph(contributionData);
} else {
    console.log('オンラインモードで実行中（公開CSV使用）');
    Promise.all([
        fetch(PUBLIC_BASIC_INFO_CSV_URL).then(response => response.text()),
        fetch(PUBLIC_MULTI_CSV_URL).then(response => response.text()),
        fetch(PUBLIC_SINGLE_CSV_URL).then(response => response.text()),
        fetch(PUBLIC_CONTRIBUTION_CSV_URL).then(response => response.text())
    ])
    .then(([basicInfoCsvText, multiCsvText, singleCsvText, contributionCsvText]) => {
        const basicInfo = parseBasicInfoCSV(basicInfoCsvText);
        const multiData = parseMultiCSV(multiCsvText);
        const singleData = parseSingleCSV(singleCsvText);
        const contributionData = parseContributionCSV(contributionCsvText);
        generateCards(basicInfo, singleData);
        loadFeeds(multiData, singleData);
        generateContributionGraph(contributionData);
    })
    .catch(error => {
        console.error('公開CSVの読み込みに失敗しました:', error);
    });
}

// CSV解析関数（基本情報用：key,category,siteTitle,breadcrumbs,siteUrl,image,sub-image,logo）
function parseBasicInfoCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const keyIndex = headers.indexOf('key');
    const categoryIndex = headers.indexOf('category');
    const siteTitleIndex = headers.indexOf('siteTitle');
    const breadcrumbsIndex = headers.indexOf('breadcrumbs');
    const siteUrlIndex = headers.indexOf('siteUrl');
    const imageIndex = headers.indexOf('image');
    const subImageIndex = headers.indexOf('sub-image');
    const logoIndex = headers.indexOf('logo');
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        // cmp2000は除外
        if (values[keyIndex] === 'cmp2000') continue;
        
        if (values[keyIndex] && values[categoryIndex] && 
            values[siteTitleIndex] && values[breadcrumbsIndex] && values[siteUrlIndex]) {
            items.push({
                key: values[keyIndex],
                category: values[categoryIndex],
                siteTitle: values[siteTitleIndex],
                breadcrumbs: values[breadcrumbsIndex],
                siteUrl: values[siteUrlIndex],
                image: values[imageIndex] || '',
                subImage: values[subImageIndex] || '',  // sub-imageフィールド追加
                logo: values[logoIndex] || ''
            });
        }
    }
    
    return items;
}

// CSV解析関数（multi用：key,breadcrumbs,siteUrl,title,link,date）
function parseMultiCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const keyIndex = headers.indexOf('key');
    const breadcrumbsIndex = headers.indexOf('breadcrumbs');
    const siteUrlIndex = headers.indexOf('siteUrl');
    const titleIndex = headers.indexOf('title');
    const linkIndex = headers.indexOf('link');
    const dateIndex = headers.indexOf('date');
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        // 必須フィールド（key, breadcrumbs, siteUrl, title, date）が埋まっているかチェック
        // linkは空白でも可（オプション）
        if (values[keyIndex] && values[breadcrumbsIndex] && values[siteUrlIndex] && 
            values[titleIndex] && values[dateIndex]) {
            items.push({
                key: values[keyIndex],
                breadcrumbs: values[breadcrumbsIndex],
                siteUrl: values[siteUrlIndex],
                title: values[titleIndex],
                link: values[linkIndex] || '',  // 空白の場合は空文字列
                pubDate: values[dateIndex]
            });
        }
    }
    
    return items;
}

// CSV解析関数（single用：key,title,link,date）
function parseSingleCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const keyIndex = headers.indexOf('key');
    const titleIndex = headers.indexOf('title');
    const linkIndex = headers.indexOf('link');
    const dateIndex = headers.indexOf('date');
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        // keyとtitleのみ必須、linkとdateは空白OK
        if (values[keyIndex] && values[titleIndex]) {
            items.push({
                key: values[keyIndex],
                title: values[titleIndex],
                link: values[linkIndex] || '',  // 空白の場合は空文字列
                pubDate: values[dateIndex] || ''  // 空白の場合は空文字列
            });
        }
    }
    
    return items;
}

// CSV解析関数（contribution用：date,count）
function parseContributionCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const dateIndex = headers.indexOf('date');
    const countIndex = headers.indexOf('count');
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values[dateIndex] && values[countIndex]) {
            items.push({
                date: values[dateIndex],
                count: parseInt(values[countIndex], 10) || 0
            });
        }
    }
    
    return items;
}

// カード自動生成関数
function generateCards(basicInfo, singleData) {
    // categoryごとにグループ化
    const groupedByCategory = {};
    basicInfo.forEach(item => {
        if (!groupedByCategory[item.category]) {
            groupedByCategory[item.category] = [];
        }
        groupedByCategory[item.category].push(item);
    });
    
    // keyごとにsingleDataをグループ化
    const singleDataByKey = {};
    singleData.forEach(item => {
        if (!singleDataByKey[item.key]) {
            singleDataByKey[item.key] = [];
        }
        singleDataByKey[item.key].push(item);
    });
    
    // 最新記事がNEW!!対象かを判定する関数
    function isNewArticle(key) {
        const articles = singleDataByKey[key];
        if (!articles || articles.length === 0) return false;
        
        // 最新の記事（最初の記事）の日付を取得
        const latestArticle = articles[0];
        const articleDate = new Date(latestArticle.pubDate);
        const today = new Date();
        const diffTime = today - articleDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= NEW_BADGE_DAYS;
    }
    
    // containerを探す
    const container = document.getElementById('card-content-container');
    if (!container) return;
    
    // 各categoryごとにセクションとカードを生成
    Object.entries(groupedByCategory).forEach(([category, items]) => {
        // セクションタイトル
        const sectionTitle = document.createElement('h3');
        sectionTitle.className = 'section-title';
        sectionTitle.textContent = category;
        container.appendChild(sectionTitle);
        
        // カードコンテナ
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';
        
        // 各サイトのカードを生成
        items.forEach(site => {
            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'card-wrapper';
            
            // NEW!!バッジのHTML（条件に合う場合のみ表示）
            const newBadgeHtml = isNewArticle(site.key) 
                ? '<span class="badge bg-danger new-badge">New!!</span>' 
                : '';
            
            // sub-imageがある場合の表示HTML
            const subImageHtml = site.subImage 
                ? `<img src="${site.subImage}" alt="sub-image" class="card-sub-image">` 
                : '';
            
            cardWrapper.innerHTML = `
                <div class="card">
                    <a href="${site.siteUrl}" target="_blank" style="position: relative; overflow: hidden; height: 200px; display: block; text-decoration: none;">
                        <img src="${site.image}" class="card-img-top" alt="${site.siteTitle}" style="width: 100%; height: 100%; object-fit: cover;">
                        ${newBadgeHtml}
                        ${subImageHtml}
                        <img src="${site.logo}" alt="logo" style="position: absolute; top: 8px; right: 8px; width: 60px; height: auto; max-width: 30%; object-fit: contain;">
                    </a>
                    <div class="card-body">
                        <h5 class="card-title">${site.siteTitle}</h5>
                        <p class="card-text">
                            <div id="single-rss-feed-container-${site.key}" class="rss-feed-container text-start"></div>
                        </p>
                        <a href="${site.siteUrl}" class="btn btn-primary" target="_blank">Go to Site</a>
                    </div>
                </div>
            `;
            cardContainer.appendChild(cardWrapper);
        });
        
        container.appendChild(cardContainer);
        
        // セクションにIDを追加（ジャンプ用）
        if (category === '共通コンテンツ') {
            sectionTitle.id = 'common';
        } else if (category === 'けびんケビンソン') {
            sectionTitle.id = 'kevin';
        } else if (category === 'イイダリョウ') {
            sectionTitle.id = 'ryo';
        }
        
        // 区切り線
        const hr = document.createElement('hr');
        container.appendChild(hr);
    });
}

function loadFeeds(multiData, singleData) {
    // ========================
    // 複数サイトフィード（multi）の表示
    // ========================
    const multiContainer = document.getElementById('multi-rss-feed-container');
    
    if (multiContainer) {
        // 上位件数のみ表示（CSVで既にソート済みだが念のため）
        multiData.slice(0, multiMaxLength).forEach(item => {
            // 日付が空白の場合はスキップ
            if (!item.pubDate) return;
            
            const date = new Date(item.pubDate);
            const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
            const articleElement = document.createElement('div');
            
            // タイトル部分（linkが空白かどうかで分岐）
            let titleSpan = '';
            if (item.link) {
                // リンクあり
                titleSpan = `<a href="${item.link}" target="_blank">
                    <span style="line-height: 1.25; margin-bottom: 0.25rem; display: inline-block; width: 30rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; vertical-align: middle;">${item.title}</span>
                </a>`;
            } else {
                // リンクなし（テキストのみ）
                titleSpan = `<span style="line-height: 1.25; margin-bottom: 0.25rem; display: inline-block; width: 30rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; vertical-align: middle;">${item.title}</span>`;
            }
            
            articleElement.innerHTML = `
            <p style="margin-bottom: 0.25rem">
                <span style="display: inline-block; width: 15rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; vertical-align: middle;">
                    <a href="${item.siteUrl}" target="_blank"><strong>${item.breadcrumbs}</strong></a>
                </span>
                <span style="display: inline-block; width: 7.5rem; vertical-align: middle;">
                     - ${formattedDate} 
                </span>
                <span style="vertical-align: middle;">
                    ${titleSpan}
                </span>
            </p>
            `;
            multiContainer.appendChild(articleElement);
        });
    }
    
    // ========================
    // 単独サイトフィード（single）の表示
    // ========================
    // keyごとにグループ化
    const groupedByKey = {};
    singleData.forEach(item => {
        if (!groupedByKey[item.key]) {
            groupedByKey[item.key] = [];
        }
        groupedByKey[item.key].push(item);
    });
    
    // 各keyごとに表示
    Object.entries(groupedByKey).forEach(([key, items]) => {
        const containerId = `single-rss-feed-container-${key}`;
        const singleContainer = document.getElementById(containerId);
        
        if (singleContainer) {
            // 上位件数のみ表示（CSVで既にソート済みだが念のため）
            items.slice(0, singleMaxLength).forEach(item => {
                const articleElement = document.createElement('div');
                
                // 日付のフォーマット（dateが空白でない場合のみ）
                let dateHtml = '';
                if (item.pubDate) {
                    const date = new Date(item.pubDate);
                    // 有効な日付かチェック
                    if (!isNaN(date.getTime())) {
                        const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                        dateHtml = `<span style="margin-bottom: 0.25rem">${formattedDate}</span>`;
                    }
                }
                
                // タイトル部分（linkが空白かどうかで分岐）
                let titleHtml = '';
                if (item.link) {
                    // リンクあり
                    titleHtml = `<a href="${item.link}" target="_blank"><p style="line-height: 1.25; margin-bottom: 0.25rem">${item.title}</p></a>`;
                } else {
                    // リンクなし（テキストのみ）
                    titleHtml = `<p style="line-height: 1.25; margin-bottom: 0.25rem">${item.title}</p>`;
                }
                
                // HTML生成（dateがある場合とない場合で改行を調整）
                if (dateHtml) {
                    articleElement.innerHTML = `${dateHtml}${titleHtml}`;
                } else {
                    articleElement.innerHTML = titleHtml;
                }
                
                singleContainer.appendChild(articleElement);
            });
        }
    });
}

// コントリビューショングラフ生成関数
function generateContributionGraph(contributionData) {
    const container = document.getElementById('contribution-graph');
    if (!container) return;
    
    // データをマップに変換（日付 -> カウント）
    const dataMap = {};
    contributionData.forEach(item => {
        dataMap[item.date] = item.count;
    });
    
    // 今日の日付から1年前までの期間を計算
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    // 日曜日に調整（グラフは日曜日から始まる）
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // カウント数に応じたレベルを決定（GitHub風）
    function getLevel(count) {
        if (count === 0) return 0;
        if (count <= 2) return 1;
        if (count <= 5) return 2;
        if (count <= 9) return 3;
        return 4;
    }
    
    // 日付をフォーマット
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
    }
    
    // 週のデータを生成（今日の日付まで確実に含まれるように）
    const weeks = [];
    let currentDate = new Date(startDate);
    
    // 今日の日付を含む週まで生成
    while (currentDate <= today) {
        const days = [];
        for (let day = 0; day < 7; day++) {
            const dateStr = formatDate(currentDate);
            const count = dataMap[dateStr] || 0;
            days.push({
                date: new Date(currentDate),
                dateStr: dateStr,
                count: count,
                level: getLevel(count)
            });
            currentDate.setDate(currentDate.getDate() + 1);
            
            // 今日を超えたら週の途中でも抜ける
            if (currentDate > today) {
                break;
            }
        }
        weeks.push(days);
    }
    
    // グラフ構造を作成
    const graphContainer = document.createElement('div');
    graphContainer.className = 'contribution-graph-container';
    
    // 年ラベルを生成
    const yearsRow = document.createElement('div');
    yearsRow.className = 'contribution-years';
    yearsRow.style.position = 'relative';
    yearsRow.style.height = '20px';
    yearsRow.style.marginBottom = '2px';
    
    let lastYear = -1;
    weeks.forEach((week, weekIndex) => {
        const firstDay = week[0].date;
        const year = firstDay.getFullYear();
        
        // 最初の週、または年が変わったときに年ラベルを表示
        if (weekIndex === 0 || year !== lastYear) {
            const yearLabel = document.createElement('div');
            yearLabel.className = 'contribution-year';
            yearLabel.textContent = `${year}年`;
            yearLabel.style.position = 'absolute';
            yearLabel.style.left = `${25 + weekIndex * 14}px`;
            yearsRow.appendChild(yearLabel);
            lastYear = year;
        }
    });
    
    graphContainer.appendChild(yearsRow);
    
    // 月ラベルを生成
    const monthsRow = document.createElement('div');
    monthsRow.className = 'contribution-months';
    monthsRow.style.position = 'relative';
    monthsRow.style.height = '18px';
    monthsRow.style.marginBottom = '5px';
    
    lastYear = -1;
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
        const firstDay = week[0].date;
        const month = firstDay.getMonth();
        const year = firstDay.getFullYear();
        
        // 年が変わった場合は月の表示をリセット
        if (year !== lastYear) {
            lastMonth = -1;
            lastYear = year;
        }
        
        // 月が変わったときラベルを表示
        if (month !== lastMonth) {
            const monthLabel = document.createElement('div');
            monthLabel.className = 'contribution-month';
            monthLabel.textContent = `${month + 1}月`;
            monthLabel.style.position = 'absolute';
            monthLabel.style.left = `${25 + weekIndex * 14}px`;
            monthsRow.appendChild(monthLabel);
            lastMonth = month;
        }
    });
    
    graphContainer.appendChild(monthsRow);
    
    // メインコンテンツ
    const mainContent = document.createElement('div');
    mainContent.className = 'contribution-main';
    mainContent.style.position = 'relative';
    mainContent.style.zIndex = '1';
    
    // 曜日ラベル（月・水・金のみ表示、位置を修正）
    const weekdays = document.createElement('div');
    weekdays.className = 'contribution-weekdays';
    ['日', '月', '火', '水', '木', '金', '土'].forEach((day, index) => {
        const weekday = document.createElement('div');
        weekday.className = 'contribution-weekday';
        // 月・水・金のみ表示
        if (index === 1 || index === 3 || index === 5) {
            weekday.textContent = day;
        }
        weekdays.appendChild(weekday);
    });
    mainContent.appendChild(weekdays);
    
    // 週のコンテナ
    const weeksContainer = document.createElement('div');
    weeksContainer.className = 'contribution-weeks';
    
    // 各週を生成
    weeks.forEach(week => {
        const weekElement = document.createElement('div');
        weekElement.className = 'contribution-week';
        
        week.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = `contribution-day level-${day.level}`;
            dayElement.dataset.date = day.dateStr;
            dayElement.dataset.count = day.count;
            
            // ホバー時のツールチップ
            dayElement.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'contribution-tooltip';
                tooltip.textContent = `${day.dateStr}: ${day.count}件`;
                tooltip.style.display = 'block';
                tooltip.style.left = `${e.pageX + 10}px`;
                tooltip.style.top = `${e.pageY - 30}px`;
                document.body.appendChild(tooltip);
                dayElement._tooltip = tooltip;
            });
            
            dayElement.addEventListener('mouseleave', () => {
                if (dayElement._tooltip) {
                    dayElement._tooltip.remove();
                    dayElement._tooltip = null;
                }
            });
            
            weekElement.appendChild(dayElement);
        });
        
        weeksContainer.appendChild(weekElement);
    });
    
    mainContent.appendChild(weeksContainer);
    graphContainer.appendChild(mainContent);
    container.appendChild(graphContainer);
    
    // グラフ生成後に右端にスクロール
    setTimeout(() => {
        const graphWrapper = document.querySelector('.contribution-graph-wrapper');
        if (graphWrapper) {
            graphWrapper.scrollLeft = graphWrapper.scrollWidth;
        }
    }, 100);
}

// ヘッダースクロール効果の初期化
function initHeaderScroll() {
    const header = document.getElementById('main-header');
    
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

// 現在年を更新
function updateCurrentYear() {
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        const currentYear = new Date().getFullYear();
        currentYearSpan.textContent = currentYear;
    }
}

// 理念セクションの+/-アイコン切り替え
function initPhilosophyIconToggle() {
    const philosophyCollapse = document.getElementById('philosophyCollapse');
    const icon = document.getElementById('philosophy-icon');
    
    if (philosophyCollapse && icon) {
        philosophyCollapse.addEventListener('show.bs.collapse', function () {
            icon.textContent = '-';
        });
        philosophyCollapse.addEventListener('hide.bs.collapse', function () {
            icon.textContent = '+';
        });
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    updateCurrentYear();
    initPhilosophyIconToggle();
});