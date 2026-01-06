/**
 * カード生成モジュール
 * 各タブのカード表示とフィルタ表示を管理
 */

import { extractHashTags, convertHashTagsToLinks, renderHashTagListForTab } from '../shared/hashtag.js';
import { extractXUsername, formatXPostDate, shouldShowNewBadge } from '../shared/utils.js';
import { getBasicInfoByKey } from '../shared/csv-loader.js';
import { SINGLE_MAX_LENGTH, NEW_BADGE_DAYS } from './home-config.js';

/**
 * NEW!!バッジを表示すべきかチェック
 * @param {string} key - サイトのkey
 * @param {Object} site - サイト情報
 * @param {Object} singleDataByKey - SingleデータをKeyでグループ化したオブジェクト
 * @returns {boolean}
 */
function isNewArticle(key, site, singleDataByKey) {
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
    
    return shouldShowNewBadge(latestArticle.date, NEW_BADGE_DAYS);
}

/**
 * 単一カードのHTMLを生成
 * @param {Object} site - サイト情報
 * @param {boolean} showCategory - カテゴリバッジを表示するか
 * @param {boolean} includeFeed - フィードを含めるか
 * @param {Object} singleDataByKey - SingleデータをKeyでグループ化したオブジェクト
 * @param {Function} onHashTagClick - ハッシュタグクリック時のコールバック
 * @returns {string} カードHTML
 */
