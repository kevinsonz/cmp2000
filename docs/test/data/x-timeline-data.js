// ========================
// Xタイムライン テストデータ
// ========================
// ローカル環境でXタイムラインの代わりに表示するダミーデータ

const X_TIMELINE_TEST_DATA = {
    // ユニットタブ用（@epumes）
    'cmpMainX': `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.95rem;">@epumes</strong>
                    <span style="color: #657786; margin-left: 0.5rem; font-size: 0.85rem;">· 2時間前</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                    新しいプロジェクトを開始しました！詳細は後日お知らせします。
                </p>
            </div>
            <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.95rem;">@epumes</strong>
                    <span style="color: #657786; margin-left: 0.5rem; font-size: 0.85rem;">· 5時間前</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                    今日も一日頑張りました。明日も引き続き開発を進めます！
                </p>
            </div>
            <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.95rem;">@epumes</strong>
                    <span style="color: #657786; margin-left: 0.5rem; font-size: 0.85rem;">· 1日前</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                    CMP2000の新機能を追加中です。お楽しみに！
                </p>
            </div>
            <div style="padding: 1rem; text-align: center; color: #657786; font-size: 0.85rem;">
                <em>※ これはローカル環境用のテストデータです。<br>実際のXタイムラインを表示するには、ローカルサーバーまたはGitHub Pagesで開いてください。</em>
            </div>
        </div>
    `,
    
    // けびんタブ メインX用（@kevinsonzzz）
    'kevinMainX': `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.95rem;">@kevinsonzzz</strong>
                    <span style="color: #657786; margin-left: 0.5rem; font-size: 0.85rem;">· 1時間前</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                    データ分析の新しい手法について研究中です。興味深い結果が出ています。
                </p>
            </div>
            <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.95rem;">@kevinsonzzz</strong>
                    <span style="color: #657786; margin-left: 0.5rem; font-size: 0.85rem;">· 3時間前</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                    機械学習モデルのトレーニングが完了しました。精度が向上しています！
                </p>
            </div>
            <div style="padding: 1rem; text-align: center; color: #657786; font-size: 0.85rem;">
                <em>※ これはローカル環境用のテストデータです。</em>
            </div>
        </div>
    `,
    
    // けびんタブ サブX用（@kevinsonzz）
    'kevinSubX': `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.95rem;">@kevinsonzz</strong>
                    <span style="color: #657786; margin-left: 0.5rem; font-size: 0.85rem;">· 30分前</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                    今日のランチは美味しかった！写真をアップしました。
                </p>
            </div>
            <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.95rem;">@kevinsonzz</strong>
                    <span style="color: #657786; margin-left: 0.5rem; font-size: 0.85rem;">· 2時間前</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                    週末の予定を立て中。どこか出かけたいな。
                </p>
            </div>
            <div style="padding: 1rem; text-align: center; color: #657786; font-size: 0.85rem;">
                <em>※ これはローカル環境用のテストデータです。</em>
            </div>
        </div>
    `,
    
    // リョウタブ メインX用（@idr_zz）
    'ryoMainX': `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.95rem;">@idr_zz</strong>
                    <span style="color: #657786; margin-left: 0.5rem; font-size: 0.85rem;">· 1時間前</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                    React 19の新機能を試してみました。Server Componentsが本当に便利です。
                </p>
            </div>
            <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.95rem;">@idr_zz</strong>
                    <span style="color: #657786; margin-left: 0.5rem; font-size: 0.85rem;">· 4時間前</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                    TypeScriptの型定義について記事を書きました。良かったら読んでください！
                </p>
            </div>
            <div style="padding: 1rem; text-align: center; color: #657786; font-size: 0.85rem;">
                <em>※ これはローカル環境用のテストデータです。</em>
            </div>
        </div>
    `,
    
    // リョウタブ サブX用（@idr_zzz）
    'ryoSubX': `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.95rem;">@idr_zzz</strong>
                    <span style="color: #657786; margin-left: 0.5rem; font-size: 0.85rem;">· 2時間前</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                    カメラ散歩してきました。良い写真が撮れた！
                </p>
            </div>
            <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="font-size: 0.95rem;">@idr_zzz</strong>
                    <span style="color: #657786; margin-left: 0.5rem; font-size: 0.85rem;">· 5時間前</span>
                </div>
                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4;">
                    新しい音楽プレイリストを作成しました。作業用BGMにどうぞ。
                </p>
            </div>
            <div style="padding: 1rem; text-align: center; color: #657786; font-size: 0.85rem;">
                <em>※ これはローカル環境用のテストデータです。</em>
            </div>
        </div>
    `
};
