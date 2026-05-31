# CLAUDE.md

このリポジトリで Claude Code（および他の AI アシスタント）が作業する際に従うべき方針をまとめています。

## 言語に関する方針

このリポジトリでは、以下をすべて **日本語** で記述します。

- **コミットメッセージ** — タイトル・本文ともに日本語
- **README.md** — リポジトリ直下・サブディレクトリ問わず日本語
- **ドキュメント** — `docs/` 配下を含む、すべてのドキュメントファイル（Markdown など）は日本語
- **JXA スクリプトのコメント** — `scripts/` 配下の `.js` ファイル内コメント（行コメント・ブロックコメント・JSDoc 等）は日本語

### 例

コミットメッセージ:

```
feat: マウスクリックスクリプトを追加

指定座標を引数として受け取り、System Events 経由でクリックを行う
JXA スクリプトを scripts/mouse/ に追加した。
```

JXA スクリプトのコメント:

```javascript
// 現在のマウスカーソル座標を取得して返す
function getMousePosition() {
  // System Events を経由して座標を取得
  const se = Application("System Events");
  // ...
}
```

## ファイル形式の方針

JXA スクリプトは **`.js`（プレーンテキスト）** で管理します。Script Editor のバイナリ形式 `.scpt` は使いません。

理由:
- `git diff` / コードレビュー / GitHub 上での閲覧がすべて機能する
- 任意のエディタ（VS Code 等）でも編集できる
- ポートフォリオとして GitHub 上にコードが直接見える状態を維持できる

`.scpt` で受け取った既存スクリプトを追加する場合は、Script Editor で開いて「フォーマット → スクリプトをテキストとして書き出す」または手動で `.js` にコピーしてから追加してください。

## 実行・検証の方針

- **実行**: Script Editor（言語: JavaScript）で開いて `⌘R`、または `osascript -l JavaScript path/to/script.js`
- **構文チェック**: Node.js は使わない（`ObjC.import` 等の JXA 固有 API を解釈できないため）。
  代わりに以下を使う:
  ```sh
  osacompile -l JavaScript -o /tmp/check.scpt path/to/script.js
  ```
  実行はせずビルドだけ通す形で構文の妥当性を確認できる。

## 座標系の方針

マウス座標は **NSEvent 座標（左下原点）** で保持・表示する。

- 取得 API: `NSEvent.mouseLocation`（左下原点・Y は上向き）
- クリック送信 API: `CGEventCreateMouseEvent`（左上原点・Y は下向き）
- 両者で Y 軸の向きが異なるため、`cgY = primaryH - nsY` で変換が必要
- 変換はクリック直前にのみ行い、保持する値は NSEvent 座標のままにする（座標の劣化を防ぐ、ディスプレイ構成変更にも追従しやすい）

プライマリディスプレイは `NSScreen.screens` の中で `frame.origin === (0, 0)` のものを探す。`NSScreen.mainScreen` はキーウィンドウがあるスクリーンを返すため不安定で使用しない。

## ディレクトリ構成

ディレクトリ構成や各ディレクトリの役割については [README.md](README.md) を参照してください。
