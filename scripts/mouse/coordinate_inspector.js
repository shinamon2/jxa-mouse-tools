// ==========================================
// coordinate_inspector
// JXA (JavaScript for Automation)
//
// 位置づけ:
//   マウス自動化ツール群 (training_boost_tap.js,
//   help_tap.js 等) で利用する座標を取得するための
//   補助ツール。
//   単体で完結する成果物ではなく、他ツールへ転記
//   する座標値を取得・確認する目的で使う、
//   マウス操作ツール群の共通ユーティリティ。
//
// 典型的な使い方:
//   1. 本スクリプトを Script Editor で実行
//   2. 表示までの待機 (WAIT_SEC 秒) の間に
//      マウスを「クリックさせたい位置」へ移動
//   3. ダイアログ・通知に表示された NSEvent 座標
//      (X, Y) を控える
//   4. その値を training_boost_tap.js などの
//      MAIN COORD として転記する
//
// 実行方法:
//   Script Editor → 言語「JavaScript」→ ⌘R
//   または:
//     osascript -l JavaScript scripts/mouse/coordinate_inspector.js
//
// 必要権限:
//   なし (マウス位置の "読み取り" のみ。
//   他アプリ操作・クリック送信は行わないため)。
//   通知が出ない場合は「システム設定 → 通知」で
//   Script Editor の通知を許可してください。
//
// 出力先:
//   1. console.log (Script Editor の「メッセージ」ペイン)
//   2. 通知センターのトースト
//   3. ダイアログ
// ==========================================

ObjC.import('AppKit')

var app = Application.currentApplication()
app.includeStandardAdditions = true

// ==========================================
// Config
// ==========================================

// マウスを目的位置へ移動するための猶予秒数
var WAIT_SEC = 3

// ==========================================
// Utility
// ==========================================

function notify(title, body) {
    try {
        app.displayNotification(body, { withTitle: title })
    } catch (e) { }
}

// ==========================================
// 座標系の解説 (JXA 学習用メモ)
//
// ┌ NSEvent.mouseLocation ─────────────────┐
// │                                        │
// │  AppKit の API。スクリーン上のマウス     │
// │  位置を NSPoint で返す。                │
// │                                        │
// │  原点: プライマリディスプレイの "左下"   │
// │  Y軸:  上方向に増加 ↑                  │
// │                                        │
// │  例:                                    │
// │    画面下端付近 → y ≈ 0                │
// │    画面上端付近 → y ≈ 画面高さ          │
// │                                        │
// └────────────────────────────────────────┘
//
// ┌ CGEventCreateMouseEvent ───────────────┐
// │                                        │
// │  CoreGraphics の API。マウスイベントを   │
// │  生成・送信する際に使う座標系。         │
// │                                        │
// │  原点: プライマリディスプレイの "左上"   │
// │  Y軸:  下方向に増加 ↓                  │
// │                                        │
// │  例:                                    │
// │    画面上端付近 → y ≈ 0                │
// │    画面下端付近 → y ≈ 画面高さ          │
// │                                        │
// └────────────────────────────────────────┘
//
// ┌ なぜ Y 軸変換が必要なのか ─────────────┐
// │                                        │
// │  「マウス位置を取得する API (NSEvent)」 │
// │  と                                     │
// │  「マウスをクリックさせる API (CGEvent)」│
// │  で Y 軸の向きが逆だから。              │
// │                                        │
// │  X はどちらも左方向起点で同じ。         │
// │  Y だけ変換が要る。                     │
// │                                        │
// │  変換式:                                │
// │    cgY = primaryH - nsY                │
// │                                        │
// │  primaryH = プライマリディスプレイの    │
// │             高さ (logical points)       │
// │                                        │
// │  ※ Retina 倍率 (backingScaleFactor) は  │
// │    不要。NSEvent / CGEvent はどちらも   │
// │    "logical points" を扱うため、画素    │
// │    数ベースの倍率を掛ける必要はない。   │
// │                                        │
// └────────────────────────────────────────┘
//
// ┌ なぜ NSEvent 座標で保持するのか ────────┐
// │                                        │
// │  training_boost_tap は、取得したマウス   │
// │  座標を NSEvent 座標のまま変数に保持し、 │
// │  クリック直前 (clickAt 内) に CG 座標へ  │
// │  変換している。                         │
// │                                        │
// │  理由:                                  │
// │  1. mouseLocation が NSEvent 座標で     │
// │     返してくれるため、取得時の変換が    │
// │     不要 (＝丸め誤差・変換ミスを防げる)。│
// │  2. クリック直前に毎回変換することで、   │
// │     ディスプレイ構成が変わって primaryH │
// │     が変動した場合でも追従しやすい。    │
// │  3. NSScreen との突き合わせ (どの         │
// │     ディスプレイ上にあるか判定など) も   │
// │     NSEvent 座標で行う方が直接的。       │
// │                                        │
// │  本インスペクタも同じ方針に揃え、       │
// │  表示する座標も NSEvent 座標を主とする。 │
// │  これにより、表示された値を              │
// │  そのまま training_boost_tap 側にコピペ  │
// │  できる。                                │
// │                                        │
// └────────────────────────────────────────┘
//
// ┌ マルチディスプレイ時の判定理由 ────────┐
// │                                        │
// │  マルチディスプレイ環境では各画面の     │
// │  frame.origin が異なる位置に配置される。 │
// │                                        │
// │  例:                                    │
// │    画面1 (プライマリ): origin=(0,0)    │
// │    画面2 (右側に配置): origin=(1920,0) │
// │    画面2 (上側に配置): origin=(0,1440) │
// │    画面2 (下側に配置): origin=(0,-1440)│
// │                                        │
// │  そのため取得した nsX, nsY だけ見ても   │
// │  「どの画面のどの位置か」が分かりにくい。│
// │                                        │
// │  各 NSScreen.frame に nsX, nsY が       │
// │  含まれるか判定することで、             │
// │   - どのディスプレイ上か                 │
// │   - そのディスプレイ内のローカル座標     │
// │  を表示でき、座標の妥当性を目視確認     │
// │  しやすくなる。                         │
// │                                        │
// └────────────────────────────────────────┘
// ==========================================

