const singleMaxLength = 10;

// NEW!!バッジを表示する日数（変更可能なパラメータ）
const NEW_BADGE_DAYS = 30;

// 公開スプレッドシートのCSV URL
const PUBLIC_BASIC_INFO_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=0&single=true&output=csv';
const PUBLIC_MULTI_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=195059601&single=true&output=csv';
const PUBLIC_SINGLE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=900915820&single=true&output=csv';

// グローバル変数（ハッシュタグフィルタリング用）
let allHashTags = [];
let currentFilterTag = null;
let basicInfoData = null;
let multiDataGlobal = null;
let singleDataGlobal = null;
let currentTab = 'general'; // 現在のタブを追跡

// 日付ナビゲーション用のグローバル変数
let availableDates = []; // コンテンツが存在する日付の配列（ソート済み）
let currentDateIndex = -1; // 現在選択中の日付のインデックス
let currentSelectedDate = null; // 現在選択中の日付文字列（記事のない日付も含む）

// ヒートマップ選択状態管理用のグローバル変数
let activeTooltipElement = null; // 選択中のセル要素
let isTooltipPinned = false; // セルが選択固定されているかどうか

// 集計期間用のグローバル変数
let statsPeriodStart = null; // 集計開始日
let statsPeriodEnd = null; // 集計終了日

// 環境判定
const isLocalMode = window.location.protocol === 'file:' || (typeof BASIC_INFO_CSV !== 'undefined' && typeof TEST_DATA !== 'undefined');

// MULTI_CSVからコントリビューションデータを生成する関数
function generateContributionDataFromMulti(multiData) {
    if (!multiData || !Array.isArray(multiData) || multiData.length === 0) {
        console.warn('generateContributionDataFromMulti: multiDataが空です');
        return [];
    }
    
    console.log('generateContributionDataFromMulti: multiData件数:', multiData.length);
    
    // dateごとにグループ化してカウント
    const dateCounts = {};
    multiData.forEach(item => {
        if (item.date) {
            dateCounts[item.date] = (dateCounts[item.date] || 0) + 1;
        }
    });
    
    console.log('generateContributionDataFromMulti: ユニークな日付数:', Object.keys(dateCounts).length);
    console.log('generateContributionDataFromMulti: サンプルデータ:', Object.keys(dateCounts).slice(0, 5));
    
    // {date: '2024-12-09', count: 3} の形式に変換
    const result = Object.keys(dateCounts).map(date => ({
        date: date,
        count: dateCounts[date]
    }));
    
    console.log('generateContributionDataFromMulti: 生成されたデータ件数:', result.length);
    
    return result;
}

