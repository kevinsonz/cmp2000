/**
 * Homeページ設定モジュール
 * 定数と設定値を管理
 */

// singleタブでの最大表示件数
export const SINGLE_MAX_LENGTH = 10;

// NEW!!バッジを表示する日数
export const NEW_BADGE_DAYS = 30;

// タブ設定
export const TAB_CONFIG = {
    general: {
        name: 'general',
        displayName: '総合',
        color: '#6c757d'
    },
    common: {
        name: 'common',
        displayName: 'ユニット',
        color: '#dc3545'
    },
    kevin: {
        name: 'kevin',
        displayName: 'けびん',
        color: '#198754'
    },
    ryo: {
        name: 'ryo',
        displayName: 'リョウ',
        color: '#8b4513'
    },
    filter: {
        name: 'filter',
        displayName: 'フィルタ',
        color: '#dc3545'
    }
};

// カテゴリー名のマッピング
export const CATEGORY_NAMES = {
    'Blog': 'ブログ',
    'Tech': '技術記事',
    'X': 'X (Twitter)',
    'Social': 'SNS',
    'Project': 'プロジェクト',
    'Other': 'その他'
};

// アイコンマッピング
export const CATEGORY_ICONS = {
    'Blog': '📝',
    'Tech': '💻',
    'X': '🐦',
    'Social': '📱',
    'Project': '🚀',
    'Other': '📌'
};

/**
 * 基本情報CSVからタブアイコンを設定
 * @param {Array} basicInfoData - 基本情報データ
 */
export function setTabIcons(basicInfoData) {
    if (!basicInfoData) return;
    
    // cmp2000のsub-image
    const cmp2000 = basicInfoData.find(item => item.key === 'cmp2000');
    if (cmp2000 && cmp2000.subImage) {
        TAB_CONFIG.common.icon = cmp2000.subImage;
    }
    
    // kevinKevinsonのsub-image
    const kevinKevinson = basicInfoData.find(item => item.key === 'kevinKevinson');
    if (kevinKevinson && kevinKevinson.subImage) {
        TAB_CONFIG.kevin.icon = kevinKevinson.subImage;
    }
    
    // ryoIidaのsub-image
    const ryoIida = basicInfoData.find(item => item.key === 'ryoIida');
    if (ryoIida && ryoIida.subImage) {
        TAB_CONFIG.ryo.icon = ryoIida.subImage;
    }
    
    console.log('Tab icons set:', {
        common: TAB_CONFIG.common.icon,
        kevin: TAB_CONFIG.kevin.icon,
        ryo: TAB_CONFIG.ryo.icon
    });
}