const multiMaxLength = 20;
const singleMaxLength = 10;

// NEW!!バッジを表示する日数（変更可能なパラメータ）
const NEW_BADGE_DAYS = 30;

// 公開スプレッドシートのCSV URL
const PUBLIC_BASIC_INFO_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=0&single=true&output=csv';
const PUBLIC_MULTI_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=195059601&single=true&output=csv';
const PUBLIC_SINGLE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=900915820&single=true&output=csv';
const PUBLIC_CONTRIBUTION_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=928202728&single=true&output=csv';

// グローバル変数（ハッシュタグフィルタリング用）
let allHashTags = [];
let currentFilterTag = null;
let basicInfoData = null;
let singleDataGlobal = null;

// 環境判定
const isLocalMode = window.location.protocol === 'file:' || (typeof BASIC_INFO_CSV !== 'undefined' && typeof TEST_DATA !== 'undefined');

if (isLocalMode && typeof BASIC_INFO_CSV !== 'undefined' && typeof TEST_DATA !== 'undefined') {
    console.log('ローカルモードで実行中');
    const basicInfo = parseBasicInfoCSV(BASIC_INFO_CSV);
    const multiData = parseMultiCSV(TEST_DATA.MULTI_CSV);
    const singleData = parseSingleCSV(TEST_DATA.SINGLE_CSV);
    const contributionData = parseContributionCSV(TEST_DATA.CONTRIBUTION_CSV);
    
    basicInfoData = basicInfo;
    singleDataGlobal = singleData;
    allHashTags = collectAllHashTags(basicInfo);
    
    generateCards(basicInfo, singleData);
    loadFeeds(multiData, singleData);
    generateContributionGraph(contributionData);
    renderHashTagList();
} else if (typeof BASIC_INFO_CSV !== 'undefined') {
    console.log('オンラインモードで実行中');
    
    Promise.all([
        fetch(PUBLIC_BASIC_INFO_CSV_URL).then(response => response.text()),
        fetch(PUBLIC_MULTI_CSV_URL).then(response => response.text()),
        fetch(PUBLIC_SINGLE_CSV_URL).then(response => response.text()),
        fetch(PUBLIC_CONTRIBUTION_CSV_URL).then(response => response.text())
    ])
    .then(([basicCsvText, multiCsvText, singleCsvText, contributionCsvText]) => {
        const basicInfo = parseBasicInfoCSV(basicCsvText);
        const multiData = parseMultiCSV(multiCsvText);
        const singleData = parseSingleCSV(singleCsvText);
        const contributionData = parseContributionCSV(contributionCsvText);
        
        basicInfoData = basicInfo;
        singleDataGlobal = singleData;
        allHashTags = collectAllHashTags(basicInfo);
        
        generateCards(basicInfo, singleData);
        loadFeeds(multiData, singleData);
        generateContributionGraph(contributionData);
        renderHashTagList();
    })
    .catch(error => {
        console.error('公開CSVの読み込みに失敗しました:', error);
    });
} else {
    console.error('basic-info.jsが読み込まれていません。');
}

// ハッシュタグ抽出（半角・全角スペース対応）
function extractHashTags(hashTagString) {
    if (!hashTagString) return [];
    return hashTagString.split(/[\s\u3000]+/).filter(tag => tag.trim().startsWith('#'));
}

// 全ハッシュタグを収集
function collectAllHashTags(basicInfo) {
    const tags = new Set();
    basicInfo.forEach(item => {
        if (item.hashTag) {
            extractHashTags(item.hashTag).forEach(tag => tags.add(tag));
        }
    });
    return Array.from(tags).sort();
}

