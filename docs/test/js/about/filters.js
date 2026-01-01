/**
 * Aboutページのフィルタモジュール
 * ハッシュタグフィルタの適用・解除とUI制御
 */

import { parseHashTags, collectAllHashTags } from '../shared/hashtag.js';
import { accordionStates, preFilterStates, SECTION_INFO } from './accordion.js';

/**
 * フィルタUIを表示
 * @param {string} tag - フィルタタグ
 * @param {Function} clearCallback - フィルタ解除時のコールバック
 */
export function showFilterUI(tag, clearCallback) {
    const container = document.getElementById('filter-ui-container');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = `
        <div class="alert alert-danger d-flex justify-content-between align-items-center mb-3" role="alert">
            <span>フィルタ: <strong>${tag}</strong></span>
            <button type="button" class="btn btn-sm btn-secondary filter-clear-btn">
                フィルタ解除
            </button>
        </div>
    `;
    
    // イベントリスナーを追加
    const clearBtn = container.querySelector('.filter-clear-btn');
    if (clearBtn && clearCallback) {
        clearBtn.addEventListener('click', clearCallback);
    }
}

/**
 * フィルタUIを非表示
 */
export function hideFilterUI() {
    const container = document.getElementById('filter-ui-container');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

/**
 * ハッシュタグフィルタを適用
 * @param {string} tag - フィルタタグ
 * @param {Array} basicInfo - Basic Info データ
 * @param {Array} archiveInfo - Archive データ
 * @param {Array} familyInfo - Family データ
 * @param {Function} generateCallback - ページ生成コールバック
 * @param {Function} updateJumpMenuCallback - ジャンプメニュー更新コールバック
 * @param {Function} generateHashTagListCallback - ハッシュタグリスト生成コールバック
 * @returns {Object} 更新された状態
 */
export function applyHashTagFilter(
    tag,
    basicInfo,
    archiveInfo,
    familyInfo,
    generateCallback,
    updateJumpMenuCallback,
    generateHashTagListCallback
) {
    // 現在の開閉状態を保存
    const savedStates = { ...accordionStates };
    
    // フィルタに該当するカテゴリを特定
    const basicByCategory = {};
    basicInfo.forEach(item => {
        const tags = parseHashTags(item.hashTag);
        if (tags.includes(tag)) {
            if (!basicByCategory[item.category]) {
                basicByCategory[item.category] = true;
            }
        }
    });
    
    const archiveByCategory = {};
    archiveInfo.forEach(item => {
        const tags = parseHashTags(item.hashTag);
        if (tags.includes(tag)) {
            if (!archiveByCategory[item.category]) {
                archiveByCategory[item.category] = true;
            }
        }
    });
    
    const familyByCategory = {};
    familyInfo.forEach(item => {
        const tags = parseHashTags(item.hashTag);
        if (tags.includes(tag)) {
            if (!familyByCategory[item.category]) {
                familyByCategory[item.category] = true;
            }
        }
    });
    
    // フィルタに該当するアコーディオンのみを開く
    SECTION_INFO.forEach(info => {
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
    
    // ページを再生成
    if (generateCallback) {
        generateCallback(tag);
    }
    
    // ジャンプメニューを更新
    if (updateJumpMenuCallback) {
        updateJumpMenuCallback(tag);
    }
    
    // ハッシュタグ一覧の状態を更新
    if (generateHashTagListCallback) {
        const allTags = collectAllHashTags(basicInfo, archiveInfo, familyInfo);
        generateHashTagListCallback(allTags, tag);
    }
    
    // フィルタUI表示位置にスムーズスクロール
    setTimeout(() => {
        const filterContainer = document.getElementById('filter-ui-container');
        if (filterContainer) {
            filterContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
    
    return {
        preFilterStates: savedStates,
        currentFilterTag: tag
    };
}

/**
 * ハッシュタグフィルタをクリア
 * @param {Object|null} savedStates - 保存された開閉状態
 * @param {Array} basicInfo - Basic Info データ
 * @param {Array} archiveInfo - Archive データ
 * @param {Array} familyInfo - Family データ
 * @param {Function} generateCallback - ページ生成コールバック
 * @param {Function} updateJumpMenuCallback - ジャンプメニュー更新コールバック
 * @param {Function} generateHashTagListCallback - ハッシュタグリスト生成コールバック
 * @returns {Object} 更新された状態
 */
export function clearHashTagFilter(
    savedStates,
    basicInfo,
    archiveInfo,
    familyInfo,
    generateCallback,
    updateJumpMenuCallback,
    generateHashTagListCallback
) {
    // 開閉状態を元に戻す
    if (savedStates) {
        Object.keys(savedStates).forEach(key => {
            accordionStates[key] = savedStates[key];
        });
    }
    
    // フィルタなしでページを再生成
    if (generateCallback) {
        generateCallback(null);
    }
    
    // ジャンプメニューを更新
    if (updateJumpMenuCallback) {
        updateJumpMenuCallback(null);
    }
    
    // ハッシュタグボタンの状態を更新
    if (generateHashTagListCallback) {
        const allTags = collectAllHashTags(basicInfo, archiveInfo, familyInfo);
        generateHashTagListCallback(allTags, null);
    }
    
    // 「共通コンテンツ」セクションにスムーズスクロール
    setTimeout(() => {
        const commonSection = document.getElementById('common');
        if (commonSection) {
            commonSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
    
    return {
        preFilterStates: null,
        currentFilterTag: null
    };
}
