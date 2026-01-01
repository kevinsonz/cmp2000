/**
 * CSV読み込みモジュール
 * Google SheetsからCSVを取得してパースする
 */

import { convertMarkdownToHTML } from './markdown.js';

// 公開スプレッドシートのCSV URL
export const CSV_URLS = {
    BASIC_INFO: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=0&single=true&output=csv',
    MULTI: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=195059601&single=true&output=csv',
    SINGLE: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=900915820&single=true&output=csv'
};

/**
 * CSVをフェッチ
 * @param {string} url - CSV URL
 * @returns {Promise<string>} CSV テキスト
 */
export async function fetchCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error('CSV読み込みエラー:', error);
        throw error;
    }
}

/**
 * Basic Info CSVをパース
 * @param {string} csvText - CSV テキスト
 * @returns {Array} パース済みデータ
 */
export function parseBasicInfoCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const keyIndex = headers.indexOf('key');
    const tabIdIndex = headers.indexOf('tabId');
    const tabIndex = headers.indexOf('tab');
    const categoryIndex = headers.indexOf('category');
    const summaryIndex = headers.indexOf('summary');
    const siteTitleIndex = headers.indexOf('siteTitle');
    const hashTagIndex = headers.indexOf('hashTag');
    const siteUrlIndex = headers.indexOf('siteUrl');
    const imageIndex = headers.indexOf('image');
    const subImageIndex = headers.indexOf('sub-image');
    const logoIndex = headers.indexOf('logo');
    const commentIndex = headers.indexOf('comment');
    const cardDateIndex = headers.indexOf('cardDate');
    const propertyIndex = headers.indexOf('property');
    const abbreviationIndex = headers.indexOf('abbreviation');
    const orderIndex = headers.indexOf('order');
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        // カンマ区切りの解析（コメント内のカンマを考慮）
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                insideQuotes = !insideQuotes;
                // 引用符は値に含めない
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        
        if (values[keyIndex] && values[categoryIndex]) {
            const rawComment = commentIndex >= 0 ? (values[commentIndex] || '') : '';
            
            items.push({
                key: values[keyIndex],
                tabId: values[tabIdIndex] || '',
                tab: values[tabIndex] || '',
                category: values[categoryIndex],
                summary: values[summaryIndex] || '',
                siteTitle: values[siteTitleIndex] || '',
                hashTag: values[hashTagIndex] || '',
                siteUrl: values[siteUrlIndex] || '',
                image: values[imageIndex] || '',
                subImage: values[subImageIndex] || '',
                logo: values[logoIndex] || '',
                comment: convertMarkdownToHTML(rawComment),
                cardDate: cardDateIndex >= 0 ? (values[cardDateIndex] || '') : '',
                property: propertyIndex >= 0 ? (values[propertyIndex] || '') : '',
                abbreviation: abbreviationIndex >= 0 ? (values[abbreviationIndex] || '') : '',
                order: orderIndex >= 0 ? (values[orderIndex] || '') : ''
            });
        }
    }
    
    return items;
}

/**
 * Multi CSVをパース
 * @param {string} csvText - CSV テキスト
 * @returns {Array} パース済みデータ
 */
export function parseMultiCSV(csvText) {
    if (!csvText || csvText.trim() === '') {
        console.warn('parseMultiCSV: 空のCSVテキストが渡されました');
        return [];
    }
    
    const lines = csvText.trim().split('\n');
    if (lines.length <= 1) {
        console.warn('parseMultiCSV: CSVにデータ行がありません');
        return [];
    }
    
    console.log('parseMultiCSV: 行数:', lines.length);
    
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('parseMultiCSV: ヘッダー:', headers);
    
    const items = [];
    
    const keyIndex = headers.indexOf('key');
    const titleIndex = headers.indexOf('title');
    const linkIndex = headers.indexOf('link');
    const dateIndex = headers.indexOf('date');
    
    console.log('parseMultiCSV: dateインデックス:', dateIndex);
    
    if (keyIndex === -1 || titleIndex === -1) {
        console.warn('parseMultiCSV: 必要なカラム（key, title）が見つかりません');
        return [];
    }
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line || line.trim() === '') continue;
        
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        
        if (values[keyIndex] && values[titleIndex]) {
            // 日付形式を統一（yyyy/mm/dd → yyyy-mm-dd）
            let dateValue = values[dateIndex] || '';
            if (dateValue && dateValue.includes('/')) {
                dateValue = dateValue.replace(/\//g, '-');
            }
            
            items.push({
                key: values[keyIndex],
                title: convertMarkdownToHTML(values[titleIndex]),
                link: values[linkIndex] || '',
                date: dateValue
            });
        }
    }
    
    console.log('parseMultiCSV: パース完了。アイテム数:', items.length);
    if (items.length > 0) {
        console.log('parseMultiCSV: 最初の3件:', items.slice(0, 3));
    }
    
    return items;
}

/**
 * Single CSVをパース
 * @param {string} csvText - CSV テキスト
 * @returns {Array} パース済みデータ
 */
export function parseSingleCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const keyIndex = headers.indexOf('key');
    const titleIndex = headers.indexOf('title');
    const linkIndex = headers.indexOf('link');
    const dateIndex = headers.indexOf('date');
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        
        // クォーテーションを除去する関数
        const removeQuotes = (str) => {
            if (str && str.startsWith('"') && str.endsWith('"')) {
                return str.slice(1, -1);
            }
            return str;
        };
        
        if (values[keyIndex] && values[titleIndex]) {
            // 日付形式を統一（yyyy/mm/dd → yyyy-mm-dd）
            let dateValue = removeQuotes(values[dateIndex] || '');
            if (dateValue && dateValue.includes('/')) {
                dateValue = dateValue.replace(/\//g, '-');
            }
            
            const rawTitle = removeQuotes(values[titleIndex]);
            
            items.push({
                key: removeQuotes(values[keyIndex]),
                title: convertMarkdownToHTML(rawTitle),
                link: removeQuotes(values[linkIndex] || ''),
                date: dateValue
            });
        }
    }
    
    console.log('=== parseSingleCSV 完了 ===');
    console.log('総行数:', items.length);
    const xItems = items.filter(item => item.key && (item.key.includes('MainX') || item.key.includes('SubX')));
    console.log('X関連行数:', xItems.length);
    if (xItems.length > 0) {
        console.log('最初の3件:', xItems.slice(0, 3));
    }
    
    return items;
}

/**
 * keyを基にBasic Infoから情報を取得
 * @param {Array} basicInfoData - Basic Info データ
 * @param {string} key - 検索するkey
 * @returns {Object|null} 該当する情報またはnull
 */
export function getBasicInfoByKey(basicInfoData, key) {
    if (!basicInfoData) return null;
    return basicInfoData.find(item => item.key === key);
}