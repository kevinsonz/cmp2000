/**
 * Homeページのエントリーポイント
 * 全モジュールを統合し、ページの初期化を管理
 */

import { updateCurrentYear } from '../shared/utils.js';
import { initHeaderScroll, initHeaderTitleClick, updateCompactHeaderRow2 } from '../shared/header.js';
import { fetchCSV, CSV_URLS, parseBasicInfoCSV, parseMultiCSV, parseSingleCSV } from '../shared/csv-loader.js';
import { collectAllHashTags, convertHashTagsToLinks } from '../shared/hashtag.js';
import { convertMarkdownToHTML } from '../shared/markdown.js';
import { setTabIcons, TAB_CONFIG } from './home-config.js';

import { initTabs, switchTab, generateTabLinksSection, addTabIcons } from './home-tabs.js';
import { generateCards, loadSingleFeeds } from './home-cards.js';
import { applyHashTagFilter, clearHashTagFilter } from './home-filters.js';
import { generateAbbreviationMenu, generateAboutSnsSection, generateCompactAbbreviationMenuHTML, setupCompactAbbreviationMenuEvents } from './home-abbreviation-menu.js';

// グローバルに公開（header.jsで使用するため）
window.generateCompactAbbreviationMenuHTML = generateCompactAbbreviationMenuHTML;
window.setupCompactAbbreviationMenuEvents = setupCompactAbbreviationMenuEvents;

// TAB_CONFIGをグローバルに公開（header.jsで使用するため）
window.TAB_CONFIG = TAB_CONFIG;

// basicInfoDataとsingleDataByKeyをグローバルに公開（header.jsで使用するため）
window.basicInfoData = null;
window.singleDataByKey = null;

// グローバル状態
let basicInfoData = null;
let singleDataGlobal = null;
let multiDataGlobal = null;
let singleDataByKey = {};
let allHashTags = [];
let currentFilterTag = null;
let currentTab = 'general';

/**
 * 理念セクションを更新
 * @param {Array} basicInfo - Basic Infoデータ
 */
function updatePhilosophySection(basicInfo) {
    const philosophyContent = document.getElementById('philosophy-content');
    if (!philosophyContent) return;
    
    const portalInfo = basicInfo.find(item => item.key === 'cmpOfficialPortal');
    
    if (portalInfo && portalInfo.comment) {
        philosophyContent.innerHTML = portalInfo.comment;
    } else {
        philosophyContent.innerHTML = `
            <strong>Creation Meets Peace</strong>＝『創造』と『平和』の出会い。<br>
            争いの絶えない世の中において、平和は自然に生まれるモノではなく、ヒトの創造によって実現されるモノである、という理念。
        `;
    }
}

/**
 * カード生成のラッパー関数
 * @param {string|null} filterTag - フィルタタグ
 */
