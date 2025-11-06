const multiMaxLength = 20;
const singleMaxLength = 10;

// ========================
// ローカル用CSV設定データ（最優先で定義）
// ========================

// ローカル用基本情報CSV（key,category,siteTitle,breadcrumbs,siteUrl,image,logo の形式）
const LOCAL_BASIC_INFO_CSV = `
key,category,siteTitle,breadcrumbs,siteUrl,image,logo
cmp2000,共通コンテンツ,-,CMP2000,https://kevinsonz.github.io/cmp2000/,./images/cmp2000-sk.jpg,./logos/GitHub_Logo.png
cmpOfficialBlog,共通コンテンツ,公式ブログ,CMP2000 > 公式ブログ,https://cmp2000.hatenadiary.jp/,./images/cmp2000-sk.jpg,./logos/hatenablog-logotype.svg
cmpText,共通コンテンツ,文章系コンテンツ,CMP2000 > 文章系コンテンツ,https://note.com/cmp2000/,./images/cmp2000-sk.jpg,./logos/note-logo.svg
cmpPicture,共通コンテンツ,画像系コンテンツ,CMP2000 > 画像系コンテンツ,https://www.instagram.com/peitaro_s,./images/cmp2000-sk.jpg,./logos/Instagram_logo.svg.png
cmpVideo,共通コンテンツ,映像系コンテンツ,CMP2000 > 映像系コンテンツ,https://www.youtube.com/@epumes,./images/cmp2000-sk.jpg,./logos/yt_logo_rgb_light.png
cmpRepository,共通コンテンツ,リポジトリ,CMP2000 > リポジトリ,https://github.com/kevinsonz/cmp2000/,./images/cmp2000-sk.jpg,./logos/GitHub_Logo.png
kevinBlog,けびんケビンソン,活動ブログ,けびんケビンソン > 活動ブログ,https://kevinson2.hateblo.jp/,./images/kevin-moon.png,./logos/hatenablog-logotype.svg
kevinText,けびんケビンソン,文章系コンテンツ,けびんケビンソン > 文章系コンテンツ,https://note.com/kevinson/,./images/kevin-moon.png,./logos/note-logo.svg
kevinPicture,けびんケビンソン,画像系コンテンツ,けびんケビンソン > 画像系コンテンツ,https://www.instagram.com/kevinsonzz,./images/kevin-moon.png,./logos/Instagram_logo.svg.png
kevinVideo,けびんケビンソン,映像系コンテンツ,けびんケビンソン > 映像系コンテンツ,https://www.youtube.com/@kevinvinvinson,./images/kevin-moon.png,./logos/yt_logo_rgb_light.png
kevinRepository,けびんケビンソン,リポジトリ,けびんケビンソン > リポジトリ,https://github.com/kevinsonz/,./images/kevin-moon.png,./logos/GitHub_Logo.png
ryoTechBlog,イイダリョウ,技術系ブログ,イイダリョウ > 技術系ブログ,https://www.i-ryo.com/,./images/kumokotsu.jpg,./logos/hatenablog-logotype.svg
ryoTechSummary,イイダリョウ,技術系まとめ,イイダリョウ > 技術系まとめ,https://qiita.com/i-ryo/,./images/kumokotsu.jpg,./logos/qiita-logo-background-color.png
ryoTextCareer,イイダリョウ,文章系（キャリア関係）,イイダリョウ > 文章系（キャリア関係）,https://note.com/idr_zz/,./images/kumokotsu.jpg,./logos/note-logo.svg
ryoTextHobby,イイダリョウ,文章系（趣味関係）,イイダリョウ > 文章系（趣味関係）,https://idr-zz.hatenablog.jp/,./images/kumokotsu.jpg,./logos/hatenablog-logotype.svg
ryoPicture,イイダリョウ,画像系コンテンツ,イイダリョウ > 画像系コンテンツ,https://www.instagram.com/idr_zz/,./images/kumokotsu.jpg,./logos/Instagram_logo.svg.png
ryoVideoTech,イイダリョウ,映像系（技術関係）,イイダリョウ > 映像系（技術関係）,https://www.youtube.com/@idr_zz,./images/kumokotsu.jpg,./logos/yt_logo_rgb_light.png
ryoVideoHobby,イイダリョウ,映像系（趣味関係）,イイダリョウ > 映像系（趣味関係）,https://www.youtube.com/@idr_zzz,./images/kumokotsu.jpg,./logos/yt_logo_rgb_light.png
ryoVideoMusic,イイダリョウ,映像系（音楽関係）,イイダリョウ > 映像系（音楽関係）,https://music.youtube.com/channel/UCps-rhJpt3fbOuWokQAAHIg,./images/kumokotsu.jpg,./logos/YouTube_Music_logo.svg.png
ryoRepository,イイダリョウ,リポジトリ,イイダリョウ > リポジトリ,https://github.com/ryo-i/,./images/kumokotsu.jpg,./logos/GitHub_Logo.png
`;

