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
├── README.md            # 本ファイル
├── .gitignore
├── scripts/             # JXA スクリプト本体
│   ├── mouse/           # マウス操作系（移動・クリックなど）
│   └── coords/          # 座標取得系
└── docs/                # 補足ドキュメント
    └── permissions.md   # macOS の権限設定手順
```

新しいユーティリティを追加する際は、適切なカテゴリの下に `.js` ファイルとして配置してください。カテゴリが既存に当てはまらない場合は `scripts/` 配下に新規ディレクトリを作成します。

## 実行方法

JXA スクリプトはターミナルから `osascript` コマンドで実行します。

```sh
# 基本形
osascript -l JavaScript scripts/coords/get_mouse_position.js

# 引数を渡す例
osascript -l JavaScript scripts/mouse/click.js 100 200
```

スクリプト先頭に下記のシバンを書き、実行権限を付けることで直接実行することも可能です。

```javascript
#!/usr/bin/env osascript -l JavaScript
```

```sh
chmod +x scripts/mouse/click.js
./scripts/mouse/click.js 100 200
```

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
