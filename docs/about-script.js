// ========================
// about.html用のスクリプト
// ========================

// 公開スプレッドシートのCSV URL
const PUBLIC_BASIC_INFO_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=0&single=true&output=csv';
const PUBLIC_ARCHIVE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=1835326531&single=true&output=csv';
const PUBLIC_FAMILY_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=1836880976&single=true&output=csv';

// 環境判定
const isLocalMode = window.location.protocol === 'file:' || (typeof BASIC_INFO_CSV !== 'undefined' && typeof ABOUT_DATA !== 'undefined');

// ハッシュタグフィルタリング用のグローバル変数
let currentFilterTag = null;
let allBasicInfo = [];
let allArchiveInfo = [];
let allFamilyInfo = [];

// 基本情報CSVの解析
function parseBasicInfoCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const keyIndex = headers.indexOf('key');
    const categoryIndex = headers.indexOf('category');
    const siteTitleIndex = headers.indexOf('siteTitle');
    const hashTagIndex = headers.indexOf('hashTag');
    const siteUrlIndex = headers.indexOf('siteUrl');
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
        
        // cmp2000は除外
        if (values[keyIndex] === 'cmp2000') continue;
        
        if (values[keyIndex] && values[categoryIndex] && values[siteTitleIndex]) {
            items.push({
                key: values[keyIndex],
                category: values[categoryIndex],
                siteTitle: values[siteTitleIndex],
                hashTag: values[hashTagIndex] || '',
                siteUrl: values[siteUrlIndex] || '#',
                logo: values[logoIndex] || '',
                comment: values[commentIndex] || ''
            });
        }
    }
    
    return items;
}

// アーカイブCSVの解析
function parseArchiveCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const categoryIndex = headers.indexOf('category');
    const siteTitleIndex = headers.indexOf('siteTitle');
    const hashTagIndex = headers.indexOf('hashTag');
    const siteUrlIndex = headers.indexOf('siteUrl');
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
        
        if (values[categoryIndex] && values[siteTitleIndex]) {
            items.push({
                category: values[categoryIndex],
                siteTitle: values[siteTitleIndex],
                hashTag: values[hashTagIndex] || '',
                siteUrl: values[siteUrlIndex] || '#',
                logo: values[logoIndex] || '',
                comment: values[commentIndex] || ''
            });
        }
    }
    
    return items;
}

// ファミリーCSVの解析
function parseFamilyCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const categoryIndex = headers.indexOf('category');
    const nameIndex = headers.indexOf('name');
    const commentIndex = headers.indexOf('comment');
    const hashTagIndex = headers.indexOf('hashTag');
    
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
        
        if (values[categoryIndex] && values[nameIndex]) {
            items.push({
                category: values[categoryIndex],
                name: values[nameIndex],
                comment: values[commentIndex] || '',
                hashTag: values[hashTagIndex] || ''
            });
        }
    }
    
    return items;
}

// ハッシュタグをパースする関数（半角・全角スペース対応）
function parseHashTags(hashTagString) {
    if (!hashTagString) return [];
    // 半角スペースと全角スペースの両方で分割
    return hashTagString.split(/[\s\u3000]+/).filter(tag => tag.startsWith('#')).map(tag => tag.trim());
}

// すべてのハッシュタグを収集する関数（サイト、アーカイブ、ファミリーすべてから）
function collectAllHashTags(basicInfo, archiveInfo, familyInfo) {
    const hashTagSet = new Set();
    basicInfo.forEach(item => {
        const tags = parseHashTags(item.hashTag);
        tags.forEach(tag => hashTagSet.add(tag));
    });
    archiveInfo.forEach(item => {
        const tags = parseHashTags(item.hashTag);
        tags.forEach(tag => hashTagSet.add(tag));
    });
    familyInfo.forEach(item => {
        const tags = parseHashTags(item.hashTag);
        tags.forEach(tag => hashTagSet.add(tag));
    });
    return Array.from(hashTagSet).sort();
}

