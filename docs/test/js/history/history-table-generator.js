/**
 * Historyページのテーブル生成モジュール
 * メインのテーブル生成ロジックと表示制御
 */

import { MIN_YEAR, MAX_YEAR, getJapaneseEra, CATEGORY_ICONS, CATEGORY_ABBREVIATIONS } from './history-constants.js';

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
 * Historyテーブルを生成
 * @param {Object} state - 現在の状態
 * @param {Array} historyData - Historyデータ
 * @param {Array} basicInfoData - Basic Infoデータ
 * @param {Function} scrollToFilterCallback - フィルタ設定へのスクロールコールバック
 * @param {Function} selectCategoryCallback - カテゴリ選択コールバック
 * @param {Function} updateMenuCallback - メニュー更新コールバック
 */
export function generateHistoryTable(
    state,
    historyData,
    basicInfoData,
    scrollToFilterCallback,
    selectCategoryCallback,
    updateMenuCallback
) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // 年表の範囲表示を更新
    updateYearRangeDisplay(state.currentStartYear, state.currentEndYear);
    
    // データを年とカテゴリでグループ化
    const groupedData = {};
    
    historyData.forEach(item => {
        if (item.year >= state.currentStartYear && item.year <= state.currentEndYear) {
            // カテゴリフィルタを適用
            if (state.currentCategoryFilters.length === 0) {
                return;
            }
            if (!state.currentCategoryFilters.includes(item.category)) {
                return;
            }
            
            if (!groupedData[item.year]) {
                groupedData[item.year] = [];
            }
            groupedData[item.year].push(item);
        }
    });
    
    // 表示する年のリストを作成
    let yearsToDisplay = [];
    
    if (state.currentShowEmptyYears) {
        // 全ての年を表示
        for (let year = state.currentStartYear; year <= state.currentEndYear; year++) {
            yearsToDisplay.push(year);
        }
    } else {
        // 記事がある年のみ表示
        yearsToDisplay = Object.keys(groupedData).map(y => parseInt(y)).sort((a, b) => a - b);
    }
    
    // 並び順の設定
    if (state.currentSortNewestFirst) {
        yearsToDisplay.sort((a, b) => b - a);
    } else {
        yearsToDisplay.sort((a, b) => a - b);
    }
    
    // 表示年の範囲が全体範囲より狭い場合に「...」行を追加
    const hasYearsBeforeStart = state.currentStartYear > MIN_YEAR;
    const hasYearsAfterEnd = state.currentEndYear < MAX_YEAR;
    
    // 最初に「...」行を追加
    if (state.currentSortNewestFirst && hasYearsAfterEnd) {
        addEllipsisRow(tbody, '(未来に続く)', scrollToFilterCallback);
    } else if (!state.currentSortNewestFirst && hasYearsBeforeStart) {
        addEllipsisRow(tbody, '(過去に続く)', scrollToFilterCallback);
    }
    
    // 年ごとに行を生成
    yearsToDisplay.forEach(year => {
        const row = document.createElement('tr');
        row.id = `year-${year}`;
        
        // 年のセル
        const yearCell = document.createElement('td');
        yearCell.className = 'year-column fw-bold text-center';
        
        const yearDiv = document.createElement('div');
        yearDiv.textContent = year + '年';
        yearCell.appendChild(yearDiv);
        
        const eraDiv = document.createElement('div');
        eraDiv.className = 'text-muted small';
        eraDiv.textContent = getJapaneseEra(year);
        yearCell.appendChild(eraDiv);
        
        row.appendChild(yearCell);
        
        // Article列のセル
        const articleCell = document.createElement('td');
        articleCell.className = 'article-column';
        
        const items = groupedData[year];
        
        if (items && items.length > 0) {
            // 記事がある場合
            const sortedItems = [...items].sort((a, b) => {
                if (!a.date && !b.date) return 0;
                if (!a.date) return 1;
                if (!b.date) return -1;
                
                if (state.currentSortNewestFirst) {
                    return b.date.localeCompare(a.date);
                } else {
                    return a.date.localeCompare(b.date);
                }
            });
            
            // 各アイテムを改行で表示
            sortedItems.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'article-item';
                
                const icon = CATEGORY_ICONS[item.category] || '';
                const abbr = CATEGORY_ABBREVIATIONS[item.category] || item.category;
                
                // カテゴリ略称ボタン
                const abbrBtn = document.createElement('button');
                abbrBtn.className = 'btn btn-outline-primary btn-sm category-abbr-btn';
                abbrBtn.style.cursor = 'pointer';
                abbrBtn.style.marginRight = '0.5rem';
                abbrBtn.setAttribute('title', `${item.category}のみ表示`);
                abbrBtn.innerHTML = `${icon} ${abbr}`;
                
                abbrBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (selectCategoryCallback) {
                        selectCategoryCallback(item.category);
                    }
                });
                itemDiv.appendChild(abbrBtn);
                
                // 基本情報からsiteTitleとsiteUrlを取得
                const basicInfo = basicInfoData.find(info => info.key === item.key);
                const siteTitle = basicInfo ? basicInfo.siteTitle : '';
                const siteUrl = basicInfo ? basicInfo.siteUrl : '';
                
                // 記事内容
                if (item.link) {
                    const link = document.createElement('a');
                    link.href = item.link;
                    link.target = '_blank';
                    link.textContent = item.contents;
                    link.className = 'history-link';
                    itemDiv.appendChild(link);
                } else {
                    const text = document.createTextNode(item.contents);
                    itemDiv.appendChild(text);
                }
                
                // siteTitleをカッコ書きで追加（HTMLタグとmarkdownを除去）
                if (siteTitle) {
                    const cleanSiteTitle = stripHtmlAndMarkdown(siteTitle);
                    
                    const siteTitleSpan = document.createElement('span');
                    siteTitleSpan.textContent = ' (';
                    siteTitleSpan.style.color = '#6c757d';
                    siteTitleSpan.style.fontSize = '0.85rem';
                    itemDiv.appendChild(siteTitleSpan);
                    
                    if (siteUrl) {
                        const siteTitleLink = document.createElement('a');
                        siteTitleLink.href = siteUrl;
                        siteTitleLink.target = '_blank';
                        siteTitleLink.textContent = cleanSiteTitle;
                        siteTitleLink.style.color = '#dc3545';
                        siteTitleLink.style.fontSize = '0.85rem';
                        siteTitleLink.style.textDecoration = 'none';
                        itemDiv.appendChild(siteTitleLink);
                    } else {
                        const siteTitleText = document.createElement('span');
                        siteTitleText.textContent = cleanSiteTitle;
                        siteTitleText.style.color = '#6c757d';
                        siteTitleText.style.fontSize = '0.85rem';
                        itemDiv.appendChild(siteTitleText);
                    }
                    
                    const closeParen = document.createElement('span');
                    closeParen.textContent = ')';
                    closeParen.style.color = '#6c757d';
                    closeParen.style.fontSize = '0.85rem';
                    itemDiv.appendChild(closeParen);
                }
                
                articleCell.appendChild(itemDiv);
            });
        } else {
            // 記事がない場合
            articleCell.classList.add('empty-year-cell');
        }
        
        row.appendChild(articleCell);
        tbody.appendChild(row);
    });
    
    // 最後に「...」行を追加
    if (state.currentSortNewestFirst && hasYearsBeforeStart) {
        addEllipsisRow(tbody, '(過去に続く)', scrollToFilterCallback);
    } else if (!state.currentSortNewestFirst && hasYearsAfterEnd) {
        addEllipsisRow(tbody, '(未来に続く)', scrollToFilterCallback);
    }
    
    // ジャンプメニューを更新
    if (updateMenuCallback) {
        updateMenuCallback();
    }
}