// ==========================================
// Primary Screen
//
// プライマリディスプレイ:
//   メニューバーが表示される画面。
//   NSEvent / CGEvent 双方の座標系の原点が
//   この画面の角に乗る。
//
// 特定方法:
//   NSScreen.screens の中で frame.origin が
//   (0, 0) のものを探す。
//   training_boost_tap と同じロジック。
//
// NSScreen.mainScreen を使わない理由:
//   "キーウィンドウのあるスクリーン" を返す
//   ため、ダイアログ表示等で切り替わる可能性
//   がある。座標変換の基準には不安定。
// ==========================================

function findPrimaryScreen() {

    var screens = $.NSScreen.screens
    var count = screens.count

    for (var s = 0; s < count; s++) {

        var screen = screens.objectAtIndex(s)
        var frame = screen.frame

        if (
            Math.round(frame.origin.x) === 0 &&
            Math.round(frame.origin.y) === 0
        ) {
            return {
                index: s,
                height: frame.size.height,
                screen: screen
            }
        }
    }

    // フォールバック: 見つからなければ screens[0]
    var fb = screens.objectAtIndex(0)
    return {
        index: 0,
        height: fb.frame.size.height,
        screen: fb
    }
}

// ==========================================
// マウスのあるディスプレイを特定
//
// NSEvent 座標 (nsX, nsY) を渡し、それを
// 包含する NSScreen を見つけて情報を返す。
//
// 戻り値 (該当ありの場合):
//   {
//     index:   screens 配列内の位置
//     name:    ディスプレイ名 (例 "DELL U2723QE")
//     origin:  ディスプレイの左下角 (NSEvent 座標)
//     size:    ディスプレイの幅・高さ
//     localX:  ディスプレイ内 X (左上原点)
//     localY:  ディスプレイ内 Y (左上原点)
//   }
//
// 該当なしの場合 null (画面外をクリックした等)。
// ==========================================

