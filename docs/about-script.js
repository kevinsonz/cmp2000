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

// アコーディオン状態管理
let accordionStates = {
    'common': true,   // ユニット活動：初期状態で開く
    'kevin': true,    // けびんケビンソン(ソロ)：初期状態で開く
    'ryo': true,      // イイダリョウ(ソロ)：初期状態で開く
    'staff': false,
    'family': false,
    'specialThanks': false
};

// フィルタ前の状態を保存
let preFilterStates = null;

// セクション情報
const sectionInfo = [
    { id: 'common', name: '共通', fullName: '共通コンテンツ' },
    { id: 'kevin', name: 'けびん', fullName: 'けびんケビンソン' },
    { id: 'ryo', name: 'リョウ', fullName: 'イイダリョウ' },
    { id: 'staff', name: 'Staff', fullName: 'スタッフ' },
    { id: 'family', name: 'Family', fullName: 'ファミリー' },
    { id: 'specialThanks', name: 'Thanks', fullName: 'スペシャルサンクス' }
];

// ボタンの状態を更新する関数
function updateAccordionButtonStates() {
    // 通常時のボタン
    const openAllBtn = document.getElementById('openAllBtn');
    const closeAllBtn = document.getElementById('closeAllBtn');
    
    // コンパクト版のボタン
    const openAllBtnCompact = document.getElementById('openAllBtnCompact');
    const closeAllBtnCompact = document.getElementById('closeAllBtnCompact');
    
    // フィルタ中は両方のボタンをアウトライン表示
    if (currentFilterTag) {
        [openAllBtn, openAllBtnCompact].forEach(btn => {
            if (!btn) return;
            btn.className = 'btn btn-sm btn-outline-primary';
        });
        
        [closeAllBtn, closeAllBtnCompact].forEach(btn => {
            if (!btn) return;
            btn.className = 'btn btn-sm btn-outline-secondary';
        });
        return; // フィルタ中は以降の処理をスキップ
    }
    
    // 通常時：全てのアコーディオンの状態をチェック
    const allOpen = sectionInfo.every(info => accordionStates[info.id] === true);
    const allClosed = sectionInfo.every(info => accordionStates[info.id] === false);
    
    // 全てのアーカイブセクションの状態をチェック
    const archiveBodies = document.querySelectorAll('.archive-body');
    let allArchivesOpen = true;
    let allArchivesClosed = true;
    
    if (archiveBodies.length > 0) {
        archiveBodies.forEach(body => {
            if (!body.classList.contains('show')) {
                allArchivesOpen = false;
            } else {
                allArchivesClosed = false;
            }
        });
    } else {
        // アーカイブが存在しない場合は、メインセクションの状態のみで判定
        allArchivesOpen = true;
        allArchivesClosed = true;
    }
    
    // 開くボタンの状態を更新（メインとアーカイブ両方が全開の場合のみ塗りつぶし）
    [openAllBtn, openAllBtnCompact].forEach(btn => {
        if (!btn) return;
        if (allOpen && allArchivesOpen) {
            // 全開状態: 塗りつぶし
            btn.className = 'btn btn-sm btn-primary';
        } else {
            // その他: アウトライン
            btn.className = 'btn btn-sm btn-outline-primary';
        }
    });
    
    // 閉じるボタンの状態を更新（メインとアーカイブ両方が全閉の場合のみ塗りつぶし）
    [closeAllBtn, closeAllBtnCompact].forEach(btn => {
        if (!btn) return;
        if (allClosed && allArchivesClosed) {
            // 全閉状態: 塗りつぶし
            btn.className = 'btn btn-sm btn-secondary';
        } else {
            // その他: アウトライン
            btn.className = 'btn btn-sm btn-outline-secondary';
        }
    });
}

// アコーディオンの開閉を切り替え
function toggleAccordion(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const body = section.querySelector('.accordion-body-custom');
    const icon = section.querySelector('.accordion-toggle-icon');
    
    if (!body || !icon) return;
    
    if (body.classList.contains('show')) {
        body.classList.remove('show');
        icon.classList.add('collapsed');
        accordionStates[sectionId] = false;
    } else {
        body.classList.add('show');
        icon.classList.remove('collapsed');
        accordionStates[sectionId] = true;
    }
    
    // ボタンの状態を更新
    updateAccordionButtonStates();
}

// 全開
function openAllAccordions() {
    // フィルタが適用されている場合は解除
    if (currentFilterTag) {
        clearHashTagFilter();
        // フィルタ解除後、すべて開いた状態にするため処理を続行
    }
    
    // メインセクションを全て開く
    sectionInfo.forEach(info => {
        const section = document.getElementById(info.id);
        if (!section) return;
        
        const body = section.querySelector('.accordion-body-custom');
        const icon = section.querySelector('.accordion-toggle-icon');
        
        if (!body || !icon) return;
        
        body.classList.add('show');
        icon.classList.remove('collapsed');
        accordionStates[info.id] = true;
    });
    
    // 全てのアーカイブセクションも開く
    const archiveBodies = document.querySelectorAll('.archive-body');
    const archiveIcons = document.querySelectorAll('.archive-toggle-icon');
    
    archiveBodies.forEach(body => {
        body.classList.add('show');
        body.style.display = 'block';
    });
    
    archiveIcons.forEach(icon => {
        icon.classList.remove('collapsed');
    });
    
    // ボタンの状態を更新
    updateAccordionButtonStates();
}