/**
 * 省略行を追加
 * @param {HTMLElement} tbody - tbody要素
 * @param {string} text - 表示テキスト
 * @param {Function} clickCallback - クリック時のコールバック
 */
function addEllipsisRow(tbody, text, clickCallback) {
    const dotRow = document.createElement('tr');
    dotRow.className = 'ellipsis-row';
    
    const dotYearCell = document.createElement('td');
    dotYearCell.className = 'year-column text-center text-muted';
    dotYearCell.textContent = '…';
    
    const dotArticleCell = document.createElement('td');
    dotArticleCell.className = 'article-column text-muted text-center fst-italic';
    
    const link = document.createElement('a');
    link.href = '#';
    link.style.color = '#dc3545';
    link.style.textDecoration = 'none';
    link.style.cursor = 'pointer';
    link.textContent = text;
    
    link.addEventListener('click', function(e) {
        e.preventDefault();
        if (clickCallback) {
            clickCallback();
        }
    });
    
    dotArticleCell.appendChild(link);
    dotRow.appendChild(dotYearCell);
    dotRow.appendChild(dotArticleCell);
    tbody.appendChild(dotRow);
}

/**
 * ヘッダーインジケーターを更新
 * @param {boolean} showEmptyYears - 空白年を表示するか
 * @param {boolean} sortNewestFirst - 新→古でソートするか
 */
export function updateHeaderIndicators(showEmptyYears, sortNewestFirst) {
    const emptyYearIndicator = document.getElementById('emptyYearIndicator');
    const sortOrderIndicator = document.getElementById('sortOrderIndicator');
    
    if (emptyYearIndicator) {
        emptyYearIndicator.textContent = showEmptyYears ? '[+]' : '[-]';
    }
    
    if (sortOrderIndicator) {
        sortOrderIndicator.textContent = sortNewestFirst ? '▼' : '▲';
    }
}

/**
 * 年表の範囲表示を更新
 * @param {number} startYear - 開始年
 * @param {number} endYear - 終了年
 */
export function updateYearRangeDisplay(startYear, endYear) {
    const displayElement = document.getElementById('year-range-display');
    if (!displayElement) return;
    
    displayElement.textContent = `表示期間 ${startYear}〜${endYear}年 (全${MIN_YEAR}〜${MAX_YEAR}年)`;
}