/**
 * ハッシュタグ処理モジュール
 * ハッシュタグの抽出、収集、フィルタリング処理
 */

/**
 * ハッシュタグ文字列からハッシュタグを抽出
 * @param {string} hashTagString - ハッシュタグ文字列（スペース区切り）
 * @returns {Array<string>} ハッシュタグの配列
 */
export function extractHashTags(hashTagString) {
    if (!hashTagString) return [];
    return hashTagString.split(/[\s\u3000]+/).filter(tag => tag.trim().startsWith('#'));
}

/**
 * ハッシュタグ文字列をパースして配列に変換（extractHashTagsのエイリアス）
 * @param {string} hashTagString - ハッシュタグ文字列（スペース区切り）
 * @returns {Array<string>} ハッシュタグの配列
 */
export function parseHashTags(hashTagString) {
    return extractHashTags(hashTagString);
}

/**
 * 全アイテムからハッシュタグを収集（複数データソース対応）
 * @param {...Array} dataSources - データソースの配列（可変長引数）
 * @returns {Array<string>} ユニークなハッシュタグの配列（ソート済み）
 */
export function collectAllHashTags(...dataSources) {
    const tags = new Set();
    
    dataSources.forEach(dataSource => {
        if (Array.isArray(dataSource)) {
            dataSource.forEach(item => {
                if (item && item.hashTag) {
                    extractHashTags(item.hashTag).forEach(tag => tags.add(tag));
                }
            });
        }
    });
    
    return Array.from(tags).sort();
}

/**
 * ハッシュタグをクリック可能なリンクに変換
 * @param {string} hashTagString - ハッシュタグ文字列
 * @param {Function} onClickCallback - クリック時のコールバック関数
 * @returns {string} HTML文字列
 */
export function convertHashTagsToLinks(hashTagString, onClickCallback) {
    if (!hashTagString) return '';
    
    const tags = extractHashTags(hashTagString);
    return tags.map(tag => {
        const escapedTag = tag.replace(/'/g, "\\'");
        return `<a href="#" class="hashtag-link" data-tag="${escapedTag}" style="margin-right: 0.25rem; color: #dc3545; text-decoration: none;">${tag}</a>`;
    }).join(' ');
}

/**
 * ハッシュタグ一覧を表示
 * @param {string} tabName - タブ名（general, common, kevin, ryo, filter）
 * @param {Array<string>} allHashTags - 全ハッシュタグの配列
 * @param {Array} basicInfoData - Basic Info データ
 * @param {string|null} currentFilterTag - 現在のフィルタタグ
 * @param {Function} onTagClick - タグクリック時のコールバック
 */
export function renderHashTagListForTab(tabName, allHashTags, basicInfoData, currentFilterTag, onTagClick) {
    const container = document.getElementById(`hashtag-list-container-${tabName}`);
    if (!container) return;
    
    container.innerHTML = '';
    
    const tagContainer = document.createElement('div');
    tagContainer.className = 'hashtag-list';
    
    // 各ハッシュタグの出現数をカウント
    const tagCounts = {};
    allHashTags.forEach(tag => {
        tagCounts[tag] = 0;
    });
    
    if (basicInfoData) {
        basicInfoData.forEach(item => {
            if (item.hashTag) {
                const tags = extractHashTags(item.hashTag);
                tags.forEach(tag => {
                    if (tagCounts.hasOwnProperty(tag)) {
                        tagCounts[tag]++;
                    }
                });
            }
        });
    }
    
    allHashTags.forEach(tag => {
        const tagButton = document.createElement('button');
        // Aboutページと同じBootstrapボタンスタイルを使用
        tagButton.className = currentFilterTag === tag 
            ? 'btn btn-danger btn-sm me-2 mb-2' 
            : 'btn btn-outline-danger btn-sm me-2 mb-2';
        tagButton.textContent = `${tag} (${tagCounts[tag]})`;
        
        tagButton.onclick = () => onTagClick(tag);
        
        tagContainer.appendChild(tagButton);
    });
    
    container.appendChild(tagContainer);
}

/**
 * フィルタUIを表示
 * @param {string} tag - フィルタタグ
 * @param {Function} onClearCallback - クリア時のコールバック
 */
export function showFilterUI(tag, onClearCallback) {
    const container = document.getElementById('filter-ui-container');
    if (!container) return;
    
    container.style.display = 'block';
    container.innerHTML = `
        <div class="alert alert-danger d-flex justify-content-between align-items-center">
            <span>フィルタ: <strong>${tag}</strong></span>
            <button class="btn btn-sm btn-secondary filter-clear-btn">フィルタ解除</button>
        </div>
    `;
    
    // イベントリスナーを追加
    const clearBtn = container.querySelector('.filter-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', onClearCallback);
    }
}

/**
 * フィルタUIを非表示
 */
export function hideFilterUI() {
    const container = document.getElementById('filter-ui-container');
    if (!container) return;
    
    container.style.display = 'none';
    container.innerHTML = '';
}