function generateCardsWrapper(filterTag = null) {
    console.log('=== generateCardsWrapper called ===');
    console.log('filterTag:', filterTag);
    
    // singleDataByKeyを構築
    singleDataByKey = {};
    if (singleDataGlobal) {
        singleDataGlobal.forEach(item => {
            if (!singleDataByKey[item.key]) {
                singleDataByKey[item.key] = [];
            }
            singleDataByKey[item.key].push(item);
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
        
        console.log('=== singleDataByKey 構築完了 ===');
        console.log('全キー:', Object.keys(singleDataByKey));
        console.log('キー数:', Object.keys(singleDataByKey).length);
        
        // グローバルに公開（header.jsで使用するため）
        window.singleDataByKey = singleDataByKey;
        
        // ryoのキーを確認
        const ryoKeys = Object.keys(singleDataByKey).filter(key => key.startsWith('ryo'));
        console.log('ryoで始まるキー:', ryoKeys);
        ryoKeys.forEach(key => {
            console.log(`  ${key}: ${singleDataByKey[key].length}件`);
        });
    }
    
    const result = generateCards(
        basicInfoData,
        singleDataGlobal,
        filterTag,
        allHashTags,
        (tag) => handleHashTagClick(tag),
        (singleData, keys) => loadSingleFeeds(singleData, keys),
        () => generateTabLinksWrapper()
    );
    
    if (result) {
        currentTab = result;
        console.log('Cards generated - currentTab set to:', currentTab);
    } else {
        console.log('Cards generated - currentTab unchanged');
    }
    
    // 各タブの3段目メニューとAbout/SNSセクションを生成
    if (!filterTag) {
        console.log('=== Generating abbreviation menus and About/SNS sections ===');
        console.log('singleDataByKey keys:', Object.keys(singleDataByKey).length);
        ['common', 'kevin', 'ryo'].forEach(tabName => {
            console.log(`Generating abbreviation menu for: ${tabName}`);
            generateAbbreviationMenu(tabName, basicInfoData, singleDataByKey);
            console.log(`Generating About/SNS section for: ${tabName}`);
            generateAboutSnsSection(tabName, basicInfoData);
        });
        console.log('=== Finished generating abbreviation menus and About/SNS sections ===');
    }
}

/**
 * タブリンクセクション生成のラッパー関数
 */
function generateTabLinksWrapper() {
    generateTabLinksSection(basicInfoData, singleDataGlobal, (tabName) => switchTabWrapper(tabName));
}

/**
 * タブ切り替えのラッパー関数
 * @param {string} tabName - タブ名
 */
function switchTabWrapper(tabName) {
    console.log('=== switchTabWrapper called with:', tabName, '===');
    currentTab = switchTab(
        tabName,
        currentFilterTag,
        () => clearHashTagFilterWrapper()
    );
    console.log('=== switchTabWrapper completed - currentTab:', currentTab, '===');
    
    // コンパクトヘッダーの2行目を更新
    updateCompactHeaderRow2(currentTab);
}

/**
 * ハッシュタグクリックのハンドラ
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
        const result = applyHashTagFilter(
            tag,
            currentTab,
            (filterTag) => generateCardsWrapper(filterTag),
            () => clearHashTagFilterWrapper()
        );
        currentTab = result.currentTab;
        currentFilterTag = result.currentFilterTag;
        console.log('Filter applied - currentTab:', currentTab, 'currentFilterTag:', currentFilterTag);
    }
}

/**
 * フィルタクリアのラッパー関数
 */
function clearHashTagFilterWrapper() {
    console.log('=== clearHashTagFilterWrapper called ===');
    console.log('Before clear - currentFilterTag:', currentFilterTag);
    
    // 先にcurrentFilterTagをnullに設定
    currentFilterTag = null;
    console.log('Set currentFilterTag to null');
    
    const result = clearHashTagFilter(
        (filterTag) => generateCardsWrapper(filterTag),
        (tabName) => switchTabWrapper(tabName)
    );
    currentTab = result.currentTab;
    // currentFilterTagは既にnullに設定済み
    
    console.log('After clear - currentTab:', currentTab, 'currentFilterTag:', currentFilterTag);
}

/**
 * ページ初期化処理
 */
async function initializePage() {
    console.log('=== ページ初期化開始 ===');
    
    // ヘッダーとフッターの初期化
    initHeaderScroll();
    initHeaderTitleClick();
    updateCurrentYear();
    
    // タブの初期化
    initTabs((tabName) => switchTabWrapper(tabName));
    
    try {
        // CSVデータを読み込み
        console.log('=== CSV読み込み開始 ===');
        const [basicCsvText, multiCsvText, singleCsvText] = await Promise.all([
            fetchCSV(CSV_URLS.BASIC_INFO),
            fetchCSV(CSV_URLS.MULTI).catch(err => {
                console.warn('MULTI_CSV読み込み失敗:', err);
                return '';
            }),
            fetchCSV(CSV_URLS.SINGLE)
        ]);
        
        console.log('=== 公開CSV読み込み成功 ===');
        console.log('BASIC_INFO_CSV文字数:', basicCsvText.length);
        console.log('MULTI_CSV文字数:', multiCsvText.length);
        console.log('SINGLE_CSV文字数:', singleCsvText.length);
        
        // CSVをパース
        const basicInfo = parseBasicInfoCSV(basicCsvText);
        const multiData = multiCsvText ? parseMultiCSV(multiCsvText) : [];
        const singleData = parseSingleCSV(singleCsvText);
        
        console.log('パース後のsingleData件数:', singleData.length);
        const xData = singleData.filter(item => item.key && (item.key.includes('MainX') || item.key.includes('SubX')));
        console.log('X関連データ件数:', xData.length);
        
        // タブアイコンを設定
        setTabIcons(basicInfo);
        
        // タブボタンにアイコンを追加
        addTabIcons();
        
        // グローバル変数に保存
        basicInfoData = basicInfo;
        multiDataGlobal = multiData;
        singleDataGlobal = singleData;
        allHashTags = collectAllHashTags(basicInfo);
        
        // グローバルに公開（header.jsで使用するため）
        window.basicInfoData = basicInfo;
        
        // UIを更新
        updatePhilosophySection(basicInfo);
        generateCardsWrapper(null);
        
        // URLハッシュをチェックしてタブを切り替え
        const hash = window.location.hash.substring(1); // #を除去
        if (hash && ['common', 'kevin', 'ryo'].includes(hash)) {
            console.log('URLハッシュ検出:', hash);
            // DOMの更新を待ってからタブを切り替え
            setTimeout(() => {
                switchTabWrapper(hash);
            }, 100);
        }
        
        console.log('=== ページ初期化完了 ===');
    } catch (error) {
        console.error('公開CSVの読み込みに失敗しました:', error);
    }
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', initializePage);

// コンパクトヘッダーのタブボタン用のカスタムイベントリスナー
document.addEventListener('tabSwitch', (e) => {
    const targetTab = e.detail.tab;
    console.log('tabSwitch event received:', targetTab);
    switchTabWrapper(targetTab);
});
