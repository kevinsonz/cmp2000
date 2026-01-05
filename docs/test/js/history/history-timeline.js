/**
 * Historyページのタイムラインモジュール
 * 年表の生成と表示を管理
 */

import { convertMarkdownToHTML } from '../shared/markdown.js';

/**
 * History CSVをパース
 */
export function parseHistoryCSV(csvText) {
    console.log('[timeline] === parseHistoryCSV 開始 ===');
    
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log('[timeline] ヘッダー配列:', headers);
    
    const items = [];
    
    // ヘッダー名を大文字・小文字両方に対応
    const yearIndex = headers.findIndex(h => h.toLowerCase() === 'year');
    const categoryIndex = headers.findIndex(h => h.toLowerCase() === 'category');
    const dateIndex = headers.findIndex(h => h.toLowerCase() === 'date');
    const keyIndex = headers.findIndex(h => h.toLowerCase() === 'key');
    const contentsIndex = headers.findIndex(h => h.toLowerCase() === 'contents');
    const linkIndex = headers.findIndex(h => h.toLowerCase() === 'link');
    
    console.log('[timeline] カラムインデックス:');
    console.log('  - year:', yearIndex);
    console.log('  - category:', categoryIndex);
    console.log('  - date:', dateIndex);
    console.log('  - key:', keyIndex);
    console.log('  - contents:', contentsIndex);
    console.log('  - link:', linkIndex);
    
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
        
        if (values[yearIndex] && values[contentsIndex]) {
            const rawContents = values[contentsIndex] || '';
            
            items.push({
                year: parseInt(values[yearIndex], 10),
                category: values[categoryIndex] || '',
                date: values[dateIndex] || '',
                key: values[keyIndex] || '',
                contents: convertMarkdownToHTML(rawContents),
                link: values[linkIndex] || ''
            });
        }
    }
    
    console.log('[timeline] === parseHistoryCSV 完了 ===');
    console.log('[timeline] 最終的なアイテム数:', items.length);
    if (items.length > 0) {
        console.log('[timeline] 最初のアイテム:', items[0]);
        console.log('[timeline] 最後のアイテム:', items[items.length - 1]);
    }
    
    return items;
}