// 全閉
function closeAllAccordions() {
    // フィルタが適用されている場合は解除
    if (currentFilterTag) {
        clearHashTagFilter();
        // フィルタ解除後、すべて閉じた状態にするため処理を続行
    }
    
    // メインセクションを全て閉じる
    sectionInfo.forEach(info => {
        const section = document.getElementById(info.id);
        if (!section) return;
        
        const body = section.querySelector('.accordion-body-custom');
        const icon = section.querySelector('.accordion-toggle-icon');
        
        if (!body || !icon) return;
        
        body.classList.remove('show');
        icon.classList.add('collapsed');
        accordionStates[info.id] = false;
    });
    
    // 全てのアーカイブセクションも閉じる
    const archiveBodies = document.querySelectorAll('.archive-body');
    const archiveIcons = document.querySelectorAll('.archive-toggle-icon');
    
    archiveBodies.forEach(body => {
        body.classList.remove('show');
        body.style.display = 'none';
    });
    
    archiveIcons.forEach(icon => {
        icon.classList.add('collapsed');
    });
    
    // ボタンの状態を更新
    updateAccordionButtonStates();
}

// セクションナビゲーションを更新（削除）
function updateSectionNavigation(filterTag = null) {
    // セクションナビゲーションは削除されたため、何もしない
}

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
    const summaryIndex = headers.indexOf('summary');
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
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
        
        // 表示対象外のkeyをスキップ
        const excludedKeys = ['cmp2000', 'kevinKevinson', 'ryoIida'];
        if (excludedKeys.includes(values[keyIndex])) continue;
        
        if (values[keyIndex] && values[categoryIndex] && values[siteTitleIndex]) {
            items.push({
                key: values[keyIndex],
                category: values[categoryIndex],
                siteTitle: values[siteTitleIndex],
                hashTag: values[hashTagIndex] || '',
                siteUrl: values[siteUrlIndex] || '#',
                logo: values[logoIndex] || '',
                comment: values[commentIndex] || '',
                summary: summaryIndex >= 0 ? (values[summaryIndex] || '') : ''
            });
        }
    }
    
    return items;
}

