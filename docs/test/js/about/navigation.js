/**
 * Aboutページのナビゲーションモジュール
 * ジャンプメニューとスクロール機能の管理
 */

import { parseHashTags } from '../shared/hashtag.js';
import { accordionStates, SECTION_INFO } from './accordion.js';

/**
 * ヘッダーの高さを考慮してセクションにスクロール
 * @param {string} sectionId - セクションID
 */
export function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    // 固定ヘッダーの高さを取得
    const header = document.getElementById('main-header');
    const compactHeader = header ? header.querySelector('.header-compact') : null;
    
    let targetHeaderHeight = 0;
    if (compactHeader) {
        // 一時的にコンパクトヘッダーを表示して高さを測定
        const originalDisplay = compactHeader.style.display;
        const originalPosition = compactHeader.style.position;
        const originalOpacity = compactHeader.style.opacity;
        const originalVisibility = compactHeader.style.visibility;
        
        compactHeader.style.display = 'flex';
        compactHeader.style.position = 'relative';
        compactHeader.style.opacity = '1';
        compactHeader.style.visibility = 'visible';
        
        targetHeaderHeight = compactHeader.offsetHeight;
        
        // 元に戻す
        compactHeader.style.display = originalDisplay;
        compactHeader.style.position = originalPosition;
        compactHeader.style.opacity = originalOpacity;
        compactHeader.style.visibility = originalVisibility;
    } else if (header) {
        targetHeaderHeight = header.offsetHeight;
    }
    
    // 追加の余白
    const additionalOffset = 10;
    
    // 要素の位置を取得
    const sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
    
    // スクロール先の位置を計算
    const offsetPosition = sectionTop - targetHeaderHeight - additionalOffset;
    
    // スムーズスクロール
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
    
    // スクロール完了後に位置を微調整
    setTimeout(() => {
        const currentHeader = document.getElementById('main-header');
        const currentHeaderHeight = currentHeader ? currentHeader.offsetHeight : 0;
        const currentSectionTop = section.getBoundingClientRect().top + window.pageYOffset;
        const adjustedPosition = currentSectionTop - currentHeaderHeight - additionalOffset;
        
        // 現在位置と理想位置のズレが大きい場合のみ再調整
        if (Math.abs(window.pageYOffset - adjustedPosition) > 5) {
            window.scrollTo({
                top: adjustedPosition,
                behavior: 'smooth'
            });
        }
    }, 600);
}

/**
 * ページ読み込み時にURLハッシュをチェックして該当セクションに移動
 * @param {Function} toggleCallback - アコーディオン切り替えコールバック
 */
export function handleInitialHash(toggleCallback) {
    const hash = window.location.hash.replace('#', '');
    
    // 有効なセクションIDのリスト
    const validSections = ['common', 'kevin', 'ryo', 'staff', 'family', 'specialThanks'];
    
    if (hash && validSections.includes(hash)) {
        // すべてのアコーディオンを閉じる
        SECTION_INFO.forEach(info => {
            const section = document.getElementById(info.id);
            if (!section) return;
            
            const body = section.querySelector('.accordion-body-custom');
            const icon = section.querySelector('.accordion-toggle-icon');
            
            if (body && icon) {
                body.classList.remove('show');
                icon.classList.add('collapsed');
                accordionStates[info.id] = false;
            }
        });
        
        // 該当セクションのメインアコーディオンを開く
        const targetSection = document.getElementById(hash);
        if (targetSection) {
            const body = targetSection.querySelector('.accordion-body-custom');
            const icon = targetSection.querySelector('.accordion-toggle-icon');
            
            if (body && icon) {
                body.classList.add('show');
                icon.classList.remove('collapsed');
                accordionStates[hash] = true;
            }
            
            // 少し遅延してからスクロール（DOM更新を待つ）
            setTimeout(() => {
                scrollToSection(hash);
            }, 500);
        }
    }
}

/**
 * セクションナビゲーションを更新
 * @param {string|null} filterTag - フィルタタグ
 */
export function updateSectionNavigation(filterTag = null) {
    // 必要に応じて実装
    // 現在のところ、ジャンプメニューで十分カバーされている
}

/**
 * ジャンプメニューを更新
 * @param {string|null} filterTag - フィルタタグ
 * @param {Array} basicInfo - Basic Info データ
 * @param {Array} archiveInfo - Archive データ
 * @param {Array} familyInfo - Family データ
 */
