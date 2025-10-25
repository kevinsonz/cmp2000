const multiMaxLength = 20;
const singleMaxLength = 10;

// フィード設定
const feedUrls = {
    cmpOfficialBlog: {
        url: 'https://cmp2000.hatenadiary.jp/rss',
        siteUrl: 'https://cmp2000.hatenadiary.jp/',
        siteTitle: 'CMP2000 > 公式ブログ'
    },
    cmpText: {
        url: 'https://note.com/cmp2000/rss',
        siteUrl: 'https://note.com/cmp2000',
        siteTitle: 'CMP2000 > 文章系コンテンツ'
    },
    cmpRepository: {
        url: 'https://github.com/kevinsonz/cmp2000/commits.atom',
        siteUrl: 'https://github.com/kevinsonz/cmp2000/',
        siteTitle: 'CMP2000 > リポジトリ'
    }
};

// ========================
// 複数サイトフィードの取得と表示
// ========================
const multiSiteItems = [];

const multiPromises = Object.entries(feedUrls).map(([key, config]) =>
    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${config.url}`)
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
        })
);

Promise.all(multiPromises).then(() => {
    // 日付（pubDate）で降順ソート
    multiSiteItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const container = document.getElementById('multi-rss-feed-container');
    
    // 上位20件のみ表示
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
    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${config.url}`)
        .then(response => response.json())
        .then(data => {
            const items = data.items;
            
            // 日付で降順ソート
            items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
            
            const containerId = `single-rss-feed-container-${key}`;
            const singleContainer = document.getElementById(containerId);
            
            if (singleContainer) {
                // 上位10件のみ表示
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
});