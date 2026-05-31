# jxa-mouse-tools

macOS の JXA（JavaScript for Automation）で書かれた、マウス操作・座標取得などを行うユーティリティスクリプト集です。

## リポジトリ概要

- 対象 OS: macOS
- 言語: JavaScript（JXA / osascript ランタイム）
- 用途:
  - マウスカーソルの座標取得
  - 指定座標へのマウス移動・クリックなどの自動操作
  - その他、将来追加する macOS 操作系の JXA ユーティリティ

GUI 操作の自動化、テスト補助、定型作業の効率化などを想定しています。

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
├── README.md                              # 本ファイル
├── CLAUDE.md                              # 本リポジトリの作業方針
├── .gitignore
├── scripts/                               # JXA スクリプト本体
│   ├── mouse/                             # マウス操作系
│   │   └── coordinate_inspector.js        # マウス座標取得 (NSEvent 座標)
│   └── coords/                            # 座標取得系
│       └── boost_tap.js                   # オートクリッカー v12
└── docs/                                  # 補足ドキュメント
    └── permissions.md                     # macOS の権限設定手順
```

新しいユーティリティを追加する際は、適切なカテゴリの下に `.js` ファイルとして配置してください。カテゴリが既存に当てはまらない場合は `scripts/` 配下に新規ディレクトリを作成します。

## 実行方法

このリポジトリのスクリプトは **Script Editor から実行する** 運用を基本としています。

### Script Editor で実行（推奨）

1. ターミナルから対象スクリプトを Script Editor で開く:

   ```sh
   open -a "Script Editor" scripts/mouse/coordinate_inspector.js
   ```

   または Finder で右クリック → 「このアプリケーションで開く」→ Script Editor。

2. Script Editor 左上の言語セレクタが **JavaScript** になっていることを確認する。
   （AppleScript になっている場合はクリックして JavaScript に変更）
3. `⌘R`（または ▶︎ 実行ボタン）で実行。
4. ログは「メッセージ」ペイン（`View → Show Log` / `⌘\`）で確認できる。

### ターミナルから直接実行

`osascript` 経由でも実行できます。

```sh
osascript -l JavaScript scripts/mouse/coordinate_inspector.js
```

### 構文チェックのみ（実行はしない）

`osacompile` でビルドだけ通すことで、実行せずに JXA 構文の妥当性を確認できます。

```sh
osacompile -l JavaScript -o /tmp/check.scpt scripts/mouse/coordinate_inspector.js
```

> このリポジトリのスクリプトは Node.js では実行できません（`ObjC.import` 等の JXA 固有 API を使うため）。構文チェックも Node ではなく `osacompile` を使ってください。

## ファイル形式の方針

スクリプトはすべて **`.js`（プレーンテキスト）** で管理します。Script Editor のバイナリ形式 `.scpt` は使用しません。

理由:
- `git diff` / コードレビュー / GitHub 上での閲覧がすべて機能する
- 任意のエディタ（VS Code 等）でも編集できる
- Script Editor では `open -a` で開けば同様に実行可能

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