// ハッシュタグ一覧を生成する関数（ボタンスタイル）
function generateHashTagList(allTags, filterTag = null) {
    const container = document.getElementById('hashtag-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    allTags.forEach(tag => {
        const tagButton = document.createElement('button');
        tagButton.className = 'hashtag-button';
        tagButton.textContent = tag;
        
        if (filterTag && tag === filterTag) {
            tagButton.classList.add('active');
        }
        
        tagButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentFilterTag === tag) {
                clearHashTagFilter();
            } else {
                applyHashTagFilter(tag);
            }
        });
        
        container.appendChild(tagButton);
    });
}

// フィルタUIを表示
function showFilterUI(tag) {
    const container = document.getElementById('filter-ui-container');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = `
        <div class="alert alert-info d-flex justify-content-between align-items-center mb-3" role="alert">
            <span>フィルタ適用中: <strong>${tag}</strong></span>
            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="clearHashTagFilter()">
                フィルタ解除
            </button>
        </div>
    `;
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
            <li><a class="dropdown-item" href="#staff">スタッフ</a></li>
            <li><a class="dropdown-item" href="#family">ファミリー</a></li>
            <li><a class="dropdown-item" href="#special-thanks">スペシャルサンクス</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#footer">フッター</a></li>
        `;
    }
}

// フィルタUIを非表示
function hideFilterUI() {
    const container = document.getElementById('filter-ui-container');
    if (!container) return;
    
    container.style.display = 'none';
    container.innerHTML = '';
}

// ハッシュタグフィルタを適用
function applyHashTagFilter(tag) {
    currentFilterTag = tag;
    
    // フィルタ適用してページを再生成
    generateAboutPage(tag);
    
    // フィルタUIを表示
    showFilterUI(tag);
    
    // ジャンプメニューを更新
    updateJumpMenu(tag);
    
    // ハッシュタグ一覧の状態を更新
    const allTags = collectAllHashTags(allBasicInfo, allArchiveInfo, allFamilyInfo);
    generateHashTagList(allTags, tag);
    
    // フィルタUI表示位置にスムーズスクロール
    setTimeout(() => {
        const filterContainer = document.getElementById('filter-ui-container');
        if (filterContainer) {
            filterContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// ハッシュタグフィルタをクリア
function clearHashTagFilter() {
    currentFilterTag = null;
    
    // フィルタなしでページを再生成
    generateAboutPage();
    
    // フィルタUIを非表示
    hideFilterUI();
    
    // ジャンプメニューを更新
    updateJumpMenu(null);
    
    // ハッシュタグボタンの状態を更新
    const allTags = collectAllHashTags(allBasicInfo, allArchiveInfo, allFamilyInfo);
    generateHashTagList(allTags);
    
    // ジャンプメニューを更新
    updateJumpMenu(null);
    
    // 「共通コンテンツ」セクションにスムーズスクロール
    setTimeout(() => {
        const commonSection = document.getElementById('common');
        if (commonSection) {
            commonSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// ハッシュタグをリンクに変換する関数
function convertHashTagsToLinks(hashTagString) {
    if (!hashTagString) return '';
    const tags = parseHashTags(hashTagString);
    return tags.map(tag => {
        return `<a href="#" class="hashtag-link" onclick="event.preventDefault(); applyHashTagFilter('${tag}');">${tag}</a>`;
    }).join(' ');
}

// アイテムがフィルタに一致するかチェック
function matchesFilter(item, filterTag) {
    if (!filterTag) return true;
    if (!item.hashTag) return false;
    const tags = parseHashTags(item.hashTag);
    return tags.includes(filterTag);
}

// Aboutページを生成する関数（フィルタに対応）
function generateAboutPage(filterTag = null) {
    const container = document.getElementById('about-content');
    if (!container) return;
    
    container.innerHTML = '';
    
    // カテゴリーでグループ化（サイト情報）
    const groupedByCategory = {};
    allBasicInfo.forEach(item => {
        if (!matchesFilter(item, filterTag)) return;
        
        if (!groupedByCategory[item.category]) {
            groupedByCategory[item.category] = [];
        }
        groupedByCategory[item.category].push(item);
    });
    
    // カテゴリーでグループ化（ファミリー）
    const familyByCategory = {};
    allFamilyInfo.forEach(item => {
        if (!matchesFilter(item, filterTag)) return;
        
        if (!familyByCategory[item.category]) {
            familyByCategory[item.category] = [];
        }
        familyByCategory[item.category].push(item);
    });
    
    // アーカイブ情報をカテゴリー別に整理
    const archiveByCategory = {};
    allArchiveInfo.forEach(item => {
        if (!matchesFilter(item, filterTag)) return;
        
        if (!archiveByCategory[item.category]) {
            archiveByCategory[item.category] = [];
        }
        archiveByCategory[item.category].push(item);
    });
    
    // カテゴリーの順序を定義（共通、けびん、りょうの順）
    const categoryOrder = ['共通コンテンツ', 'けびんケビンソン', 'イイダリョウ'];
    
    // カテゴリーごとにセクションを生成
    categoryOrder.forEach(category => {
        const siteList = groupedByCategory[category] || [];
        const archiveList = archiveByCategory[category] || [];
        
        // サイトまたはアーカイブがある場合のみセクションを表示
        if (siteList.length > 0 || archiveList.length > 0) {
            const sectionCard = document.createElement('div');
            sectionCard.className = 'section-card card';
            
            // セクションにIDを追加（ジャンプ用）
            if (category === '共通コンテンツ') {
                sectionCard.id = 'common';
            } else if (category === 'けびんケビンソン') {
                sectionCard.id = 'kevin';
            } else if (category === 'イイダリョウ') {
                sectionCard.id = 'ryo';
            }
            
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'section-header';
            sectionHeader.textContent = category;
            sectionCard.appendChild(sectionHeader);
            
            const sectionBody = document.createElement('div');
            sectionBody.className = 'section-body';
            
            // サイト一覧を表示
            if (siteList.length > 0) {
                const siteSection = document.createElement('div');
                siteSection.style.marginBottom = '1rem';
                
                const siteListDiv = document.createElement('div');
                siteListDiv.className = 'site-list';
                
                siteList.forEach(site => {
                    const siteItem = document.createElement('div');
                    siteItem.className = 'site-item';
                    siteItem.style.display = 'block';
                    siteItem.style.marginBottom = '0.5rem';
                    
                    // タイトルとロゴのコンテナ
                    const titleContainer = document.createElement('div');
                    titleContainer.style.marginBottom = '0.25rem';
                    
                    const siteLink = document.createElement('a');
                    siteLink.href = site.siteUrl;
                    siteLink.target = '_blank';
                    siteLink.className = 'site-link';
                    siteLink.textContent = site.siteTitle;
                    
                    titleContainer.appendChild(siteLink);
                    
                    // logo列が空白でない場合のみロゴを表示
                    if (site.logo && site.logo.trim() !== '') {
                        const logoImg = document.createElement('img');
                        logoImg.src = site.logo;
                        logoImg.className = 'logo-img';
                        logoImg.alt = 'logo';
                        titleContainer.appendChild(logoImg);
                    }
                    
                    // ハッシュタグがあれば表示
                    if (site.hashTag) {
                        const hashTagSpan = document.createElement('span');
                        hashTagSpan.className = 'hashtag-display';
                        hashTagSpan.innerHTML = convertHashTagsToLinks(site.hashTag);
                        titleContainer.appendChild(hashTagSpan);
                    }
                    
                    siteItem.appendChild(titleContainer);
                    
                    // コメントがあれば表示（archiveと同じスタイル）
                    if (site.comment && site.comment.trim() !== '') {
                        const commentSpan = document.createElement('span');
                        commentSpan.className = 'archive-comment';
                        commentSpan.textContent = site.comment;
                        siteItem.appendChild(commentSpan);
                    }
                    
                    siteListDiv.appendChild(siteItem);
                });
                
                siteSection.appendChild(siteListDiv);
                sectionBody.appendChild(siteSection);
            }
            
            // アーカイブ一覧を表示（サイトの下に）
            if (archiveList.length > 0) {
                const archiveSection = document.createElement('div');
                archiveSection.className = 'archive-section';
                // アーカイブセクション全体を囲う
                archiveSection.style.border = '2px solid #adb5bd';
                archiveSection.style.borderRadius = '0.5rem';
                archiveSection.style.padding = '1rem';
                archiveSection.style.marginTop = '0.5rem'; /* 1remから0.5remに縮小 */
                archiveSection.style.backgroundColor = '#f8f9fa';
                
                // アーカイブセクションヘッダー
                const archiveHeader = document.createElement('h6');
                archiveHeader.textContent = 'アーカイブ';
                archiveHeader.className = 'archive-header';
                archiveHeader.style.marginTop = '0';
                archiveHeader.style.marginBottom = '0.75rem';
                archiveSection.appendChild(archiveHeader);
                
                const archiveListDiv = document.createElement('div');
                archiveListDiv.className = 'archive-list';
                
                archiveList.forEach(archive => {
                    const archiveItem = document.createElement('div');
                    archiveItem.className = 'archive-item';
                    archiveItem.style.display = 'block';
                    archiveItem.style.marginBottom = '0.5rem';
                    
                    // タイトルとロゴのコンテナ
                    const titleContainer = document.createElement('div');
                    titleContainer.style.marginBottom = '0.25rem';
                    
                    // siteUrlが空白の場合はリンクなしテキスト、それ以外はリンク
                    if (archive.siteUrl && archive.siteUrl.trim() !== '' && archive.siteUrl !== '#') {
                        const archiveLink = document.createElement('a');
                        archiveLink.href = archive.siteUrl;
                        archiveLink.target = '_blank';
                        archiveLink.className = 'site-link';
                        archiveLink.textContent = archive.siteTitle;
                        titleContainer.appendChild(archiveLink);
                    } else {
                        const archiveText = document.createElement('span');
                        archiveText.textContent = archive.siteTitle;
                        archiveText.style.color = '#6c757d';
                        titleContainer.appendChild(archiveText);
                    }
                    
                    // ロゴがあれば表示
                    if (archive.logo) {
                        const logoImg = document.createElement('img');
                        logoImg.src = archive.logo;
                        logoImg.className = 'logo-img';
                        logoImg.alt = 'logo';
                        titleContainer.appendChild(logoImg);
                    }
                    
                    // ハッシュタグがあれば表示
                    if (archive.hashTag) {
                        const hashTagSpan = document.createElement('span');
                        hashTagSpan.className = 'hashtag-display';
                        hashTagSpan.innerHTML = convertHashTagsToLinks(archive.hashTag);
                        titleContainer.appendChild(hashTagSpan);
                    }
                    
                    archiveItem.appendChild(titleContainer);
                    
                    // コメントがあれば表示（ファミリーと同じスタイル）
                    if (archive.comment) {
                        const commentSpan = document.createElement('span');
                        commentSpan.className = 'archive-comment';
                        commentSpan.textContent = archive.comment;
                        archiveItem.appendChild(commentSpan);
                    }
                    
                    archiveListDiv.appendChild(archiveItem);
                });
                
                archiveSection.appendChild(archiveListDiv);
                sectionBody.appendChild(archiveSection);
            }
            
            sectionCard.appendChild(sectionBody);
            container.appendChild(sectionCard);
        }
    });
    
    // スタッフ、ファミリー、スペシャルサンクスのセクション（並列に表示）
    ['スタッフ', 'ファミリー', 'スペシャルサンクス'].forEach(familyCategory => {
        if (familyByCategory[familyCategory]) {
            const sectionCard = document.createElement('div');
            sectionCard.className = 'section-card card';
            
            // セクションにIDを追加（ジャンプ用）
            if (familyCategory === 'スタッフ') {
                sectionCard.id = 'staff';
            } else if (familyCategory === 'ファミリー') {
                sectionCard.id = 'family';
            } else if (familyCategory === 'スペシャルサンクス') {
                sectionCard.id = 'special-thanks';
            }
            
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'section-header';
            sectionHeader.textContent = familyCategory;
            sectionCard.appendChild(sectionHeader);
            
            const sectionBody = document.createElement('div');
            sectionBody.className = 'section-body';
            
            familyByCategory[familyCategory].forEach(member => {
                const familyItem = document.createElement('div');
                familyItem.className = 'family-item';
                
                const familyNameContainer = document.createElement('div');
                familyNameContainer.style.marginBottom = '0.25rem';
                
                const familyName = document.createElement('span');
                familyName.className = 'family-name';
                familyName.textContent = member.name;
                familyNameContainer.appendChild(familyName);
                
                // ハッシュタグがあれば名前の横に表示
                if (member.hashTag) {
                    const hashTagSpan = document.createElement('span');
                    hashTagSpan.className = 'hashtag-display';
                    hashTagSpan.innerHTML = convertHashTagsToLinks(member.hashTag);
                    familyNameContainer.appendChild(hashTagSpan);
                }
                
                const familyComment = document.createElement('span');
                familyComment.className = 'family-comment';
                familyComment.textContent = member.comment;
                
                familyItem.appendChild(familyNameContainer);
                familyItem.appendChild(familyComment);
                
                sectionBody.appendChild(familyItem);
            });
            
            sectionCard.appendChild(sectionBody);
            container.appendChild(sectionCard);
        }
    });
    
    // 初回生成時のみハッシュタグ一覧を生成
    if (!filterTag && !currentFilterTag) {
        const allTags = collectAllHashTags(allBasicInfo, allArchiveInfo, allFamilyInfo);
        generateHashTagList(allTags);
    }
}

// データ読み込みと初期化
function initializeAboutPage() {
    if (isLocalMode && typeof BASIC_INFO_CSV !== 'undefined' && typeof ABOUT_DATA !== 'undefined') {
        console.log('ローカルモードで実行中（About）');
        allBasicInfo = parseBasicInfoCSV(BASIC_INFO_CSV);
        allArchiveInfo = parseArchiveCSV(ABOUT_DATA.ARCHIVE_CSV);
        allFamilyInfo = parseFamilyCSV(ABOUT_DATA.FAMILY_CSV);
        
        generateAboutPage();
        updateCurrentYear();
        initHeaderScroll();
        updateJumpMenu(null);
    } else {
        console.log('オンラインモードで実行中（About）');
        
        Promise.all([
            fetch(PUBLIC_BASIC_INFO_CSV_URL).then(response => response.text()),
            fetch(PUBLIC_ARCHIVE_CSV_URL).then(response => response.text()),
            fetch(PUBLIC_FAMILY_CSV_URL).then(response => response.text())
        ])
        .then(([basicCsvText, archiveCsvText, familyCsvText]) => {
            allBasicInfo = parseBasicInfoCSV(basicCsvText);
            allArchiveInfo = parseArchiveCSV(archiveCsvText);
            allFamilyInfo = parseFamilyCSV(familyCsvText);
            
            generateAboutPage();
            updateCurrentYear();
            initHeaderScroll();
            updateJumpMenu(null);
        })
        .catch(error => {
            console.error('公開CSVの読み込みに失敗しました:', error);
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

// ヘッダースクロール効果の初期化
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
        
        // passive: true でパフォーマンス向上（特にモバイル）
        window.addEventListener('scroll', onScroll, { passive: true });
        
        // 初回実行
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

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeAboutPage();
    initHeaderTitleClick();
});
