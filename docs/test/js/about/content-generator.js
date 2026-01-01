/**
 * Aboutページのコンテンツ生成モジュール
 * メインのページ生成ロジックとハッシュタグリスト生成
 */

import { parseHashTags, convertHashTagsToLinks } from '../shared/hashtag.js';
import { accordionStates } from './accordion.js';
import { updateAccordionButtonStates, toggleAccordion } from './accordion.js';
import { updateSectionNavigation } from './navigation.js';

/**
 * CSVからcommentを取得
 * @param {string} csvText - CSV テキスト
 * @param {string} targetKey - 検索するkey
 * @returns {string} comment
 */
function getCommentByKey(csvText, targetKey) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const keyIndex = headers.indexOf('key');
    const commentIndex = headers.indexOf('comment');
    
    if (keyIndex === -1 || commentIndex === -1) return '';
    
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
        
        if (values[keyIndex] === targetKey) {
            let comment = values[commentIndex] || '';
            // 前後の引用符を除去
            if (comment.startsWith('"') && comment.endsWith('"')) {
                comment = comment.slice(1, -1);
            }
            return comment;
        }
    }
    
    return '';
}

/**
 * ハッシュタグ一覧を生成
 * @param {Array} allTags - 全ハッシュタグ
 * @param {string|null} activeTag - アクティブなタグ
 * @param {Function} clickCallback - タグクリック時のコールバック
 * @param {Array} basicInfo - Basic Info データ（件数カウント用）
 * @param {Array} archiveInfo - Archive データ（件数カウント用）
 * @param {Array} familyInfo - Family データ（件数カウント用）
 */
export function generateHashTagList(allTags, activeTag, clickCallback, basicInfo = [], archiveInfo = [], familyInfo = []) {
    const container = document.getElementById('hashtag-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!allTags || allTags.length === 0) {
        container.innerHTML = '<p class="text-muted">ハッシュタグがありません</p>';
        return;
    }
    
    // 各ハッシュタグの出現数をカウント（全データを対象）
    const tagCounts = {};
    allTags.forEach(tag => {
        tagCounts[tag] = 0;
    });
    
    // basicInfo, archiveInfo, familyInfo の全データからカウント
    [basicInfo, archiveInfo, familyInfo].forEach(dataArray => {
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
        tagButton.className = activeTag === tag ? 'btn btn-danger btn-sm me-2 mb-2' : 'btn btn-outline-danger btn-sm me-2 mb-2';
        tagButton.textContent = `${tag} (${tagCounts[tag]})`;
        tagButton.addEventListener('click', () => {
            if (clickCallback) {
                clickCallback(tag);
            }
        });
        container.appendChild(tagButton);
    });
}

/**
 * About ページのコンテンツを生成
 * @param {string|null} filterTag - フィルタタグ
 * @param {Array} basicInfo - Basic Info データ
 * @param {Array} archiveInfo - Archive データ
 * @param {Array} familyInfo - Family データ
 * @param {string} basicInfoCsvText - Basic Info の元CSV テキスト
 * @param {Function} hashTagClickCallback - ハッシュタグクリック時のコールバック
 */
