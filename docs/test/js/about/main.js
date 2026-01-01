/**
 * Aboutページのエントリーポイント
 * 全モジュールを統合し、ページの初期化を管理
 */

import { updateCurrentYear } from '../shared/utils.js';
import { initHeaderScroll, initHeaderTitleClick } from '../shared/header.js';
import { collectAllHashTags } from '../shared/hashtag.js';
import { fetchCSV, parseBasicInfoCSV } from '../shared/csv-loader.js';
import { parseArchiveCSV, parseFamilyCSV, CSV_URLS, updatePhilosophySection } from './content-loader.js';

import { 
    accordionStates, 
    updateAccordionButtonStates, 
    openAllAccordions, 
    closeAllAccordions,
    initAccordionButtons 
} from './accordion.js';

import { 
    applyHashTagFilter, 
    clearHashTagFilter, 
    showFilterUI, 
    hideFilterUI 
} from './filters.js';

import { 
    updateJumpMenu, 
    handleInitialHash 
} from './navigation.js';

import { 
    generateAboutPage, 
    generateHashTagList 
} from './content-generator.js';

// グローバル状態
let basicInfoData = [];
let archiveInfoData = [];
let familyInfoData = [];
let basicInfoCsvText = '';
let currentFilterTag = null;
let preFilterStates = null;

/**
 * ハッシュタグクリック時の処理
 * @param {string} tag - クリックされたタグ
 */
function handleHashTagClick(tag) {
    console.log('=== handleHashTagClick ===');
    console.log('Clicked tag:', tag);
    console.log('Current filter tag:', currentFilterTag);
    
    if (currentFilterTag === tag) {
        console.log('Same tag clicked - clearing filter');
        clearHashTagFilterWrapper();
    } else {
        console.log('Different tag clicked - applying filter');
        applyHashTagFilterWrapper(tag);
    }
}

/**
 * フィルタ適用のラッパー関数
 * @param {string} tag - フィルタタグ
 */
function applyHashTagFilterWrapper(tag) {
    const result = applyHashTagFilter(
        tag,
        basicInfoData,
        archiveInfoData,
        familyInfoData,
        (filterTag) => generateAboutPageWrapper(filterTag),
        (filterTag) => updateJumpMenu(filterTag, basicInfoData, archiveInfoData, familyInfoData),
        (allTags, activeTag) => generateHashTagList(allTags, activeTag, handleHashTagClick, basicInfoData, archiveInfoData, familyInfoData)
    );
    
    preFilterStates = result.preFilterStates;
    currentFilterTag = result.currentFilterTag;
    
    // フィルタUIを表示
    showFilterUI(tag, clearHashTagFilterWrapper);
}

/**
 * フィルタクリアのラッパー関数
 */
function clearHashTagFilterWrapper() {
    console.log('=== clearHashTagFilterWrapper ===');
    console.log('Before clear - currentFilterTag:', currentFilterTag);
    
    const result = clearHashTagFilter(
        preFilterStates,
        basicInfoData,
        archiveInfoData,
        familyInfoData,
        (filterTag) => generateAboutPageWrapper(filterTag),
        (filterTag) => updateJumpMenu(filterTag, basicInfoData, archiveInfoData, familyInfoData),
        (allTags, activeTag) => generateHashTagList(allTags, activeTag, handleHashTagClick, basicInfoData, archiveInfoData, familyInfoData)
    );
    
    preFilterStates = result.preFilterStates;
    currentFilterTag = result.currentFilterTag;
    
    // フィルタUIを非表示
    hideFilterUI();
    
    console.log('After clear - currentFilterTag:', currentFilterTag);
}

/**
 * ページ生成のラッパー関数
 * @param {string|null} filterTag - フィルタタグ
 */
function generateAboutPageWrapper(filterTag = null) {
    generateAboutPage(
        filterTag,
        basicInfoData,
        archiveInfoData,
        familyInfoData,
        basicInfoCsvText,
        handleHashTagClick
    );
    
    // 初回生成時のみハッシュタグ一覧を生成
    if (!filterTag && !currentFilterTag) {
        const allTags = collectAllHashTags(basicInfoData, archiveInfoData, familyInfoData);
        generateHashTagList(allTags, null, handleHashTagClick, basicInfoData, archiveInfoData, familyInfoData);
    }
}

/**
 * 全開ボタンクリック時の処理
 */
function handleOpenAllClick() {
    openAllAccordions(currentFilterTag, clearHashTagFilterWrapper);
}

/**
 * 全閉ボタンクリック時の処理
 */
function handleCloseAllClick() {
    closeAllAccordions(currentFilterTag, clearHashTagFilterWrapper);
}

/**
 * ページ初期化処理
 */
async function initializeAboutPage() {
    console.log('=== About ページ初期化開始 ===');
    
    // ヘッダーとフッターの初期化
    initHeaderScroll();
    initHeaderTitleClick();
    updateCurrentYear();
    
    // アコーディオンボタンの初期化
    initAccordionButtons(handleOpenAllClick, handleCloseAllClick);
    
    try {
        // CSVデータを読み込み
        console.log('=== CSV読み込み開始 ===');
        const [basicCsvText, archiveCsvText, familyCsvText] = await Promise.all([
            fetchCSV(CSV_URLS.BASIC_INFO),
            fetchCSV(CSV_URLS.ARCHIVE),
            fetchCSV(CSV_URLS.FAMILY)
        ]);
        
        console.log('=== 公開CSV読み込み成功 ===');
        console.log('BASIC_INFO_CSV文字数:', basicCsvText.length);
        console.log('ARCHIVE_CSV文字数:', archiveCsvText.length);
        console.log('FAMILY_CSV文字数:', familyCsvText.length);
        
        // CSVをパース
        const basicInfo = parseBasicInfoCSV(basicCsvText);
        const archiveInfo = parseArchiveCSV(archiveCsvText);
        const familyInfo = parseFamilyCSV(familyCsvText);
        
        console.log('パース後のデータ件数:');
        console.log('- basicInfo:', basicInfo.length);
        console.log('- archiveInfo:', archiveInfo.length);
        console.log('- familyInfo:', familyInfo.length);
        
        // グローバル変数に保存
        basicInfoData = basicInfo;
        archiveInfoData = archiveInfo;
        familyInfoData = familyInfo;
        basicInfoCsvText = basicCsvText;
        
        // UIを更新
        updatePhilosophySection(basicInfo);
        generateAboutPageWrapper(null);
        updateJumpMenu(null, basicInfo, archiveInfo, familyInfo);
        
        // URLハッシュをチェックしてセクションに移動
        handleInitialHash((sectionId, filterTag) => {
            // アコーディオン切り替えが必要な場合のコールバック
            updateAccordionButtonStates(filterTag);
        });
        
        console.log('=== About ページ初期化完了 ===');
    } catch (error) {
        console.error('公開CSVの読み込みに失敗しました:', error);
    }
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', initializeAboutPage);