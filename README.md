# ピアノ・ステップ 🎹

2〜3歳向けピアノ学習アプリ。画面ガイドを見ながら、ドレミを楽しく覚えよう！

## 機能

- **1音チャレンジ**：五線譜に表示された音を弾いて「ひけたよ！」ボタンを押す
- 2歳向け：ド・レ・ミの3ステージ
- 3歳向け：準備中
- Web Audio API による効果音（音符の音・クリア音）
- LocalStorage で進捗を保存（ブラウザを閉じても記録が残る）

## ローカルでの起動方法

**⚠️ `index.html` をダブルクリックで開くと動きません。**

`fetch()` による JSON 読み込みに HTTP サーバーが必要なため、以下のいずれかの方法で起動してください。

### 方法1：VS Code Live Server 拡張
1. VS Code で `piano/` フォルダを開く
2. `index.html` を右クリック → 「Open with Live Server」

### 方法2：live-server（npm）
```bash
npm install -g live-server
cd piano
live-server
```

### 方法3：Python 簡易サーバー
```bash
cd piano
python -m http.server 8080
# ブラウザで http://localhost:8080 を開く
```

## GitHub Pages での公開

```bash
git add .
git commit -m "add piano step app"
git push origin main
```

リポジトリの Settings → Pages → Source: `main` ブランチ を選択すると自動公開されます。

## ファイル構成

```
piano/
  index.html            # エントリーポイント
  styles/
    main.css            # 全体スタイル
    components.css      # 各コンポーネント
  scripts/
    app.js              # 画面遷移・状態管理
    data.js             # JSONデータ fetch
    render.js           # DOM描画・五線譜SVG
    storage.js          # localStorage 操作
    audio.js            # Web Audio API 効果音
  data/
    age2.json           # 2歳向けステージ（ド・レ・ミ）
    age3.json           # 3歳向けステージ（準備中）
  README.md
```

## 動作確認チェックリスト

- [ ] ホーム → 年齢選択（2歳）→ 1音チャレンジ → ドのプレイ画面が表示される
- [ ] 五線譜にドの音符が表示される
- [ ] 「ひけたよ！」を押すとクリア画面に遷移する
- [ ] クリア音が鳴る
- [ ] 次へを押すとレのプレイ画面に遷移する
- [ ] ミまでクリア後、全クリア画面になる
- [ ] ブラウザを再読み込みしてもクリア済みステージが保持される

## 技術スタック

- バニラ JavaScript（ES Modules）
- SVG による五線譜描画
- Web Audio API による効果音
- localStorage による進捗保存
- 外部ライブラリ・ビルドツール不要
