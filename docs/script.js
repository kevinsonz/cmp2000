const multiMaxLength = 20;
const singleMaxLength = 10;

// フィード設定をCSVから読み込む（本番環境用）
let feedUrls = {};

// 環境判定：file://プロトコルならローカルモード
const isLocalMode = window.location.protocol === 'file:';

if (isLocalMode) {
    console.log('ローカルモードで実行中');
    feedUrls = getLocalFeedUrls();
    loadFeeds();
} else {
    fetch('./feedUrls.csv')
        .then(response => response.text())
        .then(csvText => {
            feedUrls = parseCSV(csvText);
            loadFeeds();
        })
        .catch(error => {
            console.error('feedUrls.csvの読み込みに失敗しました:', error);
        });
}

// CSV解析関数（feedUrls用）
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const result = {};
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const key = values[0];
        const obj = {};
        
        for (let j = 1; j < headers.length; j++) {
            obj[headers[j]] = values[j];
        }
        
        result[key] = obj;
    }
    
    return result;
}

// CSV解析関数（カスタムフィード用）
function parseCustomFeedCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const item = {};
        
        for (let j = 0; j < headers.length; j++) {
            item[headers[j]] = values[j];
        }
        
        items.push(item);
    }
    
    return { items: items };
}

function loadFeeds() {
    // ========================
    // 複数サイトフィードの取得と表示
    // ========================
    const multiSiteItems = [];

    const multiPromises = Object.entries(feedUrls).map(([key, config]) => {
        if (config.type === 'custom') {
            // 手作りCSV形式のカスタムフィード
            if (isLocalMode) {
                // ローカルモード：getLocalCustomFeeds()から取得
                return Promise.resolve().then(() => {
                    const siteTitle = config.siteTitle;
                    const siteUrl = config.siteUrl;
                    const siteData = getLocalCustomFeeds()[key];
                    if (siteData && siteData.items) {
                        const itemsWithTitle = siteData.items.map(item => ({
                            ...item,
                            siteTitle: siteTitle,
                            siteUrl: siteUrl
                        }));
                        multiSiteItems.push(...itemsWithTitle);
                    }
                });
            } else {
                // 本番モード：CSVファイルから取得
                return fetch(config.url)
                    .then(response => response.text())
                    .then(csvText => {
                        const siteTitle = config.siteTitle;
                        const siteUrl = config.siteUrl;
                        const data = parseCustomFeedCSV(csvText);
                        if (data && data.items) {
                            const itemsWithTitle = data.items.map(item => ({
                                ...item,
                                siteTitle: siteTitle,
                                siteUrl: siteUrl
                            }));
                            multiSiteItems.push(...itemsWithTitle);
                        }
                    });
            }
        } else {
            // RSS/ATOM形式のフィード（RSS2JSON API経由）
            return fetch(`https://api.rss2json.com/v1/api.json?rss_url=${config.url}`)
                .then(response => response.json())
                .then(data => {
                    const siteTitle = config.siteTitle;
                    const siteUrl = config.siteUrl;
                    const itemsWithTitle = data.items.map(item => ({
                        ...item,
                        siteTitle: siteTitle,
                        siteUrl: siteUrl
                    }));
                    multiSiteItems.push(...itemsWithTitle);
                });
        }
    });

    Promise.all(multiPromises).then(() => {
        // 日付（pubDate）で降順ソート
        multiSiteItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        const container = document.getElementById('multi-rss-feed-container');
        
        // 上位件数のみ表示
        multiSiteItems.slice(0, multiMaxLength).forEach(item => {
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
            container.appendChild(articleElement);
        });
    });

    // ========================
    // 単独サイトフィードの取得と表示
    // ========================
    Object.entries(feedUrls).forEach(([key, config]) => {
        if (config.type === 'custom') {
            // 手作りCSV形式のカスタムフィード
            if (isLocalMode) {
                // ローカルモード：getLocalCustomFeeds()から取得
                const siteData = getLocalCustomFeeds()[key];
                if (siteData && siteData.items) {
                    const items = siteData.items;
                    
                    // 日付で降順ソート
                    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
                    
                    const containerId = `single-rss-feed-container-${key}`;
                    const singleContainer = document.getElementById(containerId);
                    
                    if (singleContainer) {
                        // 上位件数のみ表示
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
                }
            } else {
                // 本番モード：CSVファイルから取得
                fetch(config.url)
                    .then(response => response.text())
                    .then(csvText => {
                        const data = parseCustomFeedCSV(csvText);
                        if (data && data.items) {
                            const items = data.items;
                            
                            // 日付で降順ソート
                            items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
                            
                            const containerId = `single-rss-feed-container-${key}`;
                            const singleContainer = document.getElementById(containerId);
                            
                            if (singleContainer) {
                                // 上位件数のみ表示
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
                        }
                    });
            }
        } else {
            // RSS/ATOM形式のフィード（RSS2JSON API経由）
            fetch(`https://api.rss2json.com/v1/api.json?rss_url=${config.url}`)
                .then(response => response.json())
                .then(data => {
                    const items = data.items;
                    
                    // 日付で降順ソート
                    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
                    
                    const containerId = `single-rss-feed-container-${key}`;
                    const singleContainer = document.getElementById(containerId);
                    
                    if (singleContainer) {
                        // 上位件数のみ表示
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
    });
}

// ========================
// ローカル確認用設定（ファイル最後に配置）
// ========================
function getLocalFeedUrls() {
    // ここにfeedUrls.csvの内容を貼り付け
    return {

        // ===== API経由のフィード（RSS/ATOM）の例 =====
        // sampleRssSite: {
        //     url: 'https://example.com/rss',
        //     siteUrl: 'https://example.com',
        //     siteTitle: 'サンプルサイト',
        //     type: 'api'
        // },



        // ===== カスタムフィード（手作りCSV）の例 =====
        // sampleCustomSite: {
        //     url: './feeds/sample-custom.csv',
        //     siteUrl: 'https://custom-site.com',
        //     siteTitle: 'カスタムサイト',
        //     type: 'custom'
        // },



        // 必要に応じてサイトを追加
    };
}

function getLocalCustomFeeds() {
    // ここにカスタムフィードの内容を貼り付け
    // キー名はgetLocalFeedUrls()のキー名と一致させる
    return {
        // 例:
        // customSite1: {
        //     items: [
        //         {
        //             title: "記事タイトル",
        //             link: "https://example.com/article",
        //             pubDate: "2025-10-22"
        //         }
        //     ]
        // }



    };
}