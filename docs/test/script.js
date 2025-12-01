const multiMaxLength = 20;
const singleMaxLength = 10;

// NEW!!バッジを表示する日数（変更可能なパラメータ）
const NEW_BADGE_DAYS = 30;

// 公開スプレッドシートのCSV URL
const PUBLIC_BASIC_INFO_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=0&single=true&output=csv';
// PUBLIC_MULTI_CSV_URLは廃止されました（MULTI_CSVは使用されなくなりました）
const PUBLIC_SINGLE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=900915820&single=true&output=csv';
const PUBLIC_CONTRIBUTION_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=928202728&single=true&output=csv';

// グローバル変数（ハッシュタグフィルタリング用）
let allHashTags = [];
let currentFilterTag = null;
let basicInfoData = null;
let singleDataGlobal = null;
let currentTab = 'general'; // 現在のタブを追跡

// 環境判定
const isLocalMode = window.location.protocol === 'file:' || (typeof BASIC_INFO_CSV !== 'undefined' && typeof TEST_DATA !== 'undefined');

if (isLocalMode && typeof BASIC_INFO_CSV !== 'undefined' && typeof TEST_DATA !== 'undefined') {
    console.log('ローカルモードで実行中');
    const basicInfo = parseBasicInfoCSV(BASIC_INFO_CSV);
    const singleData = parseSingleCSV(TEST_DATA.SINGLE_CSV);
    const contributionData = parseContributionCSV(TEST_DATA.CONTRIBUTION_CSV);
    
    basicInfoData = basicInfo;
    singleDataGlobal = singleData;
    allHashTags = collectAllHashTags(basicInfo);
    
    generateCards(basicInfo, singleData);
    loadFeeds(singleData);
    generateContributionGraph(contributionData);
    updateJumpMenuForCurrentTab(); // ローカルモード時はここでジャンプメニューを更新
} else {
    console.log('オンラインモードで実行中');
    
    Promise.all([
        fetch(PUBLIC_BASIC_INFO_CSV_URL).then(response => response.text()),
        fetch(PUBLIC_SINGLE_CSV_URL).then(response => response.text()),
        fetch(PUBLIC_CONTRIBUTION_CSV_URL).then(response => response.text())
    ])
    .then(([basicCsvText, singleCsvText, contributionCsvText]) => {
        const basicInfo = parseBasicInfoCSV(basicCsvText);
        const singleData = parseSingleCSV(singleCsvText);
        const contributionData = parseContributionCSV(contributionCsvText);
        
        console.log('[オンラインモード] singleData読み込み完了:', {
            総データ数: singleData.length,
            keyの種類: [...new Set(singleData.map(item => item.key))],
            サンプル: singleData.slice(0, 5)
        });
        
        basicInfoData = basicInfo;
        singleDataGlobal = singleData;
        allHashTags = collectAllHashTags(basicInfo);
        
        generateCards(basicInfo, singleData);
        loadFeeds(singleData);
        generateContributionGraph(contributionData);
        updateJumpMenuForCurrentTab(); // オンラインモード時はデータ読み込み完了後にジャンプメニューを更新
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

// ハッシュタグ一覧を表示（各タブごとに表示）
// この関数は、タブごとのハッシュタグ一覧表示に置き換えられました
// renderHashTagListForTab関数を使用してください


// ハッシュタグをクリック可能なリンクに変換
function convertHashTagsToLinks(hashTagString) {
    if (!hashTagString) return '';
    
    const tags = extractHashTags(hashTagString);
    return tags.map(tag => {
        return `<a href="#" onclick="applyHashTagFilter('${tag}'); return false;" style="margin-right: 0.25rem; color: #dc3545; text-decoration: none;">${tag}</a>`;
    }).join(' ');
}

// ハッシュタグフィルタを適用
function applyHashTagFilter(tag) {
    // 現在のタブを保存（フィルタモードでない場合のみ）
    if (!currentFilterTag && currentTab !== 'filter') {
        // 保存するタブがfilterでない場合のみ保存
        window.previousTab = currentTab;
    }
    
    currentFilterTag = tag;
    generateCards(basicInfoData, singleDataGlobal, tag);
    showFilterUI(tag);
    updateJumpMenuForCurrentTab();
    
    // フィルタUI表示位置にスムーズスクロール
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
}

// フィルタをクリア
function clearHashTagFilter() {
    currentFilterTag = null;
    
    // フィルタタブのコンテンツをクリア
    const filterContainer = document.getElementById('card-content-container-filter');
    if (filterContainer) {
        filterContainer.innerHTML = '';
    }
    
    generateCards(basicInfoData, singleDataGlobal, null);
    hideFilterUI();
    
    // タブボタンのfilteringクラスを削除
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('filtering');
    });
    
    // 元のタブに戻る（保存されたタブがない場合はgeneralに戻る）
    const targetTab = window.previousTab || 'general';
    currentTab = targetTab; // currentTabを直接設定
    switchTab(targetTab);
}

// フィルタUI表示
function showFilterUI(tag) {
    const container = document.getElementById('filter-ui-container');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = `
        <div class="alert alert-danger d-flex justify-content-between align-items-center">
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

// ジャンプメニューを更新（タブ対応版に置き換えられました）
// updateJumpMenuForCurrentTab関数を使用してください


// CSV解析関数（基本情報用） - comment列対応
function parseBasicInfoCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const keyIndex = headers.indexOf('key');
    const tabIdIndex = headers.indexOf('tabId');
    const tabIndex = headers.indexOf('tab');
    const categoryIndex = headers.indexOf('category');
    const summaryIndex = headers.indexOf('summary');
    const siteTitleIndex = headers.indexOf('siteTitle');
    const hashTagIndex = headers.indexOf('hashTag');
    const siteUrlIndex = headers.indexOf('siteUrl');
    const imageIndex = headers.indexOf('image');
    const subImageIndex = headers.indexOf('sub-image');
    const logoIndex = headers.indexOf('logo');
    const commentIndex = headers.indexOf('comment');
    const cardDateIndex = headers.indexOf('cardDate');
    
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
                tabId: values[tabIdIndex] || '',
                tab: values[tabIndex] || '',
                category: values[categoryIndex],
                summary: values[summaryIndex] || '',
                siteTitle: values[siteTitleIndex] || '',
                hashTag: values[hashTagIndex] || '',
                siteUrl: values[siteUrlIndex] || '',
                image: values[imageIndex] || '',
                subImage: values[subImageIndex] || '',
                logo: values[logoIndex] || '',
                comment: commentIndex >= 0 ? (values[commentIndex] || '') : '',
                cardDate: cardDateIndex >= 0 ? (values[cardDateIndex] || '') : ''
            });
        }
    }
    
    return items;
}

// CSV解析関数（Multi用） - 廃止されました（MULTI_CSVは使用されなくなりました）
/*
function parseMultiCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const keyIndex = headers.indexOf('key');
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
                title: values[titleIndex],
                link: values[linkIndex] || '',
                pubDate: values[dateIndex] || '' // dateをpubDateとして使用
            });
        }
    }
    
    return items;
}
*/

// keyを基にbasic-info.jsから情報を取得するヘルパー関数
function getBasicInfoByKey(key) {
    if (!basicInfoData) return null;
    return basicInfoData.find(item => item.key === key);
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
    
    console.log('[parseSingleCSV] ヘッダー:', headers);
    console.log('[parseSingleCSV] インデックス:', { keyIndex, titleIndex, linkIndex, dateIndex });
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; // 空行をスキップ
        
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
        
        // クォーテーションを除去する関数
        const removeQuotes = (str) => {
            if (str && str.startsWith('"') && str.endsWith('"')) {
                return str.slice(1, -1);
            }
            return str;
        };
        
        if (values[keyIndex] && values[titleIndex]) {
            const item = {
                key: removeQuotes(values[keyIndex]),
                title: removeQuotes(values[titleIndex]),
                link: removeQuotes(values[linkIndex] || ''),
                pubDate: removeQuotes(values[dateIndex] || '')
            };
            
            // デバッグログ（最初の3件のみ）
            if (i <= 3) {
                console.log(`[parseSingleCSV] 行${i}:`, item);
            }
            
            items.push(item);
        }
    }
    
    console.log(`[parseSingleCSV] 解析完了: ${items.length}件`);
    
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

// タブごとのハッシュタグ一覧を表示
function renderHashTagListForTab(tabName) {
    const container = document.getElementById(`hashtag-list-container-${tabName}`);
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

function generateCards(basicInfo, singleData, filterTag = null) {
    let filteredInfo = basicInfo;
    
    // デバッグログ: singleDataの内容を確認
    console.log('[generateCards] singleData受信:', {
        総データ数: singleData.length,
        サンプル: singleData.slice(0, 3)
    });
    
    // ハッシュタグフィルタを適用
    if (filterTag) {
        filteredInfo = filteredInfo.filter(item => {
            if (!item.hashTag) return false;
            const tags = extractHashTags(item.hashTag);
            return tags.includes(filterTag);
        });
    }
    
    const singleDataByKey = {};
    singleData.forEach(item => {
        if (!singleDataByKey[item.key]) {
            singleDataByKey[item.key] = [];
        }
        singleDataByKey[item.key].push(item);
    });
    
    // デバッグログ: keyごとのデータ数を確認
    console.log('[generateCards] singleDataByKey作成完了:', Object.keys(singleDataByKey).map(key => ({
        key,
        件数: singleDataByKey[key].length
    })));
    
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
    
    function isNewArticle(key, site = null) {
        // デバッグログ
        console.log(`[isNewArticle] チェック開始: key=${key}, siteTitle=${site ? site.siteTitle : 'null'}`);
        
        // basic-infoのcardDateをチェック（優先）
        if (site && site.cardDate) {
            const cardDate = new Date(site.cardDate);
            const today = new Date();
            const diffTime = today - cardDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            console.log(`[isNewArticle] cardDate検出: ${site.cardDate}, diffDays=${diffDays}`);
            
            if (diffDays <= NEW_BADGE_DAYS) {
                console.log(`[isNewArticle] ✓ cardDateによりNEW判定: ${key}`);
                return true;
            }
        }
        
        // singleDataの最新記事日付をチェック（フォールバック）
        const articles = singleDataByKey[key];
        
        console.log(`[isNewArticle] singleData確認: key=${key}, データ数=${articles ? articles.length : 0}`);
        
        if (!articles || articles.length === 0) {
            console.log(`[isNewArticle] ✗ singleDataなし: ${key}`);
            return false;
        }
        
        const latestArticle = articles[0];
        
        if (!latestArticle.pubDate) {
            console.log(`[isNewArticle] ✗ pubDateなし: ${key}`);
            return false;
        }
        
        console.log(`[isNewArticle] 最新記事日付: ${latestArticle.pubDate}`);
        
        const articleDate = new Date(latestArticle.pubDate);
        const today = new Date();
        const diffTime = today - articleDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log(`[isNewArticle] 記事経過日数: ${diffDays}日`);
        
        const result = diffDays <= NEW_BADGE_DAYS;
        console.log(`[isNewArticle] ${result ? '✓' : '✗'} 判定結果: ${key} = ${result}`);
        
        return result;
    }
    
    function generateCardHTML(site, showCategory = false, includeFeed = false) {
        const isNew = isNewArticle(site.key, site);
        const newBadgeHtml = isNew 
            ? '<span class="badge bg-danger new-badge">New!!</span>' 
            : '';
        
        const subImageHtml = site.subImage 
            ? `<img src="${site.subImage}" alt="sub-image" class="card-sub-image">` 
            : '';
        
        const logoHtml = (site.logo && site.logo.trim() !== '')
            ? `<img src="${site.logo}" alt="logo" class="card-logo-img">`
            : '';
        
        const hashTagHtml = site.hashTag ? `<div class="card-hashtag-area"><small class="text-muted">${convertHashTagsToLinks(site.hashTag)}</small></div>` : '';
        
        const categoryBadgeHtml = showCategory ? `<small class="text-muted" style="font-size: 0.75rem; display: block; margin-bottom: 0.25rem;">${site.category}</small>` : '';
        
        // RSSフィードのHTMLを生成（includeFeedがtrueの場合）
        let feedContentHtml = '';
        if (includeFeed) {
            console.log(`カード ${site.key} のフィード生成:`, singleDataByKey[site.key] ? `${singleDataByKey[site.key].length}件` : 'データなし');
            
            if (singleDataByKey[site.key]) {
                    const articles = singleDataByKey[site.key].slice(0, singleMaxLength);
                feedContentHtml = articles.map(item => {
                    if (!item.title) return '';
                    
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
                        titleSpan = `<a href="${item.link}" target="_blank" style="color: #dc3545; font-size: 0.9rem;">${item.title}</a>`;
                    } else {
                        titleSpan = `<span style="color: #6c757d; font-size: 0.9rem;">${item.title}</span>`;
                    }
                    
                    return `<div style="margin-bottom: 0.4rem; font-size: 0.9rem;">${dateSpan}${titleSpan}</div>`;
                }).join('');
            }
        }
        
        return `
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
                        <div id="single-rss-feed-container-${site.key}" class="rss-feed-container text-start">${feedContentHtml}</div>
                    </div>
                    <div class="card-action-area">
                        <a href="${site.siteUrl}" class="btn btn-primary card-action-button" target="_blank">Go to Site</a>
                        ${hashTagHtml}
                    </div>
                </div>
            </div>
        `;
    }
    
    // フィルタモード
    if (filterTag) {
        console.log('フィルタモード:', filterTag);
        console.log('フィルタされたカード数:', filteredInfo.length);
        filteredInfo.forEach(item => {
            console.log('- カード:', item.key, item.siteTitle, 'カテゴリ:', item.category);
        });
        
        // フィルタタブを表示
        currentTab = 'filter';
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            btn.classList.add('filtering');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const filterTab = document.getElementById('tab-filter');
        if (filterTab) {
            filterTab.classList.add('active');
        }
        
        const container = document.getElementById('card-content-container-filter');
        if (container) {
            container.innerHTML = '';
            
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card-container';
            
            // カテゴリ順序を維持するためのソート
            const categoryOrder = ['共通コンテンツ', 'けびんケビンソン', 'イイダリョウ'];
            const groupedByCategory = {};
            filteredInfo.forEach(item => {
                if (!groupedByCategory[item.category]) {
                    groupedByCategory[item.category] = [];
                }
                groupedByCategory[item.category].push(item);
            });
            
            const sortedCategories = Object.keys(groupedByCategory).sort((a, b) => {
                return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
            });
            
            sortedCategories.forEach(category => {
                const items = groupedByCategory[category];
                items.forEach(site => {
                    const cardWrapper = document.createElement('div');
                    cardWrapper.className = 'card-wrapper';
                    cardWrapper.id = site.key; // 各カードにIDを設定
                    cardWrapper.innerHTML = generateCardHTML(site, true, true); // includeFeed=trueを追加
                    cardContainer.appendChild(cardWrapper);
                });
            });
            
            container.appendChild(cardContainer);
            
            // ハッシュタグ一覧を更新
            renderHashTagListForTab('filter');
        }
    } else {
        // 通常モード: タブごとにカードを生成
        
        // CSVのtabフィールドを基にタブを動的に生成
        // タブ名とコンテナIDのマッピング
        const tabContainerMap = {
            'common': 'card-content-container-common',
            'kevin': 'card-content-container-kevin',
            'ryo': 'card-content-container-ryo'
        };
        
        // 各タブごとにアイテムをグループ化
        const itemsByTab = {
            'common': [],
            'kevin': [],
            'ryo': []
        };
        
        filteredInfo.forEach(item => {
            const tabName = item.tabId || 'common'; // デフォルトはcommon
            
            // 各カードはそれぞれのtabIdに対応するタブにのみ追加
            if (tabName === 'common' || tabName === '') {
                itemsByTab['common'].push(item);
            } else if (tabName === 'kevin') {
                itemsByTab['kevin'].push(item);
            } else if (tabName === 'ryo') {
                itemsByTab['ryo'].push(item);
            }
        });
        
        // 各タブを処理
        Object.entries(itemsByTab).forEach(([tabName, tabItems]) => {
            const containerId = tabContainerMap[tabName];
            if (!containerId) return;
            
            const container = document.getElementById(containerId);
            if (!container) return;
            
            container.innerHTML = '';
            
            // カテゴリごとにグループ化
            const groupedByCategory = {};
            tabItems.forEach(item => {
                if (!groupedByCategory[item.category]) {
                    groupedByCategory[item.category] = [];
                }
                groupedByCategory[item.category].push(item);
            });
            
            Object.entries(groupedByCategory).forEach(([category, items]) => {
                const sectionTitle = document.createElement('h3');
                sectionTitle.className = 'section-title';
                
                // categoryフィールドの値をタイトルとして使用
                sectionTitle.textContent = category;
                sectionTitle.id = items[0].key; // カテゴリの最初のアイテムのkeyをIDとする
                container.appendChild(sectionTitle);
                
                const cardContainer = document.createElement('div');
                cardContainer.className = 'card-container';
                
                items.forEach(site => {
                    const cardWrapper = document.createElement('div');
                    cardWrapper.className = 'card-wrapper';
                    cardWrapper.id = site.key; // 各カードにIDを設定
                    cardWrapper.innerHTML = generateCardHTML(site, false, true); // includeFeed=trueに変更
                    cardContainer.appendChild(cardWrapper);
                });
                
                container.appendChild(cardContainer);
                
                const hr = document.createElement('hr');
                container.appendChild(hr);
            });
        });
        
        // 各タブのハッシュタグ一覧を更新
        renderHashTagListForTab('general');
        renderHashTagListForTab('common');
        renderHashTagListForTab('kevin');
        renderHashTagListForTab('ryo');
        
        // タブリンクセクションを生成
        generateTabLinksSection();
    }
    
    // 通常モード時のみloadSingleFeedsを呼び出す（フィルタモードでは既に埋め込まれている）
    if (singleData && !filterTag) {
        // DOM更新が完了するのを待ってからフィードを読み込む
        setTimeout(() => {
            loadSingleFeeds(singleData, filteredInfo.map(item => item.key));
        }, 50);
    }
}
function loadFeeds(singleData) {
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
        
        singleData.slice(0, multiMaxLength).forEach(item => {
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
            
            // siteTitleのリンク（basic-info.jsから取得）
            let siteTitleHtml = '';
            const basicInfo = getBasicInfoByKey(item.key);
            if (basicInfo) {
                if (basicInfo.siteTitle && basicInfo.siteUrl) {
                    siteTitleHtml = `<a href="${basicInfo.siteUrl}" target="_blank" style="color: #dc3545; text-decoration: none;">${basicInfo.siteTitle}</a>`;
                } else if (basicInfo.siteTitle) {
                    siteTitleHtml = `<span style="color: #495057;">${basicInfo.siteTitle}</span>`;
                }
            }
            
            cell1.innerHTML = newBadgeHtml + siteTitleHtml;
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
                link.style.color = '#dc3545';
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
    console.log('loadSingleFeeds called with keys:', keys);
    console.log('singleData length:', singleData ? singleData.length : 'null');
    
    keys.forEach(key => {
        const feedContainer = document.getElementById(`single-rss-feed-container-${key}`);
        console.log(`Looking for container: single-rss-feed-container-${key}`, feedContainer ? 'FOUND' : 'NOT FOUND');
        
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
        
        console.log(`Filtered data for ${key}:`, filteredData.length, 'items');
        
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
                titleSpan = `<a href="${item.link}" target="_blank" style="color: #dc3545; font-size: 0.9rem;">${item.title}</a>`;
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
    let lastYearPosition = -999; // 最後に配置した年ラベルの位置
    const minYearGap = 60; // 年ラベル間の最小間隔（px）
    
    weeks.forEach((week, weekIndex) => {
        // 週の中で年が変わるかチェック
        for (let i = 0; i < week.length; i++) {
            const day = week[i];
            const year = day.date.getFullYear();
            
            if (year !== lastYear) {
                const currentPosition = 25 + weekIndex * 13;
                
                // 前の年ラベルから十分な距離がある場合、または最初の年の場合は表示
                if (weekIndex === 0 || currentPosition - lastYearPosition >= minYearGap) {
                    const yearLabel = document.createElement('div');
                    yearLabel.className = 'contribution-year';
                    yearLabel.textContent = `${year}年`;
                    yearLabel.style.position = 'absolute';
                    yearLabel.style.left = `${currentPosition}px`;
                    yearLabel.style.whiteSpace = 'nowrap'; // 改行を防ぐ
                    yearsRow.appendChild(yearLabel);
                    lastYearPosition = currentPosition;
                }
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
    let lastMonthPosition = -999; // 最後に配置した月ラベルの位置
    const minMonthGap = 40; // 月ラベル間の最小間隔（px）
    
    weeks.forEach((week, weekIndex) => {
        // 週の中で最初に表示される月を見つける
        for (let i = 0; i < week.length; i++) {
            const day = week[i];
            const month = day.date.getMonth();
            
            // 新しい月の最初の出現
            if (month !== lastMonth) {
                const currentPosition = 25 + weekIndex * 13;
                
                // 前の月ラベルから十分な距離がある場合のみ表示
                if (currentPosition - lastMonthPosition >= minMonthGap) {
                    const monthLabel = document.createElement('div');
                    monthLabel.className = 'contribution-month';
                    monthLabel.textContent = `${month + 1}月`;
                    monthLabel.style.position = 'absolute';
                    monthLabel.style.left = `${currentPosition}px`;
                    monthLabel.style.whiteSpace = 'nowrap'; // 改行を防ぐ
                    monthsRow.appendChild(monthLabel);
                    lastMonthPosition = currentPosition;
                }
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
    const body = document.body;
    
    if (header) {
        let ticking = false;
        
        const updateHeader = () => {
            if (window.scrollY > 50 || window.pageYOffset > 50) {
                header.classList.add('scrolled');
                body.classList.add('header-scrolled');
            } else {
                header.classList.remove('scrolled');
                body.classList.remove('header-scrolled');
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

// タブ初期化
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            switchTab(targetTab);
        });
    });
}

// タブ切り替え
function switchTab(tabName) {
    // フィルタモードの場合は何もしない
    if (currentFilterTag) {
        return;
    }
    
    // すべてのタブボタン（通常版とコンパクト版両方）とコンテンツから active と filtering クラスを削除
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('filtering');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 選択されたタブをアクティブにする（通常版とコンパクト版両方）
    const targetButtons = document.querySelectorAll(`.tab-button[data-tab="${tabName}"]`);
    const targetContent = document.getElementById(`tab-${tabName}`);
    
    if (targetButtons.length > 0 && targetContent) {
        targetButtons.forEach(btn => btn.classList.add('active'));
        targetContent.classList.add('active');
        currentTab = tabName;
        
        // previousTabも更新（次回のフィルタ用）
        if (tabName !== 'filter') {
            window.previousTab = tabName;
        }
        
        // ジャンプメニューを更新
        updateJumpMenuForCurrentTab();
        
        // ページトップにスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// タブリンクセクションを生成
function generateTabLinksSection() {
    const container = document.getElementById('tab-links-section');
    if (!container || !basicInfoData || !singleDataGlobal) return;
    
    // CSVデータから各タブの情報を動的に取得
    // タブごとに最初のアイテムを取得してリンクカードを作成
    const tabNames = ['common', 'kevin', 'ryo'];
    const tabData = [];
    
    tabNames.forEach(tabName => {
        // 該当するタブのアイテムを取得
        const tabItems = basicInfoData.filter(item => item.tabId === tabName);
        if (tabItems.length > 0) {
            // 最初のアイテムから情報を取得
            const firstItem = tabItems[0];
            tabData.push({
                tabId: tabName,
                tabName: firstItem.tab, // 表示用のタブ名
                name: firstItem.summary || firstItem.category, // summaryを優先、なければcategory
                key: firstItem.key,
                image: firstItem.image,
                subImage: firstItem.subImage
            });
        }
    });
    
    const linksHTML = tabData.map(tabInfo => {
        const image = tabInfo.image || '';
        
        // アイコン画像の決定
        let subImageSrc = '';
        if (tabInfo.tabId === 'ryo') {
            subImageSrc = './images/ryo-icon-tech.jpg';
        } else {
            subImageSrc = tabInfo.subImage || '';
        }
        
        // tabIdに対応するkeyプレフィックスのマッピング
        const tabKeyPrefixMap = {
            'common': 'cmp',
            'kevin': 'kevin',
            'ryo': 'ryo'
        };
        
        // 該当する記事を検索（keyプレフィックスで一致するもの）
        const keyPrefix = tabKeyPrefixMap[tabInfo.tabId] || tabInfo.tabId;
        const articles = singleDataGlobal.filter(article => 
            article.key.startsWith(keyPrefix)
        );
        
        console.log(`[generateTabLinksSection] タブ=${tabInfo.tabId}, keyPrefix=${keyPrefix}, 記事数=${articles.length}`);
        if (articles.length > 0) {
            console.log(`[generateTabLinksSection] 記事サンプル:`, articles.slice(0, 2));
        }
        
        // 最新10件を取得
        const sortedArticles = articles.sort((a, b) => {
            const dateA = new Date(a.pubDate);
            const dateB = new Date(b.pubDate);
            return dateB - dateA;
        }).slice(0, 10);
        
        const latestArticle = sortedArticles[0];
        
        // NEW!!バッジの表示判定
        let showNewBadge = false;
        if (latestArticle && latestArticle.pubDate) {
            const articleDate = new Date(latestArticle.pubDate);
            const today = new Date();
            const diffTime = today - articleDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            showNewBadge = diffDays <= NEW_BADGE_DAYS;
            console.log(`[generateTabLinksSection] タブ=${tabInfo.tabId}, 最新記事日=${latestArticle.pubDate}, 経過日数=${diffDays}, NEW判定=${showNewBadge}`);
        } else {
            console.log(`[generateTabLinksSection] タブ=${tabInfo.tabId}, 最新記事なしまたはpubDateなし`);
        }
        
        // RSSフィード形式のHTML生成（日付とNew!!バッジ付き）
        const feedItemsHTML = sortedArticles.map(article => {
            let dateSpan = '';
            if (article.pubDate) {
                const date = new Date(article.pubDate);
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
            
            return `
                <div class="rss-item" style="margin-bottom: 0.4rem; font-size: 0.9rem;">
                    ${dateSpan}<a href="${article.link}" target="_blank" rel="noopener noreferrer" style="color: #0d6efd; font-size: 0.9rem;">${article.title}</a>
                </div>
            `;
        }).join('');
        
        return `
            <div class="card-wrapper" id="${tabInfo.key}">
                <div class="card">
                    <a href="javascript:void(0);" onclick="switchTab('${tabInfo.tabId}'); return false;">
                        <img src="${image}" class="card-img-top" alt="${tabInfo.name}">
                        ${showNewBadge ? '<span class="new-badge">NEW!!</span>' : ''}
                        ${subImageSrc ? `<img src="${subImageSrc}" class="card-sub-image" alt="${tabInfo.name} Icon">` : ''}
                    </a>
                    <div class="card-body">
                        <h5 class="card-title">${tabInfo.name}</h5>
                        <div class="card-text">
                            <div class="rss-feed-container">
                                ${feedItemsHTML}
                            </div>
                        </div>
                        <div class="card-action-area">
                            <button class="btn btn-primary btn-sm card-action-button" onclick="switchTab('${tabInfo.tabId}')">Go to Tab</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="card-container">${linksHTML}</div>`;
}

// 現在のタブに応じてジャンプメニューを更新
function updateJumpMenuForCurrentTab() {
    const jumpMenuList = document.getElementById('jumpMenuList');
    if (!jumpMenuList) return;
    
    if (currentFilterTag) {
        // フィルタモード
        jumpMenuList.innerHTML = `
            <li><a class="dropdown-item" href="#" onclick="smoothScrollToTop(); return false;">ヘッダー</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="smoothScrollToElement('filter-ui-container'); return false;">フィルタ結果</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="smoothScrollToElement('footer'); return false;">フッター</a></li>
        `;
    } else {
        // タブモード
        let menuItems = '<li><a class="dropdown-item" href="#" onclick="smoothScrollToTop(); return false;">ヘッダー</a></li>';
        menuItems += '<li><hr class="dropdown-divider"></li>';
        
        if (currentTab === 'general') {
            // 各タブのカードへのリンクを生成
            const tabNames = ['common', 'kevin', 'ryo'];
            const tabKeyPrefixMap = {
                'common': 'cmp',
                'kevin': 'kevin',
                'ryo': 'ryo'
            };
            
            tabNames.forEach(tabName => {
                const keyPrefix = tabKeyPrefixMap[tabName] || tabName;
                const tabItems = basicInfoData.filter(item => item.key.startsWith(keyPrefix));
                if (tabItems.length > 0) {
                    const firstItem = tabItems[0];
                    menuItems += `<li><a class="dropdown-item" href="#" onclick="smoothScrollToElement('${firstItem.key}'); return false;">${firstItem.summary || firstItem.category}</a></li>`;
                }
            });
            menuItems += '<li><hr class="dropdown-divider"></li>';
            menuItems += '<li><a class="dropdown-item" href="#" onclick="smoothScrollToElement(\'contribution-graph\'); return false;">ヒートマップ</a></li>';
        } else {
            // 各タブのカードセクションへのリンクを生成
            const sections = getSectionsForTab(currentTab);
            sections.forEach(section => {
                menuItems += `<li><a class="dropdown-item" href="#" onclick="smoothScrollToElement('${section.id}'); return false;">${section.name}</a></li>`;
            });
        }
        
        menuItems += '<li><hr class="dropdown-divider"></li>';
        menuItems += '<li><a class="dropdown-item" href="#" onclick="smoothScrollToElement(\'footer\'); return false;">フッター</a></li>';
        
        jumpMenuList.innerHTML = menuItems;
    }
}

// スムーズスクロール関数
function smoothScrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function smoothScrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// タブごとのセクション（個別のカード）を取得
function getSectionsForTab(tabName) {
    if (!basicInfoData) return [];
    
    let keyPrefix = '';
    if (tabName === 'common') keyPrefix = 'cmp';
    else if (tabName === 'kevin') keyPrefix = 'kevin';
    else if (tabName === 'ryo') keyPrefix = 'ryo';
    
    // 該当するタブのアイテムをフィルタして、各カードの情報を返す
    const sections = basicInfoData
        .filter(item => item.key.startsWith(keyPrefix))
        .map(item => ({
            id: item.key, // 各カードのkeyをIDとする
            name: item.siteTitle // カードのタイトルを表示名とする
        }));
    
    return sections;
}

document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initHeaderTitleClick();
    updateCurrentYear();
    initTabs();
});