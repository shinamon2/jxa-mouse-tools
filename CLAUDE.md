# CLAUDE.md

本リポジトリは macOS で使う JXA（JavaScript for Automation）スクリプト集です。Claude Code で継続的に育てており、GitHub で履歴管理しています。

本ファイルは Claude Code（および他の AI アシスタント）が作業する際に従うべき方針をまとめています。

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

- **編集元は `.js`**。すべての編集は `.js`（`scripts/mouse/` 配下）に対して行う。
- **`.scpt` は make build でローカル生成**する。出力先は `dist/scpt/`。
- **`dist/` は `.gitignore` で除外**しコミットしない。
- ただし `.scpt` 全体を ignore はしない。将来、配布用・保存用などの目的で `dist/` 外のパスに `.scpt` をコミットするケースに備える。

`.scpt` で受け取った既存スクリプトを `.js` 化する必要がある場合は、Script Editor で開いて「フォーマット → スクリプトをテキストとして書き出す」または手動で `.js` にコピーしてから追加する。

## ビルド・実行ワークフロー

ユーザのフロー:

1. `make build` を実行
2. `scripts/mouse/*.js` がコンパイルされ `dist/scpt/*.scpt` が生成される
3. Finder で `dist/scpt/` が自動で開く
4. `.scpt` をダブルクリック → Script Editor → `⌘R`

または `make run TOOL=<name>` で個別の `.scpt` を Script Editor で直接開く。
詳細な Makefile ターゲットは README.md の「ビルド」セクション参照。

## AI アシスタント（Claude）の編集ワークフロー

- **編集対象は常に `.js`**（`scripts/mouse/` 配下）。`.scpt` を直接編集しない。
- **`.scpt` の生成はユーザに任せる**（ユーザがローカルで `make build` を実行する）。
  Claude が `osacompile` を直接叩いて `.scpt` を作る必要は基本ない。
- **構文チェック**が必要なときは、実行はせず `osacompile` だけ通す:
  ```sh
  osacompile -l JavaScript -o /tmp/check.scpt scripts/mouse/path/to/file.js
  ```
  これによりエラーがあれば検出できる。

## 座標系の方針

マウス座標は **NSEvent 座標（左下原点）** で保持・表示する。

- 取得 API: `NSEvent.mouseLocation`（左下原点・Y は上向き）
- クリック送信 API: `CGEventCreateMouseEvent`（左上原点・Y は下向き）
- 両者で Y 軸の向きが異なるため、`cgY = primaryH - nsY` で変換が必要
- 変換はクリック直前にのみ行い、保持する値は NSEvent 座標のままにする（座標の劣化を防ぐ、ディスプレイ構成変更にも追従しやすい）

プライマリディスプレイは `NSScreen.screens` の中で `frame.origin === (0, 0)` のものを探す。`NSScreen.mainScreen` はキーウィンドウがあるスクリーンを返すため不安定で使用しない。

## ディレクトリ構成

ディレクトリ構成や各ディレクトリの役割については [README.md](README.md) を参照してください。
