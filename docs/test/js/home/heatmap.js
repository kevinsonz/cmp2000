/**
 * ヒートマップ（コントリビューショングラフ）生成モジュール
 */

import { initializeStatsPeriod, displayTabStatisticsChart, displayCardStatisticsForTab } from './statistics.js';

// グローバル変数（他のモジュールから参照される）
export let availableDates = [];
export let activeTooltipElement = null;
export let isTooltipPinned = false;

// 内部で使用する変数
let multiDataGlobal = null;
let basicInfoData = null;
let switchTabCallback = null;

/**
 * コントリビューショングラフを生成
 * @param {Array} contributionData - 日付ごとの件数データ
 * @param {Array} multiDataGlobal - 全記事データ
 * @param {Array} basicInfoData - 基本情報データ
 * @param {Function} switchTabCallback - タブ切り替えコールバック
 */
export function generateContributionGraph(contributionData, multiData, basicInfo, switchTab) {
    const container = document.getElementById('contribution-graph');
    if (!container) return;
    
    // データとコールバックを保存
    multiDataGlobal = multiData;
    basicInfoData = basicInfo;
    switchTabCallback = switchTab;
    
    // 統計期間を初期化
    initializeStatsPeriod();
    
    const dataMap = {};
    contributionData.forEach(item => {
        dataMap[item.date] = item.count;
    });
    
    // コンテンツが存在する日付のリストを初期化（ソート済み）
    availableDates = contributionData
        .filter(item => item.count > 0)
        .map(item => item.date)
        .sort(); // 昇順にソート
    
    console.log('Available dates initialized:', availableDates.length, 'dates');
    
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    function getLevel(count) {
        if (count === 0) return 0;
        if (count <= 2) return 1;
        if (count <= 5) return 2;
        if (count <= 9) return 3;
        return 4;
    }
    
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    const weeks = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= today) {
        const days = [];
        for (let day = 0; day < 7; day++) {
            const dateStr = formatDate(currentDate);
            const count = dataMap[dateStr] || 0;
            days.push({
                date: new Date(currentDate),
                dateStr: dateStr,
                count: count,
                level: getLevel(count)
            });
            currentDate.setDate(currentDate.getDate() + 1);
            
            if (currentDate > today) {
                break;
            }
        }
        weeks.push(days);
    }
    
    const graphContainer = document.createElement('div');
    graphContainer.className = 'contribution-graph-container';
    graphContainer.style.position = 'relative';
    
    // 共通定数（年ラベルと月ラベルで使用）
    const edgeWeeks = 4; // 重複判定の週数
    const leftEdgeProtection = 6; // 左端6週間は削除しない
    const totalWeeks = weeks.length;
    
    // 年ラベル
    const yearsRow = document.createElement('div');
    yearsRow.className = 'contribution-years';
    yearsRow.style.position = 'relative';
    yearsRow.style.height = '20px';
    yearsRow.style.marginBottom = '2px';
    
    let lastYear = -1;
    let lastYearLabel = null;
    let lastYearWeekIndex = -1;
    
    weeks.forEach((week, weekIndex) => {
        for (let i = 0; i < week.length; i++) {
            const day = week[i];
            const year = day.date.getFullYear();
            
            if (year !== lastYear) {
                // 前のラベルとの間隔をチェック
                if (lastYearLabel && lastYearWeekIndex >= 0) {
                    const weekDistance = weekIndex - lastYearWeekIndex;
                    // 前のラベルが週0にあり、新しいラベルが保護エリア内で、間隔が4週間未満なら削除
                    if (lastYearWeekIndex === 0 && weekIndex < leftEdgeProtection && weekDistance < edgeWeeks) {
                        lastYearLabel.remove();
                    }
                }
                
                // 常に2桁表示
                const yearText = `${String(year).slice(-2)}年`;
                
                const yearLabel = document.createElement('div');
                yearLabel.className = 'contribution-year';
                yearLabel.textContent = yearText;
                yearLabel.style.position = 'absolute';
                yearLabel.style.left = `${25 + weekIndex * 13}px`;
                yearLabel.style.whiteSpace = 'nowrap';
                yearsRow.appendChild(yearLabel);
                
                lastYear = year;
                lastYearLabel = yearLabel;
                lastYearWeekIndex = weekIndex;
                break;
            }
        }
    });
    
    graphContainer.appendChild(yearsRow);
    
    // 月ラベル
    const monthsRow = document.createElement('div');
    monthsRow.className = 'contribution-months';
    monthsRow.style.position = 'relative';
    monthsRow.style.height = '18px';
    monthsRow.style.marginBottom = '5px';
    
    let lastMonth = -1;
    let lastMonthLabel = null;
    let lastMonthWeekIndex = -1;
    
    weeks.forEach((week, weekIndex) => {
        for (let i = 0; i < week.length; i++) {
            const day = week[i];
            const month = day.date.getMonth();
            
            if (month !== lastMonth) {
                // 前のラベルとの間隔をチェック
                if (lastMonthLabel && lastMonthWeekIndex >= 0) {
                    const weekDistance = weekIndex - lastMonthWeekIndex;
                    // 前のラベルが週0にあり、新しいラベルが保護エリア内で、間隔が4週間未満なら削除
                    if (lastMonthWeekIndex === 0 && weekIndex < leftEdgeProtection && weekDistance < edgeWeeks) {
                        lastMonthLabel.remove();
                    }
                }
                
                const monthLabel = document.createElement('div');
                monthLabel.className = 'contribution-month';
                monthLabel.textContent = `${month + 1}月`;
                monthLabel.style.position = 'absolute';
                monthLabel.style.left = `${25 + weekIndex * 13}px`;
                monthLabel.style.whiteSpace = 'nowrap';
                monthsRow.appendChild(monthLabel);
                
                lastMonth = month;
                lastMonthLabel = monthLabel;
                lastMonthWeekIndex = weekIndex;
                break;
            }
        }
    });
    
    graphContainer.appendChild(monthsRow);
    
    const mainContent = document.createElement('div');
    mainContent.className = 'contribution-main';
    mainContent.style.position = 'relative';
    mainContent.style.zIndex = '1';
    
    // 左側の曜日ラベル
    const weekdaysLeft = document.createElement('div');
    weekdaysLeft.className = 'contribution-weekdays';
    ['日', '月', '火', '水', '木', '金', '土'].forEach((day) => {
        const weekday = document.createElement('div');
        weekday.className = 'contribution-weekday';
        weekday.textContent = day;
        weekdaysLeft.appendChild(weekday);
    });
    mainContent.appendChild(weekdaysLeft);
    
    const weeksContainer = document.createElement('div');
    weeksContainer.className = 'contribution-weeks';
    
    // モバイル判定
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    let activeTooltip = null;
    let activeDayData = null;
    
    // ツールチップを表示する関数
    function showTooltip(dayElement, day, clientX, clientY, pinned = false) {
        if (pinned) {
            // すべての選択状態を解除
            const selectedCells = document.querySelectorAll('.contribution-day.selected');
            selectedCells.forEach(cell => {
                cell.classList.remove('selected');
            });
            
            dayElement.classList.add('selected');
            activeTooltipElement = dayElement;
            isTooltipPinned = true;
            activeDayData = day;
            
            // データテーブルを更新
            updateDataTable(day.dateStr);
        } else {
            if (activeTooltip && !isTooltipPinned) {
                activeTooltip.remove();
                activeTooltip = null;
            }
            
            const date = new Date(day.dateStr);
            const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
            const formattedDate = day.dateStr.replace(/-/g, '/');
            const tooltipText = `${formattedDate}(${dayOfWeek}) - ${day.count}件`;
            
            const tooltip = document.createElement('div');
            tooltip.className = 'contribution-tooltip';
            tooltip.textContent = tooltipText;
            tooltip.style.display = 'block';
            tooltip.style.position = 'fixed';
            tooltip.style.left = `${clientX + 10}px`;
            tooltip.style.top = `${clientY - 30}px`;
            tooltip.style.zIndex = '10000';
            
            document.body.appendChild(tooltip);
            activeTooltip = tooltip;
        }
    }
    
    weeks.forEach((week) => {
        const weekElement = document.createElement('div');
        weekElement.className = 'contribution-week';
        
        week.forEach((day) => {
            const dayElement = document.createElement('div');
            dayElement.className = `contribution-day level-${day.level}`;
            dayElement.dataset.date = day.dateStr;
            dayElement.dataset.count = day.count;
            
            if (!isMobile) {
                dayElement.addEventListener('mouseenter', (e) => {
                    if (!isTooltipPinned) {
                        showTooltip(dayElement, day, e.clientX, e.clientY, false);
                    }
                });
                
                dayElement.addEventListener('mouseleave', () => {
                    if (activeTooltip && !isTooltipPinned) {
                        activeTooltip.remove();
                        activeTooltip = null;
                    }
                });
            }
            
            dayElement.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (isTooltipPinned && activeTooltipElement === dayElement) {
                    dayElement.classList.remove('selected');
                    activeTooltipElement = null;
                    isTooltipPinned = false;
                    activeDayData = null;
                    
                    if (activeTooltip) {
                        activeTooltip.remove();
                        activeTooltip = null;
                    }
                    
                    clearDataTable();
                } else {
                    if (activeTooltip) {
                        activeTooltip.remove();
                        activeTooltip = null;
                    }
                    showTooltip(dayElement, day, e.clientX, e.clientY, true);
                }
            });
            
            weekElement.appendChild(dayElement);
        });
        
        weeksContainer.appendChild(weekElement);
    });
    
    mainContent.appendChild(weeksContainer);
    
    // 右側の曜日ラベル
    const weekdaysRight = document.createElement('div');
    weekdaysRight.className = 'contribution-weekdays-right';
    ['日', '月', '火', '水', '木', '金', '土'].forEach((day) => {
        const weekday = document.createElement('div');
        weekday.className = 'contribution-weekday';
        weekday.textContent = day;
        weekdaysRight.appendChild(weekday);
    });
    mainContent.appendChild(weekdaysRight);
    
    graphContainer.appendChild(mainContent);
    
    container.innerHTML = '';
    container.appendChild(graphContainer);
    
    // データテーブル表示エリアを追加（.contribution-graph-wrapperの外、兄弟要素として）
    const graphWrapper = document.querySelector('.contribution-graph-wrapper');
    if (graphWrapper && graphWrapper.parentElement) {
        const dataTableContainer = document.createElement('div');
        dataTableContainer.className = 'contribution-data-table-container';
        dataTableContainer.id = 'contribution-data-table';
        
        // 初期状態のHTML
        dataTableContainer.innerHTML = `
            <div class="data-table-header">
                <div class="date-navigation" style="display: flex; justify-content: center; align-items: center; gap: 1rem;">
                    <button id="date-prev-btn" class="date-nav-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #dc3545; padding: 0.25rem 0.5rem;" disabled>◀︎</button>
                    <div id="selected-date-display" style="font-weight: bold; color: #dc3545; font-size: 1rem;"></div>
                    <button id="date-next-btn" class="date-nav-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #dc3545; padding: 0.25rem 0.5rem;" disabled>▶︎</button>
                </div>
            </div>
            <div class="data-table-content" id="data-table-content">
                <p class="text-muted text-center">セルを選択すると投稿内容が表示されます</p>
            </div>
        `;
        
        // graphWrapperの次の兄弟要素として挿入
        graphWrapper.parentElement.insertBefore(dataTableContainer, graphWrapper.nextSibling);
        
        // ボタンのイベントリスナーを設定（DOM挿入後）
        const prevBtn = document.getElementById('date-prev-btn');
        const nextBtn = document.getElementById('date-next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => navigateDate(-1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => navigateDate(1));
        }
    }
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.contribution-day') && 
            !e.target.closest('.contribution-tooltip') && 
            !e.target.closest('.contribution-data-table-container')) {
            // ツールチップを削除
            if (activeTooltip) {
                activeTooltip.remove();
                activeTooltip = null;
            }
            
            // セルが選択されている場合は解除してグラフ表示に戻す
            if (isTooltipPinned) {
                // すべての選択状態を解除
                const selectedCells = document.querySelectorAll('.contribution-day.selected');
                selectedCells.forEach(cell => {
                    cell.classList.remove('selected');
                });
                
                // データテーブルをクリアしてグラフ表示に戻す
                clearDataTable();
            }
        }
    });
    
    // 初期状態で統計グラフを表示
    displayTabStatisticsChart(multiDataGlobal, basicInfoData, switchTabCallback);
    
    // 初期化時：最新日付を自動選択し、右端にスクロール
    setTimeout(() => {
        const graphWrapper = document.querySelector('.contribution-graph-wrapper');
        if (graphWrapper) {
            graphWrapper.scrollLeft = graphWrapper.scrollWidth;
        }
        
        if (availableDates.length > 0) {
            const latestDate = availableDates[availableDates.length - 1];
            updateDataTable(latestDate);
            selectDateOnHeatmap(latestDate, false); // スクロールは既に完了しているのでfalse
        }
    }, 100);
}