// ローカル用multi履歴CSV（key,breadcrumbs,siteUrl,title,link,date の形式）
const LOCAL_MULTI_CSV = `
key,breadcrumbs,siteUrl,title,link,date
cmpOfficialBlog,CMP2000 > 公式ブログ,https://cmp2000.hatenadiary.jp/,最新記事のタイトル1,https://example.com/article1,2025-01-20
cmpText,CMP2000 > 文章系コンテンツ,https://note.com/cmp2000,最新記事のタイトル2,https://example.com/article2,2025-01-19
cmpVideo,CMP2000 > 映像系コンテンツ,https://www.youtube.com/@epumes,動画タイトル1,https://youtu.be/xxxxx1,2025-01-18
kevinBlog,けびんケビンソン > 活動ブログ,https://kevinson2.hateblo.jp/,ブログ記事1,https://example.com/article3,2025-01-17
cmpOfficialBlog,CMP2000 > 公式ブログ,https://cmp2000.hatenadiary.jp/,過去の記事,https://example.com/article4,2025-01-15
ryoTechBlog,イイダリョウ > 技術系ブログ,https://www.i-ryo.com/,技術記事1,https://example.com/article5,2025-01-14
cmpRepository,CMP2000 > リポジトリ,https://github.com/kevinsonz/cmp2000/,コミット履歴1,https://github.com/kevinsonz/cmp2000/commit/xxx,2025-01-13
kevinText,けびんケビンソン > 文章系コンテンツ,https://note.com/kevinson/,Note記事1,https://example.com/article6,2025-01-12
ryoTextCareer,イイダリョウ > 文章系（キャリア関係）,https://note.com/idr_zz/,キャリア記事1,https://example.com/article7,2025-01-11
cmpText,CMP2000 > 文章系コンテンツ,https://note.com/cmp2000,文章記事2,https://example.com/article8,2025-01-10
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
const PUBLIC_BASIC_INFO_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=0&single=true&output=csv';
const PUBLIC_MULTI_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=195059601&single=true&output=csv';
const PUBLIC_SINGLE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=900915820&single=true&output=csv';

// 環境判定：file://プロトコルならローカルモード
const isLocalMode = window.location.protocol === 'file:';

if (isLocalMode) {
    console.log('ローカルモードで実行中');
    const basicInfo = parseBasicInfoCSV(LOCAL_BASIC_INFO_CSV);
    const multiData = parseMultiCSV(LOCAL_MULTI_CSV);
    const singleData = parseSingleCSV(LOCAL_SINGLE_CSV);
    generateCards(basicInfo);
    loadFeeds(multiData, singleData);
} else {
    Promise.all([
        fetch(PUBLIC_BASIC_INFO_CSV_URL).then(response => response.text()),
        fetch(PUBLIC_MULTI_CSV_URL).then(response => response.text()),
        fetch(PUBLIC_SINGLE_CSV_URL).then(response => response.text())
    ])
    .then(([basicInfoCsvText, multiCsvText, singleCsvText]) => {
        const basicInfo = parseBasicInfoCSV(basicInfoCsvText);
        const multiData = parseMultiCSV(multiCsvText);
        const singleData = parseSingleCSV(singleCsvText);
        generateCards(basicInfo);
        loadFeeds(multiData, singleData);
    })
    .catch(error => {
        console.error('公開CSVの読み込みに失敗しました:', error);
    });
}

// CSV解析関数（基本情報用：key,category,siteTitle,breadcrumbs,siteUrl,image,logo）
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
        
        // 必須フィールド（key, breadcrumbs, siteUrl, title, link, date）が埋まっているかチェック
        if (values[keyIndex] && values[breadcrumbsIndex] && values[siteUrlIndex] && 
            values[titleIndex] && values[linkIndex] && values[dateIndex]) {
            items.push({
                key: values[keyIndex],
                breadcrumbs: values[breadcrumbsIndex],
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

// カード自動生成関数
function generateCards(basicInfo) {
    // categoryごとにグループ化
    const groupedByCategory = {};
    basicInfo.forEach(item => {
        if (!groupedByCategory[item.category]) {
            groupedByCategory[item.category] = [];
        }
        groupedByCategory[item.category].push(item);
    });
    
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
            cardWrapper.innerHTML = `
                <div class="card">
                    <div style="position: relative; overflow: hidden; height: 200px;">
                        <img src="${site.image}" class="card-img-top" alt="${site.siteTitle}" style="width: 100%; height: 100%; object-fit: cover;">
                        <img src="${site.logo}" alt="logo" style="position: absolute; top: 8px; right: 8px; width: 60px; height: auto; max-width: 30%; object-fit: contain;">
                    </div>
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
            const date = new Date(item.pubDate);
            const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
            const articleElement = document.createElement('div');
            articleElement.innerHTML = `
            <p style="margin-bottom: 0.25rem">
                <span style="display: inline-block; width: 15rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis">
                    <a href="${item.siteUrl}" target="_blank"><strong>${item.breadcrumbs}</strong></a>
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

// ジャンプメニューの初期化
function initJumpMenu() {
    const jumpBtn = document.getElementById('jump-btn');
    const jumpOptions = document.getElementById('jump-options');
    
    if (jumpBtn && jumpOptions) {
        jumpBtn.addEventListener('click', () => {
            jumpOptions.style.display = jumpOptions.style.display === 'none' ? 'block' : 'none';
        });
        
        // メニュー外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#jump-menu')) {
                jumpOptions.style.display = 'none';
            }
        });
        
        // リンククリックで閉じる
        jumpOptions.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                jumpOptions.style.display = 'none';
            });
        });
    }
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

// ページ読み込み時にジャンプメニューとヘッダースクロールを初期化
document.addEventListener('DOMContentLoaded', () => {
    initJumpMenu();
    initHeaderScroll();
});