export function generateAboutPage(
    filterTag,
    basicInfo,
    archiveInfo,
    familyInfo,
    basicInfoCsvText,
    hashTagClickCallback
) {
    const container = document.getElementById('about-content');
    if (!container) return;
    
    container.innerHTML = '';
    
    // カテゴリごとにグループ化（property が 'conditional' のアイテムは除外）
    const basicByCategory = {};
    basicInfo.forEach(item => {
        // property が 'conditional' の場合は Aboutページには表示しない
        if (item.property === 'conditional') {
            return;
        }
        if (!basicByCategory[item.category]) {
            basicByCategory[item.category] = [];
        }
        basicByCategory[item.category].push(item);
    });
    
    const archiveByCategory = {};
    archiveInfo.forEach(item => {
        if (!archiveByCategory[item.category]) {
            archiveByCategory[item.category] = [];
        }
        archiveByCategory[item.category].push(item);
    });
    
    console.log('=== アーカイブデータのデバッグ ===');
    console.log('archiveInfo件数:', archiveInfo.length);
    console.log('archiveByCategoryのキー:', Object.keys(archiveByCategory));
    
    const familyByCategory = {};
    familyInfo.forEach(item => {
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
            
            // 「更新履歴へ」ボタンを追加
            let timelineLink = '';
            if (category === 'ユニット活動') {
                timelineLink = 'index.html#common';
            } else if (category === 'けびんケビンソン(ソロ)') {
                timelineLink = 'index.html#kevin';
            } else if (category === 'イイダリョウ(ソロ)') {
                timelineLink = 'index.html#ryo';
            }
            
            if (timelineLink) {
                const timelineButtonDiv = document.createElement('div');
                timelineButtonDiv.style.cssText = 'margin-bottom: 1rem; text-align: center;';
                
                const timelineButton = document.createElement('a');
                timelineButton.href = timelineLink;
                timelineButton.className = 'btn btn-outline-primary btn-sm';
                timelineButton.textContent = '📅 更新履歴へ';
                timelineButton.style.cssText = 'text-decoration: none;';
                
                timelineButtonDiv.appendChild(timelineButton);
                accordionBody.appendChild(timelineButtonDiv);
            }
            
            // 説明文を追加
            let descriptionKey = '';
            if (category === 'ユニット活動') {
                descriptionKey = 'cmp2000';
            } else if (category === 'けびんケビンソン(ソロ)') {
                descriptionKey = 'kevinKevinson';
            } else if (category === 'イイダリョウ(ソロ)') {
                descriptionKey = 'ryoIida';
            }
            
            if (descriptionKey && basicInfoCsvText) {
                const description = getCommentByKey(basicInfoCsvText, descriptionKey);
                if (description) {
                    const descDiv = document.createElement('p');
                    descDiv.className = 'person-description';
                    descDiv.style.cssText = 'margin-bottom: 1rem; color: #6c757d; line-height: 1.5;';
                    descDiv.textContent = description;
                    accordionBody.appendChild(descDiv);
                }
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
                    if (site.logo && site.logo.trim() !== '') {
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
                        commentCell.innerHTML = site.comment;
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
                
                // アーカイブヘッダー
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
                
                // アーカイブボディ
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
                    if (archive.logo && archive.logo.trim() !== '') {
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
                        commentCell.innerHTML = archive.comment;
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
                    
                    updateAccordionButtonStates(filterTag);
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
                toggleAccordion(sectionId, filterTag);
            });
            
            // 初期状態の設定
            if (accordionStates[sectionId]) {
                accordionBody.classList.add('show');
            } else {
                toggleIcon.classList.add('collapsed');
            }
        }
    });
    
    // ファミリーセクション（スタッフ、ファミリー、スペシャルサンクス）
    const familyCategories = [
        { key: 'staff', name: 'スタッフ', categoryName: 'スタッフ' },
        { key: 'family', name: 'ファミリー', categoryName: 'ファミリー' },
        { key: 'specialThanks', name: 'スペシャルサンクス', categoryName: 'スペシャルサンクス' }
    ];
    
    familyCategories.forEach(({ key: sectionId, name, categoryName: familyCategory }) => {
        if (familyByCategory[familyCategory] && familyByCategory[familyCategory].length > 0) {
            const memberCount = familyByCategory[familyCategory].length;
            
            const accordionSection = document.createElement('div');
            accordionSection.className = 'accordion-section';
            accordionSection.id = sectionId;
            
            // アコーディオンヘッダー
            const accordionHeader = document.createElement('div');
            accordionHeader.className = 'accordion-header-custom';
            
            const headerTitle = document.createElement('div');
            headerTitle.className = 'accordion-header-title';
            headerTitle.textContent = name;
            
            const headerStats = document.createElement('div');
            headerStats.className = 'accordion-header-stats';
            
            const memberBadge = document.createElement('span');
            memberBadge.className = 'stat-badge active-count';
            memberBadge.textContent = `メンバー: ${memberCount}`;
            
            headerStats.appendChild(memberBadge);
            
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
                familyComment.textContent = member.comment || '';
                
                familyItem.appendChild(familyNameContainer);
                familyItem.appendChild(familyComment);
                
                accordionBody.appendChild(familyItem);
            });
            
            accordionSection.appendChild(accordionHeader);
            accordionSection.appendChild(accordionBody);
            container.appendChild(accordionSection);
            
            // クリックイベント
            accordionHeader.addEventListener('click', () => {
                toggleAccordion(sectionId, filterTag);
            });
            
            // 初期状態の設定
            if (accordionStates[sectionId]) {
                accordionBody.classList.add('show');
            } else {
                toggleIcon.classList.add('collapsed');
            }
        }
    });
    
    // ハッシュタグリンクのイベントリスナーを設定
    if (hashTagClickCallback) {
        const hashtagLinks = container.querySelectorAll('.hashtag-link');
        hashtagLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tag = link.getAttribute('data-tag');
                if (tag) {
                    hashTagClickCallback(tag);
                }
            });
        });
    }
    
    // セクションナビゲーションを更新
    updateSectionNavigation(filterTag);
    
    // ボタンの状態を更新
    updateAccordionButtonStates(filterTag);
}