// ハッシュタグ一覧を表示
function renderHashTagList() {
    const container = document.getElementById('hashtag-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const title = document.createElement('h5');
    title.textContent = 'ハッシュタグ一覧';
    title.className = 'mb-3';
    container.appendChild(title);
    
    const tagContainer = document.createElement('div');
    tagContainer.className = 'hashtag-list';
    
    allHashTags.forEach(tag => {
        const tagButton = document.createElement('button');
        tagButton.className = 'hashtag-button';
        tagButton.textContent = tag;
        
        if (currentFilterTag === tag) {
            tagButton.classList.add('active');
        }
        
        tagButton.onclick = () => {
            if (currentFilterTag === tag) {
                clearHashTagFilter();
            } else {
                applyHashTagFilter(tag);
            }
        };
        
        tagContainer.appendChild(tagButton);
    });
    
    container.appendChild(tagContainer);
}

// ハッシュタグをクリック可能なリンクに変換
function convertHashTagsToLinks(hashTagString) {
    if (!hashTagString) return '';
    
    const tags = extractHashTags(hashTagString);
    return tags.map(tag => {
        return `<a href="#" onclick="applyHashTagFilter('${tag}'); return false;" style="margin-right: 0.25rem; color: #0d6efd; text-decoration: none;">${tag}</a>`;
    }).join(' ');
}

// ハッシュタグフィルターを適用
function applyHashTagFilter(tag) {
    currentFilterTag = tag;
    generateCards(basicInfoData, singleDataGlobal, tag);
    renderHashTagList();
    showFilterUI(tag);
    updateJumpMenu(tag);
}

// フィルターをクリア
function clearHashTagFilter() {
    currentFilterTag = null;
    generateCards(basicInfoData, singleDataGlobal, null);
    renderHashTagList();
    hideFilterUI();
    updateJumpMenu(null);
}

// フィルターUI表示
function showFilterUI(tag) {
    const container = document.getElementById('filter-ui-container');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = `
        <div class="alert alert-info d-flex justify-content-between align-items-center">
            <span>表示中: <strong>${tag}</strong></span>
            <button class="btn btn-sm btn-secondary" onclick="clearHashTagFilter()">フィルター解除</button>
        </div>
    `;
}

// フィルターUI非表示
function hideFilterUI() {
    const container = document.getElementById('filter-ui-container');
    if (!container) return;
    
    container.style.display = 'none';
    container.innerHTML = '';
}

// ジャンプメニューを更新
function updateJumpMenu(filterTag) {
    const dropdownMenu = document.querySelector('#jumpMenuButton + .dropdown-menu');
    if (!dropdownMenu) return;
    
    if (filterTag) {
        dropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="#" onclick="window.scrollTo(0,0); return false;">ヘッダー</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#filter-ui-container">フィルター結果</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#footer">フッター</a></li>
        `;
    } else {
        dropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="#" onclick="window.scrollTo(0,0); return false;">ヘッダー</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#common">共通コンテンツ</a></li>
            <li><a class="dropdown-item" href="#kevin">けびんケビンソン</a></li>
            <li><a class="dropdown-item" href="#ryo">イイダリョウ</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#footer">フッター</a></li>
        `;
    }
}

// CSV解析関数（基本情報用）
function parseBasicInfoCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const keyIndex = headers.indexOf('key');
    const categoryIndex = headers.indexOf('category');
    const siteTitleIndex = headers.indexOf('siteTitle');
    const breadcrumbsIndex = headers.indexOf('breadcrumbs');
    const hashTagIndex = headers.indexOf('hashTag');
    const siteUrlIndex = headers.indexOf('siteUrl');
    const imageIndex = headers.indexOf('image');
    const subImageIndex = headers.indexOf('sub-image');
    const logoIndex = headers.indexOf('logo');
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values[keyIndex] === 'cmp2000') continue;
        
        if (values[keyIndex] && values[categoryIndex] && 
            values[siteTitleIndex] && values[breadcrumbsIndex] && values[siteUrlIndex]) {
            items.push({
                key: values[keyIndex],
                category: values[categoryIndex],
                siteTitle: values[siteTitleIndex],
                breadcrumbs: values[breadcrumbsIndex],
                hashTag: values[hashTagIndex] || '',
                siteUrl: values[siteUrlIndex],
                image: values[imageIndex] || '',
                subImage: values[subImageIndex] || '',
                logo: values[logoIndex] || ''
            });
        }
    }
    
    return items;
}

