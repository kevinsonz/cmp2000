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
} else {
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

// ハッシュタグフィルタを適用
function applyHashTagFilter(tag) {
    currentFilterTag = tag;
    generateCards(basicInfoData, singleDataGlobal, tag);
    renderHashTagList();
    showFilterUI(tag);
    updateJumpMenu(tag);
    
    // フィルタUI表示位置にスムーズスクロール
    setTimeout(() => {
        const filterContainer = document.getElementById('filter-ui-container');
        if (filterContainer) {
            filterContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// フィルタをクリア
function clearHashTagFilter() {
    currentFilterTag = null;
    generateCards(basicInfoData, singleDataGlobal, null);
    renderHashTagList();
    hideFilterUI();
    updateJumpMenu(null);
    
    // 「共通コンテンツ」セクションにスムーズスクロール
    setTimeout(() => {
        const commonSection = document.getElementById('common');
        if (commonSection) {
            commonSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// フィルタUI表示
function showFilterUI(tag) {
    const container = document.getElementById('filter-ui-container');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = `
        <div class="alert alert-info d-flex justify-content-between align-items-center">
            <span>表示中: <strong>${tag}</strong></span>
            <button class="btn btn-sm btn-secondary" onclick="clearHashTagFilter()">フィルタ解除</button>
        </div>
    `;
}

// フィルタUI非表示
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
            <li><a class="dropdown-item" href="#filter-ui-container">フィルタ結果</a></li>
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

// CSV解析関数（基本情報用） - comment列対応
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
    const commentIndex = headers.indexOf('comment');
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        // カンマ区切りの解析（コメント内のカンマを考慮）
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
        
        if (values[keyIndex] && values[categoryIndex]) {
            items.push({
                key: values[keyIndex],
                category: values[categoryIndex],
                siteTitle: values[siteTitleIndex] || '',
                breadcrumbs: values[breadcrumbsIndex] || '',
                hashTag: values[hashTagIndex] || '',
                siteUrl: values[siteUrlIndex] || '',
                image: values[imageIndex] || '',
                subImage: values[subImageIndex] || '',
                logo: values[logoIndex] || '',
                comment: commentIndex >= 0 ? (values[commentIndex] || '') : ''
            });
        }
    }
    
    return items;
}

// CSV解析関数（Multi用）
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
        const line = lines[i];
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        // カンマ区切りの解析（タイトル内のカンマを考慮）
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
        
        if (values[keyIndex] && values[titleIndex]) {
            items.push({
                key: values[keyIndex],
                breadcrumbs: values[breadcrumbsIndex] || '',
                siteUrl: values[siteUrlIndex] || '',
                title: values[titleIndex] || '',
                link: values[linkIndex] || '',
                pubDate: values[dateIndex] || ''
            });
        }
    }
    
    return items;
}

// CSV解析関数（Single用）
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

// CSV解析関数（Contribution用）
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

// カード自動生成関数（フィルタ対応）
function generateCards(basicInfo, singleData, filterTag = null) {
    // 全てのアイテムを表示
    let filteredInfo = basicInfo;
    
    // ハッシュタグフィルタを適用
    if (filterTag) {
        filteredInfo = filteredInfo.filter(item => {
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
    
    // 各キーのデータを日付順にソート
    Object.keys(singleDataByKey).forEach(key => {
        singleDataByKey[key].sort((a, b) => {
            if (!a.pubDate && !b.pubDate) return 0;
            if (!a.pubDate) return -1;
            if (!b.pubDate) return 1;
            
            const dateA = new Date(a.pubDate);
            const dateB = new Date(b.pubDate);
            return dateB - dateA; // 新しい順
        });
    });
    
    function isNewArticle(key) {
        console.log(`=== Checking isNewArticle for key: ${key} ===`);
        const articles = singleDataByKey[key];
        
        if (!articles) {
            console.log(`  - No articles found for key: ${key}`);
            return false;
        }
        
        if (articles.length === 0) {
            console.log(`  - Articles array is empty for key: ${key}`);
            return false;
        }
        
        console.log(`  - Found ${articles.length} articles for key: ${key}`);
        
        const latestArticle = articles[0];
        console.log(`  - Latest article:`, latestArticle);
        
        if (!latestArticle.pubDate) {
            console.log(`  - Latest article has no pubDate`);
            return false;
        }
        
        const articleDate = new Date(latestArticle.pubDate);
        const today = new Date();
        const diffTime = today - articleDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`  - Latest Date: ${latestArticle.pubDate}`);
        console.log(`  - Today: ${today.toISOString().split('T')[0]}`);
        console.log(`  - Days Ago: ${diffDays}`);
        console.log(`  - NEW_BADGE_DAYS: ${NEW_BADGE_DAYS}`);
        console.log(`  - Is New: ${diffDays <= NEW_BADGE_DAYS}`);
        
        return diffDays <= NEW_BADGE_DAYS;
    }
    
    const container = document.getElementById('card-content-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // フィルタ時は全カードを1つのコンテナに並べる
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
                
                const isNew = isNewArticle(site.key);
                console.log(`>>> [FILTER] Card: ${site.siteTitle} (${site.key}), isNew: ${isNew}`);
                
                const newBadgeHtml = isNew 
                    ? '<span class="badge bg-danger new-badge">New!!</span>' 
                    : '';
                
                console.log(`>>> [FILTER] Badge HTML: ${newBadgeHtml ? 'Generated' : 'Empty'}, HTML length: ${newBadgeHtml.length}`);
                
                const subImageHtml = site.subImage 
                    ? `<img src="${site.subImage}" alt="sub-image" class="card-sub-image">` 
                    : '';
                
                // logo列が空白でない場合のみロゴを表示
                const logoHtml = (site.logo && site.logo.trim() !== '')
                    ? `<img src="${site.logo}" alt="logo" class="card-logo-img">`
                    : '';
                
                const hashTagHtml = site.hashTag ? `<div class="card-hashtag-area"><small class="text-muted">${convertHashTagsToLinks(site.hashTag)}</small></div>` : '';
                
                // カテゴリ名を小さめの文字で表示
                const categoryBadgeHtml = `<small class="text-muted" style="font-size: 0.75rem; display: block; margin-bottom: 0.25rem;">${category}</small>`;
                
                cardWrapper.innerHTML = `
                    <div class="card">
                        <a href="${site.siteUrl}" target="_blank">
                            <img src="${site.image}" class="card-img-top" alt="${site.siteTitle}">
                            ${newBadgeHtml}
                            ${subImageHtml}
                            ${logoHtml}
                        </a>
                        <div class="card-body">
                            ${categoryBadgeHtml}
                            <h5 class="card-title">${site.siteTitle}</h5>
                            <div class="card-text">
                                <div id="single-rss-feed-container-${site.key}" class="rss-feed-container text-start"></div>
                            </div>
                            <div class="card-action-area">
                                <a href="${site.siteUrl}" class="btn btn-primary card-action-button" target="_blank">Go to Site</a>
                                ${hashTagHtml}
                            </div>
                        </div>
                    </div>
                `;
                
                // 生成後のHTMLにバッジが含まれているか確認
                if (isNew) {
                    const hasNewBadge = cardWrapper.innerHTML.includes('new-badge');
                    console.log(`>>> [FILTER] Card HTML includes new-badge class: ${hasNewBadge}`);
                }
                
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
                
                const isNew = isNewArticle(site.key);
                console.log(`>>> [NORMAL] Card: ${site.siteTitle} (${site.key}), isNew: ${isNew}`);
                
                const newBadgeHtml = isNew 
                    ? '<span class="badge bg-danger new-badge">New!!</span>' 
                    : '';
                
                console.log(`>>> [NORMAL] Badge HTML: ${newBadgeHtml ? 'Generated' : 'Empty'}, HTML length: ${newBadgeHtml.length}`);
                
                const subImageHtml = site.subImage 
                    ? `<img src="${site.subImage}" alt="sub-image" class="card-sub-image">` 
                    : '';
                
                // logo列が空白でない場合のみロゴを表示
                const logoHtml = (site.logo && site.logo.trim() !== '')
                    ? `<img src="${site.logo}" alt="logo" class="card-logo-img">`
                    : '';
                
                const hashTagHtml = site.hashTag ? `<div class="card-hashtag-area"><small class="text-muted">${convertHashTagsToLinks(site.hashTag)}</small></div>` : '';
                
                cardWrapper.innerHTML = `
                    <div class="card">
                        <a href="${site.siteUrl}" target="_blank">
                            <img src="${site.image}" class="card-img-top" alt="${site.siteTitle}">
                            ${newBadgeHtml}
                            ${subImageHtml}
                            ${logoHtml}
                        </a>
                        <div class="card-body">
                            <h5 class="card-title">${site.siteTitle}</h5>
                            <div class="card-text">
                                <div id="single-rss-feed-container-${site.key}" class="rss-feed-container text-start"></div>
                            </div>
                            <div class="card-action-area">
                                <a href="${site.siteUrl}" class="btn btn-primary card-action-button" target="_blank">Go to Site</a>
                                ${hashTagHtml}
                            </div>
                        </div>
                    </div>
                `;
                
                // 生成後のHTMLにバッジが含まれているか確認
                if (isNew) {
                    const hasNewBadge = cardWrapper.innerHTML.includes('new-badge');
                    console.log(`>>> [NORMAL] Card HTML includes new-badge class: ${hasNewBadge}`);
                }
                
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
        // テーブル形式で表示するためのラッパー
        const tableWrapper = document.createElement('div');
        tableWrapper.style.maxHeight = '200px'; // スクロール可能な高さ
        tableWrapper.style.overflowY = 'auto';
        tableWrapper.style.border = '1px solid #dee2e6';
        tableWrapper.style.borderRadius = '0.375rem';
        tableWrapper.style.backgroundColor = 'white';
        
        const table = document.createElement('table');
        table.className = 'table table-sm mb-0';
        table.style.fontSize = '0.9rem';
        
        const tbody = document.createElement('tbody');
        
        let currentYear = null;
        
        multiData.slice(0, multiMaxLength).forEach(item => {
            const date = item.pubDate ? new Date(item.pubDate) : null;
            const year = date ? date.getFullYear() : null;
            const month = date ? String(date.getMonth() + 1).padStart(2, '0') : null;
            const day = date ? String(date.getDate()).padStart(2, '0') : null;
            const formattedShortDate = date ? `${month}/${day}` : '--/--';
            
            // 年が変わった場合、年の行を追加
            if (year !== null && year !== currentYear) {
                currentYear = year;
                const yearRow = document.createElement('tr');
                yearRow.style.backgroundColor = '#e9ecef';
                const yearCell = document.createElement('td');
                yearCell.colSpan = 2;
                yearCell.className = 'fw-bold text-center py-2';
                yearCell.textContent = `${year}年`;
                yearRow.appendChild(yearCell);
                tbody.appendChild(yearRow);
            }
            
            // 1行目：NEW!!バッヂ、breadcrumbs（siteUrl付き）
            const row1 = document.createElement('tr');
            const cell1 = document.createElement('td');
            cell1.colSpan = 2;
            cell1.className = 'py-1';
            cell1.style.borderBottom = '0';
            
            // NEW!!バッヂの計算
            const today = new Date();
            const diffTime = date ? today - date : null;
            const diffDays = diffTime ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : null;
            
            let newBadgeHtml = '';
            if (diffDays !== null && diffDays <= NEW_BADGE_DAYS) {
                newBadgeHtml = '<span class="badge bg-danger me-2" style="font-size: 0.7rem;">New!!</span>';
            } else {
                newBadgeHtml = '<span style="display: inline-block; width: 3.5rem;"></span>'; // 空白スペース
            }
            
            // breadcrumbsのリンク
            let breadcrumbsHtml = '';
            if (item.breadcrumbs && item.siteUrl) {
                breadcrumbsHtml = `<a href="${item.siteUrl}" target="_blank" style="color: #0d6efd; text-decoration: none;">${item.breadcrumbs}</a>`;
            } else if (item.breadcrumbs) {
                breadcrumbsHtml = `<span style="color: #495057;">${item.breadcrumbs}</span>`;
            }
            
            cell1.innerHTML = newBadgeHtml + breadcrumbsHtml;
            row1.appendChild(cell1);
            tbody.appendChild(row1);
            
            // 2行目：「mm/dd」、title（link付き）
            const row2 = document.createElement('tr');
            const dateCell = document.createElement('td');
            dateCell.className = 'py-1 text-muted';
            dateCell.style.width = '80px';
            dateCell.style.borderTop = '0';
            dateCell.textContent = formattedShortDate;
            
            const titleCell = document.createElement('td');
            titleCell.className = 'py-1';
            titleCell.style.borderTop = '0';
            titleCell.style.maxWidth = '0'; // テーブルの自動幅計算を防ぐ
            titleCell.style.overflow = 'auto'; // 横スクロール有効化
            titleCell.style.whiteSpace = 'nowrap'; // 改行を防止
            
            if (item.link) {
                const link = document.createElement('a');
                link.href = item.link;
                link.target = '_blank';
                link.style.color = '#0d6efd';
                link.style.textDecoration = 'none';
                link.textContent = item.title;
                link.addEventListener('mouseenter', () => {
                    link.style.textDecoration = 'underline';
                });
                link.addEventListener('mouseleave', () => {
                    link.style.textDecoration = 'none';
                });
                titleCell.appendChild(link);
            } else {
                titleCell.textContent = item.title;
                titleCell.style.color = '#6c757d';
            }
            
            row2.appendChild(dateCell);
            row2.appendChild(titleCell);
            tbody.appendChild(row2);
        });
        
        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        multiContainer.appendChild(tableWrapper);
    }
}

function loadSingleFeeds(singleData, keys) {
    keys.forEach(key => {
        const feedContainer = document.getElementById(`single-rss-feed-container-${key}`);
        if (!feedContainer) return;
        
        const filteredData = singleData
            .filter(item => item.key === key)
            .sort((a, b) => {
                // 日付なし項目を最上位に
                if (!a.pubDate && !b.pubDate) return 0;
                if (!a.pubDate) return -1;
                if (!b.pubDate) return 1;
                
                // 日付あり項目は新しい順（降順）
                const dateA = new Date(a.pubDate);
                const dateB = new Date(b.pubDate);
                return dateB - dateA;
            })
            .slice(0, singleMaxLength);
        
        filteredData.forEach(item => {
            if (!item.title) return;
            
            const articleElement = document.createElement('div');
            articleElement.style.marginBottom = '0.4rem';
            articleElement.style.fontSize = '0.9rem';
            
            let dateSpan = '';
            if (item.pubDate) {
                const date = new Date(item.pubDate);
                const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                
                const today = new Date();
                const diffTime = today - date;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                let newBadge = '';
                if (diffDays <= NEW_BADGE_DAYS) {
                    newBadge = '<span class="badge bg-danger" style="margin-right: 0.35rem; font-size: 0.65rem;">New!!</span>';
                }
                
                dateSpan = `${newBadge}<span style="color: #6c757d; margin-right: 0.35rem; font-size: 0.85rem;">${formattedDate}</span>`;
            }
            
            let titleSpan = '';
            if (item.link) {
                titleSpan = `<a href="${item.link}" target="_blank" style="color: #0d6efd; font-size: 0.9rem;">${item.title}</a>`;
            } else {
                titleSpan = `<span style="color: #6c757d; font-size: 0.9rem;">${item.title}</span>`;
            }
            
            articleElement.innerHTML = `${dateSpan}${titleSpan}`;
            
            feedContainer.appendChild(articleElement);
        });
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
        // 週の中で年が変わるかチェック
        for (let i = 0; i < week.length; i++) {
            const day = week[i];
            const year = day.date.getFullYear();
            
            if (weekIndex === 0 || year !== lastYear) {
                const yearLabel = document.createElement('div');
                yearLabel.className = 'contribution-year';
                yearLabel.textContent = `${year}年`;
                yearLabel.style.position = 'absolute';
                yearLabel.style.left = `${25 + weekIndex * 13}px`;
                yearsRow.appendChild(yearLabel);
                lastYear = year;
                break;
            }
        }
    });
    
    graphContainer.appendChild(yearsRow);
    
    const monthsRow = document.createElement('div');
    monthsRow.className = 'contribution-months';
    monthsRow.style.position = 'relative';
    monthsRow.style.height = '18px';
    monthsRow.style.marginBottom = '5px';
    
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
        // 週の中で最初に表示される月を見つける
        for (let i = 0; i < week.length; i++) {
            const day = week[i];
            const month = day.date.getMonth();
            
            // 新しい月の最初の出現
            if (month !== lastMonth) {
                const monthLabel = document.createElement('div');
                monthLabel.className = 'contribution-month';
                monthLabel.textContent = `${month + 1}月`;
                monthLabel.style.position = 'absolute';
                monthLabel.style.left = `${25 + weekIndex * 13}px`;
                monthsRow.appendChild(monthLabel);
                lastMonth = month;
                break;
            }
        }
    });
    
    graphContainer.appendChild(monthsRow);
    
    const mainContent = document.createElement('div');
    mainContent.className = 'contribution-main';
    mainContent.style.position = 'relative';
    mainContent.style.zIndex = '1';
    
    // 左側の曜日ラベル
    const weekdaysLeft = document.createElement('div');
    weekdaysLeft.className = 'contribution-weekdays';
    ['日', '月', '火', '水', '木', '金', '土'].forEach((day) => {
        const weekday = document.createElement('div');
        weekday.className = 'contribution-weekday';
        weekday.textContent = day;
        weekdaysLeft.appendChild(weekday);
    });
    mainContent.appendChild(weekdaysLeft);
    
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
    
    // 右側の曜日ラベル
    const weekdaysRight = document.createElement('div');
    weekdaysRight.className = 'contribution-weekdays contribution-weekdays-right';
    ['日', '月', '火', '水', '木', '金', '土'].forEach((day) => {
        const weekday = document.createElement('div');
        weekday.className = 'contribution-weekday';
        weekday.textContent = day;
        weekdaysRight.appendChild(weekday);
    });
    mainContent.appendChild(weekdaysRight);
    
    graphContainer.appendChild(mainContent);
    container.appendChild(graphContainer);
    
    setTimeout(() => {
        const graphWrapper = document.querySelector('.contribution-graph-wrapper');
        if (graphWrapper) {
            graphWrapper.scrollLeft = graphWrapper.scrollWidth;
        }
    }, 100);
}

// ヘッダー初期化
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

function updateCurrentYear() {
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        const currentYear = new Date().getFullYear();
        currentYearSpan.textContent = currentYear;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initHeaderTitleClick();
    updateCurrentYear();
});