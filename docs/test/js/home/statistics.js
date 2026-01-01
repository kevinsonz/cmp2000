/**
 * 統計グラフ表示モジュール
 */

// 集計期間（1年間）
let statsPeriodStart = null;
let statsPeriodEnd = null;

/**
 * 集計期間を初期化
 */
export function initializeStatsPeriod() {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    statsPeriodStart = new Date(oneYearAgo);
    statsPeriodEnd = new Date(today);
    
    console.log('Statistics period initialized:', statsPeriodStart, 'to', statsPeriodEnd);
}

/**
 * タブごとの統計情報を計算してバーチャートを表示する関数
 * @param {Array} multiDataGlobal - 全記事データ
 * @param {Array} basicInfoData - 基本情報データ
 * @param {Function} switchTabCallback - タブ切り替えコールバック
 */
export function displayTabStatisticsChart(multiDataGlobal, basicInfoData, switchTabCallback) {
    const tableContent = document.getElementById('data-table-content');
    const dateDisplay = document.getElementById('selected-date-display');
    
    if (!tableContent || !dateDisplay) {
        console.warn('Required elements not found for statistics chart');
        return;
    }
    
    // 集計期間が初期化されていない場合は初期化
    if (!statsPeriodStart || !statsPeriodEnd) {
        initializeStatsPeriod();
    }
    
    // 必要なデータがあるかチェック
    if (!multiDataGlobal || !basicInfoData) {
        tableContent.innerHTML = '<p class="text-muted text-center">統計情報を表示できません</p>';
        console.warn('Missing required data for statistics chart');
        return;
    }
    
    // 集計期間の文字列を作成（yyyy/mm形式）
    const startYearMonth = `${statsPeriodStart.getFullYear()}/${String(statsPeriodStart.getMonth() + 1).padStart(2, '0')}`;
    const endYearMonth = `${statsPeriodEnd.getFullYear()}/${String(statsPeriodEnd.getMonth() + 1).padStart(2, '0')}`;
    const periodText = `${startYearMonth}〜${endYearMonth}`;
    
    // 日付表示を更新
    dateDisplay.textContent = periodText;
    
    // 1年分のデータをフィルタ
    const oneYearData = multiDataGlobal.filter(item => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        return itemDate >= statsPeriodStart && itemDate <= statsPeriodEnd;
    });
    
    console.log('Filtered one year data:', oneYearData.length, 'items');
    
    // タブ情報を取得（common, kevin, ryo）
    const tabInfo = [
        { tabId: 'common', keyPrefix: 'cmp' },
        { tabId: 'kevin', keyPrefix: 'kevin' },
        { tabId: 'ryo', keyPrefix: 'ryo' }
    ];
    
    // 各タブの記事数を集計
    const tabStats = tabInfo.map(tab => {
        const count = oneYearData.filter(item => item.key.startsWith(tab.keyPrefix)).length;
        
        // basicInfoからtabを取得
        const basicInfo = basicInfoData.find(item => item.tabId === tab.tabId);
        const tabName = basicInfo ? basicInfo.tab : tab.tabId;
        
        return {
            tabId: tab.tabId,
            tabName: tabName,
            count: count
        };
    });
    
    // 合計件数を計算
    const totalCount = tabStats.reduce((sum, stat) => sum + stat.count, 0);
    
    // 割合を計算
    tabStats.forEach(stat => {
        stat.percentage = totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0;
    });
    
    // 件数が多い順にソート
    tabStats.sort((a, b) => b.count - a.count);
    
    console.log('Tab statistics:', tabStats);
    
    // PC版：テーブル形式
    const tableHTML = `
        <div class="tab-stats-table-view">
            <table class="table table-bordered table-sm mb-0">
                <thead>
                    <tr>
                        <th style="width: 25%;">タブ名</th>
                        <th style="width: 20%;">件数</th>
                        <th style="width: 20%;">割合</th>
                        <th style="width: 35%;">グラフ</th>
                    </tr>
                </thead>
                <tbody>
                    ${tabStats.map(stat => `
                        <tr>
                            <td>
                                <a href="#" class="text-decoration-none tab-switch-link" data-tab="${stat.tabId}" style="color: #dc3545; font-weight: 500;">
                                    ${stat.tabName}
                                </a>
                            </td>
                            <td>${stat.count}件</td>
                            <td>${stat.percentage}%</td>
                            <td>
                                <div class="tab-stats-bar-wrapper-table">
                                    <div class="tab-stats-bar" style="width: ${stat.percentage}%;"></div>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // モバイル版：バーチャート形式
    const chartHTML = `
        <div class="tab-stats-chart-view">
            <div class="tab-stats-chart">
                ${tabStats.map(stat => `
                    <div class="tab-stats-item">
                        <div class="tab-stats-label">
                            <a href="#" class="text-decoration-none tab-switch-link" data-tab="${stat.tabId}" style="color: #dc3545; font-weight: 500;">
                                ${stat.tabName}
                            </a>
                            <span style="color: #495057;"> | 件数：${stat.count}件 | 割合：${stat.percentage}%</span>
                        </div>
                        <div class="tab-stats-bar-wrapper">
                            <div class="tab-stats-bar" style="width: ${stat.percentage}%;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    tableContent.innerHTML = tableHTML + chartHTML;
    
    // タブ切り替えリンクのイベントリスナー
    if (switchTabCallback) {
        tableContent.querySelectorAll('.tab-switch-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = e.target.dataset.tab;
                switchTabCallback(tabId);
            });
        });
    }
    
    console.log('Statistics chart displayed successfully');
}