// CSV解析関数（multi用）
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
        
        if (values[keyIndex] && values[breadcrumbsIndex] && values[siteUrlIndex] && 
            values[titleIndex] && values[dateIndex]) {
            items.push({
                key: values[keyIndex],
                breadcrumbs: values[breadcrumbsIndex],
                siteUrl: values[siteUrlIndex],
                title: values[titleIndex],
                link: values[linkIndex] || '',
                pubDate: values[dateIndex]
            });
        }
    }
    
    return items;
}

// CSV解析関数（single用）
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
        
        if (values[keyIndex] && values[titleIndex]) {
            items.push({
                key: values[keyIndex],
                title: values[titleIndex],
                link: values[linkIndex] || '',
                pubDate: values[dateIndex] || ''
            });
        }
    }
    
    return items;
}

// CSV解析関数（contribution用）
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

// カード自動生成関数（フィルター対応）
function generateCards(basicInfo, singleData, filterTag = null) {
    let filteredInfo = basicInfo;
    if (filterTag) {
        filteredInfo = basicInfo.filter(item => {
            if (!item.hashTag) return false;
            const tags = extractHashTags(item.hashTag);
            return tags.includes(filterTag);
        });
    }
    
    const groupedByCategory = {};
    filteredInfo.forEach(item => {
        if (!groupedByCategory[item.category]) {
            groupedByCategory[item.category] = [];
        }
        groupedByCategory[item.category].push(item);
    });
    
    const singleDataByKey = {};
    singleData.forEach(item => {
        if (!singleDataByKey[item.key]) {
            singleDataByKey[item.key] = [];
        }
        singleDataByKey[item.key].push(item);
    });
    
    function isNewArticle(key) {
        const articles = singleDataByKey[key];
        if (!articles || articles.length === 0) return false;
        
        const latestArticle = articles[0];
        const articleDate = new Date(latestArticle.pubDate);
        const today = new Date();
        const diffTime = today - articleDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= NEW_BADGE_DAYS;
    }
    
    const container = document.getElementById('card-content-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // フィルター時は全カードを1つのコンテナに並べる
    if (filterTag) {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';
        
        // カテゴリ順序を維持するためのソート
        const categoryOrder = ['共通コンテンツ', 'けびんケビンソン', 'イイダリョウ'];
        const sortedCategories = Object.keys(groupedByCategory).sort((a, b) => {
            return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
        });
        
        sortedCategories.forEach(category => {
            const items = groupedByCategory[category];
            items.forEach(site => {
                const cardWrapper = document.createElement('div');
                cardWrapper.className = 'card-wrapper';
                
                const newBadgeHtml = isNewArticle(site.key) 
                    ? '<span class="badge bg-danger new-badge">New!!</span>' 
                    : '';
                
                const subImageHtml = site.subImage 
                    ? `<img src="${site.subImage}" alt="sub-image" class="card-sub-image">` 
                    : '';
                
                const hashTagHtml = site.hashTag ? `<small class="text-muted">${convertHashTagsToLinks(site.hashTag)}</small>` : '';
                
                // カテゴリ名を小さめの文字で表示
                const categoryBadgeHtml = `<small class="text-muted" style="font-size: 0.75rem; display: block; margin-bottom: 0.25rem;">${category}</small>`;
                
                cardWrapper.innerHTML = `
                    <div class="card">
                        <a href="${site.siteUrl}" target="_blank" style="position: relative; overflow: hidden; height: 200px; display: block; text-decoration: none;">
                            <img src="${site.image}" class="card-img-top" alt="${site.siteTitle}" style="width: 100%; height: 100%; object-fit: cover;">
                            ${newBadgeHtml}
                            ${subImageHtml}
                            <img src="${site.logo}" alt="logo" class="card-logo-img">
                        </a>
                        <div class="card-body">
                            ${categoryBadgeHtml}
                            <h5 class="card-title">${site.siteTitle}</h5>
                            <p class="card-text">
                                <div id="single-rss-feed-container-${site.key}" class="rss-feed-container text-start"></div>
                            </p>
                            <div class="d-flex justify-content-between align-items-center">
                                <a href="${site.siteUrl}" class="btn btn-primary" target="_blank">Go to Site</a>
                                ${hashTagHtml}
                            </div>
                        </div>
                    </div>
                `;
                cardContainer.appendChild(cardWrapper);
            });
        });
        
        container.appendChild(cardContainer);
    } else {
        // 通常表示（カテゴリごとにセクション分け）
        Object.entries(groupedByCategory).forEach(([category, items]) => {
            const sectionTitle = document.createElement('h3');
            sectionTitle.className = 'section-title';
            sectionTitle.textContent = category;
            container.appendChild(sectionTitle);
            
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card-container';
            
            items.forEach(site => {
                const cardWrapper = document.createElement('div');
                cardWrapper.className = 'card-wrapper';
                
                const newBadgeHtml = isNewArticle(site.key) 
                    ? '<span class="badge bg-danger new-badge">New!!</span>' 
                    : '';
                
                const subImageHtml = site.subImage 
                    ? `<img src="${site.subImage}" alt="sub-image" class="card-sub-image">` 
                    : '';
                
                const hashTagHtml = site.hashTag ? `<small class="text-muted">${convertHashTagsToLinks(site.hashTag)}</small>` : '';
                
                cardWrapper.innerHTML = `
                    <div class="card">
                        <a href="${site.siteUrl}" target="_blank" style="position: relative; overflow: hidden; height: 200px; display: block; text-decoration: none;">
                            <img src="${site.image}" class="card-img-top" alt="${site.siteTitle}" style="width: 100%; height: 100%; object-fit: cover;">
                            ${newBadgeHtml}
                            ${subImageHtml}
                            <img src="${site.logo}" alt="logo" class="card-logo-img">
                        </a>
                        <div class="card-body">
                            <h5 class="card-title">${site.siteTitle}</h5>
                            <p class="card-text">
                                <div id="single-rss-feed-container-${site.key}" class="rss-feed-container text-start"></div>
                            </p>
                            <div class="d-flex justify-content-between align-items-center">
                                <a href="${site.siteUrl}" class="btn btn-primary" target="_blank">Go to Site</a>
                                ${hashTagHtml}
                            </div>
                        </div>
                    </div>
                `;
                cardContainer.appendChild(cardWrapper);
            });
            
            container.appendChild(cardContainer);
            
            if (category === '共通コンテンツ') {
                sectionTitle.id = 'common';
            } else if (category === 'けびんケビンソン') {
                sectionTitle.id = 'kevin';
            } else if (category === 'イイダリョウ') {
                sectionTitle.id = 'ryo';
            }
            
            const hr = document.createElement('hr');
            container.appendChild(hr);
        });
    }
    
    if (singleData) {
        loadSingleFeeds(singleData, filteredInfo.map(item => item.key));
    }
}

function loadFeeds(multiData, singleData) {
    const multiContainer = document.getElementById('multi-rss-feed-container');
    
    if (multiContainer) {
        multiData.slice(0, multiMaxLength).forEach(item => {
            if (!item.pubDate) return;
            
            const date = new Date(item.pubDate);
            const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
            const articleElement = document.createElement('div');
            
            let titleSpan = '';
            if (item.link) {
                titleSpan = `<a href="${item.link}" target="_blank">
                    <span style="line-height: 1.25; margin-bottom: 0.25rem; display: inline-block; width: 30rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; vertical-align: middle;">${item.title}</span>
                </a>`;
            } else {
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
    
    loadSingleFeeds(singleData);
}

function loadSingleFeeds(singleData, filterKeys = null) {
    const groupedByKey = {};
    singleData.forEach(item => {
        if (!groupedByKey[item.key]) {
            groupedByKey[item.key] = [];
        }
        groupedByKey[item.key].push(item);
    });
    
    Object.entries(groupedByKey).forEach(([key, items]) => {
        if (filterKeys && !filterKeys.includes(key)) return;
        
        const containerId = `single-rss-feed-container-${key}`;
        const singleContainer = document.getElementById(containerId);
        
        if (singleContainer) {
            singleContainer.innerHTML = '';
            
            items.slice(0, singleMaxLength).forEach(item => {
                const articleElement = document.createElement('div');
                
                let dateHtml = '';
                if (item.pubDate) {
                    const date = new Date(item.pubDate);
                    if (!isNaN(date.getTime())) {
                        const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                        dateHtml = `<span style="margin-bottom: 0.25rem">${formattedDate}</span>`;
                    }
                }
                
                let titleHtml = '';
                if (item.link) {
                    titleHtml = `<a href="${item.link}" target="_blank"><p style="line-height: 1.25; margin-bottom: 0.25rem">${item.title}</p></a>`;
                } else {
                    titleHtml = `<p style="line-height: 1.25; margin-bottom: 0.25rem">${item.title}</p>`;
                }
                
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
    
    const dataMap = {};
    contributionData.forEach(item => {
        dataMap[item.date] = item.count;
    });
    
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    function getLevel(count) {
        if (count === 0) return 0;
        if (count <= 2) return 1;
        if (count <= 5) return 2;
        if (count <= 9) return 3;
        return 4;
    }
    
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
    }
    
    const weeks = [];
    let currentDate = new Date(startDate);
    
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
            
            if (currentDate > today) {
                break;
            }
        }
        weeks.push(days);
    }
    
    const graphContainer = document.createElement('div');
    graphContainer.className = 'contribution-graph-container';
    
    const yearsRow = document.createElement('div');
    yearsRow.className = 'contribution-years';
    yearsRow.style.position = 'relative';
    yearsRow.style.height = '20px';
    yearsRow.style.marginBottom = '2px';
    
    let lastYear = -1;
    weeks.forEach((week, weekIndex) => {
        const firstDay = week[0].date;
        const year = firstDay.getFullYear();
        
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
        
        if (year !== lastYear) {
            lastMonth = -1;
            lastYear = year;
        }
        
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
    
    const mainContent = document.createElement('div');
    mainContent.className = 'contribution-main';
    mainContent.style.position = 'relative';
    mainContent.style.zIndex = '1';
    
    const weekdays = document.createElement('div');
    weekdays.className = 'contribution-weekdays';
    ['日', '月', '火', '水', '木', '金', '土'].forEach((day, index) => {
        const weekday = document.createElement('div');
        weekday.className = 'contribution-weekday';
        if (index === 1 || index === 3 || index === 5) {
            weekday.textContent = day;
        }
        weekdays.appendChild(weekday);
    });
    mainContent.appendChild(weekdays);
    
    const weeksContainer = document.createElement('div');
    weeksContainer.className = 'contribution-weeks';
    
    weeks.forEach(week => {
        const weekElement = document.createElement('div');
        weekElement.className = 'contribution-week';
        
        week.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = `contribution-day level-${day.level}`;
            dayElement.dataset.date = day.dateStr;
            dayElement.dataset.count = day.count;
            
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
    
    setTimeout(() => {
        const graphWrapper = document.querySelector('.contribution-graph-wrapper');
        if (graphWrapper) {
            graphWrapper.scrollLeft = graphWrapper.scrollWidth;
        }
    }, 100);
}

// 初期化関数
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

function updateCurrentYear() {
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        const currentYear = new Date().getFullYear();
        currentYearSpan.textContent = currentYear;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    updateCurrentYear();
});
