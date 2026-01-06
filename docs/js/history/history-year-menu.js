/**
 * Historyページの年代ジャンプメニューモジュール
 * 5年単位のジャンプボタン生成と横スクロール制御
 */

import { MIN_YEAR, MAX_YEAR } from './history-constants.js';
import { scrollToYear } from './history-navigation.js';

/**
 * キリの良い5年刻みの年リストを生成（2000, 2005, 2010...）
 * @param {number} minYear - 最小年（MIN_YEAR）
 * @param {number} maxYear - 最大年（MAX_YEAR）
 * @param {boolean} isDesc - 降順かどうか
 * @returns {Array<number>} 年のリスト
 */
function generateYearList(minYear, maxYear, isDesc) {
    const years = [];
    
    // 2000年を基準にして、キリの良い年を生成
    const baseYear = 2000;
    
    // minYear以下で最も大きいキリの良い年を探す
    let startYear = baseYear;
    while (startYear > minYear) {
        startYear -= 5;
    }
    
    // startYearからmaxYearまで5年刻みで生成
    for (let year = startYear; year <= maxYear; year += 5) {
        years.push(year);
    }
    
    // 降順の場合は逆順に
    if (isDesc) {
        years.reverse();
    }
    
    return years;
}

/**
 * ジャンプボタンを生成
 * @param {HTMLElement} container - コンテナ要素
 * @param {boolean} isDesc - 降順かどうか
 * @param {number} currentStartYear - 現在の表示開始年
 * @param {number} currentEndYear - 現在の表示終了年
 */
export function generateYearJumpButtons(container, isDesc, currentStartYear, currentEndYear) {
    if (!container) return;
    
    // 既存のジャンプボタンを削除
    const existingButtons = container.querySelectorAll('.year-jump-btn');
    existingButtons.forEach(btn => btn.remove());
    
    // キリの良い5年刻みの年リストを生成
    const years = generateYearList(MIN_YEAR, MAX_YEAR, isDesc);
    
    // ボタンを生成してコンテナに追加
    years.forEach(year => {
        const btn = document.createElement('button');
        btn.className = 'abbreviation-menu-button year-jump-btn';
        btn.textContent = `${year}年`;
        btn.setAttribute('data-year', year);
        
        // 範囲外かどうかをチェック
        const isOutOfRange = year < currentStartYear || year > currentEndYear;
        
        if (isOutOfRange) {
            // 範囲外: 灰色・非アクティブ
            btn.classList.add('disabled');
            btn.disabled = true;
            btn.style.opacity = '0.4';
            btn.style.cursor = 'not-allowed';
            btn.style.color = '#6c757d';
        } else {
            // 範囲内: クリック可能
            btn.addEventListener('click', () => {
                scrollToYear(year);
            });
        }
        
        container.appendChild(btn);
    });
}

/**
 * スクロール矢印の表示状態を更新
 * @param {HTMLElement} container - スクロールコンテナ
 * @param {HTMLElement} leftArrow - 左矢印ボタン
 * @param {HTMLElement} rightArrow - 右矢印ボタン
 */
function updateScrollArrows(container, leftArrow, rightArrow) {
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    const threshold = window.innerWidth <= 768 ? 1 : 5;
    
    // スクロール不要な場合は両方非表示
    if (scrollWidth <= clientWidth + threshold) {
        leftArrow.classList.add('hidden');
        rightArrow.classList.add('hidden');
        return;
    }
    
    // 左端
    if (scrollLeft <= threshold) {
        leftArrow.classList.add('hidden');
        rightArrow.classList.remove('hidden');
    }
    // 右端
    else if (scrollLeft + clientWidth >= scrollWidth - threshold) {
        leftArrow.classList.remove('hidden');
        rightArrow.classList.add('hidden');
    }
    // 中間
    else {
        leftArrow.classList.remove('hidden');
        rightArrow.classList.remove('hidden');
    }
}

/**
 * justify-contentを動的に切り替える
 * @param {HTMLElement} container - スクロールコンテナ
 */