/**
 * タブごとのカード別統計情報を計算してバーチャートを表示する関数
 * @param {string} tabName - タブ名（common, kevin, ryo）
 * @param {Array} tabMultiData - タブ固有の記事データ
 * @param {Array} basicInfoData - 基本情報データ
 */
export function displayCardStatisticsForTab(tabName, tabMultiData, basicInfoData) {
    const tableContent = document.getElementById(`data-table-content-${tabName}`);
    const dateDisplay = document.getElementById(`selected-date-display-${tabName}`);
    
    if (!tableContent || !dateDisplay) {
        console.warn(`Required elements not found for tab ${tabName}`);
        return;
    }
    
    // 集計期間が初期化されていない場合は初期化
    if (!statsPeriodStart || !statsPeriodEnd) {
        initializeStatsPeriod();
    }
    
    // 必要なデータがあるかチェック
    if (!tabMultiData || !basicInfoData) {
        tableContent.innerHTML = '<p class="text-muted text-center">統計情報を表示できません</p>';
        console.warn('Missing required data for card statistics');
        return;
    }
    
    // 集計期間の文字列を作成
    const startYearMonth = `${statsPeriodStart.getFullYear()}/${String(statsPeriodStart.getMonth() + 1).padStart(2, '0')}`;
    const endYearMonth = `${statsPeriodEnd.getFullYear()}/${String(statsPeriodEnd.getMonth() + 1).padStart(2, '0')}`;
    const periodText = `${startYearMonth}〜${endYearMonth}`;
    
    // 日付表示を更新
    dateDisplay.textContent = periodText;
    
    // 1年分のデータをフィルタ
    const oneYearData = tabMultiData.filter(item => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        return itemDate >= statsPeriodStart && itemDate <= statsPeriodEnd;
    });
    
    console.log(`Filtered one year data for ${tabName}:`, oneYearData.length, 'items');
    
    // タブIDに対応するkeyプレフィックス
    const keyPrefixMap = {
        'common': 'cmp',
        'kevin': 'kevin',
        'ryo': 'ryo'
    };
    const keyPrefix = keyPrefixMap[tabName];
    
    // タブに属するカード情報を取得
    const tabCards = basicInfoData.filter(item => 
        item.tabId === tabName && 
        item.property !== 'hidden' &&
        !item.key.includes('MainX') &&
        !item.key.includes('SubX')
    );
    
    // 各カードの記事数を集計
    const cardStats = tabCards.map(card => {
        const count = oneYearData.filter(item => item.key === card.key).length;
        
        return {
            key: card.key,
            siteTitle: card.siteTitle,
            count: count,
            order: parseInt(card.order, 10) || 0  // order値を保持
        };
    }); // 0件のカードも含める
    
    // 合計件数を計算
    const totalCount = cardStats.reduce((sum, stat) => sum + stat.count, 0);
    
    // 割合を計算
    cardStats.forEach(stat => {
        stat.percentage = totalCount > 0 ? Math.round((stat.count / totalCount) * 100) : 0;
    });
    
    // ソート：件数が多い順、同件数の場合はorder順
    cardStats.sort((a, b) => {
        if (b.count !== a.count) {
            return b.count - a.count;  // 件数降順
        }
        return a.order - b.order;  // order昇順
    });
    
    console.log(`Card statistics for ${tabName}:`, cardStats);
    
    // PC版：テーブル形式
    const tableHTML = `
        <div class="tab-stats-table-view">
            <table class="table table-bordered table-sm mb-0">
                <thead>
                    <tr>
                        <th style="width: 25%;">カード名</th>
                        <th style="width: 20%;">件数</th>
                        <th style="width: 20%;">割合</th>
                        <th style="width: 35%;">グラフ</th>
                    </tr>
                </thead>
                <tbody>
                    ${cardStats.map(stat => `
                        <tr>
                            <td style="font-weight: 500;">${stat.siteTitle}</td>
                            <td>${stat.count}件</td>
                            <td>${stat.percentage}%</td>
                            <td>
                                <div class="tab-stats-bar-wrapper-table">
                                    <div class="tab-stats-bar" style="width: ${stat.percentage}%;"></div>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // モバイル版：バーチャート形式
    const chartHTML = `
        <div class="tab-stats-chart-view">
            <div class="tab-stats-chart">
                ${cardStats.map(stat => `
                    <div class="tab-stats-item">
                        <div class="tab-stats-label">
                            <span style="color: #dc3545; font-weight: 500;">${stat.siteTitle}</span>
                            <span style="color: #495057;"> | 件数：${stat.count}件 | 割合：${stat.percentage}%</span>
                        </div>
                        <div class="tab-stats-bar-wrapper" style="display: flex; align-items: center;">
                            <div class="tab-stats-bar" style="width: ${stat.percentage}%;"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    tableContent.innerHTML = tableHTML + chartHTML;
    
    // ナビゲーションボタンを初期状態に設定（グラフ表示時）
    const prevBtn = document.getElementById(`date-prev-btn-${tabName}`);
    const nextBtn = document.getElementById(`date-next-btn-${tabName}`);
    if (prevBtn && nextBtn) {
        const baseStyle = 'background: none; border: none; font-size: 1.5rem; padding: 0.25rem 0.5rem;';
        prevBtn.disabled = false;
        prevBtn.style.cssText = baseStyle + ' color: #dc3545; cursor: pointer;';
        nextBtn.disabled = false;
        nextBtn.style.cssText = baseStyle + ' color: #dc3545; cursor: pointer;';
    }
    
    console.log(`Card statistics chart displayed for ${tabName}`);
}