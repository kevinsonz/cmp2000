// ========================
// 基本情報データ
// ========================
// サイトの基本情報を定義
// index.htmlとabout.htmlの両方で使用

const BASIC_INFO_CSV = `
key,category,siteTitle,breadcrumbs,hashTag,siteUrl,image,sub-image,logo
cmp2000,共通コンテンツ,-,CMP2000,#ポータル,https://kevinsonz.github.io/cmp2000/,./images/cmp2000-card.png,./images/cmp2000-sk.gif,./logos/GitHub_Logo.png
cmpOfficialBlog,共通コンテンツ,公式ブログ,CMP2000 > 公式ブログ,#お知らせ #全般 #旧作,https://cmp2000.hatenadiary.jp/,./images/cmp2000-card.png,./images/cmp2000-sk.gif,./logos/hatenablog-logotype.svg
cmpText,共通コンテンツ,文章系コンテンツ,CMP2000 > 文章系コンテンツ,#文字作品 #コラム,https://note.com/cmp2000/,./images/cmp2000-card.png,./images/cmp2000-sk.gif,./logos/note-logo.svg
cmpPicture,共通コンテンツ,画像系コンテンツ,CMP2000 > 画像系コンテンツ,#漫画 #イラスト #写真,https://www.instagram.com/peitaro_s,./images/cmp2000-card.png,./images/cmp2000-sk.gif,./logos/Instagram_logo.svg.png
cmpVideo,共通コンテンツ,映像系コンテンツ,CMP2000 > 映像系コンテンツ,#動画 #音楽,https://www.youtube.com/@epumes,./images/cmp2000-card.png,./images/cmp2000-sk.gif,./logos/yt_logo_rgb_light.png
cmpRepository,共通コンテンツ,リポジトリ,CMP2000 > リポジトリ,#プログラム #ドキュメント,https://github.com/kevinsonz/cmp2000/,./images/cmp2000-card.png,./images/cmp2000-sk.gif,./logos/GitHub_Logo.png
cmpEtc,共通コンテンツ,その他,CMP2000 > その他,#X(旧Twitter) #その他,#,./images/cmp2000-card.png,./images/cmp2000-sk.gif,./logos/GitHub_Logo.png
kevinBlog,けびんケビンソン,活動ブログ,けびんケビンソン > 活動ブログ,#全般 #統計関連,https://kevinson2.hateblo.jp/,./images/kevin-card.png,./images/kevin-moon.jpg,./logos/hatenablog-logotype.svg
kevinText,けびんケビンソン,文章系コンテンツ,けびんケビンソン > 文章系コンテンツ,#文字作品 #コラム,https://note.com/kevinson/,./images/kevin-card.png,./images/kevin-moon.jpg,./logos/note-logo.svg
kevinPicture,けびんケビンソン,画像系コンテンツ,けびんケビンソン > 画像系コンテンツ,#漫画 #イラスト #写真,https://www.instagram.com/kevinsonzz,./images/kevin-card.png,./images/kevin-moon.jpg,./logos/Instagram_logo.svg.png
kevinVideo,けびんケビンソン,映像系コンテンツ,けびんケビンソン > 映像系コンテンツ,#動画 #音楽,https://www.youtube.com/@kevinvinvinson,./images/kevin-card.png,./images/kevin-moon.jpg,./logos/yt_logo_rgb_light.png
kevinRepository,けびんケビンソン,リポジトリ,けびんケビンソン > リポジトリ,#プログラム #ドキュメント,https://github.com/kevinsonz/,./images/kevin-card.png,./images/kevin-moon.jpg,./logos/GitHub_Logo.png
kevinEtc,けびんケビンソン,その他,けびんケビンソン > その他,#X(旧Twitter) #その他,#,./images/kevin-card.png,./images/kevin-moon.jpg,./logos/GitHub_Logo.png
ryoBlogTech,イイダリョウ,技術系ブログ,イイダリョウ > 技術系ブログ,#技術系 #活動,https://www.i-ryo.com/,./images/ryo-card.jpg,./images/ryo-tech.jpg,./logos/hatenablog-logotype.svg
ryoSummaryTech,イイダリョウ,技術系まとめ,イイダリョウ > 技術系まとめ,#技術系 #まとめ,https://qiita.com/i-ryo/,./images/ryo-card.jpg,./images/ryo-tech.jpg,./logos/qiita-logo-background-color.png
ryoTextCareer,イイダリョウ,文章系（キャリア関係）,イイダリョウ > 文章系（キャリア関係）,#文章 #キャリア,https://note.com/idr_zz/,./images/ryo-card.jpg,./images/ryo-tech.jpg,./logos/note-logo.svg
ryoTextHobby,イイダリョウ,文章系（趣味関係）,イイダリョウ > 文章系（趣味関係）,#文章 #趣味,https://idr-zz.hatenablog.jp/,./images/ryo-card.jpg,./images/ryo-private.jpg,./logos/hatenablog-logotype.svg
ryoPicture,イイダリョウ,画像系コンテンツ,イイダリョウ > 画像系コンテンツ,#写真 #イラスト,https://www.instagram.com/idr_zz/,./images/ryo-card.jpg,./images/ryo-private.jpg,./logos/Instagram_logo.svg.png
ryoVideoTech,イイダリョウ,映像系（技術関係）,イイダリョウ > 映像系（技術関係）,#動画 #技術系,https://www.youtube.com/@idr_zz,./images/ryo-card.jpg,./images/ryo-tech.jpg,./logos/yt_logo_rgb_light.png
ryoVideoHobby,イイダリョウ,映像系（趣味関係）,イイダリョウ > 映像系（趣味関係）,#動画 #趣味,https://www.youtube.com/@idr_zzz,./images/ryo-card.jpg,./images/ryo-private.jpg,./logos/yt_logo_rgb_light.png
ryoMusicList,イイダリョウ,音楽系（プレイリスト）,イイダリョウ > 音楽系（プレイリスト）,#音楽 #プレイリスト,https://music.youtube.com/channel/UCps-rhJpt3fbOuWokQAAHIg,./images/ryo-card.jpg,./images/ryo-private.jpg,./logos/YouTube_Music_logo.svg.png
ryoRepository,イイダリョウ,リポジトリ,イイダリョウ > リポジトリ,#プログラム #ドキュメント,https://github.com/ryo-i/,./images/ryo-card.jpg,./images/ryo-tech.jpg,./logos/GitHub_Logo.png
ryoEtc,イイダリョウ,その他,イイダリョウ > その他,#X(旧Twitter) #その他,#,./images/ryo-card.jpg,./images/ryo-tech.jpg,./logos/GitHub_Logo.png
`;
