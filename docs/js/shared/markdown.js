/**
 * Markdown変換モジュール
 * 基本的なMarkdown記法をHTMLに変換
 */

/**
 * Markdown記法をHTMLに変換
 * @param {string} text - Markdown形式のテキスト
 * @returns {string} HTML形式のテキスト
 */
export function convertMarkdownToHTML(text) {
    if (!text) return '';
    
    let html = text;
    
    // 1. **太字** → <strong>太字</strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // 2. *斜体* → <em>斜体</em>（太字の後に処理）
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // 3. [リンクテキスト](URL) → <a href="URL" target="_blank">リンクテキスト</a>
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color: #dc3545; text-decoration: none;">$1</a>');
    
    // 4. 行末の2スペース+改行 → <br>
    html = html.replace(/  \n/g, '<br>');
    html = html.replace(/  $/gm, '<br>');
    
    return html;
}