function updateJustifyContent(container) {
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    
    // 余裕を持たせて判定（スクロールバーやパディングの誤差を考慮）
    const threshold = 10;
    
    if (scrollWidth > clientWidth + threshold) {
        container.style.justifyContent = 'flex-start';
    } else {
        container.style.justifyContent = 'center';
    }
}

/**
 * スクロール矢印ボタンの初期化
 */
export function initScrollArrows() {
    // 通常メニューの矢印ボタン
    const scrollContainer = document.getElementById('filterNavContainer');
    const leftArrow = document.getElementById('scrollLeftBtn');
    const rightArrow = document.getElementById('scrollRightBtn');
    
    if (scrollContainer && leftArrow && rightArrow) {
        leftArrow.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
        });
        
        rightArrow.addEventListener('click', () => {
            scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
        });
        
        const updateArrows = () => {
            updateJustifyContent(scrollContainer);
            updateScrollArrows(scrollContainer, leftArrow, rightArrow);
        };
        
        // 即座に実行
        updateArrows();
        
        // requestAnimationFrameで次のフレームに実行
        requestAnimationFrame(() => {
            updateArrows();
            requestAnimationFrame(updateArrows);
        });
        
        // 複数のタイミングで実行
        setTimeout(updateArrows, 50);
        setTimeout(updateArrows, 100);
        setTimeout(updateArrows, 200);
        setTimeout(updateArrows, 500);
        
        // スクロールイベント
        scrollContainer.addEventListener('scroll', updateArrows);
        
        // リサイズイベント
        window.addEventListener('resize', updateArrows);
    }
    
    // コンパクトメニューの矢印ボタン
    const scrollContainerCompact = document.getElementById('filterNavContainerCompact');
    const leftArrowCompact = document.getElementById('scrollLeftBtnCompact');
    const rightArrowCompact = document.getElementById('scrollRightBtnCompact');
    
    if (scrollContainerCompact && leftArrowCompact && rightArrowCompact) {
        leftArrowCompact.addEventListener('click', () => {
            scrollContainerCompact.scrollBy({ left: -200, behavior: 'smooth' });
        });
        
        rightArrowCompact.addEventListener('click', () => {
            scrollContainerCompact.scrollBy({ left: 200, behavior: 'smooth' });
        });
        
        const updateArrowsCompact = () => {
            updateJustifyContent(scrollContainerCompact);
            updateScrollArrows(scrollContainerCompact, leftArrowCompact, rightArrowCompact);
        };
        
        // 即座に実行
        updateArrowsCompact();
        
        // requestAnimationFrameで次のフレームに実行
        requestAnimationFrame(() => {
            updateArrowsCompact();
            requestAnimationFrame(updateArrowsCompact);
        });
        
        // 複数のタイミングで実行
        setTimeout(updateArrowsCompact, 50);
        setTimeout(updateArrowsCompact, 100);
        setTimeout(updateArrowsCompact, 200);
        setTimeout(updateArrowsCompact, 500);
        
        // スクロールイベント
        scrollContainerCompact.addEventListener('scroll', updateArrowsCompact);
        
        // リサイズイベント
        window.addEventListener('resize', updateArrowsCompact);
    }
}

/**
 * 年代メニューを更新（ソート順が変わった時に呼ばれる）
 * @param {boolean} isDesc - 降順かどうか
 * @param {number} currentStartYear - 現在の表示開始年
 * @param {number} currentEndYear - 現在の表示終了年
 */
export function updateYearMenu(isDesc, currentStartYear, currentEndYear) {
    const containerNormal = document.getElementById('filterNavContainer');
    const containerCompact = document.getElementById('filterNavContainerCompact');
    
    if (containerNormal) {
        generateYearJumpButtons(containerNormal, isDesc, currentStartYear, currentEndYear);
    }
    
    if (containerCompact) {
        generateYearJumpButtons(containerCompact, isDesc, currentStartYear, currentEndYear);
    }
    
    // 矢印ボタンの状態を更新
    setTimeout(() => {
        initScrollArrows();
    }, 100);
}
