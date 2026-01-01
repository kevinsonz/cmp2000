/**
 * タブ切り替えモジュール
 * タブの初期化、切り替え、タブリンクセクション生成を管理
 */

import { shouldShowNewBadge } from '../shared/utils.js';
import { NEW_BADGE_DAYS, TAB_CONFIG } from './config.js';

/**
 * HTMLタグとmarkdown記法を除去
 * @param {string} text - 元のテキスト
 * @returns {string} タグとmarkdownを除去したテキスト
 */
function stripHtmlAndMarkdown(text) {
    if (!text) return '';
    
    // HTMLタグを除去
    let result = text.replace(/<[^>]*>/g, '');
    
    // markdown記法を除去
    // 太字: **text** or __text__
    result = result.replace(/\*\*([^*]+)\*\*/g, '$1');
    result = result.replace(/__([^_]+)__/g, '$1');
    
    // 斜体: *text* or _text_
    result = result.replace(/\*([^*]+)\*/g, '$1');
    result = result.replace(/_([^_]+)_/g, '$1');
    
    // リンク: [text](url)
    result = result.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // コードブロック: `code`
    result = result.replace(/`([^`]+)`/g, '$1');
    
    return result.trim();
}

/**
 * タブボタンにアイコンを追加
 */
export function addTabIcons() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        const tabName = button.dataset.tab;
        const config = TAB_CONFIG[tabName];
        
        // 総合タブはアイコンなし
        if (tabName === 'general' || !config || !config.icon) return;
        
        // 既存のテキストを取得
        const textNode = button.childNodes[0];
        if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
        
        const text = textNode.textContent.trim();
        
        // アイコンを作成
        const iconImg = document.createElement('img');
        iconImg.src = config.icon;
        iconImg.alt = `${text} icon`;
        iconImg.className = 'tab-icon';
        iconImg.style.cssText = 'width: 1.2em; height: 1.2em; margin-right: 0.3em; vertical-align: middle; border-radius: 50%; object-fit: cover;';
        
        // ボタンの内容をクリアして再構成
        button.innerHTML = '';
        button.appendChild(iconImg);
        button.appendChild(document.createTextNode(text));
    });
    
    console.log('Tab icons added to buttons');
}

/**
 * タブボタンのイベントリスナーを初期化
 */
export function initTabs(switchTabCallback) {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            switchTabCallback(targetTab);
        });
    });
}

/**
 * タブを切り替え
 * @param {string} tabName - 切り替え先のタブ名
 * @param {string|null} currentFilterTag - 現在のフィルタタグ
 * @param {Function} clearFilterCallback - フィルタクリア時のコールバック
 * @param {Function} updateJumpMenuCallback - ジャンプメニュー更新のコールバック
 * @param {Function} updateDataTableCallback - データテーブル更新のコールバック（generalタブ用）
 * @param {Function} selectDateOnHeatmapCallback - ヒートマップ日付選択のコールバック（generalタブ用）
 * @param {Array} availableDates - 利用可能な日付の配列（generalタブ用）
 * @returns {string} 切り替え後のタブ名
 */
export function switchTab(tabName, currentFilterTag, clearFilterCallback, updateJumpMenuCallback, updateDataTableCallback, selectDateOnHeatmapCallback, availableDates) {
    console.log('=== switchTab called ===');
    console.log('Target tab:', tabName);
    console.log('Current filter tag:', currentFilterTag);
    
    // フィルタモード中にタブボタンをクリックした場合は、フィルタを解除してから通常のタブ切り替えを行う
    if (currentFilterTag && clearFilterCallback && tabName !== 'filter') {
        console.log('Clearing filter before switching to tab:', tabName);
        clearFilterCallback();
        return tabName; // フィルタ解除処理内でタブ切り替えが行われるため、ここで終了
    }
    
    // すべてのタブボタンとコンテンツからactiveクラスを削除
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('filtering');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 選択されたタブをアクティブにする
    const targetButtons = document.querySelectorAll(`.tab-button[data-tab="${tabName}"]`);
    const targetContent = document.getElementById(`tab-${tabName}`);
    
    if (targetButtons.length > 0 && targetContent) {
        targetButtons.forEach(btn => btn.classList.add('active'));
        targetContent.classList.add('active');
        
        // previousTabも更新（次回のフィルタ用）
        if (tabName !== 'filter') {
            window.previousTab = tabName;
        }
        
        // ジャンプメニューを更新（新しいタブ名を引数として渡す）
        console.log('Updating jump menu for tab:', tabName);
        if (updateJumpMenuCallback) {
            updateJumpMenuCallback(tabName);
        }
        
        // 総合タブの場合、最新日付を自動選択
        if (tabName === 'general' && updateDataTableCallback && selectDateOnHeatmapCallback) {
            setTimeout(() => {
                if (availableDates && availableDates.length > 0) {
                    const latestDate = availableDates[availableDates.length - 1];
                    console.log('Auto-selecting latest date on general tab:', latestDate);
                    
                    updateDataTableCallback(latestDate);
                    selectDateOnHeatmapCallback(latestDate);
                }
            }, 100);
        }
        
        // ページトップにスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    console.log('=== switchTab completed - returning:', tabName, '===');
    return tabName;
}

/**
 * タブリンクセクションを生成
 * @param {Array} basicInfoData - Basic Infoデータ
 * @param {Array} singleDataGlobal - Singleデータ
 * @param {Function} switchTabCallback - タブ切り替えコールバック
 */
export function generateTabLinksSection(basicInfoData, singleDataGlobal, switchTabCallback) {
    const container = document.getElementById('tab-links-section');
    if (!container || !basicInfoData || !singleDataGlobal) return;
    
    // CSVデータから各タブの情報を動的に取得
    const tabNames = ['common', 'kevin', 'ryo'];
    const tabData = [];
    
    tabNames.forEach(tabName => {
        const tabItems = basicInfoData.filter(item => item.tabId === tabName);
        if (tabItems.length > 0) {
            const firstItem = tabItems[0];
            tabData.push({
                tabId: tabName,
                tabName: firstItem.tab,
                name: firstItem.summary || firstItem.category,
                key: firstItem.key,
                image: firstItem.image,
                subImage: firstItem.subImage
            });
        }
    });
    
    // cmpOfficialPortalのロゴ情報を取得
    const portalInfo = basicInfoData.find(item => item.key === 'cmpOfficialPortal');
    const portalLogo = portalInfo ? portalInfo.logo : '';
    
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
        
        // 該当する記事を検索
        const keyPrefix = tabKeyPrefixMap[tabInfo.tabId] || tabInfo.tabId;
        const articles = singleDataGlobal.filter(article => 
            article.key.startsWith(keyPrefix) && article.date
        );
        
        // 最新10件を取得
        const sortedArticles = articles.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
            if (isNaN(dateA.getTime())) return 1;
            if (isNaN(dateB.getTime())) return -1;
            return dateB - dateA;
        }).slice(0, 10);
        
        const latestArticle = sortedArticles[0];
        
        // NEW!!リボンの表示判定
        let showNewRibbon = false;
        if (latestArticle && latestArticle.date) {
            showNewRibbon = shouldShowNewBadge(latestArticle.date, NEW_BADGE_DAYS);
        }
        
        // RSSフィード形式のHTML生成
        const feedItemsHTML = sortedArticles.map(article => {
            let dateSpan = '';
            if (article.date) {
                const date = new Date(article.date);
                const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                
                let newBadge = '';
                if (shouldShowNewBadge(article.date, NEW_BADGE_DAYS)) {
                    newBadge = '<span class="badge bg-danger" style="margin-right: 0.35rem; font-size: 0.65rem;">New!!</span>';
                }
                
                dateSpan = `${newBadge}<span style="color: #6c757d; margin-right: 0.35rem; font-size: 0.85rem;">${formattedDate}</span>`;
            }
            
            // 基本情報からsiteTitleとsiteUrlを取得
            const basicInfo = basicInfoData.find(item => item.key === article.key);
            const siteTitle = basicInfo ? basicInfo.siteTitle : '';
            const siteUrl = basicInfo ? basicInfo.siteUrl : '';
            
            // siteTitleリンクを生成（カッコ内ではHTMLタグとmarkdownを除去）
            let siteTitleSpan = '';
            if (siteTitle) {
                const cleanSiteTitle = stripHtmlAndMarkdown(siteTitle);
                
                if (siteTitle === '全体') {
                    // keyからタブを判定してdata属性を設定
                    let targetTab = '';
                    if (article.key.startsWith('cmp')) {
                        targetTab = 'common';
                    } else if (article.key.startsWith('kevin')) {
                        targetTab = 'kevin';
                    } else if (article.key.startsWith('ryo')) {
                        targetTab = 'ryo';
                    }
                    
                    if (targetTab) {
                        siteTitleSpan = ` <span style="color: #6c757d; font-size: 0.85rem;">(</span><a href="#" class="tab-switch-link-inline" data-tab="${targetTab}" style="color: #dc3545; font-size: 0.85rem; text-decoration: none;">${cleanSiteTitle}</a><span style="color: #6c757d; font-size: 0.85rem;">)</span>`;
                    } else {
                        siteTitleSpan = ` <span style="color: #6c757d; font-size: 0.85rem;">(${cleanSiteTitle})</span>`;
                    }
                } else if (siteUrl) {
                    siteTitleSpan = ` <span style="color: #6c757d; font-size: 0.85rem;">(</span><a href="${siteUrl}" target="_blank" rel="noopener noreferrer" style="color: #dc3545; font-size: 0.85rem; text-decoration: none;">${cleanSiteTitle}</a><span style="color: #6c757d; font-size: 0.85rem;">)</span>`;
                } else {
                    siteTitleSpan = ` <span style="color: #6c757d; font-size: 0.85rem;">(${cleanSiteTitle})</span>`;
                }
            }
            
            let titleSpan = '';
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
        
        // Aboutボタンのリンク先を決定
        const aboutHashMap = {
            'common': 'common',
            'kevin': 'kevin',
            'ryo': 'ryo'
        };
        const aboutLink = `about.html#${aboutHashMap[tabInfo.tabId] || tabInfo.tabId}`;
        
        // SNSボタンを生成
        let snsButtonsHTML = '';
        const tabItems = basicInfoData.filter(item => item.tabId === tabInfo.tabId);
        
        const mainXItem = tabItems.find(item => item.key.includes('MainX'));
        if (mainXItem && mainXItem.siteUrl) {
            snsButtonsHTML += `<a href="${mainXItem.siteUrl}" target="_blank" class="btn btn-outline-danger btn-sm">${mainXItem.siteTitle}</a> `;
        }
        
        const subXItem = tabItems.find(item => item.key.includes('SubX'));
        if (subXItem && subXItem.siteUrl) {
            snsButtonsHTML += `<a href="${subXItem.siteUrl}" target="_blank" class="btn btn-outline-danger btn-sm">${subXItem.siteTitle}</a>`;
        }
        
        // cmpOfficialPortalのロゴを表示（右上）
        let portalLogoHTML = '';
        if (portalLogo && portalLogo.trim() !== '') {
            if (portalLogo.startsWith('text:')) {
                // text:プレフィックスを除去して文字として表示
                const logoText = portalLogo.substring(5);
                portalLogoHTML = `<div class="card-logo-text">${logoText}</div>`;
            } else {
                // 画像として表示
                portalLogoHTML = `<img src="${portalLogo}" alt="logo" class="card-logo-img">`;
            }
        }
        
        return `
            <div class="card-wrapper" id="${tabInfo.key}">
                <div class="card">
                    <a href="#" class="tab-link-card" data-tab="${tabInfo.tabId}">
                        <img src="${image}" class="card-img-top" alt="${tabInfo.name}">
                        ${showNewRibbon ? '<div class="new-ribbon">NEW!!</div>' : ''}
                        ${subImageSrc ? `<img src="${subImageSrc}" class="card-sub-image" alt="${tabInfo.name} Icon">` : ''}
                        ${portalLogoHTML}
                        <h5 class="card-title-overlay">${tabInfo.name}</h5>
                        <div class="card-circle-arrow"></div>
                    </a>
                    <div class="text-center" style="padding: 0.5rem 1rem; background-color: rgba(220, 53, 69, 0.08); border-top: 1px solid rgba(220, 53, 69, 0.15); border-bottom: 1px solid rgba(220, 53, 69, 0.15);">
                        <a href="${aboutLink}" class="btn btn-outline-danger btn-sm">About</a>
                        ${snsButtonsHTML}
                    </div>
                    <div class="card-body">
                        <div class="card-text">
                            <div class="rss-feed-container">
                                ${feedItemsHTML}
                            </div>
                        </div>
                        <div class="card-action-area">
                            <button class="btn btn-primary btn-sm card-action-button tab-action-btn" data-tab="${tabInfo.tabId}">Go to Tab</button>
                            <span style="margin-left: 0.5rem; color: #6c757d; font-size: 0.9rem;"># 更新履歴</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="card-container">${linksHTML}</div>`;
    
    // イベントリスナーを追加
    container.querySelectorAll('.tab-link-card, .tab-action-btn').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = element.getAttribute('data-tab');
            if (targetTab && switchTabCallback) {
                switchTabCallback(targetTab);
            }
        });
    });
    
    // 「全体」リンク用のイベントリスナーを追加
    container.querySelectorAll('.tab-switch-link-inline').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            if (targetTab && switchTabCallback) {
                switchTabCallback(targetTab);
            }
        });
    });
}