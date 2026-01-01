/**
 * Aboutページのコンテンツローダーモジュール
 * CSV読み込みとコンテンツ生成を管理
 */

import { convertMarkdownToHTML } from '../shared/markdown.js';

// CSV URL
export const CSV_URLS = {
    BASIC_INFO: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=0&single=true&output=csv',
    ARCHIVE: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=1835326531&single=true&output=csv',
    FAMILY: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqAyEBuht7Li1CN7ifhsp9TB4KZXTdaK9LJbfmHV7BQ76TRgZcaFlo17OlRn0sb1NGSAOuYhrAQ0T9/pub?gid=1836880976&single=true&output=csv'
};

/**
 * Archive CSVをパース
 */
export function parseArchiveCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const categoryIndex = headers.indexOf('category');
    const siteTitleIndex = headers.indexOf('siteTitle');
    const siteUrlIndex = headers.indexOf('siteUrl');
    const logoIndex = headers.indexOf('logo');
    const hashTagIndex = headers.indexOf('hashTag');
    const commentIndex = headers.indexOf('comment');
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
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
        
        if (values[categoryIndex] && values[siteTitleIndex]) {
            const rawComment = commentIndex >= 0 ? (values[commentIndex] || '') : '';
            
            items.push({
                category: values[categoryIndex],
                siteTitle: values[siteTitleIndex],
                siteUrl: values[siteUrlIndex] || '',
                logo: values[logoIndex] || '',
                hashTag: values[hashTagIndex] || '',
                comment: convertMarkdownToHTML(rawComment)
            });
        }
    }
    
    return items;
}

/**
 * Family CSVをパース
 */
export function parseFamilyCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];
    
    const categoryIndex = headers.indexOf('category');
    const nameIndex = headers.indexOf('name');
    const hashTagIndex = headers.indexOf('hashTag');
    const commentIndex = headers.indexOf('comment');
    
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
        
        if (values[categoryIndex] && values[nameIndex]) {
            items.push({
                category: values[categoryIndex],
                name: values[nameIndex],
                hashTag: values[hashTagIndex] || '',
                comment: values[commentIndex] || ''
            });
        }
    }
    
    return items;
}

/**
 * 理念セクションを更新
 */
export function updatePhilosophySection(basicInfo) {
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