function generateCardHTML(site, showCategory, includeFeed, singleDataByKey, onHashTagClick) {
    const isNew = isNewArticle(site.key, site, singleDataByKey);
    const newRibbonHtml = isNew 
        ? '<div class="new-ribbon">NEW!!</div>' 
        : '';
    
    const subImageHtml = site.subImage 
        ? `<img src="${site.subImage}" alt="sub-image" class="card-sub-image">` 
        : '';
    
    // ロゴの判定：text:プレフィックスがあれば文字として表示
    let logoHtml = '';
    if (site.logo && site.logo.trim() !== '') {
        if (site.logo.startsWith('text:')) {
            // text:プレフィックスを除去して文字として表示
            const logoText = site.logo.substring(5);
            logoHtml = `<div class="card-logo-text">${logoText}</div>`;
        } else {
            // 画像として表示
            logoHtml = `<img src="${site.logo}" alt="logo" class="card-logo-img">`;
        }
    }
    
    // カードタイトル（画像中央に配置）
    const cardTitleHtml = `<h5 class="card-title-overlay">${site.siteTitle}</h5>`;
    
    // 全体カードかどうかを判定
    const mainKeys = ['cmp2000', 'kevinKevinson', 'ryoIida'];
    const isMainCard = mainKeys.includes(site.key);
    
    // タブのマッピング
    const keyToTabMap = {
        'cmp2000': 'common',
        'kevinKevinson': 'kevin',
        'ryoIida': 'ryo'
    };
    
    // リンク設定
    let cardImageLinkHref = site.siteUrl;
    let cardImageLinkTarget = 'target="_blank"';
    let cardImageLinkClass = '';
    let cardImageLinkDataTab = '';
    
    let goToSiteHref = site.siteUrl;
    let goToSiteTarget = 'target="_blank"';
    let goToSiteClass = 'btn btn-primary card-action-button';
    let goToSiteDataTab = '';
    
    if (isMainCard) {
        const targetTab = keyToTabMap[site.key];
        cardImageLinkHref = '#';
        cardImageLinkTarget = '';
        cardImageLinkClass = 'scroll-to-tab-top';
        cardImageLinkDataTab = `data-target-tab="${targetTab}"`;
        
        goToSiteHref = '#';
        goToSiteTarget = '';
        goToSiteClass = 'btn btn-primary card-action-button scroll-to-tab-top';
        goToSiteDataTab = `data-target-tab="${targetTab}"`;
    }
    
    const hashTagHtml = site.hashTag 
        ? `<div class="card-hashtag-area"><small class="text-muted">${convertHashTagsToLinks(site.hashTag, onHashTagClick)}</small></div>` 
        : '';
    
    const categoryBadgeHtml = showCategory 
        ? `<small class="text-muted" style="font-size: 0.75rem; display: block; margin-bottom: 0.25rem;">${site.category}</small>` 
        : '';
    
    // MainX/SubXの場合はX投稿を表示
    let feedContentHtml = '';
    const isXTimeline = site.key.includes('MainX') || site.key.includes('SubX');
    
    if (isXTimeline) {
        console.log('=== X投稿カード デバッグ ===');
        console.log('site.key:', site.key);
        console.log('singleDataByKey[site.key]:', singleDataByKey[site.key]);
        console.log('データ件数:', singleDataByKey[site.key] ? singleDataByKey[site.key].length : 0);
        
        if (singleDataByKey[site.key]) {
            const posts = singleDataByKey[site.key].slice(0, SINGLE_MAX_LENGTH);
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
            const articles = singleDataByKey[site.key].slice(0, SINGLE_MAX_LENGTH);
            feedContentHtml = articles.map(item => {
                if (!item.title) return '';
                
                let dateSpan = '';
                if (item.date) {
                    const date = new Date(item.date);
                    const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                    
                    let newBadge = '';
                    if (shouldShowNewBadge(item.date, NEW_BADGE_DAYS)) {
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
            <a href="${cardImageLinkHref}" ${cardImageLinkTarget} class="${cardImageLinkClass}" ${cardImageLinkDataTab}>
                <img src="${site.image}" class="card-img-top" alt="${site.siteTitle}">
                ${newRibbonHtml}
                ${subImageHtml}
                ${logoHtml}
                ${cardTitleHtml}
            </a>
            <div class="card-body">
                ${categoryBadgeHtml}
                <div class="card-text${isXTimeline ? ' x-timeline-wrapper' : ''}">
                    ${isXTimeline ? feedContentHtml : `<div id="single-rss-feed-container-${site.key}" class="rss-feed-container text-start">${feedContentHtml}</div>`}
                </div>
                <div class="card-action-area">
                    <a href="${goToSiteHref}" class="${goToSiteClass}" ${goToSiteTarget} ${goToSiteDataTab}>Go to Site</a>
                    ${hashTagHtml}
                </div>
            </div>
        </div>
    `;
}

/**
 * フィルタモードでカードを生成
 * @param {Array} filteredInfo - フィルタ済みのサイト情報
 * @param {Object} singleDataByKey - SingleデータをKeyでグループ化したオブジェクト
 * @param {string} filterTag - フィルタタグ
 * @param {Array} allHashTags - 全ハッシュタグ
 * @param {Array} basicInfoData - Basic Infoデータ
 * @param {Function} onHashTagClick - ハッシュタグクリック時のコールバック
 */
function generateFilterCards(filteredInfo, singleDataByKey, filterTag, allHashTags, basicInfoData, onHashTagClick) {
    console.log('フィルタモード:', filterTag);
    console.log('フィルタされたカード数:', filteredInfo.length);
    filteredInfo.forEach(item => {
        console.log('- カード:', item.key, item.siteTitle, 'カテゴリ:', item.category);
    });
    
    const container = document.getElementById('card-content-container-filter');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 1つのcard-containerにすべてのカードを入れる（通常タブと同じレスポンシブグリッド表示）
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-container';
    
    // すべてのカードを追加
    filteredInfo.forEach(site => {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'card-wrapper';
        cardWrapper.id = site.key;
        cardWrapper.setAttribute('data-site-title', site.siteTitle);
        cardWrapper.setAttribute('data-summary', site.summary || '');
        cardWrapper.innerHTML = generateCardHTML(site, false, true, singleDataByKey, onHashTagClick);
        cardContainer.appendChild(cardWrapper);
    });
    
    container.appendChild(cardContainer);
    
    // フィルタタブのハッシュタグ一覧を更新
    renderHashTagListForTab('filter', allHashTags, basicInfoData, filterTag, onHashTagClick);
}

/**
 * 通常モードでカードを生成
 * @param {Array} basicInfo - Basic Infoデータ
 * @param {Object} singleDataByKey - SingleデータをKeyでグループ化したオブジェクト
 * @param {Array} allHashTags - 全ハッシュタグ
 * @param {Array} basicInfoData - Basic Infoデータ（全体）
 * @param {string|null} currentFilterTag - 現在のフィルタタグ
 * @param {Function} onHashTagClick - ハッシュタグクリック時のコールバック
 */
function generateNormalCards(basicInfo, singleDataByKey, allHashTags, basicInfoData, currentFilterTag, onHashTagClick) {
    // タブごとにグループ化し、propertyによる表示制御を適用
    const tabGroups = {
        common: basicInfo.filter(item => {
            if (item.tabId !== 'common') return false;
            
            // hidden は非表示
            if (item.property === 'hidden') return false;
            
            // conditional は記事がある場合のみ表示
            if (item.property === 'conditional') {
                const hasArticles = singleDataByKey[item.key] && singleDataByKey[item.key].length > 0;
                if (!hasArticles) return false;
            }
            
            // MainX/SubX は非表示
            if (item.key.includes('MainX') || item.key.includes('SubX')) return false;
            
            return true;
        }),
        kevin: basicInfo.filter(item => {
            if (item.tabId !== 'kevin') return false;
            
            // hidden は非表示
            if (item.property === 'hidden') return false;
            
            // conditional は記事がある場合のみ表示
            if (item.property === 'conditional') {
                const hasArticles = singleDataByKey[item.key] && singleDataByKey[item.key].length > 0;
                if (!hasArticles) return false;
            }
            
            // MainX/SubX は非表示
            if (item.key.includes('MainX') || item.key.includes('SubX')) return false;
            
            return true;
        }),
        ryo: basicInfo.filter(item => {
            if (item.tabId !== 'ryo') return false;
            
            console.log(`  Checking ryo item: ${item.key} - ${item.siteTitle} (property: ${item.property || 'none'})`);
            
            // hidden は非表示
            if (item.property === 'hidden') {
                console.log(`    Filtered out (hidden): ${item.key}`);
                return false;
            }
            
            // conditional は記事がある場合のみ表示
            if (item.property === 'conditional') {
                const hasArticles = singleDataByKey && singleDataByKey[item.key] && singleDataByKey[item.key].length > 0;
                if (!hasArticles) {
                    console.log(`    Filtered out (conditional, no articles): ${item.key}`);
                    return false;
                } else {
                    console.log(`    Included (conditional, has articles): ${item.key} (${singleDataByKey[item.key].length} articles)`);
                }
            }
            
            // MainX/SubX は非表示
            if (item.key.includes('MainX') || item.key.includes('SubX')) {
                console.log(`    Filtered out (MainX/SubX): ${item.key}`);
                return false;
            }
            
            console.log(`    Included: ${item.key}`);
            return true;
        })
    };
    
    console.log('=== tabGroups generated ===');
    console.log('common items:', tabGroups.common.length);
    console.log('kevin items:', tabGroups.kevin.length);
    console.log('ryo items:', tabGroups.ryo.length);
    
    // 各タブのコンテナにカードを生成
    Object.keys(tabGroups).forEach(tabName => {
        console.log(`\n=== Processing tab: ${tabName} ===`);
        const items = tabGroups[tabName];
        console.log(`Items count for ${tabName}:`, items.length);
        
        const container = document.getElementById(`card-content-container-${tabName}`);
        console.log(`Container for ${tabName}:`, container ? 'found' : 'NOT FOUND');
        
        if (!container) {
            console.warn(`Container not found for ${tabName}, skipping`);
            return;
        }
        
        container.innerHTML = '';
        console.log(`Cleared container for ${tabName}`);
        
        // summaryでグループ化
        const groupedBySummary = {};
        items.forEach(item => {
            const summary = item.summary || 'その他';
            if (!groupedBySummary[summary]) {
                groupedBySummary[summary] = [];
            }
            groupedBySummary[summary].push(item);
        });
        
        console.log(`Summary groups for ${tabName}:`, Object.keys(groupedBySummary));
        
        // グループごとにセクションを生成
        Object.keys(groupedBySummary).forEach(summary => {
            console.log(`  Processing summary group: ${summary}`);
            const items = groupedBySummary[summary];
            
            // カードを更新順（日付の新しい順）にソート
            items.sort((a, b) => {
                // aの日付を取得
                let dateA = null;
                if (a.cardDate) {
                    dateA = new Date(a.cardDate);
                } else if (singleDataByKey[a.key] && singleDataByKey[a.key].length > 0) {
                    // 最新記事の日付を取得
                    const latestArticle = singleDataByKey[a.key][0];
                    if (latestArticle.date) {
                        dateA = new Date(latestArticle.date);
                    }
                }
                
                // bの日付を取得
                let dateB = null;
                if (b.cardDate) {
                    dateB = new Date(b.cardDate);
                } else if (singleDataByKey[b.key] && singleDataByKey[b.key].length > 0) {
                    // 最新記事の日付を取得
                    const latestArticle = singleDataByKey[b.key][0];
                    if (latestArticle.date) {
                        dateB = new Date(latestArticle.date);
                    }
                }
                
                // 日付でソート（新しい順）
                if (!dateA && !dateB) return 0; // 両方日付なし：CSV順
                if (!dateA) return 1; // aのみ日付なし：後ろ
                if (!dateB) return -1; // bのみ日付なし：前
                
                // 日付を比較（新しい順）
                return dateB - dateA;
            });
            
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card-container';
            
            console.log(`    Items in this summary group: ${items.length}`);
            
            items.forEach((site, index) => {
                console.log(`      Processing card ${index + 1}/${items.length}: ${site.key}`);
                
                // MainX/SubXを含むカードは常に非表示
                if (site.key.includes('MainX') || site.key.includes('SubX')) {
                    console.log(`        Skipped (MainX/SubX): ${site.key}`);
                    return;
                }
                
                // 全体カード（特定key）の記事チェック
                const mainKeys = ['cmp2000', 'kevinKevinson', 'ryoIida'];
                if (mainKeys.includes(site.key)) {
                    // 該当する記事があるかチェック
                    const hasArticles = singleDataByKey[site.key] && singleDataByKey[site.key].length > 0;
                    console.log(`        Main key check for ${site.key}: hasArticles=${hasArticles}`);
                    if (!hasArticles) {
                        console.log(`        Skipped (no articles): ${site.key}`);
                        return; // 記事がない場合はカードを生成しない
                    }
                }
                
                console.log(`        Creating card for: ${site.key}`);
                const cardWrapper = document.createElement('div');
                cardWrapper.className = 'card-wrapper';
                cardWrapper.id = site.key;
                console.log(`        Calling generateCardHTML for: ${site.key}`);
                cardWrapper.innerHTML = generateCardHTML(site, false, true, singleDataByKey, onHashTagClick);
                console.log(`        Appending card to container: ${site.key}`);
                cardContainer.appendChild(cardWrapper);
                console.log(`        Card added successfully: ${site.key}`);
            });
            
            console.log(`    Appending cardContainer to main container`);
            container.appendChild(cardContainer);
            console.log(`    CardContainer appended`);
            
            const hr = document.createElement('hr');
            console.log(`    Adding separator`);
            container.appendChild(hr);
            console.log(`    Separator added`);
        });
        
        console.log(`=== Finished processing tab: ${tabName} ===\n`);
    });
    
    console.log('=== Updating hashtag lists ===');
    // 各タブのハッシュタグ一覧を更新
    renderHashTagListForTab('general', allHashTags, basicInfoData, currentFilterTag, onHashTagClick);
    renderHashTagListForTab('common', allHashTags, basicInfoData, currentFilterTag, onHashTagClick);
    renderHashTagListForTab('kevin', allHashTags, basicInfoData, currentFilterTag, onHashTagClick);
    renderHashTagListForTab('ryo', allHashTags, basicInfoData, currentFilterTag, onHashTagClick);
    console.log('=== Hashtag lists updated ===');
}

/**
 * ハッシュタグリンクにイベントリスナーをバインド
 * @param {Function} onHashTagClick - ハッシュタグクリック時のコールバック
 */
function bindHashTagLinkEvents(onHashTagClick) {
    // イベント委任を使用してハッシュタグリンクのクリックを処理
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // ハッシュタグリンクがクリックされたかチェック
        if (target.classList && target.classList.contains('hashtag-link')) {
            event.preventDefault();
            const tag = target.getAttribute('data-tag');
            if (tag && onHashTagClick) {
                onHashTagClick(tag);
            }
        }
    });
}

/**
 * 全体カードのスクロールイベントリスナーをバインド
 */
function bindScrollToTabTopEvents() {
    // イベント委任を使用して全体カードのクリックを処理
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // scroll-to-tab-topクラスを持つ要素、またはその子要素がクリックされたかチェック
        let scrollElement = null;
        if (target.classList && target.classList.contains('scroll-to-tab-top')) {
            scrollElement = target;
        } else if (target.closest('.scroll-to-tab-top')) {
            scrollElement = target.closest('.scroll-to-tab-top');
        }
        
        if (scrollElement) {
            event.preventDefault();
            
            console.log('Scrolling to page top');
            
            // ページの一番上にスクロール
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });
}

/**
 * カードを生成（メイン関数）
 * @param {Array} basicInfo - Basic Infoデータ
 * @param {Array} singleData - Singleデータ
 * @param {string|null} filterTag - フィルタタグ
 * @param {Array} allHashTags - 全ハッシュタグ
 * @param {Function} onHashTagClick - ハッシュタグクリック時のコールバック
 * @param {Function} loadSingleFeedsCallback - SingleFeeds読み込み用のコールバック
 * @param {Function} generateTabLinksSectionCallback - タブリンクセクション生成用のコールバック
 * @returns {string|null} 現在のタブ（フィルタモードの場合は'filter'）
 */
export function generateCards(basicInfo, singleData, filterTag, allHashTags, onHashTagClick, loadSingleFeedsCallback, generateTabLinksSectionCallback) {
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
    
    // 初回のみイベントリスナーをバインド
    if (!window.hashTagEventsBound) {
        bindHashTagLinkEvents(onHashTagClick);
        window.hashTagEventsBound = true;
    }
    
    // 全体カードのスクロールイベントリスナーをバインド（初回のみ）
    if (!window.scrollToTabTopEventsBound) {
        bindScrollToTabTopEvents();
        window.scrollToTabTopEventsBound = true;
    }
    
    // フィルタモード
    if (filterTag) {
        // フィルタタブを表示し、全体タブを選択状態にする
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
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
        
        generateFilterCards(filteredInfo, singleDataByKey, filterTag, allHashTags, basicInfo, onHashTagClick);
        
        return 'filter';
    } else {
        // 通常モード
        generateNormalCards(filteredInfo, singleDataByKey, allHashTags, basicInfo, null, onHashTagClick);
        
        // タブリンクセクションを生成
        if (generateTabLinksSectionCallback) {
            generateTabLinksSectionCallback();
        }
        
        // SingleFeeds読み込み
        if (singleData && loadSingleFeedsCallback) {
            setTimeout(() => {
                loadSingleFeedsCallback(singleData, filteredInfo.map(item => item.key));
            }, 50);
        }
        
        return null;
    }
}

/**
 * SingleFeedsを読み込み
 * @param {Array} singleData - Singleデータ
 * @param {Array<string>} keys - 読み込むキーの配列
 */
export function loadSingleFeeds(singleData, keys) {
    keys.forEach(key => {
        const feedContainer = document.getElementById(`single-rss-feed-container-${key}`);
        
        if (!feedContainer) return;
        
        // 既に内容がある場合はスキップ
        if (feedContainer.innerHTML.trim() !== '') return;
        
        // keyに対応するsingleDataを取得
        const feedItems = singleData.filter(item => item.key === key);
        
        if (feedItems.length === 0) return;
        
        // 日付順にソート（新しい順）
        feedItems.sort((a, b) => {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });
        
        // 最大件数に制限
        const displayItems = feedItems.slice(0, SINGLE_MAX_LENGTH);
        
        // HTMLを生成
        const html = displayItems.map(item => {
            if (!item.title) return '';
            
            let dateSpan = '';
            if (item.date) {
                const date = new Date(item.date);
                const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                
                let newBadge = '';
                if (shouldShowNewBadge(item.date, NEW_BADGE_DAYS)) {
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
        
        feedContainer.innerHTML = html;
    });
}