/**
 * データテーブルを更新
 */
function updateDataTable(dateStr) {
    console.log('updateDataTable called with date:', dateStr);
    
    const dateDisplay = document.getElementById('selected-date-display');
    const tableContent = document.getElementById('data-table-content');
    
    if (!dateDisplay || !tableContent) {
        console.warn('Required elements not found');
        return;
    }
    
    if (!multiDataGlobal) {
        console.warn('multiDataGlobal is not available');
        tableContent.innerHTML = '<p class="text-muted text-center">データが読み込まれていません</p>';
        return;
    }
    
    const items = multiDataGlobal.filter(item => item.date === dateStr);
    console.log('Found', items.length, 'items for date:', dateStr);
    
    if (items.length === 0) {
        tableContent.innerHTML = '<p class="text-muted text-center">この日付には投稿がありません</p>';
        dateDisplay.textContent = dateStr.replace(/-/g, '/');
        updateNavigationButtons(dateStr);
        return;
    }
    
    const date = new Date(dateStr);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    const formattedDate = dateStr.replace(/-/g, '/') + '(' + dayOfWeek + ') - ' + items.length + '件';
    dateDisplay.textContent = formattedDate;
    
    // データを組み合わせて表示用配列を作成
    const displayData = items.map(multiItem => {
        const basicInfo = basicInfoData.find(bi => bi.key === multiItem.key);
        
        if (!basicInfo) {
            console.warn(`No matching basicInfo found for key: ${multiItem.key}`);
            return null;
        }
        
        return {
            summary: basicInfo.summary || '',
            tabId: basicInfo.tabId || '',
            siteTitle: basicInfo.siteTitle || '',
            siteUrl: basicInfo.siteUrl || '',
            title: multiItem.title || '',
            link: multiItem.link || ''
        };
    }).filter(item => item !== null);
    
    if (displayData.length === 0) {
        tableContent.innerHTML = '<p class="text-muted text-center">データがありません</p>';
        return;
    }
    
    // PC版: テーブル形式（rowspanなし、シンプルに各行を表示）
    const tableHTML = `
        <div class="data-table-desktop">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th style="width: 20%; text-align: center; vertical-align: middle;">Tab</th>
                        <th style="width: 25%; text-align: center; vertical-align: middle;">Site</th>
                        <th style="width: 55%; text-align: left; vertical-align: middle;">Title（投稿内容）</th>
                    </tr>
                </thead>
                <tbody>
                    ${displayData.map(item => {
                        // Markdown記法を除去
                        const removeMarkdown = (text) => {
                            return text
                                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // [text](url) → text
                                .replace(/\*\*([^*]+)\*\*/g, '$1')        // **text** → text
                                .replace(/\*([^*]+)\*/g, '$1')            // *text* → text
                                .replace(/`([^`]+)`/g, '$1')              // `text` → text
                                .replace(/~~([^~]+)~~/g, '$1')            // ~~text~~ → text
                                .replace(/^#+\s+/gm, '')                  // # heading → heading
                                .trim();
                        };
                        
                        const cleanSiteTitle = removeMarkdown(item.siteTitle);
                        
                        let siteLink = '';
                        if (item.siteTitle === '全体') {
                            siteLink = `<a href="#" class="text-decoration-none tab-switch-link-heatmap" data-tab="${item.tabId}">${cleanSiteTitle}</a>`;
                        } else if (item.siteUrl) {
                            siteLink = `<a href="${item.siteUrl}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">${cleanSiteTitle}</a>`;
                        } else {
                            siteLink = cleanSiteTitle;
                        }
                        
                        let titleContent = '';
                        if (item.link) {
                            titleContent = `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">${item.title}</a>`;
                        } else {
                            titleContent = item.title;
                        }
                        
                        return `
                            <tr>
                                <td style="text-align: center; vertical-align: middle;">
                                    <a href="#" class="text-decoration-none tab-switch-link" data-tab="${item.tabId}">
                                        ${item.summary}
                                    </a>
                                </td>
                                <td style="text-align: center; vertical-align: middle;">${siteLink}</td>
                                <td style="text-align: left; vertical-align: middle;"><strong>${titleContent}</strong></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // モバイル版: カード形式
    const cardsHTML = `
        <div class="data-table-mobile">
            ${displayData.map(item => {
                let siteLink = '';
                if (item.siteTitle === '全体') {
                    siteLink = `<a href="#" class="text-decoration-none tab-switch-link-heatmap" data-tab="${item.tabId}">${item.siteTitle}</a>`;
                } else if (item.siteUrl) {
                    siteLink = `<a href="${item.siteUrl}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">${item.siteTitle}</a>`;
                } else {
                    siteLink = item.siteTitle;
                }
                
                let titleContent = '';
                if (item.link) {
                    titleContent = `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">${item.title}</a>`;
                } else {
                    titleContent = item.title;
                }
                
                return `
                    <div class="data-card">
                        <div class="data-card-title">${titleContent}</div>
                        <div class="data-card-meta">
                            <span class="data-card-label">Tab:</span>
                            <a href="#" class="text-decoration-none tab-switch-link" data-tab="${item.tabId}">
                                ${item.summary}
                            </a>
                            <span class="data-card-separator">|</span>
                            <span class="data-card-label">Site:</span>
                            ${siteLink}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    tableContent.innerHTML = tableHTML + cardsHTML;
    
    // タブ切り替えリンクのイベントリスナー
    tableContent.querySelectorAll('.tab-switch-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = e.target.dataset.tab;
            if (switchTabCallback) {
                switchTabCallback(tabId);
            }
        });
    });
    
    // 「全体」リンク用のイベントリスナーを追加
    tableContent.querySelectorAll('.tab-switch-link-heatmap').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = e.target.dataset.tab;
            if (switchTabCallback) {
                switchTabCallback(tabId);
            }
        });
    });
    
    updateNavigationButtons(dateStr);
}

/**
 * データテーブルをクリア
 */
function clearDataTable() {
    console.log('clearDataTable called');
    const dateDisplay = document.getElementById('selected-date-display');
    const tableContent = document.getElementById('data-table-content');
    
    if (dateDisplay) {
        dateDisplay.textContent = '';
    }
    
    if (tableContent) {
        tableContent.innerHTML = '<p class="text-muted text-center">セルを選択すると投稿内容が表示されます</p>';
    }
    
    // グローバル変数をリセット
    activeTooltipElement = null;
    isTooltipPinned = false;
    
    // ナビゲーションボタンを有効化（未選択時に最古/最新に飛べるように）
    const prevBtn = document.getElementById('date-prev-btn');
    const nextBtn = document.getElementById('date-next-btn');
    
    if (prevBtn && availableDates && availableDates.length > 0) {
        prevBtn.disabled = false;
        prevBtn.style.color = '#dc3545';
        prevBtn.style.cursor = 'pointer';
    }
    if (nextBtn && availableDates && availableDates.length > 0) {
        nextBtn.disabled = false;
        nextBtn.style.color = '#dc3545';
        nextBtn.style.cursor = 'pointer';
    }
    
    // 統計グラフを表示
    console.log('Calling displayTabStatisticsChart');
    displayTabStatisticsChart(multiDataGlobal, basicInfoData, switchTabCallback);
}

/**
 * ナビゲーションボタンの状態を更新
 */
function updateNavigationButtons(currentDate) {
    const prevBtn = document.getElementById('date-prev-btn');
    const nextBtn = document.getElementById('date-next-btn');
    
    if (!prevBtn || !nextBtn) return;
    
    if (!currentDate || availableDates.length === 0) {
        prevBtn.disabled = true;
        prevBtn.style.color = '#6c757d';
        prevBtn.style.cursor = 'not-allowed';
        nextBtn.disabled = true;
        nextBtn.style.color = '#6c757d';
        nextBtn.style.cursor = 'not-allowed';
        return;
    }
    
    const currentIndex = availableDates.indexOf(currentDate);
    
    // 記事のない日付の場合：挿入位置を計算
    if (currentIndex === -1) {
        let insertIndex = 0;
        for (let i = 0; i < availableDates.length; i++) {
            if (currentDate < availableDates[i]) {
                insertIndex = i;
                break;
            }
            insertIndex = i + 1;
        }
        
        // 前へボタンの状態：前に記事のある日付があるか
        if (insertIndex === 0) {
            // 選択日付より前に記事がない
            prevBtn.disabled = true;
            prevBtn.style.color = '#6c757d';
            prevBtn.style.cursor = 'not-allowed';
        } else {
            // 選択日付より前に記事がある
            prevBtn.disabled = false;
            prevBtn.style.color = '#dc3545';
            prevBtn.style.cursor = 'pointer';
        }
        
        // 次へボタンの状態：後に記事のある日付があるか
        if (insertIndex >= availableDates.length) {
            // 選択日付より後に記事がない
            nextBtn.disabled = true;
            nextBtn.style.color = '#6c757d';
            nextBtn.style.cursor = 'not-allowed';
        } else {
            // 選択日付より後に記事がある
            nextBtn.disabled = false;
            nextBtn.style.color = '#dc3545';
            nextBtn.style.cursor = 'pointer';
        }
        return;
    }
    
    // 記事のある日付の場合：通常の処理
    // 前へボタンの状態
    if (currentIndex <= 0) {
        // 最古の日付
        prevBtn.disabled = true;
        prevBtn.style.color = '#6c757d';
        prevBtn.style.cursor = 'not-allowed';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.color = '#dc3545';
        prevBtn.style.cursor = 'pointer';
    }
    
    // 次へボタンの状態
    if (currentIndex >= availableDates.length - 1) {
        // 最新の日付
        nextBtn.disabled = true;
        nextBtn.style.color = '#6c757d';
        nextBtn.style.cursor = 'not-allowed';
    } else {
        nextBtn.disabled = false;
        nextBtn.style.color = '#dc3545';
        nextBtn.style.cursor = 'pointer';
    }
}

/**
 * 日付ナビゲーション
 */
function navigateDate(direction) {
    if (!availableDates || availableDates.length === 0) {
        return;
    }
    
    let newDate = null;
    
    // セル未選択時：左三角で最古、右三角で最新へジャンプ
    if (!activeTooltipElement || !activeTooltipElement.dataset.date) {
        if (direction === -1) {
            // 前へ：最古の日付
            newDate = availableDates[0];
        } else if (direction === 1) {
            // 次へ：最新の日付
            newDate = availableDates[availableDates.length - 1];
        }
        
        if (newDate) {
            updateDataTable(newDate);
            selectDateOnHeatmap(newDate, true);
        }
        return;
    }
    
    // セル選択時：ナビゲーション
    const currentDate = activeTooltipElement.dataset.date;
    const currentIndex = availableDates.indexOf(currentDate);
    
    // 記事のない日付の場合：前後で最も近い記事のある日付を探す
    if (currentIndex === -1) {
        if (direction === -1) {
            // 前へ：選択日付より前で最も近い記事のある日付
            for (let i = availableDates.length - 1; i >= 0; i--) {
                if (availableDates[i] < currentDate) {
                    newDate = availableDates[i];
                    break;
                }
            }
        } else if (direction === 1) {
            // 次へ：選択日付より後で最も近い記事のある日付
            for (let i = 0; i < availableDates.length; i++) {
                if (availableDates[i] > currentDate) {
                    newDate = availableDates[i];
                    break;
                }
            }
        }
        
        if (!newDate) {
            return; // 見つからない場合は何もしない
        }
    } else {
        // 記事のある日付の場合：通常の処理
        const newIndex = currentIndex + direction;
        
        if (newIndex < 0 || newIndex >= availableDates.length) return;
        
        newDate = availableDates[newIndex];
    }
    
    updateDataTable(newDate);
    selectDateOnHeatmap(newDate, true);
}

/**
 * ヒートマップ上で日付を選択（横スクロール対応版）
 * @param {string} dateStr - 選択する日付（YYYY-MM-DD形式）
 * @param {boolean} scrollToView - 横スクロールを実行するかどうか（デフォルト: true）
 */
export function selectDateOnHeatmap(dateStr, scrollToView = true) {
    const allCells = document.querySelectorAll('.contribution-day');
    allCells.forEach(cell => {
        cell.classList.remove('selected');
    });
    
    const targetCell = document.querySelector(`.contribution-day[data-date="${dateStr}"]`);
    if (targetCell) {
        targetCell.classList.add('selected');
        activeTooltipElement = targetCell;
        isTooltipPinned = true;
        
        // 横スクロール処理
        if (scrollToView) {
            const graphWrapper = document.querySelector('.contribution-graph-wrapper');
            if (graphWrapper) {
                // 最新日付の場合は右端にスクロール
                if (availableDates.length > 0 && dateStr === availableDates[availableDates.length - 1]) {
                    graphWrapper.scrollLeft = graphWrapper.scrollWidth;
                } else {
                    // その他の日付の場合はセルが見えるようにスクロール
                    const cellRect = targetCell.getBoundingClientRect();
                    const wrapperRect = graphWrapper.getBoundingClientRect();
                    const scrollLeft = graphWrapper.scrollLeft;
                    
                    // セルが左側に隠れている場合
                    if (cellRect.left < wrapperRect.left) {
                        graphWrapper.scrollLeft = scrollLeft - (wrapperRect.left - cellRect.left) - 50;
                    }
                    // セルが右側に隠れている場合
                    else if (cellRect.right > wrapperRect.right) {
                        graphWrapper.scrollLeft = scrollLeft + (cellRect.right - wrapperRect.right) + 50;
                    }
                }
            }
        }
    }
}

/**
 * データテーブルを更新（外部から呼び出し可能）
 * @param {string} dateStr - 更新する日付（YYYY-MM-DD形式）
 */
export function updateDataTableForDate(dateStr) {
    updateDataTable(dateStr);
}

/**
 * 最新日付を選択してヒートマップを更新（外部から呼び出し可能）
 */
export function selectLatestDateOnHeatmap() {
    if (availableDates.length > 0) {
        const latestDate = availableDates[availableDates.length - 1];
        
        // 横スクロールを実行
        const graphWrapper = document.querySelector('.contribution-graph-wrapper');
        if (graphWrapper) {
            graphWrapper.scrollLeft = graphWrapper.scrollWidth;
        }
        
        // データテーブル更新とセル選択
        updateDataTable(latestDate);
        selectDateOnHeatmap(latestDate, false); // スクロールは既に完了しているのでfalse
    }
}

/**
 * タブ固有のヒートマップを生成する関数
 * @param {string} tabName - タブ名（common, kevin, ryo）
 * @param {Array} contributionData - 全体の日付ごとの件数データ
 * @param {Array} multiData - 全記事データ
 * @param {Array} basicInfo - 基本情報データ
 */
export function generateContributionGraphForTab(tabName, contributionData, multiData, basicInfo) {
    const containerId = `contribution-graph-${tabName}`;
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.warn(`Container not found: ${containerId}`);
        return;
    }
    
    console.log(`=== generateContributionGraphForTab: ${tabName} ===`);
    
    // タブIDに対応するkeyプレフィックスを決定
    const keyPrefixMap = {
        'common': 'cmp',
        'kevin': 'kevin',
        'ryo': 'ryo'
    };
    const keyPrefix = keyPrefixMap[tabName];
    
    if (!keyPrefix) {
        console.error(`Invalid tab name: ${tabName}`);
        return;
    }
    
    // タブ固有のデータをフィルタリング
    const tabMultiData = multiData.filter(item => item.key.startsWith(keyPrefix));
    console.log(`Filtered data for ${tabName}:`, tabMultiData.length, 'items');
    
    // タブ固有のコントリビューションデータを生成
    const tabDataMap = {};
    tabMultiData.forEach(item => {
        if (item.date) {
            tabDataMap[item.date] = (tabDataMap[item.date] || 0) + 1;
        }
    });
    
    const tabContributionData = Object.keys(tabDataMap).map(date => ({
        date: date,
        count: tabDataMap[date]
    }));
    
    console.log(`Tab contribution data:`, tabContributionData.length, 'dates');
    
    // タブ固有の利用可能な日付リストを作成
    const tabAvailableDates = tabContributionData
        .filter(item => item.count > 0)
        .map(item => item.date)
        .sort();
    
    console.log(`Tab available dates:`, tabAvailableDates.length, 'dates');
    
    // ヒートマップのHTMLを生成（generateContributionGraphと同じロジック）
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    function getLevel(count) {
        if (count === 0) return 0;
        if (count <= 2) return 1;
        if (count <= 5) return 2;
        if (count <= 9) return 3;
        return 4;
    }
    
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    const weeks = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= today) {
        const days = [];
        for (let day = 0; day < 7; day++) {
            const dateStr = formatDate(currentDate);
            const count = tabDataMap[dateStr] || 0;
            days.push({
                date: new Date(currentDate),
                dateStr: dateStr,
                count: count,
                level: getLevel(count)
            });
            currentDate.setDate(currentDate.getDate() + 1);
            
            if (currentDate > today) {
                break;
            }
        }
        weeks.push(days);
    }
    
    const graphContainer = document.createElement('div');
    graphContainer.className = 'contribution-graph-container';
    graphContainer.style.position = 'relative';
    
    // 共通定数
    const edgeWeeks = 4;
    const leftEdgeProtection = 6;
    
    // 年ラベル
    const yearsRow = document.createElement('div');
    yearsRow.className = 'contribution-years';
    yearsRow.style.position = 'relative';
    yearsRow.style.height = '20px';
    yearsRow.style.marginBottom = '2px';
    
    let lastYear = -1;
    let lastYearLabel = null;
    let lastYearWeekIndex = -1;
    
    weeks.forEach((week, weekIndex) => {
        for (let i = 0; i < week.length; i++) {
            const day = week[i];
            const year = day.date.getFullYear();
            
            if (year !== lastYear) {
                if (lastYearLabel && lastYearWeekIndex >= 0) {
                    const weekDistance = weekIndex - lastYearWeekIndex;
                    if (lastYearWeekIndex === 0 && weekIndex < leftEdgeProtection && weekDistance < edgeWeeks) {
                        lastYearLabel.remove();
                    }
                }
                
                const yearText = `${String(year).slice(-2)}年`;
                
                const yearLabel = document.createElement('div');
                yearLabel.className = 'contribution-year';
                yearLabel.textContent = yearText;
                yearLabel.style.position = 'absolute';
                yearLabel.style.left = `${25 + weekIndex * 13}px`;
                yearLabel.style.whiteSpace = 'nowrap';
                yearsRow.appendChild(yearLabel);
                
                lastYear = year;
                lastYearLabel = yearLabel;
                lastYearWeekIndex = weekIndex;
                break;
            }
        }
    });
    
    graphContainer.appendChild(yearsRow);
    
    // 月ラベル
    const monthsRow = document.createElement('div');
    monthsRow.className = 'contribution-months';
    monthsRow.style.position = 'relative';
    monthsRow.style.height = '18px';
    monthsRow.style.marginBottom = '5px';
    
    let lastMonth = -1;
    let lastMonthLabel = null;
    let lastMonthWeekIndex = -1;
    
    weeks.forEach((week, weekIndex) => {
        for (let i = 0; i < week.length; i++) {
            const day = week[i];
            const month = day.date.getMonth();
            
            if (month !== lastMonth) {
                if (lastMonthLabel && lastMonthWeekIndex >= 0) {
                    const weekDistance = weekIndex - lastMonthWeekIndex;
                    if (lastMonthWeekIndex === 0 && weekIndex < leftEdgeProtection && weekDistance < edgeWeeks) {
                        lastMonthLabel.remove();
                    }
                }
                
                const monthLabel = document.createElement('div');
                monthLabel.className = 'contribution-month';
                monthLabel.textContent = `${month + 1}月`;
                monthLabel.style.position = 'absolute';
                monthLabel.style.left = `${25 + weekIndex * 13}px`;
                monthLabel.style.whiteSpace = 'nowrap';
                monthsRow.appendChild(monthLabel);
                
                lastMonth = month;
                lastMonthLabel = monthLabel;
                lastMonthWeekIndex = weekIndex;
                break;
            }
        }
    });
    
    graphContainer.appendChild(monthsRow);
    
    const mainContent = document.createElement('div');
    mainContent.className = 'contribution-main';
    mainContent.style.position = 'relative';
    mainContent.style.zIndex = '1';
    
    // 左側の曜日ラベル
    const weekdaysLeft = document.createElement('div');
    weekdaysLeft.className = 'contribution-weekdays';
    ['日', '月', '火', '水', '木', '金', '土'].forEach((day) => {
        const weekday = document.createElement('div');
        weekday.className = 'contribution-weekday';
        weekday.textContent = day;
        weekdaysLeft.appendChild(weekday);
    });
    mainContent.appendChild(weekdaysLeft);
    
    const weeksContainer = document.createElement('div');
    weeksContainer.className = 'contribution-weeks';
    
    // モバイル判定
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    let activeTooltip = null;
    let activeTooltipElement = null;
    let isTooltipPinned = false;
    
    // ツールチップを表示する関数
    function showTooltip(dayElement, day, clientX, clientY, pinned = false) {
        if (pinned) {
            const selectedCells = container.querySelectorAll('.contribution-day.selected');
            selectedCells.forEach(cell => {
                cell.classList.remove('selected');
            });
            
            dayElement.classList.add('selected');
            activeTooltipElement = dayElement;
            isTooltipPinned = true;
            
            // データテーブルを更新（タブ固有）
            updateDataTableForTab(tabName, day.dateStr, tabMultiData, basicInfo);
        } else {
            if (activeTooltip && !isTooltipPinned) {
                activeTooltip.remove();
                activeTooltip = null;
            }
            
            const date = new Date(day.dateStr);
            const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
            const formattedDate = day.dateStr.replace(/-/g, '/');
            
            const tooltip = document.createElement('div');
            tooltip.className = 'contribution-tooltip';
            tooltip.textContent = `${formattedDate} (${dayOfWeek}) - ${day.count}件`;
            tooltip.style.position = 'fixed';
            tooltip.style.left = `${clientX + 10}px`;
            tooltip.style.top = `${clientY - 30}px`;
            tooltip.style.zIndex = '10000';
            
            document.body.appendChild(tooltip);
            activeTooltip = tooltip;
        }
    }
    
    weeks.forEach(week => {
        const weekColumn = document.createElement('div');
        weekColumn.className = 'contribution-week';
        
        week.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = `contribution-day level-${day.level}`;
            dayElement.setAttribute('data-date', day.dateStr);
            dayElement.setAttribute('data-count', day.count);
            
            if (isMobile) {
                dayElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (isTooltipPinned && activeTooltipElement === dayElement) {
                        dayElement.classList.remove('selected');
                        activeTooltipElement = null;
                        isTooltipPinned = false;
                    } else {
                        showTooltip(dayElement, day, e.clientX, e.clientY, true);
                    }
                });
            } else {
                dayElement.addEventListener('mouseenter', (e) => {
                    if (!isTooltipPinned) {
                        showTooltip(dayElement, day, e.clientX, e.clientY, false);
                    }
                });
                
                dayElement.addEventListener('mouseleave', () => {
                    if (!isTooltipPinned && activeTooltip) {
                        activeTooltip.remove();
                        activeTooltip = null;
                    }
                });
                
                dayElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showTooltip(dayElement, day, e.clientX, e.clientY, true);
                });
            }
            
            weekColumn.appendChild(dayElement);
        });
        
        weeksContainer.appendChild(weekColumn);
    });
    
    mainContent.appendChild(weeksContainer);
    
    // 右側の曜日ラベル
    const weekdaysRight = document.createElement('div');
    weekdaysRight.className = 'contribution-weekdays-right';
    ['日', '月', '火', '水', '木', '金', '土'].forEach((day) => {
        const weekday = document.createElement('div');
        weekday.className = 'contribution-weekday';
        weekday.textContent = day;
        weekdaysRight.appendChild(weekday);
    });
    mainContent.appendChild(weekdaysRight);
    
    graphContainer.appendChild(mainContent);
    
    // ヒートマップのみをコンテナに追加
    container.innerHTML = '';
    container.appendChild(graphContainer);
    
    // データテーブルを別の枠として追加
    const dataTableWrapperId = `data-table-wrapper-${tabName}`;
    const dataTableWrapper = document.getElementById(dataTableWrapperId);
    
    if (!dataTableWrapper) {
        console.warn(`Data table wrapper not found: ${dataTableWrapperId}`);
        return;
    }
    
    const dataTableContainer = document.createElement('div');
    dataTableContainer.id = `data-table-container-${tabName}`;
    dataTableContainer.className = 'contribution-data-table-container';
    
    dataTableContainer.innerHTML = `
        <div class="data-table-header">
            <div class="date-navigation" style="display: flex; justify-content: center; align-items: center; gap: 1rem;">
                <button id="date-prev-btn-${tabName}" class="date-nav-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #dc3545; padding: 0.25rem 0.5rem;" disabled>◀︎</button>
                <div id="selected-date-display-${tabName}" style="font-weight: bold; color: #dc3545; font-size: 1rem;"></div>
                <button id="date-next-btn-${tabName}" class="date-nav-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #dc3545; padding: 0.25rem 0.5rem;" disabled>▶︎</button>
            </div>
        </div>
        <div id="data-table-content-${tabName}" class="data-table-content"></div>
    `;
    
    dataTableWrapper.innerHTML = '';
    dataTableWrapper.appendChild(dataTableContainer);
    
    // ナビゲーションボタンのイベントリスナー
    const prevBtn = document.getElementById(`date-prev-btn-${tabName}`);
    const nextBtn = document.getElementById(`date-next-btn-${tabName}`);
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            navigateDateForTab(tabName, -1, tabAvailableDates, () => {
                // activeTooltipElementを取得する関数
                const container = document.getElementById(`contribution-graph-${tabName}`);
                return container ? container.querySelector('.contribution-day.selected') : null;
            }, tabMultiData, basicInfo);
        });
        
        nextBtn.addEventListener('click', () => {
            navigateDateForTab(tabName, 1, tabAvailableDates, () => {
                const container = document.getElementById(`contribution-graph-${tabName}`);
                return container ? container.querySelector('.contribution-day.selected') : null;
            }, tabMultiData, basicInfo);
        });
        
        // 初期状態：ボタンを有効化
        if (tabAvailableDates && tabAvailableDates.length > 0) {
            const baseStyle = 'background: none; border: none; font-size: 1.5rem; padding: 0.25rem 0.5rem;';
            prevBtn.disabled = false;
            prevBtn.style.cssText = baseStyle + ' color: #dc3545; cursor: pointer;';
            nextBtn.disabled = false;
            nextBtn.style.cssText = baseStyle + ' color: #dc3545; cursor: pointer;';
        }
    }
    
    // 背景クリックで選択解除（総合タブと同じ条件）
    const clickHandler = (e) => {
        // データテーブル、セル、ツールチップ以外がクリックされた場合
        if (!e.target.closest('.contribution-day') && 
            !e.target.closest('.contribution-tooltip') && 
            !e.target.closest('.contribution-data-table-container')) {
            
            // ツールチップを削除
            if (activeTooltip) {
                activeTooltip.remove();
                activeTooltip = null;
            }
            
            // セルが選択されている場合は解除してグラフ表示に戻す
            if (isTooltipPinned && activeTooltipElement) {
                const selectedCells = container.querySelectorAll('.contribution-day.selected');
                selectedCells.forEach(cell => {
                    cell.classList.remove('selected');
                });
                activeTooltipElement = null;
                isTooltipPinned = false;
                
                // 統計グラフを再表示
                displayCardStatisticsForTab(tabName, tabMultiData, basicInfo);
            }
        }
    };
    
    document.addEventListener('click', clickHandler);
    
    // 初期表示：統計グラフを表示
    displayCardStatisticsForTab(tabName, tabMultiData, basicInfo);
    
    console.log(`=== generateContributionGraphForTab completed for ${tabName} ===`);
}

/**
 * タブ固有のヒートマップで最新日付を自動選択
 * @param {string} tabName - タブ名
 */
export function selectLatestDateForTab(tabName) {
    const containerId = `contribution-graph-${tabName}`;
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.warn(`Container not found: ${containerId}`);
        return;
    }
    
    // 全てのセルから日付を取得
    const allCells = container.querySelectorAll('.contribution-day[data-count]:not([data-count="0"])');
    if (allCells.length === 0) {
        console.warn(`No cells with data found in ${containerId}`);
        return;
    }
    
    // 最新の日付を探す
    let latestDate = null;
    let latestCell = null;
    
    allCells.forEach(cell => {
        const date = cell.getAttribute('data-date');
        if (!latestDate || date > latestDate) {
            latestDate = date;
            latestCell = cell;
        }
    });
    
    if (latestCell && latestDate) {
        console.log(`Selecting latest date for ${tabName}:`, latestDate);
        
        // 横スクロールを右端に
        const graphWrapper = container.closest('.contribution-graph-wrapper');
        if (graphWrapper) {
            graphWrapper.scrollLeft = graphWrapper.scrollWidth;
        }
        
        // セルをクリックして選択
        latestCell.click();
    }
}

/**
 * タブ固有のデータテーブルを更新
 */
function updateDataTableForTab(tabName, dateStr, tabMultiData, basicInfo) {
    const tableContent = document.getElementById(`data-table-content-${tabName}`);
    const dateDisplay = document.getElementById(`selected-date-display-${tabName}`);
    
    if (!tableContent || !dateDisplay) return;
    
    // その日の記事をフィルタ
    const items = tabMultiData.filter(item => item.date === dateStr);
    
    const date = new Date(dateStr);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    const formattedDate = dateStr.replace(/-/g, '/') + '(' + dayOfWeek + ') - ' + items.length + '件';
    dateDisplay.textContent = formattedDate;
    
    // データを組み合わせて表示用配列を作成
    const displayData = items.map(multiItem => {
        const basicInfoItem = basicInfo.find(bi => bi.key === multiItem.key);
        
        if (!basicInfoItem) {
            console.warn(`No matching basicInfo found for key: ${multiItem.key}`);
            return null;
        }
        
        return {
            summary: basicInfoItem.summary || '',
            tabId: basicInfoItem.tabId || '',
            siteTitle: basicInfoItem.siteTitle || '',
            siteUrl: basicInfoItem.siteUrl || '',
            title: multiItem.title || '',
            link: multiItem.link || ''
        };
    }).filter(item => item !== null);
    
    if (displayData.length === 0) {
        tableContent.innerHTML = '<p class="text-muted text-center">この日の記事はありません</p>';
        return;
    }
    
    // PC版: テーブル形式（総合タブと同じ構造）
    const tableHTML = `
        <div class="data-table-desktop">
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th style="width: 20%; text-align: center; vertical-align: middle;">Tab</th>
                        <th style="width: 25%; text-align: center; vertical-align: middle;">Site</th>
                        <th style="width: 55%; text-align: left; vertical-align: middle;">Title（投稿内容）</th>
                    </tr>
                </thead>
                <tbody>
                    ${displayData.map(item => {
                        // Markdown記法を除去
                        const removeMarkdown = (text) => {
                            return text
                                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // [text](url) → text
                                .replace(/\*\*([^*]+)\*\*/g, '$1')        // **text** → text
                                .replace(/\*([^*]+)\*/g, '$1')            // *text* → text
                                .replace(/`([^`]+)`/g, '$1')              // `text` → text
                                .replace(/~~([^~]+)~~/g, '$1')            // ~~text~~ → text
                                .replace(/^#+\s+/gm, '')                  // # heading → heading
                                .trim();
                        };
                        
                        const cleanSiteTitle = removeMarkdown(item.siteTitle);
                        
                        let siteLink = '';
                        if (item.siteUrl) {
                            siteLink = `<a href="${item.siteUrl}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">${cleanSiteTitle}</a>`;
                        } else {
                            siteLink = cleanSiteTitle;
                        }
                        
                        let titleContent = '';
                        if (item.link) {
                            titleContent = `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">${item.title}</a>`;
                        } else {
                            titleContent = item.title;
                        }
                        
                        return `
                            <tr>
                                <td style="text-align: center; vertical-align: middle;">${item.summary}</td>
                                <td style="text-align: center; vertical-align: middle;">${siteLink}</td>
                                <td style="text-align: left; vertical-align: middle;"><strong>${titleContent}</strong></td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // モバイル版: カード形式（総合タブと同じ構造）
    const cardsHTML = `
        <div class="data-table-mobile">
            ${displayData.map(item => {
                let siteLink = '';
                if (item.siteUrl) {
                    siteLink = `<a href="${item.siteUrl}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">${item.siteTitle}</a>`;
                } else {
                    siteLink = item.siteTitle;
                }
                
                let titleContent = '';
                if (item.link) {
                    titleContent = `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="text-decoration-none">${item.title}</a>`;
                } else {
                    titleContent = item.title;
                }
                
                return `
                    <div class="data-card">
                        <div class="data-card-title">${titleContent}</div>
                        <div class="data-card-meta">
                            <span class="data-card-label">Tab:</span>
                            ${item.summary}
                            <span class="data-card-separator">|</span>
                            <span class="data-card-label">Site:</span>
                            ${siteLink}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    tableContent.innerHTML = tableHTML + cardsHTML;
    
    updateNavigationButtonsForTab(tabName, dateStr, getTabAvailableDates(tabName, tabMultiData));
}

/**
 * タブ固有の利用可能な日付リストを取得
 */
function getTabAvailableDates(tabName, tabMultiData) {
    const dateCounts = {};
    tabMultiData.forEach(item => {
        if (item.date) {
            dateCounts[item.date] = (dateCounts[item.date] || 0) + 1;
        }
    });
    
    return Object.keys(dateCounts)
        .filter(date => dateCounts[date] > 0)
        .sort();
}

/**
 * タブ固有の日付ナビゲーション
 */
function navigateDateForTab(tabName, direction, tabAvailableDates, getActiveElement, tabMultiData, basicInfo) {
    if (!tabAvailableDates || tabAvailableDates.length === 0) {
        return;
    }
    
    let newDate = null;
    const activeElement = getActiveElement();
    
    // セル未選択時（グラフ表示時）：左三角で最古、右三角で最新へジャンプ
    if (!activeElement || !activeElement.dataset.date) {
        if (direction === -1) {
            // 前へ：最古の日付
            newDate = tabAvailableDates[0];
        } else if (direction === 1) {
            // 次へ：最新の日付
            newDate = tabAvailableDates[tabAvailableDates.length - 1];
        }
        
        if (newDate) {
            updateDataTableForTab(tabName, newDate, tabMultiData, basicInfo);
            selectDateOnHeatmapForTab(tabName, newDate, true);
        }
        return;
    }
    
    // セル選択時：選択しているセルから近い記事のセルへ移動
    const currentDate = activeElement.dataset.date;
    const currentIndex = tabAvailableDates.indexOf(currentDate);
    
    if (direction === -1) {
        // 前へ：選択日付より前で最も近い記事のある日付
        if (currentIndex > 0) {
            // 記事のある日付の場合：前の日付へ
            newDate = tabAvailableDates[currentIndex - 1];
        } else if (currentIndex === -1) {
            // 記事のない日付の場合：より前の日付を探す
            for (let i = tabAvailableDates.length - 1; i >= 0; i--) {
                if (tabAvailableDates[i] < currentDate) {
                    newDate = tabAvailableDates[i];
                    break;
                }
            }
        }
    } else if (direction === 1) {
        // 次へ：選択日付より後で最も近い記事のある日付
        if (currentIndex >= 0 && currentIndex < tabAvailableDates.length - 1) {
            // 記事のある日付の場合：次の日付へ
            newDate = tabAvailableDates[currentIndex + 1];
        } else if (currentIndex === -1) {
            // 記事のない日付の場合：より後の日付を探す
            for (let i = 0; i < tabAvailableDates.length; i++) {
                if (tabAvailableDates[i] > currentDate) {
                    newDate = tabAvailableDates[i];
                    break;
                }
            }
        }
    }
    
    if (newDate) {
        updateDataTableForTab(tabName, newDate, tabMultiData, basicInfo);
        selectDateOnHeatmapForTab(tabName, newDate, true);
    }
}

/**
 * タブ固有のナビゲーションボタンの状態を更新
 */
function updateNavigationButtonsForTab(tabName, currentDate, tabAvailableDates) {
    const prevBtn = document.getElementById(`date-prev-btn-${tabName}`);
    const nextBtn = document.getElementById(`date-next-btn-${tabName}`);
    
    if (!prevBtn || !nextBtn) return;
    
    // 基本スタイルを維持
    const baseStyle = 'background: none; border: none; font-size: 1.5rem; padding: 0.25rem 0.5rem;';
    
    if (!currentDate || tabAvailableDates.length === 0) {
        prevBtn.disabled = true;
        prevBtn.style.cssText = baseStyle + ' color: #6c757d; cursor: not-allowed;';
        nextBtn.disabled = true;
        nextBtn.style.cssText = baseStyle + ' color: #6c757d; cursor: not-allowed;';
        return;
    }
    
    const currentIndex = tabAvailableDates.indexOf(currentDate);
    
    // 記事のない日付の場合：挿入位置を計算
    if (currentIndex === -1) {
        let insertIndex = 0;
        for (let i = 0; i < tabAvailableDates.length; i++) {
            if (currentDate < tabAvailableDates[i]) {
                insertIndex = i;
                break;
            }
            insertIndex = i + 1;
        }
        
        // 前へボタン
        if (insertIndex === 0) {
            prevBtn.disabled = true;
            prevBtn.style.cssText = baseStyle + ' color: #6c757d; cursor: not-allowed;';
        } else {
            prevBtn.disabled = false;
            prevBtn.style.cssText = baseStyle + ' color: #dc3545; cursor: pointer;';
        }
        
        // 次へボタン
        if (insertIndex >= tabAvailableDates.length) {
            nextBtn.disabled = true;
            nextBtn.style.cssText = baseStyle + ' color: #6c757d; cursor: not-allowed;';
        } else {
            nextBtn.disabled = false;
            nextBtn.style.cssText = baseStyle + ' color: #dc3545; cursor: pointer;';
        }
        return;
    }
    
    // 記事のある日付の場合
    // 前へボタン
    if (currentIndex <= 0) {
        prevBtn.disabled = true;
        prevBtn.style.cssText = baseStyle + ' color: #6c757d; cursor: not-allowed;';
    } else {
        prevBtn.disabled = false;
        prevBtn.style.cssText = baseStyle + ' color: #dc3545; cursor: pointer;';
    }
    
    // 次へボタン
    if (currentIndex >= tabAvailableDates.length - 1) {
        nextBtn.disabled = true;
        nextBtn.style.cssText = baseStyle + ' color: #6c757d; cursor: not-allowed;';
    } else {
        nextBtn.disabled = false;
        nextBtn.style.cssText = baseStyle + ' color: #dc3545; cursor: pointer;';
    }
}

/**
 * タブ固有のヒートマップで日付を選択
 */
function selectDateOnHeatmapForTab(tabName, dateStr, scrollToView = true) {
    const containerId = `contribution-graph-${tabName}`;
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    const allCells = container.querySelectorAll('.contribution-day');
    allCells.forEach(cell => {
        cell.classList.remove('selected');
    });
    
    const targetCell = container.querySelector(`.contribution-day[data-date="${dateStr}"]`);
    if (targetCell) {
        targetCell.classList.add('selected');
        
        if (scrollToView) {
            const graphWrapper = container.closest('.contribution-graph-wrapper');
            if (graphWrapper) {
                const cellRect = targetCell.getBoundingClientRect();
                const wrapperRect = graphWrapper.getBoundingClientRect();
                const scrollLeft = graphWrapper.scrollLeft;
                
                if (cellRect.left < wrapperRect.left) {
                    graphWrapper.scrollLeft = scrollLeft - (wrapperRect.left - cellRect.left) - 50;
                } else if (cellRect.right > wrapperRect.right) {
                    graphWrapper.scrollLeft = scrollLeft + (cellRect.right - wrapperRect.right) + 50;
                }
            }
        }
    }
}