// アーカイブCSVの解析
function parseArchiveCSV(csvText) {
    console.log('=== parseArchiveCSV開始 ===');
    console.log('CSVテキスト長:', csvText.length);
    console.log('CSVの最初の200文字:', csvText.substring(0, 200));
    
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    console.log('ヘッダー:', headers);
    
    const categoryIndex = headers.indexOf('category');
    const siteTitleIndex = headers.indexOf('siteTitle');
    const hashTagIndex = headers.indexOf('hashTag');
    const siteUrlIndex = headers.indexOf('siteUrl');
    const logoIndex = headers.indexOf('logo');
    const commentIndex = headers.indexOf('comment');
    
    console.log('インデックス情報:');
    console.log('  categoryIndex:', categoryIndex);
    console.log('  siteTitleIndex:', siteTitleIndex);
    console.log('  hashTagIndex:', hashTagIndex);
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
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
    
    console.log('parseArchiveCSV完了: アイテム数=', items.length);
    if (items.length > 0) {
        console.log('最初のアイテム:', items[0]);
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

// ハッシュタグをパースする関数
function parseHashTags(hashTagString) {
    if (!hashTagString) return [];
    return hashTagString.split(/[\s\u3000]+/).filter(tag => tag.startsWith('#')).map(tag => tag.trim());
}

// すべてのハッシュタグを収集
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

// ハッシュタグ一覧を生成
function generateHashTagList(allTags, filterTag = null) {
    const container = document.getElementById('hashtag-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 各ハッシュタグの出現数をカウント（全アコーディオンを対象）
    const tagCounts = {};
    allTags.forEach(tag => {
        tagCounts[tag] = 0;
    });
    
    // allBasicInfo, allArchiveInfo, allFamilyInfo の全データからカウント
    [allBasicInfo, allArchiveInfo, allFamilyInfo].forEach(dataArray => {
        dataArray.forEach(item => {
            if (item.hashTag) {
                const tags = parseHashTags(item.hashTag);
                tags.forEach(tag => {
                    if (tagCounts.hasOwnProperty(tag)) {
                        tagCounts[tag]++;
                    }
                });
            }
        });
    });
    
    allTags.forEach(tag => {
        const tagButton = document.createElement('button');
        tagButton.className = 'hashtag-button';
        tagButton.textContent = `${tag} (${tagCounts[tag]})`;
        
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
        <div class="alert alert-danger d-flex justify-content-between align-items-center mb-3" role="alert">
            <span>フィルタ: <strong>${tag}</strong></span>
            <button type="button" class="btn btn-sm btn-secondary" onclick="clearHashTagFilter()">
                フィルタ解除
            </button>
        </div>
    `;
}

// フィルタUIを非表示
function hideFilterUI() {
    const container = document.getElementById('filter-ui-container');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

// ヘッダーの高さを考慮してセクションにスクロール
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    const header = document.getElementById('main-header');
    
    if (section && header) {
        const headerHeight = header.offsetHeight;
        const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = sectionTop - headerHeight - 10; // 10pxの余白を追加
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// ページ読み込み時にURLハッシュをチェックして該当セクションに移動
function handleInitialHash() {
    const hash = window.location.hash.replace('#', '');
    
    // 有効なセクションIDのリスト
    const validSections = ['common', 'kevin', 'ryo', 'staff', 'family', 'specialThanks'];
    
    if (hash && validSections.includes(hash)) {
        // すべてのアコーディオンを閉じる
        sectionInfo.forEach(info => {
            const section = document.getElementById(info.id);
            if (!section) return;
            
            const body = section.querySelector('.accordion-body-custom');
            const icon = section.querySelector('.accordion-toggle-icon');
            
            if (body && icon) {
                body.classList.remove('show');
                icon.classList.add('collapsed');
                accordionStates[info.id] = false;
            }
        });
        
        // 該当セクションのメインアコーディオンを開く
        const targetSection = document.getElementById(hash);
        if (targetSection) {
            const body = targetSection.querySelector('.accordion-body-custom');
            const icon = targetSection.querySelector('.accordion-toggle-icon');
            
            if (body && icon) {
                body.classList.add('show');
                icon.classList.remove('collapsed');
                accordionStates[hash] = true;
            }
            
            // 該当セクションのアーカイブアコーディオンも開く
            const archiveBody = targetSection.querySelector('.archive-body');
            const archiveIcon = targetSection.querySelector('.archive-toggle-icon');
            
            if (archiveBody && archiveIcon) {
                archiveBody.classList.add('show');
                archiveBody.style.display = 'block';
                archiveIcon.classList.remove('collapsed');
            }
        }
        
        // ボタンの状態を更新
        updateAccordionButtonStates();
        
        // スクロール位置を調整（CSSのscroll-margin-topと併用してより確実に）
        setTimeout(() => {
            scrollToSection(hash);
        }, 500);
    }
}

// ジャンプメニューを更新
function updateJumpMenu(filterTag) {
    const dropdownMenu = document.getElementById('jumpMenuList');
    if (!dropdownMenu) return;
    
    dropdownMenu.innerHTML = '';
    
    // ヘッダーへのリンク
    const headerItem = document.createElement('li');
    const headerLink = document.createElement('a');
    headerLink.className = 'dropdown-item';
    headerLink.href = '#';
    headerLink.textContent = 'ヘッダー';
    headerLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    headerItem.appendChild(headerLink);
    dropdownMenu.appendChild(headerItem);
    
    // 区切り線
    const divider1 = document.createElement('li');
    divider1.innerHTML = '<hr class="dropdown-divider">';
    dropdownMenu.appendChild(divider1);
    
    if (filterTag) {
        // フィルタに該当するカテゴリを特定
        const matchingSections = [];
        
        // basicInfoからフィルタに該当するカテゴリを取得
        const basicByCategory = {};
        allBasicInfo.forEach(item => {
            const tags = parseHashTags(item.hashTag);
            if (tags.includes(filterTag)) {
                if (!basicByCategory[item.category]) {
                    basicByCategory[item.category] = true;
                }
            }
        });
        
        // archiveInfoからフィルタに該当するカテゴリを取得
        const archiveByCategory = {};
        allArchiveInfo.forEach(item => {
            const tags = parseHashTags(item.hashTag);
            if (tags.includes(filterTag)) {
                if (!archiveByCategory[item.category]) {
                    archiveByCategory[item.category] = true;
                }
            }
        });
        
        // familyInfoからフィルタに該当するカテゴリを取得
        const familyByCategory = {};
        allFamilyInfo.forEach(item => {
            const tags = parseHashTags(item.hashTag);
            if (tags.includes(filterTag)) {
                if (!familyByCategory[item.category]) {
                    familyByCategory[item.category] = true;
                }
            }
        });
        
        // メインカテゴリ（ユニット活動、けびん、リョウ）のジャンプリンクを生成
        ['ユニット活動', 'けびんケビンソン(ソロ)', 'イイダリョウ(ソロ)'].forEach(category => {
            const hasBasic = basicByCategory[category];
            const hasArchive = archiveByCategory[category];
            
            if (hasBasic || hasArchive) {
                const sectionId = category === 'ユニット活動' ? 'common' : 
                                category === 'けびんケビンソン(ソロ)' ? 'kevin' : 'ryo';
                matchingSections.push({ id: sectionId, name: category });
            }
        });
        
        // ファミリーカテゴリのジャンプリンクを生成
        if (familyByCategory['スタッフ']) {
            matchingSections.push({ id: 'staff', name: 'スタッフ' });
        }
        if (familyByCategory['ファミリー']) {
            matchingSections.push({ id: 'family', name: 'ファミリー' });
        }
        if (familyByCategory['スペシャルサンクス']) {
            matchingSections.push({ id: 'specialThanks', name: 'スペシャルサンクス' });
        }
        
        // ジャンプリンクを生成
        matchingSections.forEach(section => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.className = 'dropdown-item';
            link.href = `#${section.id}`;
            link.textContent = section.name;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                scrollToSection(section.id);
            });
            item.appendChild(link);
            dropdownMenu.appendChild(item);
        });
    } else {
        // CSVデータから動的にセクションを生成
        const sections = [];
        
        // カテゴリごとにグループ化（generateAboutPageと同じロジック）
        const basicByCategory = {};
        allBasicInfo.forEach(item => {
            if (!basicByCategory[item.category]) {
                basicByCategory[item.category] = [];
            }
            basicByCategory[item.category].push(item);
        });
        
        const archiveByCategory = {};
        allArchiveInfo.forEach(item => {
            if (!archiveByCategory[item.category]) {
                archiveByCategory[item.category] = [];
            }
            archiveByCategory[item.category].push(item);
        });
        
        // ユニット活動、けびんケビンソン(ソロ)、イイダリョウ(ソロ)
        ['ユニット活動', 'けびんケビンソン(ソロ)', 'イイダリョウ(ソロ)'].forEach(category => {
            const hasBasic = basicByCategory[category] && basicByCategory[category].length > 0;
            const hasArchive = archiveByCategory[category] && archiveByCategory[category].length > 0;
            
            if (hasBasic || hasArchive) {
                const sectionId = category === 'ユニット活動' ? 'common' : 
                                category === 'けびんケビンソン(ソロ)' ? 'kevin' : 'ryo';
                sections.push({ id: sectionId, name: category });
            }
        });
        
        // ファミリー情報から各セクションを追加
        const familyByCategory = {};
        allFamilyInfo.forEach(member => {
            if (!familyByCategory[member.category]) {
                familyByCategory[member.category] = [];
            }
            familyByCategory[member.category].push(member);
        });
        
        if (familyByCategory['スタッフ'] && familyByCategory['スタッフ'].length > 0) {
            sections.push({ id: 'staff', name: 'スタッフ' });
        }
        
        if (familyByCategory['ファミリー'] && familyByCategory['ファミリー'].length > 0) {
            sections.push({ id: 'family', name: 'ファミリー' });
        }
        
        if (familyByCategory['スペシャルサンクス'] && familyByCategory['スペシャルサンクス'].length > 0) {
            sections.push({ id: 'specialThanks', name: 'スペシャルサンクス' });
        }
        
        // セクションのリンクを生成
        sections.forEach(section => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.className = 'dropdown-item';
            link.href = `#${section.id}`;
            link.textContent = section.name;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                scrollToSection(section.id);
            });
            item.appendChild(link);
            dropdownMenu.appendChild(item);
        });
    }
    
    // 区切り線
    const divider2 = document.createElement('li');
    divider2.innerHTML = '<hr class="dropdown-divider">';
    dropdownMenu.appendChild(divider2);
    
    // フッターへのリンク
    const footerItem = document.createElement('li');
    const footerLink = document.createElement('a');
    footerLink.className = 'dropdown-item';
    footerLink.href = '#footer';
    footerLink.textContent = 'フッター';
    footerLink.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToSection('footer');
    });
    footerItem.appendChild(footerLink);
    dropdownMenu.appendChild(footerItem);
}

