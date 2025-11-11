// ========================
// Aboutページ用データ
// ========================
// アーカイブとファミリー情報を定義

const ABOUT_DATA = {
    ARCHIVE_CSV: `
type,key,category,siteTitle,hashTag,siteUrl,logo
archive,kevinResearch,けびんケビンソン,（廃）自由研究wiki,#研究テーマ,https://w.atwiki.jp/kevinson,./logos/atwiki.png
archive,ryoTextHobby2,イイダリョウ,（旧）文章系（趣味関係）,#文章 #趣味,https://note.com/idr_zzz,./logos/note-logo.svg
archive,ryoPicture2,イイダリョウ,（旧）画像系コンテンツ,#写真 #イラスト,https://jp.pinterest.com/idr_zz,./logos/pinterest.svg
archive,ryoMusicOriginal,イイダリョウ,（止）音楽系（オリジナル）,#音楽 #オリジナル,https://soundcloud.com/idr_zz,./logos/soundcloud.png
`,

    FAMILY_CSV: `
type,category,name,comment,hashTag
family,スタッフ,世夢平太郎,私、CMP事務局、事務局員の世夢平太郎（せむぺたろう）と申します。主な業務は、CMPファミリーの作品の公開、管理です。皆様の応援が、ファミリーのモチベーションにつながります。今後共、CMP（珍萬企画）をよろしくお願い申し上げます。,#共通
family,スタッフ,世夢平次郎,俺、ペイジロウ！兄ちゃんのアシストやってるんで、ヨロシクな！,#共通
family,スタッフ,世夢平美,事務局員,#共通
family,スタッフ,世夢平子,事務局員,#共通
family,ファミリー,edak,珍萬企画（CMP）創始者。漫画を中心に広く浅く手掛ける。,#漫画 #イラスト #打ち込み
family,ファミリー,土蜘蛛,趣味はドラムとCMP。日常の隙間を縫って作品を吐き出す。格闘技・AV・IV鑑賞も。個人ブログ：土メモ,#コラム #ドラム #音楽
family,ファミリー,右京之丞（うきょうのすけ）,トンネルと溶鉱炉を愛する謎の男。日本のどこかでひっそり暮らす。個人ブログ：工場心。,#インダストリアル
family,ファミリー,DJ goLow,DJ。トラックメイカー。goLow's tracksにて打ち込み作品を公開。,#ドラムンベース
family,ファミリー,ケンペイ,Webデザイナー。フラッシャー。出張スタイルにCMP向けフラッシュ作品を提供。,#Webデザイン #Flash
family,ファミリー,アフロスキー,ギタリスト。CGクリエイター。メルヘン劇場に「CGサッカー君」「GIGS」を投稿。マカマンガにゲスト参加。,#ギター #CG
family,ファミリー,kageyama,Webデザイナー。ディレクター。プロデューサー。80's Train 邦楽編に旧盤レビューを提供。,#Webデザイン #Webマガジン
family,ファミリー,noga,メルヘン系絵描き。メルヘン劇場にメルヘンな絵を提供。,#メルヘン #イラスト
family,ファミリー,みるふる,画集院edakに煙草クッキー君のアイデア提供。,#イラスト
family,ファミリー,wagg,DJ。宇宙パンダ君に漫画を提供。,#ドラムンベース #漫画
family,ファミリー,パム,最強伝説メッタシッタの原作者。,#漫画
family,ファミリー,トリコ,アップルスーパーマーケット店長。マカマンガにゲスト参加。。メルヘン劇場に「きらいなやさい」を投稿。鳥居君に写真を提供。,#漫画 #写真
family,ファミリー,ちゃんく,イラストレイター。メルヘン劇場に「スマイル半蔵とちゃんく」を投稿。,#イラスト
family,ファミリー,よつし,画集院edakとスタヂヲヂフリに「四つ子のよつし」のアイデアを提供。,#イラスト
family,ファミリー,のびた,画集院edakに「水着君」のアイデアを提供。,#イラスト
family,ファミリー,陸上部員,edak中学時代、一緒にランニングしながら、サッカー君の構成を練る。,#漫画
family,ファミリー,ひろ,FLASH職人。edakのCGI師匠。バナー工房にマカチンバナーを提供。,#CGI #イラスト
family,ファミリー,なお,画集院edakの「横島なお」のモデル。なおさん本人は「よこしま」ではありません（笑）。,#イラスト
family,ファミリー,サッチ,イヌニャーファン。鳥居君に鳥居写真を提供。,#写真
family,ファミリー,マッキー,ベーシスト。マカテクノに参加。,#音楽 #打ち込み
`
};
