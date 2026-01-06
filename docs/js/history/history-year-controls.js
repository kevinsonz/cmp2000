/**
 * Historyページの年フィルタUI管理モジュール
 * 年範囲選択、スライダー、ボタンの制御
 */

import { MIN_YEAR, MAX_YEAR } from './history-constants.js';

/**
 * 年セレクトボックスを初期化
 * @param {number} currentStartYear - 現在の開始年
 * @param {number} currentEndYear - 現在の終了年
 */
export function initializeYearSelects(currentStartYear, currentEndYear) {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    
    if (!startYearSelect || !endYearSelect) return;
    
    // 選択肢を生成（新しい年から古い年の順）
    for (let year = MAX_YEAR; year >= MIN_YEAR; year--) {
        const startOption = document.createElement('option');
        startOption.value = year;
        startOption.textContent = `${year}年`;
        startYearSelect.appendChild(startOption);
        
        const endOption = document.createElement('option');
        endOption.value = year;
        endOption.textContent = `${year}年`;
        endYearSelect.appendChild(endOption);
    }
    
    // 初期値を設定
    startYearSelect.value = currentStartYear;
    endYearSelect.value = currentEndYear;
    
    // 変更イベントリスナーを追加
    startYearSelect.addEventListener('change', onStartYearChange);
    endYearSelect.addEventListener('change', onEndYearChange);
    
    // 初期状態で選択肢を更新
    updateYearSelectOptions();
}

/**
 * 開始年が変更された時の処理
 */
export function onStartYearChange() {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    
    const startYear = parseInt(startYearSelect.value);
    const endYear = parseInt(endYearSelect.value);
    
    // 開始年 > 終了年 の場合、終了年を開始年に合わせる
    if (startYear > endYear) {
        endYearSelect.value = startYear;
    }
    
    updateYearSelectOptions();
}

/**
 * 終了年が変更された時の処理
 */
export function onEndYearChange() {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    
    const startYear = parseInt(startYearSelect.value);
    const endYear = parseInt(endYearSelect.value);
    
    // 開始年 > 終了年 の場合、開始年を終了年に合わせる
    if (startYear > endYear) {
        startYearSelect.value = endYear;
    }
    
    updateYearSelectOptions();
}

/**
 * セレクトボックスの選択肢を更新（有効な年のみ選択可能に）
 */
export function updateYearSelectOptions() {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    
    if (!startYearSelect || !endYearSelect) return;
    
    const startYear = parseInt(startYearSelect.value);
    const endYear = parseInt(endYearSelect.value);
    
    // 開始年の選択肢を更新（終了年以前のみ有効）
    Array.from(startYearSelect.options).forEach(option => {
        const year = parseInt(option.value);
        option.disabled = year > endYear;
    });
    
    // 終了年の選択肢を更新（開始年以降のみ有効）
    Array.from(endYearSelect.options).forEach(option => {
        const year = parseInt(option.value);
        option.disabled = year < startYear;
    });
}

/**
 * スライダーと年選択の同期機能を初期化
 * @param {number} tempStartYear - 一時的な開始年
 * @param {number} tempEndYear - 一時的な終了年
 */
export function initializeYearSliders(tempStartYear, tempEndYear) {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    const startYearSlider = document.getElementById('startYearSlider');
    const endYearSlider = document.getElementById('endYearSlider');
    
    if (!startYearSelect || !endYearSelect || !startYearSlider || !endYearSlider) return;
    
    // スライダーの範囲を設定
    startYearSlider.min = MIN_YEAR;
    startYearSlider.max = MAX_YEAR;
    endYearSlider.min = MIN_YEAR;
    endYearSlider.max = MAX_YEAR;
    
    // 初期値を設定
    startYearSlider.value = tempStartYear;
    endYearSlider.value = tempEndYear;
    
    // 開始年スライダーのイベントリスナー
    startYearSlider.addEventListener('input', function() {
        const year = parseInt(this.value);
        startYearSelect.value = year;
        // 終了年より後にならないように制限
        if (year > parseInt(endYearSelect.value)) {
            endYearSelect.value = year;
            endYearSlider.value = year;
        }
        updateYearSelectOptions();
    });
    
    // 終了年スライダーのイベントリスナー
    endYearSlider.addEventListener('input', function() {
        const year = parseInt(this.value);
        endYearSelect.value = year;
        // 開始年より前にならないように制限
        if (year < parseInt(startYearSelect.value)) {
            startYearSelect.value = year;
            startYearSlider.value = year;
        }
        updateYearSelectOptions();
    });
    
    // 開始年プルダウンのイベントリスナー
    startYearSelect.addEventListener('change', function() {
        startYearSlider.value = this.value;
    });
    
    // 終了年プルダウンのイベントリスナー
    endYearSelect.addEventListener('change', function() {
        endYearSlider.value = this.value;
    });
}

/**
 * 年の増減ボタンの機能を初期化
 */