function findMouseScreen(nsX, nsY) {

    var screens = $.NSScreen.screens
    var count = screens.count

    for (var s = 0; s < count; s++) {

        var screen = screens.objectAtIndex(s)
        var f = screen.frame
        var inX = nsX >= f.origin.x && nsX < f.origin.x + f.size.width
        var inY = nsY >= f.origin.y && nsY < f.origin.y + f.size.height

        if (inX && inY) {

            // ディスプレイ名 (macOS 10.15+)。
            // 取得不可なら "Display N" にフォールバック。
            var nameJS = ObjC.unwrap(screen.localizedName)
            var name = (typeof nameJS === 'string' && nameJS.length > 0)
                ? nameJS
                : "Display " + (s + 1)

            // ディスプレイ内のローカル座標 (左上原点)
            //   X: ディスプレイ左端からの距離
            //   Y: ディスプレイ上端からの距離
            // ディスプレイ単体で見たときに直感的な値。
            var localX = Math.round(nsX - f.origin.x)
            var localY = Math.round((f.origin.y + f.size.height) - nsY)

            return {
                index: s,
                name: name,
                origin: { x: f.origin.x, y: f.origin.y },
                size: { w: f.size.width, h: f.size.height },
                localX: localX,
                localY: localY
            }
        }
    }

    return null
}

// ==========================================
// Start
// ==========================================

console.log("===== 座標インスペクター 開始 =====")

var primary = findPrimaryScreen()
var PRIMARY_H = primary.height

console.log(
    "PRIMARY index=" + primary.index +
    " height=" + PRIMARY_H
)

// 全スクリーンの構成をログ出力 (マルチディスプレイ把握用)
var allScreens = $.NSScreen.screens
for (var i = 0; i < allScreens.count; i++) {
    var sc = allScreens.objectAtIndex(i)
    var fr = sc.frame
    console.log(
        "screen[" + i + "]" +
        " origin=(" + fr.origin.x + "," + fr.origin.y + ")" +
        " size=" + fr.size.width + "x" + fr.size.height
    )
}

// ==========================================
// 実行前通知 → 待機 → 座標取得
// ==========================================

notify(
    "座標インスペクター",
    WAIT_SEC + "秒以内にマウスを移動してください"
)
console.log("[INFO] " + WAIT_SEC + "秒後にマウス座標を取得します")

delay(WAIT_SEC)

// NSEvent 座標 (左下原点) を取得
var loc = $.NSEvent.mouseLocation
var rawX = loc.x
var rawY = loc.y
var nsX = Math.round(rawX)
var nsY = Math.round(rawY)

// CG 座標 (左上原点) を参考表示用に算出
//   X は同じ、Y は反転 (cgY = primaryH - nsY)
//   training_boost_tap の clickAt() と同じ式を使う。
//   PRIMARY_H が小数になるケースに備え表示用に Math.round。
var cgX = nsX
var cgY = Math.round(PRIMARY_H - nsY)

// マウスのあるディスプレイを判定 (NSEvent 座標で判定)
var ms = findMouseScreen(rawX, rawY)

// ==========================================
// 出力テキストを組み立て
// ==========================================

var mainLines = "X = " + nsX + "\n" + "Y = " + nsY
var copyable = nsX + "," + nsY
var refCG = "(参考) CG 座標: " + cgX + ", " + cgY

var screenInfo
if (ms) {
    screenInfo =
        "ディスプレイ: " + ms.name + " [index " + ms.index + "]\n" +
        "ディスプレイ内座標 (左上原点): " +
        ms.localX + ", " + ms.localY
} else {
    screenInfo =
        "ディスプレイ: 該当なし\n" +
        "(どの NSScreen.frame にも含まれない座標)"
}

// ==========================================
// 出力1: コンソール
// ==========================================

console.log("===== 結果 (NSEvent 座標 / 左下原点) =====")
console.log(mainLines)
console.log("コピー用: " + copyable)
console.log(refCG)
console.log(screenInfo)
console.log("PRIMARY_H = " + PRIMARY_H)
console.log("(raw) nsX=" + rawX.toFixed(2) + " nsY=" + rawY.toFixed(2))
console.log("==========================================")

// ==========================================
// 出力2: 通知 (トースト)
// ==========================================

var notifyName = ms ? ms.name : "範囲外"
notify("座標取得完了", "NSEvent: " + copyable + "  /  " + notifyName)

// ==========================================
// 出力3: ダイアログ
// ==========================================

app.displayDialog(
    mainLines + "\n\n" +
    "コピー用: " + copyable + "\n\n" +
    refCG + "\n\n" +
    screenInfo + "\n\n" +
    "※ NSEvent 座標 (左下原点) で表示しています。\n" +
    "training_boost_tap の MAIN COORD として\n" +
    "そのまま転記できます。",
    {
        withTitle: "マウス座標 (NSEvent)",
        buttons: ["OK"],
        defaultButton: "OK"
    }
)
