const multiMaxLength = 20;
const singleMaxLength = 10;

// ========================
// ローカル用CSV設定データ（最優先で定義）
// ========================

// ローカル用multi履歴CSV（siteTitle,siteUrl,title,link,date の形式）
const LOCAL_MULTI_CSV = `
siteTitle,siteUrl,title,link,date
CMP2000 > 公式ブログ,https://cmp2000.hatenadiary.jp/,最新記事のタイトル1,https://example.com/article1,2025-01-20
CMP2000 > 文章系コンテンツ,https://note.com/cmp2000,最新記事のタイトル2,https://example.com/article2,2025-01-19
CMP2000 > 映像系コンテンツ,https://www.youtube.com/@epumes,動画タイトル1,https://youtu.be/xxxxx1,2025-01-18
けびんケビンソン > 活動ブログ,https://kevinson2.hateblo.jp/,ブログ記事1,https://example.com/article3,2025-01-17
CMP2000 > 公式ブログ,https://cmp2000.hatenadiary.jp/,過去の記事,https://example.com/article4,2025-01-15
イイダリョウ > 技術系ブログ,https://www.i-ryo.com/,技術記事1,https://example.com/article5,2025-01-14
CMP2000 > リポジトリ,https://github.com/kevinsonz/cmp2000/,コミット履歴1,https://github.com/kevinsonz/cmp2000/commit/xxx,2025-01-13
けびんケビンソン > 文章系コンテンツ,https://note.com/kevinson/,Note記事1,https://example.com/article6,2025-01-12
イイダリョウ > 文章系（キャリア関係）,https://note.com/idr_zz/,キャリア記事1,https://example.com/article7,2025-01-11
CMP2000 > 文章系コンテンツ,https://note.com/cmp2000,文章記事2,https://example.com/article8,2025-01-10
`;

// ローカル用single履歴CSV（key,title,link,date の形式）
const LOCAL_SINGLE_CSV = `
key,title,link,date
cmpOfficialBlog,記事タイトル1,https://example.com/1,2025-01-20
cmpOfficialBlog,記事タイトル2,https://example.com/2,2025-01-19
cmpOfficialBlog,記事タイトル3,https://example.com/3,2025-01-18
cmpText,テキスト記事1,https://example.com/4,2025-01-17
cmpText,テキスト記事2,https://example.com/5,2025-01-16
cmpText,,,,
cmpVideo,動画タイトル1,https://youtu.be/xxx1,2025-01-15
cmpVideo,動画タイトル2,https://youtu.be/xxx2,2025-01-14
cmpVideo,,,
cmpVideo,,,
cmpRepository,コミット1,https://github.com/xxx/commit/1,2025-01-13
cmpRepository,コミット2,https://github.com/xxx/commit/2,2025-01-12
cmpRepository,,,
kevinson-blog,ブログ記事1,https://example.com/6,2025-01-11
kevinson-blog,ブログ記事2,https://example.com/7,2025-01-10
kevinson-blog,,,
kevinson-blog,,,
iida-blog,技術ブログ1,https://example.com/8,2025-01-09
iida-blog,技術ブログ2,https://example.com/9,2025-01-08
iida-blog,,,
`;

// 公開スプレッドシートのCSV URL
const PUBLIC_MULTI_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=195059601&single=true&output=csv';
const PUBLIC_SINGLE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=900915820&single=true&output=csv';

// 環境判定：file://プロトコルならローカルモード
const isLocalMode = window.location.protocol === 'file:';

if (isLocalMode) {
    console.log('ローカルモードで実行中');
    const multiData = parseMultiCSV(LOCAL_MULTI_CSV);
    const singleData = parseSingleCSV(LOCAL_SINGLE_CSV);
    loadFeeds(multiData, singleData);
} else {
    Promise.all([
        fetch(PUBLIC_MULTI_CSV_URL).then(response => response.text()),
        fetch(PUBLIC_SINGLE_CSV_URL).then(response => response.text())
    ])
    .then(([multiCsvText, singleCsvText]) => {
        const multiData = parseMultiCSV(multiCsvText);
        const singleData = parseSingleCSV(singleCsvText);
        loadFeeds(multiData, singleData);
    })
    .catch(error => {
        console.error('公開CSVの読み込みに失敗しました:', error);
    });
}

// CSV解析関数（multi用：siteTitle,siteUrl,title,link,date）
function parseMultiCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const siteTitleIndex = headers.indexOf('siteTitle');
    const siteUrlIndex = headers.indexOf('siteUrl');
    const titleIndex = headers.indexOf('title');
    const linkIndex = headers.indexOf('link');
    const dateIndex = headers.indexOf('date');
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        // 全ての必須フィールドが埋まっているかチェック
        if (values[siteTitleIndex] && values[siteUrlIndex] && 
            values[titleIndex] && values[linkIndex] && values[dateIndex]) {
            items.push({
                siteTitle: values[siteTitleIndex],
                siteUrl: values[siteUrlIndex],
                title: values[titleIndex],
                link: values[linkIndex],
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
        
        // keyと他の全てのフィールドが埋まっているかチェック
        if (values[keyIndex] && values[titleIndex] && 
            values[linkIndex] && values[dateIndex]) {
            items.push({
                key: values[keyIndex],
                title: values[titleIndex],
                link: values[linkIndex],
                pubDate: values[dateIndex]
            });
        }
    }
    
    return items;
}

function loadFeeds(multiData, singleData) {
    // ========================
    // 複数サイトフィード（multi）の表示
    // ========================
    const multiContainer = document.getElementById('multi-rss-feed-container');
    
    if (multiContainer) {
        // 上位件数のみ表示（CSVで既にソート済みだが念のため）
        multiData.slice(0, multiMaxLength).forEach(item => {
            const date = new Date(item.pubDate);
            const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
            const articleElement = document.createElement('div');
            articleElement.innerHTML = `
            <p style="margin-bottom: 0.25rem">
                <span style="display: inline-block; width: 15rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis">
                    <a href="${item.siteUrl}" target="_blank"><strong>${item.siteTitle}</strong></a>
                </span>
                <span style="display: inline-block; width: 7.5rem">
                     - ${formattedDate} 
                </span>
                <span>
                    <a href="${item.link}" target="_blank">
                        <span style="line-height: 1.25; margin-bottom: 0.25rem; display: inline-block; width: 30rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis">${item.title}</span>
                    </a>
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
                const date = new Date(item.pubDate);
                const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                const articleElement = document.createElement('div');
                // サイト名は表示しない
                articleElement.innerHTML = `
                    <span style="margin-bottom: 0.25rem">${formattedDate}<a href="${item.link}" target="_blank"><p style="line-height: 1.25; margin-bottom: 0.25rem">${item.title}</p></a></span>
                `;
                singleContainer.appendChild(articleElement);
            });
        }
    });
}