export function updateJumpMenu(filterTag, basicInfo, archiveInfo, familyInfo) {
    const dropdownMenu = document.getElementById('jumpMenuList');
    if (!dropdownMenu) return;
    
    dropdownMenu.innerHTML = '';
    
    // ヘッダーへのリンク
    const headerItem = document.createElement('li');
    const headerLink = document.createElement('a');
    headerLink.className = 'dropdown-item';
    headerLink.href = '#';
    headerLink.textContent = 'ヘッダー';
    headerLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    headerItem.appendChild(headerLink);
    dropdownMenu.appendChild(headerItem);
    
    // 区切り線
    const divider1 = document.createElement('li');
    divider1.innerHTML = '<hr class="dropdown-divider">';
    dropdownMenu.appendChild(divider1);
    
    if (filterTag) {
        // フィルタに該当するカテゴリを特定
        const matchingSections = [];
        
        // basicInfoからフィルタに該当するカテゴリを取得
        const basicByCategory = {};
        basicInfo.forEach(item => {
            const tags = parseHashTags(item.hashTag);
            if (tags.includes(filterTag)) {
                if (!basicByCategory[item.category]) {
                    basicByCategory[item.category] = true;
                }
            }
        });
        
        // archiveInfoからフィルタに該当するカテゴリを取得
        const archiveByCategory = {};
        archiveInfo.forEach(item => {
            const tags = parseHashTags(item.hashTag);
            if (tags.includes(filterTag)) {
                if (!archiveByCategory[item.category]) {
                    archiveByCategory[item.category] = true;
                }
            }
        });
        
        // familyInfoからフィルタに該当するカテゴリを取得
        const familyByCategory = {};
        familyInfo.forEach(item => {
            const tags = parseHashTags(item.hashTag);
            if (tags.includes(filterTag)) {
                if (!familyByCategory[item.category]) {
                    familyByCategory[item.category] = true;
                }
            }
        });
        
        // メインカテゴリのジャンプリンクを生成
        ['ユニット活動', 'けびんケビンソン(ソロ)', 'イイダリョウ(ソロ)'].forEach(category => {
            const hasBasic = basicByCategory[category];
            const hasArchive = archiveByCategory[category];
            
            if (hasBasic || hasArchive) {
                const sectionId = category === 'ユニット活動' ? 'common' : 
                                category === 'けびんケビンソン(ソロ)' ? 'kevin' : 'ryo';
                matchingSections.push({ id: sectionId, name: category });
            }
        });
        
        // ファミリーカテゴリのジャンプリンクを生成
        if (familyByCategory['スタッフ']) {
            matchingSections.push({ id: 'staff', name: 'スタッフ' });
        }
        if (familyByCategory['ファミリー']) {
            matchingSections.push({ id: 'family', name: 'ファミリー' });
        }
        if (familyByCategory['スペシャルサンクス']) {
            matchingSections.push({ id: 'specialThanks', name: 'スペシャルサンクス' });
        }
        
        // ジャンプリンクを生成
        matchingSections.forEach(section => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.className = 'dropdown-item';
            link.href = `#${section.id}`;
            link.textContent = section.name;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                scrollToSection(section.id);
            });
            item.appendChild(link);
            dropdownMenu.appendChild(item);
        });
    } else {
        // CSVデータから動的にセクションを生成
        const sections = [];
        
        // カテゴリごとにグループ化
        const basicByCategory = {};
        basicInfo.forEach(item => {
            if (!basicByCategory[item.category]) {
                basicByCategory[item.category] = [];
            }
            basicByCategory[item.category].push(item);
        });
        
        const archiveByCategory = {};
        archiveInfo.forEach(item => {
            if (!archiveByCategory[item.category]) {
                archiveByCategory[item.category] = [];
            }
            archiveByCategory[item.category].push(item);
        });
        
        // メインカテゴリ
        ['ユニット活動', 'けびんケビンソン(ソロ)', 'イイダリョウ(ソロ)'].forEach(category => {
            const hasBasic = basicByCategory[category] && basicByCategory[category].length > 0;
            const hasArchive = archiveByCategory[category] && archiveByCategory[category].length > 0;
            
            if (hasBasic || hasArchive) {
                const sectionId = category === 'ユニット活動' ? 'common' : 
                                category === 'けびんケビンソン(ソロ)' ? 'kevin' : 'ryo';
                sections.push({ id: sectionId, name: category });
            }
        });
        
        // ファミリー情報から各セクションを追加
        const familyByCategory = {};
        familyInfo.forEach(member => {
            if (!familyByCategory[member.category]) {
                familyByCategory[member.category] = [];
            }
            familyByCategory[member.category].push(member);
        });
        
        if (familyByCategory['スタッフ'] && familyByCategory['スタッフ'].length > 0) {
            sections.push({ id: 'staff', name: 'スタッフ' });
        }
        
        if (familyByCategory['ファミリー'] && familyByCategory['ファミリー'].length > 0) {
            sections.push({ id: 'family', name: 'ファミリー' });
        }
        
        if (familyByCategory['スペシャルサンクス'] && familyByCategory['スペシャルサンクス'].length > 0) {
            sections.push({ id: 'specialThanks', name: 'スペシャルサンクス' });
        }
        
        // セクションのリンクを生成
        sections.forEach(section => {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.className = 'dropdown-item';
            link.href = `#${section.id}`;
            link.textContent = section.name;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                scrollToSection(section.id);
            });
            item.appendChild(link);
            dropdownMenu.appendChild(item);
        });
    }
    
    // 区切り線
    const divider2 = document.createElement('li');
    divider2.innerHTML = '<hr class="dropdown-divider">';
    dropdownMenu.appendChild(divider2);
    
    // フッターへのリンク
    const footerItem = document.createElement('li');
    const footerLink = document.createElement('a');
    footerLink.className = 'dropdown-item';
    footerLink.href = '#footer';
    footerLink.textContent = 'フッター';
    footerLink.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToSection('footer');
    });
    footerItem.appendChild(footerLink);
    dropdownMenu.appendChild(footerItem);
}
