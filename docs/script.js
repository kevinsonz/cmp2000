/**
// 表示したいRSSフィードのURLをここに正確に貼り付けてください
const RSS_FEED_URL = 'https://cmp2000.hatenadiary.jp/rss'; // 例：Qiitaのフィード

// コンテナ要素を取得
const container = document.getElementById('rss-feed-container');

// RSS2JSONのAPIを呼び出す
fetch(`https://api.rss2json.com/v1/api.json?rss_url=${RSS_FEED_URL}`)
    .then(response => response.json())
    .then(data => {
        // データの取得に成功した場合
        const items = data.items;
        items.forEach(item => {
            const articleTitle = item.title;
            const articleLink = item.link;
            const articleDate = new Date(item.pubDate).toLocaleDateString('ja-JP');
            
            const articleElement = document.createElement('div');
            articleElement.innerHTML = `
                <h3><a href="${articleLink}" target="_blank">${articleTitle}</a></h3>
                <p>${articleDate}</p>
            `;
            container.appendChild(articleElement);
        });
    })
    .catch(error => {
        // エラーが発生した場合
        console.error('データの取得中にエラーが発生しました:', error);
        container.innerHTML = '<p>更新情報を取得できませんでした。</p>';
    });
 */

const feedUrls = [
    'https://cmp2000.hatenadiary.jp/rss', // サイトA
    'https://note.com/cmp2000/rss'  // サイトB
];
const allItems = []; // すべての記事を格納する配列

// Promise.allで複数の取得処理を待つ
const promises = feedUrls.map(url =>
    // 各URLにRSS2JSON APIを経由してアクセス
    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${url}`)
        .then(response => response.json())
        .then(data => {
            // サイト名を追加しつつ、記事データを結合
            const siteTitle = data.feed.title;
            const itemsWithTitle = data.items.map(item => ({
                ...item, // 元の記事のプロパティをすべてコピー
                siteTitle: siteTitle // サイト名を追加
            }));
            allItems.push(...itemsWithTitle);
        })
);

// 全てのデータ取得が完了したら次の処理へ
Promise.all(promises).then(() => {
    // ステップ2へ進む
});

Promise.all(promises).then(() => {
    // 日付（pubDate）で降順ソート
    allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    const container = document.getElementById('rss-feed-container');
    
    // ソートされたリストを表示
    allItems.forEach(item => {
        const articleElement = document.createElement('div');
        articleElement.innerHTML = `
            <h3 style="margin-bottom: 0.25rem"><a href="${item.link}" target="_blank"><p style="line-height: 1.25; margin-bottom: 0.25rem">${item.title}</p></a></h3>
            <p style="margin-bottom: 0.25rem"><strong>${item.siteTitle}</strong> - ${new Date(item.pubDate).toLocaleDateString('ja-JP')}</p>
        `;
        container.appendChild(articleElement);
    });
});