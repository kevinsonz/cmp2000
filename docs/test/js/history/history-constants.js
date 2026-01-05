/**
 * Historyページの定数定義
 * カテゴリ、年範囲、CSV URLなど
 */

// カテゴリの定義（表示順）
export const CATEGORIES = [
    '夕刊中年マカチン',
    'CMP2000',
    'けびんケビンソン',
    'イイダリョウ',
    'その他'
];

// カテゴリアイコンのマッピング
export const CATEGORY_ICONS = {
    '夕刊中年マカチン': '📰',
    'CMP2000': '🏠',
    'けびんケビンソン': '👤',
    'イイダリョウ': '💻',
    'その他': '📌'
};

// カテゴリ略称のマッピング
export const CATEGORY_ABBREVIATIONS = {
    '夕刊中年マカチン': '夕マカ',
    'CMP2000': 'CMP',
    'けびんケビンソン': 'けびん',
    'イイダリョウ': 'リョウ',
    'その他': 'etc.'
};

// 年の範囲設定
export const MIN_YEAR = 1998;
export const MAX_YEAR = new Date().getFullYear();
export const DEFAULT_YEAR_RANGE = 10; // デフォルトで直近10年

// CSV URL
export const CSV_URLS = {
    BASIC_INFO: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=0&single=true&output=csv',
    HISTORY: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=2103644132&single=true&output=csv'
};

/**
 * 和暦を取得
 * @param {number} year - 西暦年
 * @returns {string} 和暦表記
 */
export function getJapaneseEra(year) {
    if (year >= 2019) {
        return `令和${year - 2018}年`;
    } else if (year >= 1989) {
        return `平成${year - 1988}年`;
    } else if (year >= 1926) {
        return `昭和${year - 1925}年`;
    } else if (year >= 1912) {
        return `大正${year - 1911}年`;
    } else {
        return `明治${year - 1867}年`;
    }
}
