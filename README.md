# jxa-mouse-tools

macOS で使う JXA（JavaScript for Automation）スクリプト集。
Claude Code で継続開発し、GitHub で履歴管理しています。

## リポジトリ概要

- 対象 OS: macOS
- 言語: JavaScript（JXA / osascript ランタイム）
- 編集元: `scripts/mouse/*.js`
- 実行物: `make build` で `dist/scpt/*.scpt` を生成し、Script Editor から利用

## JXA とは

**JXA（JavaScript for Automation）** は、macOS に標準搭載されている JavaScript ベースの自動化スクリプティング環境です。

- AppleScript の代替として、JavaScript の構文で macOS や各種アプリを操作できる
- macOS 10.10 (Yosemite) 以降に標準搭載されており、追加インストール不要
- `osascript -l JavaScript` コマンドで実行する
- `Application("System Events")` などを通じて、UI 操作・アプリ制御が可能

参考:
- [Apple Developer: JavaScript for Automation Release Notes](https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/Introduction.html)

## ディレクトリ構成

```
jxa-mouse-tools/
├── README.md
│   └─ 本ファイル
├── CLAUDE.md
│   └─ 本リポジトリの作業方針 (AI アシスタント向けガイド)
├── Makefile
│   └─ .scpt のビルド・実行支援
├── .gitignore
├── scripts/                ← ソースコード (.js を編集元として管理)
│   └── mouse/
│       ├── coordinate_inspector.js
│       │   └─ マウス操作ツール用の座標取得・確認ユーティリティ
│       │      (他ツールに転記する座標値を取得する補助ツール)
│       ├── training_boost_tap.js
│       │   └─ マウスクリック自動化サンプル (JXA 学習用)
│       └── help_tap.js  (今後追加予定)
│           └─ マウスクリック自動化サンプル
├── dist/                   ← ビルド成果物 (.gitignore で除外、make build で生成)
│   └── scpt/
│       └── *.scpt
└── docs/
    └── permissions.md
        └─ macOS の権限設定手順
```

### ツールの位置づけ

- **coordinate_inspector.js** — マウス自動化ツール群の **共通ユーティリティ**。単体で使う成果物ではなく、`training_boost_tap.js` / `help_tap.js` といったクリック実行系ツールの **座標設定のために使う補助ツール**。実行 → マウス位置の NSEvent 座標を取得 → 他ツールへ転記、という流れで利用する。
- **training_boost_tap.js** — マウスクリック自動化のサンプル実装。
- **help_tap.js** — マウスクリック自動化のサンプル実装（今後追加予定）。

新しいユーティリティは `scripts/mouse/` 配下に `.js` ファイルとして追加します。カテゴリが大きく異なるツール（キーボード操作・ウィンドウ操作など）を追加する場合は、`scripts/` 配下に新規ディレクトリを作成して整理します。

## 使い方

### 推奨フロー: make build でビルドして使う

```sh
make build
```

これだけで:

1. `scripts/mouse/*.js` がコンパイルされ、`dist/scpt/*.scpt` に出力される
2. 生成された `.scpt` の一覧がターミナルに表示される
3. Finder で `dist/scpt/` が自動で開く
4. 好きな `.scpt` をダブルクリック → Script Editor 起動 → `⌘R` で実行

特定のツールだけ Script Editor で開きたい場合:

```sh
make run TOOL=coordinate_inspector
```

### .js を Script Editor で直接開いて使う（簡易フロー）

ビルドを介さず直接実行する場合:

```sh
open -a "Script Editor" scripts/mouse/coordinate_inspector.js
```

左上の言語セレクタが **JavaScript** であることを確認 → `⌘R`。

## ビルド (.scpt の生成)

Script Editor でダブルクリック実行できる `.scpt` を生成するには Makefile を使います。

| コマンド | 内容 |
| --- | --- |
| `make` / `make build` | `scripts/mouse/*.js` を `dist/scpt/*.scpt` にビルドし、Finder で `dist/scpt` を開く |
| `make clean` | `dist/scpt` 配下の `.scpt` を削除 |
| `make open` | `dist/scpt` を Finder で開く |
| `make run TOOL=<name>` | `dist/scpt/<name>.scpt` を Script Editor で開く（例: `make run TOOL=coordinate_inspector`） |
| `make help` | ターゲット一覧を表示 |

## ファイル形式の方針

- 編集元は `.js`（このリポジトリで管理）
- `.scpt` は必要に応じて `make build` でローカル生成する
- `dist/` 配下のビルド成果物は `.gitignore` で除外しコミットしない
- ただし `.scpt` 全体を ignore はしていない。将来的に配布用・保存用の `.scpt` を `dist/` 外のパスにコミットするケースに備えた運用

## 必要な macOS 権限設定

JXA からマウス操作や他アプリケーションの制御を行う場合、macOS のプライバシー設定で以下の権限をスクリプト実行元（ターミナル等）に付与する必要があります。

| 権限 | 用途 |
| --- | --- |
| アクセシビリティ | マウス移動・クリック、キーボード入力の送信 |
| オートメーション | 他アプリ（System Events / Finder など）の制御 |
| 入力監視（任意） | カーソル座標やキー入力のリアルタイム監視 |

設定手順の詳細は [docs/permissions.md](docs/permissions.md) を参照してください。

## ライセンス

未定（必要になった時点で追記）