if (isLocalMode && typeof BASIC_INFO_CSV !== 'undefined' && typeof TEST_DATA !== 'undefined') {
    console.log('ローカルモードで実行中');
    const basicInfo = parseBasicInfoCSV(BASIC_INFO_CSV);
    const multiData = TEST_DATA.MULTI_CSV ? parseMultiCSV(TEST_DATA.MULTI_CSV) : [];
    const singleData = parseSingleCSV(TEST_DATA.SINGLE_CSV);
    const contributionData = generateContributionDataFromMulti(multiData);
    
    basicInfoData = basicInfo;
    multiDataGlobal = multiData;
    singleDataGlobal = singleData;
    allHashTags = collectAllHashTags(basicInfo);
    
    generateCards(basicInfo, singleData);
    loadFeeds(singleData);
    generateContributionGraph(contributionData);
    updateJumpMenuForCurrentTab();
} else {
    console.log('オンラインモードで実行中');
    
    Promise.all([
        fetch(PUBLIC_BASIC_INFO_CSV_URL).then(response => response.text()),
        fetch(PUBLIC_MULTI_CSV_URL).then(response => response.text()).catch(err => {
            console.warn('MULTI_CSV読み込み失敗:', err);
            return ''; // 空文字列を返して処理を継続
        }),
        fetch(PUBLIC_SINGLE_CSV_URL).then(response => response.text())
    ])
    .then(([basicCsvText, multiCsvText, singleCsvText]) => {
        console.log('=== 公開CSV読み込み成功 ===');
        console.log('BASIC_INFO_CSV文字数:', basicCsvText.length);
        console.log('MULTI_CSV文字数:', multiCsvText.length);
        console.log('SINGLE_CSV文字数:', singleCsvText.length);
        
        const basicInfo = parseBasicInfoCSV(basicCsvText);
        const multiData = multiCsvText ? parseMultiCSV(multiCsvText) : [];
        const singleData = parseSingleCSV(singleCsvText);
        
        console.log('パース後のsingleData件数:', singleData.length);
        const xData = singleData.filter(item => item.key && (item.key.includes('MainX') || item.key.includes('SubX')));
        console.log('X関連データ件数:', xData.length);
        xData.forEach(item => {
            console.log(`  ${item.key}: ${item.title ? item.title.substring(0, 30) + '...' : '(タイトルなし)'}`);
        });
        
        const contributionData = generateContributionDataFromMulti(multiData);
        
        basicInfoData = basicInfo;
        multiDataGlobal = multiData;
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

// X投稿用の日付フォーマット（mm月dd日 または yyyy年mm月dd日）
function formatXPostDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const currentYear = today.getFullYear();
    const postYear = date.getFullYear();
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if (postYear === currentYear) {
        return `${month}月${day}日`;
    } else {
        return `${postYear}年${month}月${day}日`;
    }
}

// URLから@ユーザー名を抽出
function extractXUsername(siteUrl) {
    if (!siteUrl) return '';
    
    // https://x.com/username または https://twitter.com/username から username を抽出
    const match = siteUrl.match(/(?:x\.com|twitter\.com)\/([^/?#]+)/);
    return match ? `@${match[1]}` : '';
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
    
    // DOMの更新を待ってからジャンプメニューを更新
    setTimeout(() => {
        updateJumpMenuForCurrentTab();
        
        // フィルタタブの先頭（"フィルタ: " の位置）にスクロール
        const filterTab = document.getElementById('tab-filter');
        if (filterTab) {
            const header = document.getElementById('main-header');
            const headerHeight = header ? header.offsetHeight : 0;
            const filterTabTop = filterTab.offsetTop;
            const scrollPosition = Math.max(0, filterTabTop - headerHeight - 20);
            
            console.log('Scrolling to filter tab:', {
                filterTab: filterTab.id,
                filterTabTop,
                headerHeight,
                scrollPosition
            });
            
            window.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        } else {
            console.error('Filter tab not found (tab-filter)');
        }
    }, 50);
    
    // 注: フィルタUI表示位置への自動スクロールは削除
    // ユーザーがジャンプメニューで自由にナビゲートできるようにするため
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
            <span>フィルタ: <strong>${tag}</strong></span>
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
                // 引用符は値に含めない
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

// CSV解析関数（Multi用）
function parseMultiCSV(csvText) {
    if (!csvText || csvText.trim() === '') {
        console.warn('parseMultiCSV: 空のCSVテキストが渡されました');
        return [];
    }
    
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) {
        console.warn('parseMultiCSV: CSVにデータ行がありません');
        return [];
    }
    
    console.log('parseMultiCSV: 行数:', lines.length);
    
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('parseMultiCSV: ヘッダー:', headers);
    
    const items = [];
    
    const keyIndex = headers.indexOf('key');
    const titleIndex = headers.indexOf('title');
    const linkIndex = headers.indexOf('link');
    const dateIndex = headers.indexOf('date');
    
    console.log('parseMultiCSV: dateインデックス:', dateIndex);
    
    if (keyIndex === -1 || titleIndex === -1) {
        console.warn('parseMultiCSV: 必要なカラム（key, title）が見つかりません');
        return [];
    }
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.trim() === '') continue; // 空行をスキップ
        
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
            // 日付形式を統一（yyyy/mm/dd → yyyy-mm-dd）
            let dateValue = values[dateIndex] || '';
            if (dateValue && dateValue.includes('/')) {
                dateValue = dateValue.replace(/\//g, '-');
            }
            
            items.push({
                key: values[keyIndex],
                title: values[titleIndex],
                link: values[linkIndex] || '',
                date: dateValue
            });
        }
    }
    
    console.log('parseMultiCSV: パース完了。アイテム数:', items.length);
    if (items.length > 0) {
        console.log('parseMultiCSV: 最初の3件:', items.slice(0, 3));
    }
    
    return items;
}

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
            // 日付形式を統一（yyyy/mm/dd → yyyy-mm-dd）
            let dateValue = removeQuotes(values[dateIndex] || '');
            if (dateValue && dateValue.includes('/')) {
                dateValue = dateValue.replace(/\//g, '-');
            }
            
            items.push({
                key: removeQuotes(values[keyIndex]),
                title: removeQuotes(values[titleIndex]),
                link: removeQuotes(values[linkIndex] || ''),
                date: dateValue
            });
        }
    }
    
    console.log('=== parseSingleCSV 完了 ===');
    console.log('総行数:', items.length);
    const xItems = items.filter(item => item.key && (item.key.includes('MainX') || item.key.includes('SubX')));
    console.log('X関連行数:', xItems.length);
    if (xItems.length > 0) {
        console.log('最初の3件:', xItems.slice(0, 3));
    }
    
    return items;
}

// CSV解析関数（Contribution用）
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
    
    // 各ハッシュタグの出現数をカウント（全カードを対象）
    const tagCounts = {};
    allHashTags.forEach(tag => {
        tagCounts[tag] = 0;
    });
    
    if (basicInfoData) {
        basicInfoData.forEach(item => {
            if (item.hashTag) {
                const tags = extractHashTags(item.hashTag);
                tags.forEach(tag => {
                    if (tagCounts.hasOwnProperty(tag)) {
                        tagCounts[tag]++;
                    }
                });
            }
        });
    }
    
    allHashTags.forEach(tag => {
        const tagButton = document.createElement('button');
        tagButton.className = 'hashtag-button';
        tagButton.textContent = `${tag} (${tagCounts[tag]})`;
        
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
    
    // デバッグ: singleDataByKeyの内容を確認
    console.log('=== singleDataByKey 構築完了 ===');
    console.log('全キー:', Object.keys(singleDataByKey));
    const xKeys = Object.keys(singleDataByKey).filter(k => k.includes('MainX') || k.includes('SubX'));
    console.log('X関連のキー:', xKeys);
    xKeys.forEach(key => {
        console.log(`  ${key}: ${singleDataByKey[key].length}件`);
    });
    
    // 各キーのデータを日付順にソート
    Object.keys(singleDataByKey).forEach(key => {
        singleDataByKey[key].sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return -1;
            if (!b.date) return 1;
            
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA; // 新しい順
        });
    });
    
    function isNewArticle(key, site = null) {
        // basic-infoのcardDateをチェック（優先）
        if (site && site.cardDate) {
            const cardDate = new Date(site.cardDate);
            const today = new Date();
            const diffTime = today - cardDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= NEW_BADGE_DAYS) {
                return true;
            }
        }
        
        // singleDataの最新記事日付をチェック（フォールバック）
        const articles = singleDataByKey[key];
        
        if (!articles || articles.length === 0) {
            return false;
        }
        
        const latestArticle = articles[0];
        
        if (!latestArticle.date) {
            return false;
        }
        
        const articleDate = new Date(latestArticle.date);
        const today = new Date();
        const diffTime = today - articleDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= NEW_BADGE_DAYS;
    }
    
    // カルーセル用のスライドHTMLを生成する関数
    function generateCarouselSlideForX(site, isActive = false) {
        const subImageHtml = site.subImage 
            ? `<img src="${site.subImage}" alt="sub-image" class="card-sub-image">` 
            : '';
        
        const logoHtml = (site.logo && site.logo.trim() !== '')
            ? `<img src="${site.logo}" alt="logo" class="card-logo-img">`
            : '';
        
        const hashTagHtml = site.hashTag ? `<div class="card-hashtag-area"><small class="text-muted">${convertHashTagsToLinks(site.hashTag)}</small></div>` : '';
        
        // Xタイムライン用のHTMLを生成
        let xTimelineHtml = '';
        
        // ローカルモードの場合はテストデータを使用
        if (isLocalMode && typeof X_TIMELINE_TEST_DATA !== 'undefined' && X_TIMELINE_TEST_DATA[site.key]) {
            xTimelineHtml = X_TIMELINE_TEST_DATA[site.key];
        } else if (site.comment && site.comment.includes('twitter-timeline')) {
            // オンラインモードの場合はcommentフィールドのHTMLを使用
            xTimelineHtml = site.comment;
        }
        
        return `
            <div class="carousel-item ${isActive ? 'active' : ''}">
                <div class="card">
                    <a href="${site.siteUrl}" target="_blank">
                        <img src="${site.image}" class="card-img-top" alt="${site.siteTitle}">
                        ${subImageHtml}
                        ${logoHtml}
                    </a>
                    <div class="card-body">
                        <h5 class="card-title">${site.siteTitle}</h5>
                        <div class="card-text">
                            <div class="x-timeline-container">
                                ${xTimelineHtml}
                            </div>
                        </div>
                        <div class="card-action-area">
                            <a href="${site.siteUrl}" class="btn btn-primary card-action-button" target="_blank">Go to Site</a>
                            ${hashTagHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // カルーセル用の全体カードスライドを生成する関数
    function generateCarouselSlideForGeneral(tabItems, singleDataByKey, isActive = false) {
        // 全体カード用の特定アイテムを取得
        let generalCardItem = null;
        const tabId = tabItems[0]?.tabId;
        
        if (tabId === 'common') {
            generalCardItem = tabItems.find(item => item.key === 'cmp2000');
        } else if (tabId === 'kevin') {
            generalCardItem = tabItems.find(item => item.key === 'kevinKevinson');
        } else if (tabId === 'ryo') {
            generalCardItem = tabItems.find(item => item.key === 'ryoIida');
        }
        
        if (!generalCardItem) {
            return '';
        }
        
        const subImageHtml = generalCardItem.subImage 
            ? `<img src="${generalCardItem.subImage}" alt="sub-image" class="card-sub-image">` 
            : '';
        
        const logoHtml = (generalCardItem.logo && generalCardItem.logo.trim() !== '')
            ? `<img src="${generalCardItem.logo}" alt="logo" class="card-logo-img">`
            : '';
        
        // MainX/SubX/全体カード自身を除外したアイテムから記事を統合
        const contentItems = tabItems.filter(item => 
            !item.key.includes('MainX') && 
            !item.key.includes('SubX') &&
            item.key !== 'cmp2000' &&
            item.key !== 'kevinKevinson' &&
            item.key !== 'ryoIida'
        );
        
        // 全アイテムの記事を統合
        let allArticles = [];
        contentItems.forEach(item => {
            if (singleDataByKey[item.key]) {
                const articles = singleDataByKey[item.key].map(article => ({
                    ...article,
                    sourceTitle: item.siteTitle
                }));
                allArticles = allArticles.concat(articles);
            }
        });
        
        // 日付順にソート
        allArticles.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(b.date) - new Date(a.date);
        });
        
        // 上位10件のみ
        const displayArticles = allArticles.slice(0, singleMaxLength);
        
        if (displayArticles.length === 0) {
            return ''; // 記事がない場合はスライド自体を生成しない
        }
        
        const feedContentHtml = displayArticles.map(item => {
            if (!item.title) return '';
            
            let dateSpan = '';
            if (item.date) {
                const date = new Date(item.date);
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
        
        const hashTagHtml = generalCardItem.hashTag ? `<div class="card-hashtag-area"><small class="text-muted">${convertHashTagsToLinks(generalCardItem.hashTag)}</small></div>` : '';
        
        return `
            <div class="carousel-item ${isActive ? 'active' : ''}">
                <div class="card">
                    <a href="${generalCardItem.siteUrl}" target="_blank">
                        <img src="${generalCardItem.image}" class="card-img-top" alt="${generalCardItem.siteTitle}">
                        ${subImageHtml}
                        ${logoHtml}
                    </a>
                    <div class="card-body">
                        <h5 class="card-title">${generalCardItem.siteTitle}</h5>
                        <div class="card-text">
                            <div class="rss-feed-container text-start carousel-feed-content">
                                ${feedContentHtml}
                            </div>
                        </div>
                        <div class="card-action-area">
                            <a href="${generalCardItem.siteUrl}" class="btn btn-primary card-action-button" target="_blank">Go to Site</a>
                            ${hashTagHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // タブごとのカルーセルHTMLを生成する関数
    function generateTabCarousel(tabId, tabItems, singleDataByKey) {
        const mainXItem = tabItems.find(item => item.key.includes('MainX'));
        const subXItem = tabItems.find(item => item.key.includes('SubX'));
        
        let slides = [];
        
        // スライド順序: MainX → SubX → 全体カード
        if (mainXItem) {
            slides.push(generateCarouselSlideForX(mainXItem, slides.length === 0));
        }
        
        if (subXItem) {
            slides.push(generateCarouselSlideForX(subXItem, slides.length === 0));
        }
        
        const generalSlide = generateCarouselSlideForGeneral(tabItems, singleDataByKey, slides.length === 0);
        if (generalSlide) {
            slides.push(generalSlide);
        }
        
        // スライドが0件の場合はカルーセルを生成しない
        if (slides.length === 0) {
            return '';
        }
        
        const carouselId = `carousel-${tabId}`;
        const indicatorsHtml = slides.map((_, index) => 
            `<button type="button" class="carousel-indicator-btn ${index === 0 ? 'active' : ''}" data-carousel-id="${carouselId}" data-slide-index="${index}"></button>`
        ).join('');
        
        return `
            <div class="carousel-container">
                <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel" data-bs-interval="6000">
                    <div class="carousel-inner">
                        ${slides.join('')}
                    </div>
                </div>
                <div class="carousel-external-controls">
                    <button class="btn btn-sm btn-outline-secondary carousel-nav-btn" data-bs-target="#${carouselId}" data-bs-slide="prev">◀◀</button>
                    <div class="carousel-indicators-external">
                        ${indicatorsHtml}
                    </div>
                    <button class="btn btn-sm btn-outline-secondary carousel-pause-btn" data-carousel-id="${carouselId}">
                        <span class="pause-icon">⏸</span>
                        <span class="play-icon" style="display:none;">▶</span>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary carousel-nav-btn" data-bs-target="#${carouselId}" data-bs-slide="next">▶▶</button>
                </div>
            </div>
        `;
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
        
        // MainX/SubXの場合はX投稿を表示
        let feedContentHtml = '';
        const isXTimeline = site.key.includes('MainX') || site.key.includes('SubX');
        
        if (isXTimeline) {
            console.log('=== X投稿カード デバッグ ===');
            console.log('site.key:', site.key);
            console.log('singleDataByKey[site.key]:', singleDataByKey[site.key]);
            console.log('データ件数:', singleDataByKey[site.key] ? singleDataByKey[site.key].length : 0);
            
            // SINGLE_CSVからX投稿データを取得
            if (singleDataByKey[site.key]) {
                const posts = singleDataByKey[site.key].slice(0, singleMaxLength);
                const username = extractXUsername(site.siteUrl);
                
                console.log('表示する投稿数:', posts.length);
                console.log('ユーザー名:', username);
                
                const postsHtml = posts.map(post => {
                    if (!post.title) return '';
                    
                    const dateDisplay = formatXPostDate(post.date);
                    const content = post.link 
                        ? `<a href="${post.link}" target="_blank" style="color: #1da1f2; text-decoration: none;">${post.title}</a>`
                        : post.title;
                    
                    return `
                        <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                            <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                                <strong style="font-size: 0.95rem;">${username}</strong>
                                <span style="color: #657786; margin-left: 0.5rem; font-size: 0.85rem;">· ${dateDisplay}</span>
                            </div>
                            <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                                ${content}
                            </p>
                        </div>
                    `;
                }).join('');
                
                feedContentHtml = `
                    <div class="x-timeline-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        ${postsHtml}
                    </div>
                `;
            } else {
                console.log('⚠️ singleDataByKey[site.key]が存在しません');
            }
            } else if (includeFeed) {
            // 通常のRSSフィード表示
            if (singleDataByKey[site.key]) {
                    const articles = singleDataByKey[site.key].slice(0, singleMaxLength);
                feedContentHtml = articles.map(item => {
                    if (!item.title) return '';
                    
                    let dateSpan = '';
                    if (item.date) {
                        const date = new Date(item.date);
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
                    <div class="card-text${isXTimeline ? ' x-timeline-wrapper' : ''}">
                        ${isXTimeline ? feedContentHtml : `<div id="single-rss-feed-container-${site.key}" class="rss-feed-container text-start">${feedContentHtml}</div>`}
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
        
        // フィルタタブを表示し、全体タブを選択状態にする
        currentTab = 'filter';
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            // 全体タブ（data-tab="general"）のみactiveにする
            if (btn.getAttribute('data-tab') === 'general') {
                btn.classList.add('active');
            }
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
            
            // Xウィジェットを再読み込み
            setTimeout(() => {
                refreshTwitterWidgets();
            }, 100);
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
            
            // MainX/SubX/全体カード（cmp2000、kevinKevinson、ryoIida）を除外したアイテムのみ通常カードとして表示
            const regularItems = tabItems.filter(item => 
                !item.key.includes('MainX') && 
                !item.key.includes('SubX') &&
                item.key !== 'cmp2000' &&
                item.key !== 'kevinKevinson' &&
                item.key !== 'ryoIida'
            );
            
            // カテゴリごとにグループ化
            const groupedByCategory = {};
            regularItems.forEach(item => {
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
                sectionTitle.id = `archive-section-${tabName}`; // カルーセルからのリンク用ID
                container.appendChild(sectionTitle);
                
                const cardContainer = document.createElement('div');
                cardContainer.className = 'card-container';
                
                // カルーセルを最初のカードとして追加
                const carouselHtml = generateTabCarousel(tabName, tabItems, singleDataByKey);
                if (carouselHtml) {
                    const carouselWrapper = document.createElement('div');
                    carouselWrapper.className = 'card-wrapper';
                    carouselWrapper.innerHTML = carouselHtml;
                    cardContainer.appendChild(carouselWrapper);
                }
                
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
        
        singleData.slice(0, singleMaxLength).forEach(item => {
            const date = item.date ? new Date(item.date) : null;
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
    keys.forEach(key => {
        const feedContainer = document.getElementById(`single-rss-feed-container-${key}`);
        
        if (!feedContainer) return;
        
        // 既に内容がある場合はスキップ（重複を防ぐ）
        if (feedContainer.innerHTML.trim() !== '') {
            return;
        }
        
        const filteredData = singleData
            .filter(item => item.key === key)
            .sort((a, b) => {
                // 日付なし項目を最上位に
                if (!a.date && !b.date) return 0;
                if (!a.date) return -1;
                if (!b.date) return 1;
                
                // 日付あり項目は新しい順（降順）
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
            })
            .slice(0, singleMaxLength);
        
        filteredData.forEach(item => {
            if (!item.title) return;
            
            const articleElement = document.createElement('div');
            articleElement.style.marginBottom = '0.4rem';
            articleElement.style.fontSize = '0.9rem';
            
            let dateSpan = '';
            if (item.date) {
                const date = new Date(item.date);
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
    
    // コンテンツが存在する日付のリストを初期化（ソート済み）
    availableDates = contributionData
        .filter(item => item.count > 0)
        .map(item => item.date)
        .sort(); // 昇順にソート
    
    console.log('Available dates initialized:', availableDates.length, 'dates');
    
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    // 集計期間をグローバル変数に保存
    statsPeriodStart = new Date(oneYearAgo);
    statsPeriodEnd = new Date(today);
    
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
        return `${year}-${month}-${day}`;
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
    graphContainer.style.position = 'relative'; // 子要素のabsolute配置の基準点にする
    
    const yearsRow = document.createElement('div');
    yearsRow.className = 'contribution-years';
    yearsRow.style.position = 'relative';
    yearsRow.style.height = '20px';
    yearsRow.style.marginBottom = '2px';
    
    let lastYear = -1;
    let lastYearPosition = -999; // 最後に配置した年ラベルの位置
    const edgeWeeks = 4; // 端の定義：最初と最後の4週間
    const totalWeeks = weeks.length; // 全週数を取得
    
    weeks.forEach((week, weekIndex) => {
        // 週の中で年が変わるかチェック
        for (let i = 0; i < week.length; i++) {
            const day = week[i];
            const year = day.date.getFullYear();
            
            if (year !== lastYear) {
                const currentPosition = 25 + weekIndex * 13;
                
                // 左端（最初の4週間）または右端（最後の4週間）かどうかで表示形式を決定
                const isLeftEdge = weekIndex < edgeWeeks;
                const isRightEdge = weekIndex >= totalWeeks - edgeWeeks;
                const isEdge = isLeftEdge || isRightEdge;
                const yearText = isEdge ? `${String(year).slice(-2)}年` : `${year}年`;
                
                // 年が変わる場合は必ず表示（lastYear !== yearの条件内なので常にtrue）
                const yearLabel = document.createElement('div');
                yearLabel.className = 'contribution-year';
                yearLabel.textContent = yearText;
                yearLabel.style.position = 'absolute';
                yearLabel.style.left = `${currentPosition}px`;
                yearLabel.style.whiteSpace = 'nowrap'; // 改行を防ぐ
                yearsRow.appendChild(yearLabel);
                lastYearPosition = currentPosition;
                
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
            
            // 新しい月の最初の出現（月が変わる場合は必ず表示）
            if (month !== lastMonth) {
                const currentPosition = 25 + weekIndex * 13;
                
                const monthLabel = document.createElement('div');
                monthLabel.className = 'contribution-month';
                monthLabel.textContent = `${month + 1}月`;
                monthLabel.style.position = 'absolute';
                monthLabel.style.left = `${currentPosition}px`;
                monthLabel.style.whiteSpace = 'nowrap'; // 改行を防ぐ
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
    
    // モバイル判定（iOS・Android）
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // アクティブなツールチップを管理する変数（ローカル）
    let activeTooltip = null;
    let activeDayData = null; // 固定表示中のdayデータ
    // activeTooltipElementとisTooltipPinnedはグローバル変数として定義済み
    
    // ツールチップを表示する関数
    function showTooltip(dayElement, day, clientX, clientY, pinned = false) {
        // 固定表示（クリック/タップ）の場合：データテーブルを更新
        if (pinned) {
            // すべての選択状態を解除（確実にクリア）
            const selectedCells = document.querySelectorAll('.contribution-day.selected');
            selectedCells.forEach(cell => {
                cell.classList.remove('selected');
            });
            
            // セルに選択状態を追加
            dayElement.classList.add('selected');
            
            activeTooltipElement = dayElement;
            isTooltipPinned = true;
            activeDayData = day;
            
            // データテーブルを更新（関数が存在する場合のみ）
            if (typeof updateDataTable === 'function') {
                updateDataTable(day.dateStr);
            }
        } else {
            // ホバー時：既存のホバーツールチップを削除（固定表示は維持）
            if (activeTooltip && !isTooltipPinned) {
                activeTooltip.remove();
                activeTooltip = null;
            }
            
            // 曜日を取得
            const date = new Date(day.dateStr);
            const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
            const formattedDate = day.dateStr.replace(/-/g, '/');
            const tooltipText = `${formattedDate}(${dayOfWeek}) - ${day.count}件`;
            
            // ホバー時：マウス追従のツールチップ（選択状態は維持）
            const tooltip = document.createElement('div');
            tooltip.className = 'contribution-tooltip';
            tooltip.textContent = tooltipText;
            tooltip.style.display = 'block';
            tooltip.style.position = 'fixed';
            tooltip.style.zIndex = '10000';
            
            // 一旦DOMに追加してサイズを取得
            document.body.appendChild(tooltip);
            const tooltipRect = tooltip.getBoundingClientRect();
            
            // visualViewportで座標変換（ページ座標 → ビューポート座標）
            const viewport = window.visualViewport;
            const offsetX = viewport ? viewport.offsetLeft : 0;
            const offsetY = viewport ? viewport.offsetTop : 0;
            const viewportWidth = viewport ? viewport.width : window.innerWidth;
            const viewportHeight = viewport ? viewport.height : window.innerHeight;
            
            // マウス位置もビューポート座標に変換
            let left = clientX - offsetX + 10;
            let top = clientY - offsetY - 30;
            
            // 画面からはみ出る場合の調整
            if (left + tooltipRect.width > viewportWidth - 10) {
                left = clientX - offsetX - tooltipRect.width - 10;
            }
            if (top < 10) {
                top = clientY - offsetY + 10;
            }
            if (top + tooltipRect.height > viewportHeight - 10) {
                top = clientY - offsetY - tooltipRect.height - 10;
            }
            
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
            
            // ホバーツールチップだけを設定（選択状態は維持）
            activeTooltip = tooltip;
        }
    }
    
    // ツールチップを非表示にする関数
    function hideTooltip() {
        if (activeTooltip) {
            activeTooltip.remove();
            activeTooltip = null;
        }
        if (activeTooltipElement) {
            activeTooltipElement.classList.remove('selected');
            activeTooltipElement = null;
        }
        isTooltipPinned = false;
        activeDayData = null;
        
        // データテーブルをクリア（関数が存在する場合のみ）
        if (typeof clearDataTable === 'function') {
            clearDataTable();
        }
    }
    
    weeks.forEach(week => {
        const weekElement = document.createElement('div');
        weekElement.className = 'contribution-week';
        
        week.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = `contribution-day level-${day.level}`;
            dayElement.dataset.date = day.dateStr;
            dayElement.dataset.count = day.count;
            
            // ホバー時：ツールチップを表示（PCのみ）
            if (!isMobile) {
                dayElement.addEventListener('mouseenter', (e) => {
                    showTooltip(dayElement, day, e.clientX, e.clientY, false);
                });
                
                // マウス移動：ツールチップを追従（ホバーツールチップのみ、PCのみ）
                dayElement.addEventListener('mousemove', (e) => {
                    if (activeTooltip) {
                        const tooltipRect = activeTooltip.getBoundingClientRect();
                        
                        // visualViewportで座標変換（ページ座標 → ビューポート座標）
                        const viewport = window.visualViewport;
                        const offsetX = viewport ? viewport.offsetLeft : 0;
                        const offsetY = viewport ? viewport.offsetTop : 0;
                        const viewportWidth = viewport ? viewport.width : window.innerWidth;
                        const viewportHeight = viewport ? viewport.height : window.innerHeight;
                        
                        // マウス位置もビューポート座標に変換
                        let left = e.clientX - offsetX + 10;
                        let top = e.clientY - offsetY - 30;
                        
                        // 画面からはみ出る場合の調整
                        if (left + tooltipRect.width > viewportWidth - 10) {
                            left = e.clientX - offsetX - tooltipRect.width - 10;
                        }
                        if (top < 10) {
                            top = e.clientY - offsetY + 10;
                        }
                        if (top + tooltipRect.height > viewportHeight - 10) {
                            top = e.clientY - offsetY - tooltipRect.height - 10;
                        }
                        
                        activeTooltip.style.left = `${left}px`;
                        activeTooltip.style.top = `${top}px`;
                    }
                });
                
                // マウスを離す：ホバーツールチップだけを消す（固定表示は維持、PCのみ）
                dayElement.addEventListener('mouseleave', () => {
                    if (activeTooltip) {
                        activeTooltip.remove();
                        activeTooltip = null;
                    }
                });
            }
            
            // クリック/タップ：ツールチップを固定表示/解除（PC・スマホ共通）
            dayElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // 同じセルを再度クリック → 固定解除
                if (activeTooltipElement === dayElement && isTooltipPinned) {
                    hideTooltip();
                } else {
                    // 新しいツールチップを固定表示
                    showTooltip(dayElement, day, e.clientX, e.clientY, true);
                }
            });
            
            weekElement.appendChild(dayElement);
        });
        
        weeksContainer.appendChild(weekElement);
    });
    
    // 画面の他の場所をクリック/タップした時に固定表示を閉じる
    document.addEventListener('click', (e) => {
        // ナビゲーションボタンやデータテーブル領域のクリックは無視
        const isNavButton = e.target.classList.contains('date-nav-btn') || 
                           e.target.id === 'date-prev-btn' || 
                           e.target.id === 'date-next-btn';
        const isDataTable = e.target.closest('.contribution-data-table-container');
        
        if (isTooltipPinned && 
            !e.target.classList.contains('contribution-day') && 
            !isNavButton && 
            !isDataTable) {
            hideTooltip();
        }
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
    
    // 横スクロールを右端に初期設定
    const graphWrapper = document.querySelector('.contribution-graph-wrapper');
    if (graphWrapper) {
        setTimeout(() => {
            graphWrapper.scrollLeft = graphWrapper.scrollWidth;
        }, 100);
    }
    
    // データテーブル表示エリアを追加（.contribution-graph-wrapperの外、兄弟要素として）
    if (graphWrapper && graphWrapper.parentElement) {
        const dataTableContainer = document.createElement('div');
        dataTableContainer.className = 'contribution-data-table-container';
        dataTableContainer.id = 'contribution-data-table';
        
        // 初期状態のHTML
        dataTableContainer.innerHTML = `
            <div class="data-table-header">
                <div class="date-navigation" style="display: flex; justify-content: center; align-items: center; gap: 1rem;">
                    <button id="date-prev-btn" class="date-nav-btn" onclick="navigateDate(-1)" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #dc3545; padding: 0.25rem 0.5rem;" disabled>◀︎</button>
                    <div style="text-align: center;">
                        <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.25rem;">選択日付</div>
                        <div id="selected-date-display" style="font-weight: bold;">日付を選択してください</div>
                    </div>
                    <button id="date-next-btn" class="date-nav-btn" onclick="navigateDate(1)" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #dc3545; padding: 0.25rem 0.5rem;" disabled>▶︎</button>
                </div>
            </div>
            <div class="data-table-content" id="data-table-content">
                <p class="text-muted text-center">セルを選択すると投稿内容が表示されます</p>
            </div>
        `;
        
        // graphWrapperの次の兄弟要素として挿入
        graphWrapper.parentElement.insertBefore(dataTableContainer, graphWrapper.nextSibling);
        
        // 最新日付を自動選択（データテーブルがDOMに追加された後）
        setTimeout(() => {
            if (availableDates && availableDates.length > 0) {
                const latestDate = availableDates[availableDates.length - 1];
                console.log('Auto-selecting latest date:', latestDate);
                
                // データテーブルを更新
                updateDataTable(latestDate);
                
                // ヒートマップのセルも選択状態にする
                selectDateOnHeatmap(latestDate);
            }
        }, 100);
    }
}

// データテーブルを更新する関数
function updateDataTable(dateStr) {
    const dateDisplay = document.getElementById('selected-date-display');
    const tableContent = document.getElementById('data-table-content');
    
    if (!dateDisplay || !tableContent) {
        console.warn('Data table elements not found');
        return;
    }
    
    // 必要なデータが揃っているかチェック
    if (!multiDataGlobal || !Array.isArray(multiDataGlobal) || multiDataGlobal.length === 0) {
        tableContent.innerHTML = '<p class="text-muted text-center">データがありません</p>';
        return;
    }
    
    if (!basicInfoData || !Array.isArray(basicInfoData) || basicInfoData.length === 0) {
        console.warn('basicInfoData is not available');
        tableContent.innerHTML = '<p class="text-muted text-center">データがありません</p>';
        return;
    }
    
    const matchingData = multiDataGlobal.filter(item => item.date === dateStr);
    
    // 日付を表示（yyyy/mm/dd(aaa) - n件 形式）
    const date = new Date(dateStr);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    const formattedDate = dateStr.replace(/-/g, '/') + '(' + dayOfWeek + ') - ' + matchingData.length + '件';
    dateDisplay.textContent = formattedDate;
    
    if (matchingData.length === 0) {
        tableContent.innerHTML = '<p class="text-muted text-center">データがありません</p>';
        // 記事がない場合でもナビゲーションボタンの状態を更新
        updateNavigationButtons(dateStr);
        return;
    }
    
    // データを組み合わせて表示用配列を作成
    const displayData = matchingData.map(multiItem => {
        // basicInfoのkeyがmultiItemのkeyで始まるものを取得
        const basicInfo = basicInfoData.find(basic => basic.key.startsWith(multiItem.key));
        
        if (!basicInfo) {
            console.warn(`No matching basicInfo found for key: ${multiItem.key}`);
            return null;
        }
        
        return {
            summary: basicInfo.summary || '',
            tabId: basicInfo.tabId || '',
            siteTitle: basicInfo.siteTitle || '',
            siteUrl: basicInfo.siteUrl || '',
            title: multiItem.title || '',
            link: multiItem.link || ''
        };
    }).filter(item => item !== null);
    
    if (displayData.length === 0) {
        tableContent.innerHTML = '<p class="text-muted text-center">データがありません</p>';
        return;
    }
    
    // PC版: テーブル形式
    const tableHTML = `
        <div class="data-table-desktop">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th style="width: 20%;">Tab</th>
                        <th style="width: 25%;">Site</th>
                        <th style="width: 55%;">Title（投稿内容）</th>
                    </tr>
                </thead>
                <tbody>
                    ${displayData.map(item => `
                        <tr>
                            <td>
                                <a href="javascript:void(0);" onclick="switchTab('${item.tabId}'); return false;" class="text-decoration-none">
                                    ${item.summary}
                                </a>
                            </td>
                            <td>
                                ${item.siteUrl ? `<a href="${item.siteUrl}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">${item.siteTitle}</a>` : item.siteTitle}
                            </td>
                            <td>
                                <strong>
                                    ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">${item.title}</a>` : item.title}
                                </strong>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // モバイル版: カード形式
    const cardsHTML = `
        <div class="data-table-mobile">
            ${displayData.map(item => `
                <div class="data-card">
                    <div class="data-card-title">
                        ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">${item.title}</a>` : item.title}
                    </div>
                    <div class="data-card-meta">
                        <span class="data-card-label">Tab:</span>
                        <a href="javascript:void(0);" onclick="switchTab('${item.tabId}'); return false;" class="text-decoration-none">
                            ${item.summary}
                        </a>
                        <span class="data-card-separator">|</span>
                        <span class="data-card-label">Site:</span>
                        ${item.siteUrl ? `<a href="${item.siteUrl}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">${item.siteTitle}</a>` : item.siteTitle}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    tableContent.innerHTML = tableHTML + cardsHTML;
    
    // ナビゲーションボタンの状態を更新
    updateNavigationButtons(dateStr);
}

// タブごとの統計情報を計算してバーチャートを表示する関数
function displayTabStatisticsChart() {
    const tableContent = document.getElementById('data-table-content');
    const dateDisplay = document.getElementById('selected-date-display');
    
    if (!tableContent || !dateDisplay) {
        return;
    }
    
    // 必要なデータがあるかチェック
    if (!multiDataGlobal || !basicInfoData || !statsPeriodStart || !statsPeriodEnd) {
        tableContent.innerHTML = '<p class="text-muted text-center">統計情報を表示できません</p>';
        return;
    }
    
    // 集計期間の文字列を作成（yyyy/mm形式）
    const startYearMonth = `${statsPeriodStart.getFullYear()}/${String(statsPeriodStart.getMonth() + 1).padStart(2, '0')}`;
    const endYearMonth = `${statsPeriodEnd.getFullYear()}/${String(statsPeriodEnd.getMonth() + 1).padStart(2, '0')}`;
    const periodText = `${startYearMonth}〜${endYearMonth}`;
    
    // 日付表示を更新
    dateDisplay.textContent = periodText;
    
    // 1年分のデータをフィルタ
    const oneYearData = multiDataGlobal.filter(item => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        return itemDate >= statsPeriodStart && itemDate <= statsPeriodEnd;
    });
    
    // タブ情報を取得（common, kevin, ryo）
    const tabInfo = [
        { tabId: 'common', keyPrefix: 'cmp' },
        { tabId: 'kevin', keyPrefix: 'kevin' },
        { tabId: 'ryo', keyPrefix: 'ryo' }
    ];
    
    // 各タブの記事数を集計
    const tabStats = tabInfo.map(tab => {
        const count = oneYearData.filter(item => item.key.startsWith(tab.keyPrefix)).length;
        
        // basicInfoからtabを取得
        const basicInfo = basicInfoData.find(item => item.tabId === tab.tabId);
        const tabName = basicInfo ? basicInfo.tab : tab.tabId;
        
        return {
            tabId: tab.tabId,
            tabName: tabName,
            count: count
        };
    });
    
    // 合計件数を計算
    const totalCount = tabStats.reduce((sum, stat) => sum + stat.count, 0);
    
    // 割合を計算
    tabStats.forEach(stat => {
        stat.percentage = totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0;
    });
    
    // 件数が多い順にソート
    tabStats.sort((a, b) => b.count - a.count);
    
    // PC版：テーブル形式
    const tableHTML = `
        <div class="tab-stats-table-view">
            <table class="table table-bordered table-sm mb-0">
                <thead>
                    <tr>
                        <th style="width: 25%;">タブ名</th>
                        <th style="width: 20%;">件数</th>
                        <th style="width: 20%;">割合</th>
                        <th style="width: 35%;">グラフ</th>
                    </tr>
                </thead>
                <tbody>
                    ${tabStats.map(stat => `
                        <tr>
                            <td>
                                <a href="javascript:void(0);" onclick="switchTab('${stat.tabId}'); return false;" class="text-decoration-none" style="color: #dc3545; font-weight: 500;">
                                    ${stat.tabName}
                                </a>
                            </td>
                            <td>${stat.count}件</td>
                            <td>${stat.percentage}%</td>
                            <td>
                                <div class="tab-stats-bar-wrapper-table">
                                    <div class="tab-stats-bar" style="width: ${stat.percentage}%;"></div>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // モバイル版：バーチャート形式
    const chartHTML = `
        <div class="tab-stats-chart-view">
            <div class="tab-stats-chart">
                ${tabStats.map(stat => `
                    <div class="tab-stats-item">
                        <div class="tab-stats-label">
                            <a href="javascript:void(0);" onclick="switchTab('${stat.tabId}'); return false;" class="text-decoration-none" style="color: #dc3545; font-weight: 500;">
                                ${stat.tabName}
                            </a>
                            <span style="color: #495057;"> | 件数：${stat.count}件 | 割合：${stat.percentage}%</span>
                        </div>
                        <div class="tab-stats-bar-wrapper">
                            <div class="tab-stats-bar" style="width: ${stat.percentage}%;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    tableContent.innerHTML = tableHTML + chartHTML;
}

// データテーブルをクリアする関数
function clearDataTable() {
    // ナビゲーションボタンを有効化（未選択時に最古/最新に飛べるように）
    const prevBtn = document.getElementById('date-prev-btn');
    const nextBtn = document.getElementById('date-next-btn');
    if (prevBtn && availableDates && availableDates.length > 0) {
        prevBtn.disabled = false;
        prevBtn.style.color = '#dc3545';
        prevBtn.style.cursor = 'pointer';
    }
    if (nextBtn && availableDates && availableDates.length > 0) {
        nextBtn.disabled = false;
        nextBtn.style.color = '#dc3545';
        nextBtn.style.cursor = 'pointer';
    }
    
    currentDateIndex = -1;
    currentSelectedDate = null;
    activeTooltipElement = null;
    isTooltipPinned = false;
    
    // バーチャートを表示
    displayTabStatisticsChart();
}

// ナビゲーションボタンの状態を更新する関数
function updateNavigationButtons(dateStr) {
    const prevBtn = document.getElementById('date-prev-btn');
    const nextBtn = document.getElementById('date-next-btn');
    
    if (!prevBtn || !nextBtn || !availableDates || availableDates.length === 0) {
        return;
    }
    
    // 現在選択中の日付を保存
    currentSelectedDate = dateStr;
    
    // 現在の日付のインデックスを取得
    currentDateIndex = availableDates.indexOf(dateStr);
    
    if (currentDateIndex === -1) {
        // 記事のない日付の場合：挿入位置を計算
        // この日付が availableDates のどこに入るかを見つける
        let insertIndex = 0;
        for (let i = 0; i < availableDates.length; i++) {
            if (dateStr < availableDates[i]) {
                insertIndex = i;
                break;
            }
            insertIndex = i + 1;
        }
        
        // 前へボタンの状態：前に記事のある日付があるか
        if (insertIndex === 0) {
            // 選択日付より前に記事がない
            prevBtn.disabled = true;
            prevBtn.style.color = '#6c757d';
            prevBtn.style.cursor = 'not-allowed';
        } else {
            // 選択日付より前に記事がある
            prevBtn.disabled = false;
            prevBtn.style.color = '#dc3545';
            prevBtn.style.cursor = 'pointer';
        }
        
        // 次へボタンの状態：後に記事のある日付があるか
        if (insertIndex >= availableDates.length) {
            // 選択日付より後に記事がない
            nextBtn.disabled = true;
            nextBtn.style.color = '#6c757d';
            nextBtn.style.cursor = 'not-allowed';
        } else {
            // 選択日付より後に記事がある
            nextBtn.disabled = false;
            nextBtn.style.color = '#dc3545';
            nextBtn.style.cursor = 'pointer';
        }
        return;
    }
    
    // 記事のある日付の場合：通常の処理
    // 前へボタンの状態
    if (currentDateIndex === 0) {
        // 最初の日付
        prevBtn.disabled = true;
        prevBtn.style.color = '#6c757d';
        prevBtn.style.cursor = 'not-allowed';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.color = '#dc3545';
        prevBtn.style.cursor = 'pointer';
    }
    
    // 次へボタンの状態
    if (currentDateIndex === availableDates.length - 1) {
        // 最後の日付
        nextBtn.disabled = true;
        nextBtn.style.color = '#6c757d';
        nextBtn.style.cursor = 'not-allowed';
    } else {
        nextBtn.disabled = false;
        nextBtn.style.color = '#dc3545';
        nextBtn.style.cursor = 'pointer';
    }
}

// 日付をナビゲートする関数
function navigateDate(direction) {
    if (!availableDates || availableDates.length === 0) {
        return;
    }
    
    let newDateStr = null;
    
    // 日付が選択されていない場合：◀︎で最古、▶︎で最新に飛ぶ
    if (!currentSelectedDate || currentSelectedDate === null) {
        if (direction === -1) {
            // 前へ：最古の日付
            newDateStr = availableDates[0];
        } else if (direction === 1) {
            // 次へ：最新の日付
            newDateStr = availableDates[availableDates.length - 1];
        }
        
        if (newDateStr) {
            // データテーブルを更新
            updateDataTable(newDateStr);
            
            // ヒートマップのセルも選択状態にする
            selectDateOnHeatmap(newDateStr);
        }
        return;
    }
    
    if (currentDateIndex === -1) {
        // 記事のない日付の場合：前後で最も近い記事のある日付を探す
        if (direction === -1) {
            // 前へ：選択日付より前で最も近い記事のある日付
            for (let i = availableDates.length - 1; i >= 0; i--) {
                if (availableDates[i] < currentSelectedDate) {
                    newDateStr = availableDates[i];
                    break;
                }
            }
        } else if (direction === 1) {
            // 次へ：選択日付より後で最も近い記事のある日付
            for (let i = 0; i < availableDates.length; i++) {
                if (availableDates[i] > currentSelectedDate) {
                    newDateStr = availableDates[i];
                    break;
                }
            }
        }
        
        if (!newDateStr) {
            return; // 見つからない場合は何もしない
        }
    } else {
        // 記事のある日付の場合：通常の処理
        const newIndex = currentDateIndex + direction;
        
        // 範囲チェック
        if (newIndex < 0 || newIndex >= availableDates.length) {
            return;
        }
        
        newDateStr = availableDates[newIndex];
    }
    
    // データテーブルを更新
    updateDataTable(newDateStr);
    
    // ヒートマップのセルも選択状態にする
    selectDateOnHeatmap(newDateStr);
}

// グローバルスコープに明示的に登録
window.navigateDate = navigateDate;

// ヒートマップのセルを選択状態にする関数
function selectDateOnHeatmap(dateStr) {
    console.log('selectDateOnHeatmap called with:', dateStr);
    
    // 既存の選択状態を解除
    const selectedCells = document.querySelectorAll('.contribution-day.selected');
    console.log('Removing selection from', selectedCells.length, 'cells');
    selectedCells.forEach(cell => {
        cell.classList.remove('selected');
    });
    
    // 新しいセルを選択状態にする
    const targetCell = document.querySelector(`.contribution-day[data-date="${dateStr}"]`);
    console.log('Target cell found:', !!targetCell, 'for date:', dateStr);
    
    if (targetCell) {
        targetCell.classList.add('selected');
        // グローバル変数を更新
        activeTooltipElement = targetCell;
        isTooltipPinned = true;
        console.log('Cell selected successfully, classList:', targetCell.classList.toString());
    } else {
        console.warn('Cell not found for date:', dateStr);
    }
}

// ヘッダー初期化
function initHeaderScroll() {
    const header = document.getElementById('main-header');
    const body = document.body;
    const normalHeader = header ? header.querySelector('.header-title-normal') : null;
    const compactHeader = header ? header.querySelector('.header-compact') : null;
    
    console.log('initHeaderScroll called');
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
                body.classList.add('header-scrolled');
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
                body.classList.remove('header-scrolled');
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
        console.error('Header elements not found!');
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
    // フィルタモードの場合はフィルタを解除してから通常のタブ切り替えを行う
    if (currentFilterTag) {
        currentFilterTag = null;
        
        // フィルタタブのコンテンツをクリア
        const filterContainer = document.getElementById('card-content-container-filter');
        if (filterContainer) {
            filterContainer.innerHTML = '';
        }
        
        // フィルタUIを非表示
        hideFilterUI();
        
        // カードを再生成（フィルタなし）
        generateCards(basicInfoData, singleDataGlobal, null);
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
        
        // カルーセルの再生・停止ボタンをリセット
        setTimeout(() => {
            resetCarouselPlayPauseButtons();
        }, 100);
        
        // 総合タブの場合、最新日付を自動選択
        if (tabName === 'general') {
            setTimeout(() => {
                if (availableDates && availableDates.length > 0) {
                    const latestDate = availableDates[availableDates.length - 1];
                    console.log('Auto-selecting latest date on general tab:', latestDate);
                    
                    // データテーブルを更新
                    updateDataTable(latestDate);
                    
                    // ヒートマップのセルも選択状態にする
                    selectDateOnHeatmap(latestDate);
                }
            }, 100);
        }
        
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
        
        // 該当するタブのカード数をカウント
        const tabCardCount = basicInfoData.filter(item => item.tabId === tabInfo.tabId).length;
        
        // tabIdに対応するkeyプレフィックスのマッピング
        const tabKeyPrefixMap = {
            'common': 'cmp',
            'kevin': 'kevin',
            'ryo': 'ryo'
        };
        
        // 該当する記事を検索（keyプレフィックスで一致するもの）
        const keyPrefix = tabKeyPrefixMap[tabInfo.tabId] || tabInfo.tabId;
        const articles = singleDataGlobal.filter(article => 
            article.key.startsWith(keyPrefix) && article.date // pubDateがある記事のみ
        );
        
        // 最新10件を取得
        const sortedArticles = articles.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            // Invalid Dateの場合は後ろに配置
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return 1;
            if (isNaN(dateB.getTime())) return -1;
            return dateB - dateA;
        }).slice(0, 10);
        
        const latestArticle = sortedArticles[0];
        
        // NEW!!バッジの表示判定
        let showNewBadge = false;
        if (latestArticle && latestArticle.date) {
            const articleDate = new Date(latestArticle.date);
            const today = new Date();
            const diffTime = today - articleDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            showNewBadge = diffDays <= NEW_BADGE_DAYS;
        }
        
        // RSSフィード形式のHTML生成（日付とNew!!バッジ付き）
        const feedItemsHTML = sortedArticles.map(article => {
            let dateSpan = '';
            if (article.date) {
                const date = new Date(article.date);
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
            
            // 基本情報からsiteTitleとsiteUrlを取得
            const basicInfo = basicInfoData.find(item => item.key === article.key);
            const siteTitle = basicInfo ? basicInfo.siteTitle : '';
            const siteUrl = basicInfo ? basicInfo.siteUrl : '';
            
            // リンクの有無で表示を分岐
            let titleSpan = '';
            
            // siteTitleリンクを生成
            let siteTitleSpan = '';
            if (siteTitle) {
                if (siteUrl) {
                    siteTitleSpan = ` <span style="color: #6c757d; font-size: 0.85rem;">(</span><a href="${siteUrl}" target="_blank" rel="noopener noreferrer" style="color: #dc3545; font-size: 0.85rem; text-decoration: none;">${siteTitle}</a><span style="color: #6c757d; font-size: 0.85rem;">)</span>`;
                } else {
                    siteTitleSpan = ` <span style="color: #6c757d; font-size: 0.85rem;">(${siteTitle})</span>`;
                }
            }
            
            if (article.link) {
                titleSpan = `<a href="${article.link}" target="_blank" rel="noopener noreferrer" style="color: #0d6efd; font-size: 0.9rem;">${article.title}</a>${siteTitleSpan}`;
            } else {
                titleSpan = `<span style="color: #6c757d; font-size: 0.9rem;">${article.title}</span>${siteTitleSpan}`;
            }
            
            return `
                <div class="rss-item" style="margin-bottom: 0.4rem; font-size: 0.9rem;">
                    ${dateSpan}${titleSpan}
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
                            <span style="margin-left: 0.5rem; color: #6c757d; font-size: 0.9rem;">コンテンツ数: ${tabCardCount}</span>
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
    
    console.log('updateJumpMenuForCurrentTab - currentFilterTag:', currentFilterTag, 'currentTab:', currentTab);
    
    if (currentFilterTag) {
        // フィルタモード - ヘッダー・フッターの2項目
        
        // フィルタ結果のカードを取得（ログ用）
        const filteredItems = basicInfoData.filter(item => {
            if (!item.hashTag) return false;
            const itemTags = extractHashTags(item.hashTag);
            return itemTags.includes(currentFilterTag);
        });
        
        console.log('フィルタモード: filteredItems数:', filteredItems.length);
        filteredItems.forEach(item => {
            console.log('  - カード:', item.key, item.siteTitle);
        });
        
        // フィルタモード時のジャンプメニュー
        let menuItems = '<li><a class="dropdown-item" href="#" onclick="smoothScrollToElement(\'filter-top\'); return false;">ヘッダー</a></li>';
        menuItems += '<li><hr class="dropdown-divider"></li>';
        menuItems += '<li><a class="dropdown-item" href="#" onclick="smoothScrollToElement(\'filter-bottom\'); return false;">フッター</a></li>';
        
        jumpMenuList.innerHTML = menuItems;
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
    console.log('smoothScrollToElement called with:', elementId);
    
    // フィルタモード用の特殊ID処理
    if (elementId === 'filter-top' || elementId === 'filter-bottom') {
        const filterTab = document.getElementById('tab-filter');
        if (!filterTab) {
            console.log('Filter tab not found');
            return;
        }
        
        const header = document.getElementById('main-header');
        const headerHeight = header ? header.offsetHeight : 0;
        
        let scrollPosition;
        
        if (elementId === 'filter-top') {
            // フィルタタブの先頭
            scrollPosition = filterTab.offsetTop - headerHeight - 20;
        } else if (elementId === 'filter-bottom') {
            // フィルタタブの最後
            const filterTabHeight = filterTab.offsetHeight;
            scrollPosition = filterTab.offsetTop + filterTabHeight - window.innerHeight + 50;
        }
        
        scrollPosition = Math.max(0, scrollPosition);
        
        console.log('=== Filter position scroll ===');
        console.log('Target:', elementId);
        console.log('Scroll position:', scrollPosition);
        console.log('==============================');
        
        window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
        });
        
        return;
    }
    
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Element not found:', elementId);
        return;
    }
    
    console.log('Element found:', element);
    
    // 通常モードの処理（以下は変更なし）
    const isMobile = window.innerWidth <= 768;
    
    const header = document.getElementById('main-header');
    const compactHeader = header ? header.querySelector('.header-compact') : null;
    
    let targetHeaderHeight = 0;
    if (compactHeader) {
        const originalDisplay = compactHeader.style.display;
        const originalPosition = compactHeader.style.position;
        const originalOpacity = compactHeader.style.opacity;
        const originalVisibility = compactHeader.style.visibility;
        
        compactHeader.style.display = 'flex';
        compactHeader.style.position = 'relative';
        compactHeader.style.opacity = '1';
        compactHeader.style.visibility = 'visible';
        
        targetHeaderHeight = compactHeader.offsetHeight;
        
        compactHeader.style.display = originalDisplay;
        compactHeader.style.position = originalPosition;
        compactHeader.style.opacity = originalOpacity;
        compactHeader.style.visibility = originalVisibility;
    } else if (header) {
        targetHeaderHeight = header.offsetHeight;
    }
    
    const additionalOffset = isMobile ? 60 : 20;
    
    const elementRect = element.getBoundingClientRect();
    const elementPosition = elementRect.top + window.pageYOffset;
    
    console.log('Element position details:', {
        'rect.top': elementRect.top,
        'pageYOffset': window.pageYOffset,
        'elementPosition (absolute)': elementPosition,
        'targetHeaderHeight': targetHeaderHeight,
        'additionalOffset': additionalOffset
    });
    
    let scrollToPosition = elementPosition - targetHeaderHeight - additionalOffset;
    scrollToPosition = Math.max(0, scrollToPosition);
    
    console.log('Final scroll to position:', scrollToPosition);
    
    window.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth'
    });
    
    setTimeout(() => {
        const currentHeader = document.getElementById('main-header');
        const currentHeaderHeight = currentHeader ? currentHeader.offsetHeight : 0;
        const currentElementRect = element.getBoundingClientRect();
        const currentElementPosition = currentElementRect.top + window.pageYOffset;
        const currentAdditionalOffset = window.innerWidth <= 768 ? 60 : 20;
        let adjustedPosition = currentElementPosition - currentHeaderHeight - currentAdditionalOffset;
        adjustedPosition = Math.max(0, adjustedPosition);
        
        if (Math.abs(window.pageYOffset - adjustedPosition) > 5) {
            console.log('Adjusting position to:', adjustedPosition);
            window.scrollTo({
                top: adjustedPosition,
                behavior: 'smooth'
            });
        }
    }, 600);
    
    if (elementId === 'contribution-graph') {
        setTimeout(() => {
            const graphWrapper = document.querySelector('.contribution-graph-wrapper');
            if (graphWrapper) {
                graphWrapper.scrollLeft = graphWrapper.scrollWidth - graphWrapper.clientWidth;
            }
        }, 700);
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

// カルーセルの再生・停止ボタンをデフォルト状態（再生中）にリセット
function resetCarouselPlayPauseButtons() {
    // すべてのカルーセルの再生・停止ボタンをリセット
    document.querySelectorAll('.carousel-pause-btn').forEach(btn => {
        const pauseIcon = btn.querySelector('.pause-icon');
        const playIcon = btn.querySelector('.play-icon');
        
        if (pauseIcon && playIcon) {
            // ⏸を表示（再生中の状態）
            pauseIcon.style.display = 'inline';
            playIcon.style.display = 'none';
        }
    });
    
    // すべてのカルーセルを再生状態にする
    document.querySelectorAll('[id^="carousel-"]').forEach(carouselElement => {
        let carousel = bootstrap.Carousel.getInstance(carouselElement);
        if (!carousel) {
            carousel = new bootstrap.Carousel(carouselElement, {
                interval: 6000,
                ride: 'carousel'
            });
        } else {
            // 既存のインスタンスがある場合は再生開始
            carousel.cycle();
        }
    });
}

// カルーセルの一時停止/再生機能を初期化
function initCarouselControls() {
    // 一時停止/再生ボタン
    document.querySelectorAll('.carousel-pause-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const carouselId = this.getAttribute('data-carousel-id');
            const carouselElement = document.getElementById(carouselId);
            
            if (!carouselElement) {
                console.error('Carousel not found:', carouselId);
                return;
            }
            
            // Bootstrapカルーセルインスタンスを取得または作成
            let carousel = bootstrap.Carousel.getInstance(carouselElement);
            if (!carousel) {
                carousel = new bootstrap.Carousel(carouselElement, {
                    interval: 6000,
                    ride: 'carousel'
                });
            }
            
            const pauseIcon = this.querySelector('.pause-icon');
            const playIcon = this.querySelector('.play-icon');
            
            // 現在の状態を判定（pauseIconが表示されている = 再生中）
            if (pauseIcon && pauseIcon.style.display !== 'none') {
                // 再生中 → 一時停止
                carousel.pause();
                pauseIcon.style.display = 'none';
                playIcon.style.display = 'inline';
                console.log('Carousel paused:', carouselId);
            } else {
                // 停止中 → 再生
                carousel.cycle();
                pauseIcon.style.display = 'inline';
                playIcon.style.display = 'none';
                console.log('Carousel playing:', carouselId);
            }
        });
    });
    
    // ナビゲーションボタン（◀◀と▶▶）
    document.querySelectorAll('.carousel-nav-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const carouselId = this.getAttribute('data-bs-target').replace('#', '');
            const slideDirection = this.getAttribute('data-bs-slide');
            const carouselElement = document.getElementById(carouselId);
            
            if (!carouselElement) {
                console.error('Carousel not found:', carouselId);
                return;
            }
            
            let carousel = bootstrap.Carousel.getInstance(carouselElement);
            if (!carousel) {
                carousel = new bootstrap.Carousel(carouselElement, {
                    interval: 6000,
                    ride: 'carousel'
                });
            }
            
            if (slideDirection === 'prev') {
                carousel.prev();
            } else if (slideDirection === 'next') {
                carousel.next();
            }
        });
    });
    
    // カスタムインジケータボタン
    document.querySelectorAll('.carousel-indicator-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const carouselId = this.getAttribute('data-carousel-id');
            const slideIndex = parseInt(this.getAttribute('data-slide-index'));
            const carouselElement = document.getElementById(carouselId);
            
            if (!carouselElement) {
                console.error('Carousel not found:', carouselId);
                return;
            }
            
            let carousel = bootstrap.Carousel.getInstance(carouselElement);
            if (!carousel) {
                carousel = new bootstrap.Carousel(carouselElement, {
                    interval: 6000,
                    ride: 'carousel'
                });
            }
            
            carousel.to(slideIndex);
        });
    });
    
    // カルーセルのスライド切り替え時の処理
    document.querySelectorAll('[id^="carousel-"]').forEach(carouselElement => {
        // Xウィジェットを再読み込み
        carouselElement.addEventListener('slid.bs.carousel', function(event) {
            refreshTwitterWidgets();
            
            // インジケータの状態を更新
            const carouselId = this.id;
            const activeIndex = event.to;
            
            document.querySelectorAll(`.carousel-indicator-btn[data-carousel-id="${carouselId}"]`).forEach((indicator, index) => {
                if (index === activeIndex) {
                    indicator.classList.add('active');
                } else {
                    indicator.classList.remove('active');
                }
            });
        });
    });
}

// Xウィジェットを再初期化
let twitterWidgetRetryCount = 0;
const MAX_TWITTER_WIDGET_RETRIES = 50; // 最大5秒（100ms × 50回）

function refreshTwitterWidgets() {
    // Twitterウィジェットスクリプトが読み込まれるまで待つ
    if (typeof twttr === 'undefined' || !twttr.widgets) {
        if (twitterWidgetRetryCount < MAX_TWITTER_WIDGET_RETRIES) {
            twitterWidgetRetryCount++;
            setTimeout(refreshTwitterWidgets, 100);
            return;
        } else {
            console.error('Twitter widgets script failed to load');
            return;
        }
    }
    
    // リトライカウントをリセット
    twitterWidgetRetryCount = 0;
    
    console.log('Initializing Twitter timelines...');
    
    // すべてのタイムラインコンテナを取得
    const containers = document.querySelectorAll('.x-timeline-container');
    console.log('Found', containers.length, 'timeline container(s)');
    
    containers.forEach((container, index) => {
        // 既にiframeが存在し、正常に表示されている場合はスキップ
        const existingIframe = container.querySelector('iframe');
        if (existingIframe && existingIframe.style.visibility !== 'hidden') {
            console.log('Container', index, 'already loaded, skipping');
            return;
        }
        
        // コンテナ内のタイムラインリンクを探す
        const timelineLink = container.querySelector('a.twitter-timeline');
        if (timelineLink) {
            console.log('Loading timeline', index, ':', timelineLink.href);
            
            // 該当要素だけをロード
            twttr.widgets.load(container).then(() => {
                console.log('Timeline', index, 'loaded successfully');
            }).catch(err => {
                console.error('Failed to load timeline', index, ':', err);
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOMContentLoaded ===');
    
    initHeaderScroll();
    initHeaderTitleClick();
    updateCurrentYear();
    initTabs();
    
    // Twitterウィジェットスクリプトが読み込まれているか確認
    console.log('Checking Twitter widgets script...');
    console.log('typeof twttr at DOMContentLoaded:', typeof twttr);
    
    // カルーセルとタイムラインが生成された後に一度だけウィジェットを初期化
    setTimeout(() => {
        initCarouselControls();
        resetCarouselPlayPauseButtons();
        
        // タイムラインが完全に生成されるのを待ってから一度だけrefreshを呼ぶ
        setTimeout(() => {
            refreshTwitterWidgets();
        }, 1000);
    }, 500);
});