export function initializeYearButtons() {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    const startYearSlider = document.getElementById('startYearSlider');
    const endYearSlider = document.getElementById('endYearSlider');
    
    const startYearMinus = document.getElementById('startYearMinus');
    const startYearPlus = document.getElementById('startYearPlus');
    const endYearMinus = document.getElementById('endYearMinus');
    const endYearPlus = document.getElementById('endYearPlus');
    
    if (!startYearSelect || !endYearSelect || !startYearSlider || !endYearSlider) return;
    if (!startYearMinus || !startYearPlus || !endYearMinus || !endYearPlus) return;
    
    // 長押し用のID管理
    let intervalId = null;
    let timeoutId = null;
    let isPressed = false;
    
    // 年を変更する共通関数
    function changeYear(selectElement, sliderElement, delta) {
        let currentYear = parseInt(selectElement.value);
        let newYear = currentYear + delta;
        
        // 範囲チェック
        if (newYear < MIN_YEAR) newYear = MIN_YEAR;
        if (newYear > MAX_YEAR) newYear = MAX_YEAR;
        
        // 開始年と終了年の関係チェック
        if (selectElement === startYearSelect) {
            const endYear = parseInt(endYearSelect.value);
            if (delta > 0 && newYear > endYear) {
                endYearSelect.value = newYear;
                endYearSlider.value = newYear;
            } else if (newYear > endYear) {
                newYear = endYear;
            }
        } else if (selectElement === endYearSelect) {
            const startYear = parseInt(startYearSelect.value);
            if (delta < 0 && newYear < startYear) {
                startYearSelect.value = newYear;
                startYearSlider.value = newYear;
            } else if (newYear < startYear) {
                newYear = startYear;
            }
        }
        
        // 値を更新
        selectElement.value = newYear;
        sliderElement.value = newYear;
        updateYearSelectOptions();
    }
    
    // 長押し開始
    function startContinuousChange(selectElement, sliderElement, delta) {
        isPressed = true;
        changeYear(selectElement, sliderElement, delta);
        
        timeoutId = setTimeout(() => {
            if (isPressed) {
                intervalId = setInterval(() => {
                    changeYear(selectElement, sliderElement, delta);
                }, 100);
            }
        }, 500);
    }
    
    // 長押し停止
    function stopContinuousChange() {
        isPressed = false;
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }
    
    // イベントリスナーを追加
    startYearMinus.addEventListener('mousedown', () => startContinuousChange(startYearSelect, startYearSlider, -1));
    startYearMinus.addEventListener('mouseup', stopContinuousChange);
    startYearMinus.addEventListener('mouseleave', stopContinuousChange);
    startYearMinus.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startContinuousChange(startYearSelect, startYearSlider, -1);
    });
    startYearMinus.addEventListener('touchend', stopContinuousChange);
    startYearMinus.addEventListener('touchcancel', stopContinuousChange);
    
    startYearPlus.addEventListener('mousedown', () => startContinuousChange(startYearSelect, startYearSlider, 1));
    startYearPlus.addEventListener('mouseup', stopContinuousChange);
    startYearPlus.addEventListener('mouseleave', stopContinuousChange);
    startYearPlus.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startContinuousChange(startYearSelect, startYearSlider, 1);
    });
    startYearPlus.addEventListener('touchend', stopContinuousChange);
    startYearPlus.addEventListener('touchcancel', stopContinuousChange);
    
    endYearMinus.addEventListener('mousedown', () => startContinuousChange(endYearSelect, endYearSlider, -1));
    endYearMinus.addEventListener('mouseup', stopContinuousChange);
    endYearMinus.addEventListener('mouseleave', stopContinuousChange);
    endYearMinus.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startContinuousChange(endYearSelect, endYearSlider, -1);
    });
    endYearMinus.addEventListener('touchend', stopContinuousChange);
    endYearMinus.addEventListener('touchcancel', stopContinuousChange);
    
    endYearPlus.addEventListener('mousedown', () => startContinuousChange(endYearSelect, endYearSlider, 1));
    endYearPlus.addEventListener('mouseup', stopContinuousChange);
    endYearPlus.addEventListener('mouseleave', stopContinuousChange);
    endYearPlus.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startContinuousChange(endYearSelect, endYearSlider, 1);
    });
    endYearPlus.addEventListener('touchend', stopContinuousChange);
    endYearPlus.addEventListener('touchcancel', stopContinuousChange);
}

/**
 * 全期間ボタンの処理
 */
export function setAllPeriod() {
    const startYearSelect = document.getElementById('startYearSelect');
    const endYearSelect = document.getElementById('endYearSelect');
    const startYearSlider = document.getElementById('startYearSlider');
    const endYearSlider = document.getElementById('endYearSlider');
    
    if (!startYearSelect || !endYearSelect || !startYearSlider || !endYearSlider) return;
    
    // 全期間を設定
    startYearSelect.value = MIN_YEAR;
    endYearSelect.value = MAX_YEAR;
    startYearSlider.value = MIN_YEAR;
    endYearSlider.value = MAX_YEAR;
    
    // 選択肢を更新
    updateYearSelectOptions();
    
    console.log('全期間設定:', MIN_YEAR, '〜', MAX_YEAR);
}

/**
 * 年範囲表示を更新
 * @param {number} startYear - 開始年
 * @param {number} endYear - 終了年
 */
export function updateYearRangeDisplay(startYear, endYear) {
    const yearRangeDisplay = document.getElementById('year-range-display');
    if (yearRangeDisplay) {
        yearRangeDisplay.textContent = `表示期間: ${startYear}年 〜 ${endYear}年`;
    }
}