// ハッシュタグフィルタを適用
function applyHashTagFilter(tag) {
    currentFilterTag = tag;
    
    // 現在の開閉状態を保存
    preFilterStates = { ...accordionStates };
    
    // フィルタに該当するカテゴリを特定
    const basicByCategory = {};
    allBasicInfo.forEach(item => {
        const tags = parseHashTags(item.hashTag);
        if (tags.includes(tag)) {
            if (!basicByCategory[item.category]) {
                basicByCategory[item.category] = true;
            }
        }
    });
    
    const archiveByCategory = {};
    allArchiveInfo.forEach(item => {
        const tags = parseHashTags(item.hashTag);
        if (tags.includes(tag)) {
            if (!archiveByCategory[item.category]) {
                archiveByCategory[item.category] = true;
            }
        }
    });
    
    const familyByCategory = {};
    allFamilyInfo.forEach(item => {
        const tags = parseHashTags(item.hashTag);
        if (tags.includes(tag)) {
            if (!familyByCategory[item.category]) {
                familyByCategory[item.category] = true;
            }
        }
    });
    
    // フィルタに該当するアコーディオンのみを開く
    sectionInfo.forEach(info => {
        let shouldOpen = false;
        
        if (info.id === 'common') {
            shouldOpen = basicByCategory['ユニット活動'] || archiveByCategory['ユニット活動'];
        } else if (info.id === 'kevin') {
            shouldOpen = basicByCategory['けびんケビンソン(ソロ)'] || archiveByCategory['けびんケビンソン(ソロ)'];
        } else if (info.id === 'ryo') {
            shouldOpen = basicByCategory['イイダリョウ(ソロ)'] || archiveByCategory['イイダリョウ(ソロ)'];
        } else if (info.id === 'staff') {
            shouldOpen = familyByCategory['スタッフ'];
        } else if (info.id === 'family') {
            shouldOpen = familyByCategory['ファミリー'];
        } else if (info.id === 'specialThanks') {
            shouldOpen = familyByCategory['スペシャルサンクス'];
        }
        
        accordionStates[info.id] = shouldOpen;
    });
    
    // フィルタ適用してページを再生成
    generateAboutPage(tag);
    
    // フィルタUIを表示
    showFilterUI(tag);
    
    // ジャンプメニューを更新
    updateJumpMenu(tag);
    
    // ハッシュタグ一覧の状態を更新
    const allTags = collectAllHashTags(allBasicInfo, allArchiveInfo, allFamilyInfo);
    generateHashTagList(allTags, tag);
    
    // ボタンの状態を更新（フィルタ中はアウトライン表示）
    updateAccordionButtonStates();
    
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
    
    // 開閉状態を元に戻す
    if (preFilterStates) {
        accordionStates = { ...preFilterStates };
        preFilterStates = null;
    }
    
    // フィルタなしでページを再生成
    generateAboutPage();
    
    // フィルタUIを非表示
    hideFilterUI();
    
    // ジャンプメニューを更新
    updateJumpMenu(null);
    
    // ハッシュタグボタンの状態を更新
    const allTags = collectAllHashTags(allBasicInfo, allArchiveInfo, allFamilyInfo);
    generateHashTagList(allTags);
    
    // ボタンの状態を更新（フィルタ解除後の状態に戻す）
    updateAccordionButtonStates();
    
    // 「共通コンテンツ」セクションにスムーズスクロール
    setTimeout(() => {
        const commonSection = document.getElementById('common');
        if (commonSection) {
            commonSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// ハッシュタグをリンクに変換
function convertHashTagsToLinks(hashTagString) {
    if (!hashTagString) return '';
    const tags = parseHashTags(hashTagString);
    return tags.map(tag => {
        return `<a href="#" class="hashtag-link" onclick="event.preventDefault(); applyHashTagFilter('${tag}');">${tag}</a>`;
    }).join(' ');
}

// About ページのコンテンツを生成（アコーディオン対応版）
function generateAboutPage(filterTag = null) {
    const container = document.getElementById('about-content');
    if (!container) return;
    
    container.innerHTML = '';
    
    // カテゴリごとにグループ化
    const basicByCategory = {};
    allBasicInfo.forEach(item => {
        if (!basicByCategory[item.category]) {
            basicByCategory[item.category] = [];
        }
        basicByCategory[item.category].push(item);
    });
    
    const archiveByCategory = {};
    allArchiveInfo.forEach(item => {
        if (!archiveByCategory[item.category]) {
            archiveByCategory[item.category] = [];
        }
        archiveByCategory[item.category].push(item);
    });
    
    // デバッグ用ログ
    console.log('=== アーカイブデータのデバッグ ===');
    console.log('allArchiveInfo件数:', allArchiveInfo.length);
    console.log('archiveByCategoryのキー:', Object.keys(archiveByCategory));
    console.log('archiveByCategory:', archiveByCategory);
    
    const familyByCategory = {};
    allFamilyInfo.forEach(item => {
        if (!familyByCategory[item.category]) {
            familyByCategory[item.category] = [];
        }
        familyByCategory[item.category].push(item);
    });
    
    // フィルタリング処理
    if (filterTag) {
        Object.keys(basicByCategory).forEach(category => {
            basicByCategory[category] = basicByCategory[category].filter(item => {
                const tags = parseHashTags(item.hashTag);
                return tags.includes(filterTag);
            });
            if (basicByCategory[category].length === 0) {
                delete basicByCategory[category];
            }
        });
        
        Object.keys(archiveByCategory).forEach(category => {
            archiveByCategory[category] = archiveByCategory[category].filter(item => {
                const tags = parseHashTags(item.hashTag);
                return tags.includes(filterTag);
            });
            if (archiveByCategory[category].length === 0) {
                delete archiveByCategory[category];
            }
        });
        
        Object.keys(familyByCategory).forEach(category => {
            familyByCategory[category] = familyByCategory[category].filter(item => {
                const tags = parseHashTags(item.hashTag);
                return tags.includes(filterTag);
            });
            if (familyByCategory[category].length === 0) {
                delete familyByCategory[category];
            }
        });
    }
    
    // 共通、けびん、リョウのセクション（アコーディオン）
    ['ユニット活動', 'けびんケビンソン(ソロ)', 'イイダリョウ(ソロ)'].forEach(category => {
        const hasBasic = basicByCategory[category] && basicByCategory[category].length > 0;
        const hasArchive = archiveByCategory[category] && archiveByCategory[category].length > 0;
        
        console.log(`カテゴリ "${category}":`, {
            hasBasic,
            basicCount: hasBasic ? basicByCategory[category].length : 0,
            hasArchive,
            archiveCount: hasArchive ? archiveByCategory[category].length : 0
        });
        
        if (hasBasic || hasArchive) {
            const sectionId = category === 'ユニット活動' ? 'common' : 
                            category === 'けびんケビンソン(ソロ)' ? 'kevin' : 'ryo';
            
            // 件数計算
            const activeCount = hasBasic ? basicByCategory[category].length : 0;
            const archiveCount = hasArchive ? archiveByCategory[category].length : 0;
            
            const accordionSection = document.createElement('div');
            accordionSection.className = 'accordion-section';
            accordionSection.id = sectionId;
            
            // アコーディオンヘッダー
            const accordionHeader = document.createElement('div');
            accordionHeader.className = 'accordion-header-custom';
            
            // categoryから見出しを取得（CSVのcategoryカラムの値をそのまま使用）
            const headerTitle = document.createElement('div');
            headerTitle.className = 'accordion-header-title';
            headerTitle.textContent = category;
            
            const headerStats = document.createElement('div');
            headerStats.className = 'accordion-header-stats';
            
            const activeBadge = document.createElement('span');
            activeBadge.className = 'stat-badge active-count';
            activeBadge.textContent = `アクティブ: ${activeCount}`;
            
            const archiveBadge = document.createElement('span');
            archiveBadge.className = 'stat-badge archive-count';
            archiveBadge.textContent = `アーカイブ: ${archiveCount}`;
            
            headerStats.appendChild(activeBadge);
            headerStats.appendChild(archiveBadge);
            
            const toggleIcon = document.createElement('span');
            toggleIcon.className = 'accordion-toggle-icon';
            toggleIcon.textContent = '▼';
            
            accordionHeader.appendChild(headerTitle);
            accordionHeader.appendChild(headerStats);
            accordionHeader.appendChild(toggleIcon);
            
            // アコーディオンボディ
            const accordionBody = document.createElement('div');
            accordionBody.className = 'accordion-body-custom';
            
            // 説明文を追加（けびんとリョウのみ）
            if (category === 'けびんケビンソン(ソロ)') {
                const descDiv = document.createElement('p');
                descDiv.className = 'person-description';
                descDiv.style.cssText = 'margin-bottom: 1rem; color: #6c757d; line-height: 1.5;';
                descDiv.textContent = '2019年（コロナ禍）頃からの参画で、現在はCMP2000管理人の役割を担っている。「何か」をしたくて活動しており、現在も模索中。';
                accordionBody.appendChild(descDiv);
            } else if (category === 'イイダリョウ(ソロ)') {
                const descDiv = document.createElement('p');
                descDiv.className = 'person-description';
                descDiv.style.cssText = 'margin-bottom: 1rem; color: #6c757d; line-height: 1.5;';
                descDiv.textContent = '2014年頃から参画しているCMP2000主要メンバー。多岐に渡るキャリアを経ており、現在はフロントエンドを中心としたエンジニア。';
                accordionBody.appendChild(descDiv);
            }
            
            // アクティブなサイト（テーブル形式）
            if (hasBasic) {
                const tableContainer = document.createElement('div');
                tableContainer.className = 'table-responsive';
                
                const table = document.createElement('table');
                table.className = 'table site-table';
                
                const tbody = document.createElement('tbody');
                
                basicByCategory[category].forEach(site => {
                    const row = document.createElement('tr');
                    
                    // サイト名/リンク
                    const titleCell = document.createElement('td');
                    titleCell.className = 'site-title-cell';
                    const siteLink = document.createElement('a');
                    siteLink.href = site.siteUrl;
                    siteLink.target = '_blank';
                    siteLink.className = 'site-link';
                    siteLink.textContent = site.siteTitle;
                    titleCell.appendChild(siteLink);
                    row.appendChild(titleCell);
                    
                    // ロゴ
                    const logoCell = document.createElement('td');
                    logoCell.className = 'site-logo-cell';
                    if (site.logo) {
                        const logoImg = document.createElement('img');
                        logoImg.src = site.logo;
                        logoImg.className = 'logo-img';
                        logoImg.alt = 'logo';
                        logoCell.appendChild(logoImg);
                    }
                    row.appendChild(logoCell);
                    
                    // ハッシュタグ
                    const hashTagCell = document.createElement('td');
                    hashTagCell.className = 'site-hashtag-cell';
                    if (site.hashTag) {
                        const hashTagSpan = document.createElement('span');
                        hashTagSpan.className = 'hashtag-display';
                        hashTagSpan.innerHTML = convertHashTagsToLinks(site.hashTag);
                        hashTagCell.appendChild(hashTagSpan);
                    }
                    row.appendChild(hashTagCell);
                    
                    // コメント
                    const commentCell = document.createElement('td');
                    commentCell.className = 'site-comment-cell';
                    if (site.comment) {
                        commentCell.textContent = site.comment;
                    }
                    row.appendChild(commentCell);
                    
                    tbody.appendChild(row);
                });
                
                table.appendChild(tbody);
                tableContainer.appendChild(table);
                accordionBody.appendChild(tableContainer);
            }
            
            // アーカイブ（開閉可能）
            if (hasArchive) {
                const archiveSection = document.createElement('div');
                archiveSection.className = 'archive-accordion mt-3';
                
                // アーカイブヘッダー（クリック可能）
                const archiveHeader = document.createElement('div');
                archiveHeader.className = 'archive-header';
                archiveHeader.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background-color: #f8f9fa; border-radius: 0.25rem; cursor: pointer; user-select: none; transition: background-color 0.2s ease;';
                
                const archiveTitle = document.createElement('div');
                archiveTitle.className = 'archive-title';
                archiveTitle.style.cssText = 'font-weight: 600; color: #495057;';
                archiveTitle.textContent = 'アーカイブ';
                
                const archiveToggleIcon = document.createElement('span');
                archiveToggleIcon.className = 'archive-toggle-icon collapsed';
                archiveToggleIcon.textContent = '▼';
                
                archiveHeader.appendChild(archiveTitle);
                archiveHeader.appendChild(archiveToggleIcon);
                archiveSection.appendChild(archiveHeader);
                
                // アーカイブボディ（初期状態は非表示）
                const archiveBody = document.createElement('div');
                archiveBody.className = 'archive-body';
                archiveBody.style.cssText = 'padding: 1rem 0.5rem; display: none;';
                
                const tableContainer = document.createElement('div');
                tableContainer.className = 'table-responsive';
                
                const table = document.createElement('table');
                table.className = 'table archive-table';
                
                const tbody = document.createElement('tbody');
                
                archiveByCategory[category].forEach(archive => {
                    const row = document.createElement('tr');
                    
                    // サイト名/リンク
                    const titleCell = document.createElement('td');
                    titleCell.className = 'archive-title-cell';
                    
                    if (archive.siteUrl && archive.siteUrl.trim() !== '' && archive.siteUrl !== '#') {
                        const archiveLink = document.createElement('a');
                        archiveLink.href = archive.siteUrl;
                        archiveLink.target = '_blank';
                        archiveLink.className = 'site-link';
                        archiveLink.textContent = archive.siteTitle;
                        titleCell.appendChild(archiveLink);
                    } else {
                        const archiveText = document.createElement('span');
                        archiveText.textContent = archive.siteTitle;
                        archiveText.style.color = '#6c757d';
                        titleCell.appendChild(archiveText);
                    }
                    row.appendChild(titleCell);
                    
                    // ロゴ
                    const logoCell = document.createElement('td');
                    logoCell.className = 'archive-logo-cell';
                    if (archive.logo) {
                        const logoImg = document.createElement('img');
                        logoImg.src = archive.logo;
                        logoImg.className = 'logo-img';
                        logoImg.alt = 'logo';
                        logoCell.appendChild(logoImg);
                    }
                    row.appendChild(logoCell);
                    
                    // ハッシュタグ
                    const hashTagCell = document.createElement('td');
                    hashTagCell.className = 'archive-hashtag-cell';
                    if (archive.hashTag) {
                        const hashTagSpan = document.createElement('span');
                        hashTagSpan.className = 'hashtag-display';
                        hashTagSpan.innerHTML = convertHashTagsToLinks(archive.hashTag);
                        hashTagCell.appendChild(hashTagSpan);
                    }
                    row.appendChild(hashTagCell);
                    
                    // コメント
                    const commentCell = document.createElement('td');
                    commentCell.className = 'archive-comment-cell';
                    if (archive.comment) {
                        commentCell.textContent = archive.comment;
                    }
                    row.appendChild(commentCell);
                    
                    tbody.appendChild(row);
                });
                
                table.appendChild(tbody);
                tableContainer.appendChild(table);
                archiveBody.appendChild(tableContainer);
                archiveSection.appendChild(archiveBody);
                
                // アーカイブの開閉イベント
                archiveHeader.addEventListener('click', () => {
                    if (archiveBody.classList.contains('show')) {
                        archiveBody.classList.remove('show');
                        archiveBody.style.display = 'none';
                        archiveToggleIcon.classList.add('collapsed');
                    } else {
                        archiveBody.classList.add('show');
                        archiveBody.style.display = 'block';
                        archiveToggleIcon.classList.remove('collapsed');
                    }
                    
                    // ボタンの状態を更新
                    updateAccordionButtonStates();
                });
                
                // フィルタモード時はアーカイブも自動的に開く
                if (filterTag) {
                    archiveBody.classList.add('show');
                    archiveBody.style.display = 'block';
                    archiveToggleIcon.classList.remove('collapsed');
                }
                
                accordionBody.appendChild(archiveSection);
            }
            
            accordionSection.appendChild(accordionHeader);
            accordionSection.appendChild(accordionBody);
            container.appendChild(accordionSection);
            
            // クリックイベント
            accordionHeader.addEventListener('click', () => {
                toggleAccordion(sectionId);
            });
            
            // 初期状態の設定
            if (accordionStates[sectionId]) {
                accordionBody.classList.add('show');
            } else {
                toggleIcon.classList.add('collapsed');
            }
        }
    });
    
    // スタッフ、ファミリー、スペシャルサンクス（アコーディオン）
    ['スタッフ', 'ファミリー', 'スペシャルサンクス'].forEach(familyCategory => {
        if (familyByCategory[familyCategory]) {
            const sectionId = familyCategory === 'スタッフ' ? 'staff' :
                            familyCategory === 'ファミリー' ? 'family' : 'specialThanks';
            
            const memberCount = familyByCategory[familyCategory].length;
            
            const accordionSection = document.createElement('div');
            accordionSection.className = 'accordion-section';
            accordionSection.id = sectionId;
            
            // アコーディオンヘッダー
            const accordionHeader = document.createElement('div');
            accordionHeader.className = 'accordion-header-custom';
            
            const headerTitle = document.createElement('div');
            headerTitle.className = 'accordion-header-title';
            headerTitle.textContent = familyCategory;
            
            const headerStats = document.createElement('div');
            headerStats.className = 'accordion-header-stats';
            
            const countBadge = document.createElement('span');
            countBadge.className = 'stat-badge';
            countBadge.textContent = `${memberCount}件`;
            headerStats.appendChild(countBadge);
            
            const toggleIcon = document.createElement('span');
            toggleIcon.className = 'accordion-toggle-icon';
            toggleIcon.textContent = '▼';
            
            accordionHeader.appendChild(headerTitle);
            accordionHeader.appendChild(headerStats);
            accordionHeader.appendChild(toggleIcon);
            
            // アコーディオンボディ
            const accordionBody = document.createElement('div');
            accordionBody.className = 'accordion-body-custom';
            
            familyByCategory[familyCategory].forEach(member => {
                const familyItem = document.createElement('div');
                familyItem.className = 'family-item';
                
                const familyNameContainer = document.createElement('div');
                familyNameContainer.style.marginBottom = '0.25rem';
                
                const familyName = document.createElement('span');
                familyName.className = 'family-name';
                familyName.textContent = member.name;
                familyNameContainer.appendChild(familyName);
                
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
                
                accordionBody.appendChild(familyItem);
            });
            
            accordionSection.appendChild(accordionHeader);
            accordionSection.appendChild(accordionBody);
            container.appendChild(accordionSection);
            
            // クリックイベント
            accordionHeader.addEventListener('click', () => {
                toggleAccordion(sectionId);
            });
            
            // 初期状態の設定
            if (accordionStates[sectionId]) {
                accordionBody.classList.add('show');
            } else {
                toggleIcon.classList.add('collapsed');
            }
        }
    });
    
    // 初回生成時のみハッシュタグ一覧を生成
    if (!filterTag && !currentFilterTag) {
        const allTags = collectAllHashTags(allBasicInfo, allArchiveInfo, allFamilyInfo);
        generateHashTagList(allTags);
    }
    
    // セクションナビゲーションを更新
    updateSectionNavigation(filterTag);
    
    // ボタンの状態を更新
    updateAccordionButtonStates();
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
        
        // 全開/全閉ボタンのイベント（通常時）
        const openAllBtn = document.getElementById('openAllBtn');
        const closeAllBtn = document.getElementById('closeAllBtn');
        if (openAllBtn) openAllBtn.addEventListener('click', openAllAccordions);
        if (closeAllBtn) closeAllBtn.addEventListener('click', closeAllAccordions);
        
        // 全開/全閉ボタンのイベント（コンパクト版）
        const openAllBtnCompact = document.getElementById('openAllBtnCompact');
        const closeAllBtnCompact = document.getElementById('closeAllBtnCompact');
        if (openAllBtnCompact) openAllBtnCompact.addEventListener('click', openAllAccordions);
        if (closeAllBtnCompact) closeAllBtnCompact.addEventListener('click', closeAllAccordions);
        
        // URLハッシュをチェックして該当セクションに移動
        handleInitialHash();
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
            
            // 全開/全閉ボタンのイベント（通常時）
            const openAllBtn = document.getElementById('openAllBtn');
            const closeAllBtn = document.getElementById('closeAllBtn');
            if (openAllBtn) openAllBtn.addEventListener('click', openAllAccordions);
            if (closeAllBtn) closeAllBtn.addEventListener('click', closeAllAccordions);
            
            // 全開/全閉ボタンのイベント（コンパクト版）
            const openAllBtnCompact = document.getElementById('openAllBtnCompact');
            const closeAllBtnCompact = document.getElementById('closeAllBtnCompact');
            if (openAllBtnCompact) openAllBtnCompact.addEventListener('click', openAllAccordions);
            if (closeAllBtnCompact) closeAllBtnCompact.addEventListener('click', closeAllAccordions);
            
            // URLハッシュをチェックして該当セクションに移動
            handleInitialHash();
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
    const normalHeader = header ? header.querySelector('.header-title-normal') : null;
    const compactHeader = header ? header.querySelector('.header-compact') : null;
    
    console.log('initHeaderScroll called (About)');
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
                document.body.classList.add('header-scrolled');
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
                document.body.classList.remove('header-scrolled');
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
        console.error('Header elements not found! (About)');
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