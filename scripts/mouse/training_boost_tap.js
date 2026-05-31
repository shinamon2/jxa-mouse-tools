// ==========================================
// training_boost_tap (v12)
// JXA (JavaScript for Automation) 学習用
// マウスクリック自動化サンプル
//
// 概要:
//   指定した位置を連続タップする JXA スクリプト。
//   AppKit による座標取得・座標系変換と、
//   CoreGraphics によるイベント送信、
//   ダイアログ入力、failsafe を一通り含む
//   学習サンプルとして整備。
//
// 実行方法:
//   Script Editor → 言語「JavaScript」→ ⌘R
//
// 必要権限:
//   システム設定 → プライバシーとセキュリティ
//   → アクセシビリティ → Script Editor ON
//
// 緊急停止:
//   ① 画面左上隅へマウスを移動（FAILSAFE）
//   ② ⌘.
// ==========================================

ObjC.import('AppKit')
ObjC.import('CoreGraphics')

var app = Application.currentApplication()
app.includeStandardAdditions = true

// ==========================================
// Config
// ==========================================

var DEBUG_MODE = true
var LOG_PATH = "~/Desktop/training_boost_tap.log"
var MIN_DELAY = 0.11
var MAX_DELAY = 0.24
var CLICK_HOLD = 0.008
var START_DELAY = 3

// Failsafe
var FAILSAFE_ENABLED = true
var FAILSAFE_CORNER = 10

// 補助ブースト: メイン座標からの自動オフセット
var AUTO_SUB_OFFSET_X = 77
var AUTO_SUB_OFFSET_Y = 547

// ==========================================
// Utility
// ==========================================

function shQuote(s) {
    return "'" + String(s).replace(/'/g, "'\\''") + "'"
}

function log(msg) {
    var line = new Date().toLocaleString() + "  " + msg
    console.log(line)
    try {
        app.doShellScript("echo " + shQuote(line) + " >> " + LOG_PATH)
    } catch (e) { }
}

function notify(title, body) {
    try {
        app.displayNotification(body, { withTitle: title })
    } catch (e) { }
}

// ==========================================
// Primary Screen Height
//
// ┌ 座標系の整理 ──────────────────────────┐
// │                                        │
// │  NSEvent.mouseLocation                 │
// │    原点: primary screen の 左下         │
// │    Y:    上向き ↑                      │
// │                                        │
// │  CGEventCreateMouseEvent               │
// │    原点: primary screen の 左上         │
// │    Y:    下向き ↓                      │
// │                                        │
// │  変換式: cgY = primaryH - nsY          │
// │                                        │
// │  ※ backingScaleFactor は不要           │
// │     CGEvent / NSEvent どちらも          │
// │     "logical points" を使うため        │
// └────────────────────────────────────────┘
//
// primary screen の特定:
//   NSScreen.screens の中で
//   frame.origin == (0, 0) のもの
//
// mainScreen は禁止:
//   フォーカスウィンドウが乗る画面を返すため
//   ダイアログ表示後に変わる可能性がある
// ==========================================

function findPrimaryScreen() {

    var screens = $.NSScreen.screens
    var count = screens.count

    log("screens.count=" + count)

    for (var s = 0; s < count; s++) {

        var screen = screens.objectAtIndex(s)
        var frame = screen.frame
        var ox = frame.origin.x
        var oy = frame.origin.y
        var w = frame.size.width
        var h = frame.size.height
        var bsf = screen.backingScaleFactor

        log(
            "screen[" + s + "]" +
            " origin=(" + ox + "," + oy + ")" +
            " size=" + w + "x" + h +
            " backingScaleFactor=" + bsf
        )

        if (Math.round(ox) === 0 && Math.round(oy) === 0) {
            log("primaryScreen → index=" + s + " height=" + h)
            return { height: h, screen: screen }
        }
    }

    log("WARN: primary screen not found by origin(0,0). fallback to screens[0]")
    var fb = $.NSScreen.screens.objectAtIndex(0)
    return { height: fb.frame.size.height, screen: fb }
}

var primaryInfo = findPrimaryScreen()
var PRIMARY_H = primaryInfo.height

log("PRIMARY_H=" + PRIMARY_H)

// ==========================================
// Failsafe
//
// NSEvent 座標系での左上隅判定:
//   左上 = x が小さい かつ y が大きい
//         (NSEvent は左下原点のため上ほど y 大)
//
//   判定:
//     x <= FAILSAFE_CORNER
//     y >= PRIMARY_H - FAILSAFE_CORNER
// ==========================================

function checkFailsafe() {

    if (!FAILSAFE_ENABLED) { return }

    var loc = $.NSEvent.mouseLocation
    var x = loc.x
    var y = loc.y

    if (
        x <= FAILSAFE_CORNER &&
        y >= PRIMARY_H - FAILSAFE_CORNER
    ) {
        log(
            "FAILSAFE TRIGGERED" +
            " mouse=(" + Math.round(x) + "," + Math.round(y) + ")" +
            " corner=" + FAILSAFE_CORNER +
            " PRIMARY_H=" + PRIMARY_H
        )

        app.beep()
        app.beep()
        app.beep()

        throw new Error("FAILSAFE STOP")
    }
}

// ==========================================
// Get Mouse Position
//
// NSEvent 座標 (左下原点) のまま返す。
// CG への変換は clickAt() 内で行う。
// ==========================================

function getMousePosition() {

    var loc = $.NSEvent.mouseLocation
    var nsX = loc.x
    var nsY = loc.y

    log("mouse raw location: nsX=" + nsX + " nsY=" + nsY)

    var screens = $.NSScreen.screens
    var count = screens.count

    for (var s = 0; s < count; s++) {

        var screen = screens.objectAtIndex(s)
        var f = screen.frame
        var inX = nsX >= f.origin.x && nsX < f.origin.x + f.size.width
        var inY = nsY >= f.origin.y && nsY < f.origin.y + f.size.height

        if (inX && inY) {
            log(
                "mouse screen: index=" + s +
                " origin=(" + f.origin.x + "," + f.origin.y + ")" +
                " size=" + f.size.width + "x" + f.size.height +
                " backingScaleFactor=" + screen.backingScaleFactor
            )
            break
        }
    }

    return {
        nsX: Math.round(nsX),
        nsY: Math.round(nsY)
    }
}

// ==========================================
// Click
//
// 引数は NSEvent 座標 (左下原点)
//
// ┌ 変換 ─────────────────────────────────┐
// │                                       │
// │  NSEvent:    (nsX, nsY)               │
// │  CGEvent:    (cgX, cgY)               │
// │                                       │
// │  cgX = nsX              ← X は同じ    │
// │  cgY = PRIMARY_H - nsY  ← Y 反転      │
// │                                       │
// └───────────────────────────────────────┘
// ==========================================

function clickAt(nsX, nsY) {

    var cgX = nsX
    var cgY = PRIMARY_H - nsY

    log(
        "clickAt:" +
        " ns=(" + nsX + "," + nsY + ")" +
        " → cg=(" + cgX + "," + cgY + ")"
    )

    var point = $.CGPointMake(cgX, cgY)

    var down = $.CGEventCreateMouseEvent(
        null,
        $.kCGEventLeftMouseDown,
        point,
        $.kCGMouseButtonLeft
    )

    var up = $.CGEventCreateMouseEvent(
        null,
        $.kCGEventLeftMouseUp,
        point,
        $.kCGMouseButtonLeft
    )

    $.CGEventPost($.kCGHIDEventTap, down)
    delay(CLICK_HOLD)
    $.CGEventPost($.kCGHIDEventTap, up)

    if (DEBUG_MODE) { app.beep() }
}

// ==========================================
// waitBetweenClicks
//
// 最終クリック以外の全タップ後に呼ぶ共通待機
// ==========================================

function waitBetweenClicks() {
    var waitTime =
        MIN_DELAY +
        Math.random() * (MAX_DELAY - MIN_DELAY)
    log("wait " + waitTime.toFixed(2) + " sec")
    delay(waitTime)
}

// ==========================================
// Start
// ==========================================

log("===== TRAINING_BOOST_TAP START v12 =====")
log("FAILSAFE=" + FAILSAFE_ENABLED + " corner=" + FAILSAFE_CORNER + "pt")
log("AUTO_SUB_OFFSET X=" + AUTO_SUB_OFFSET_X + " Y=" + AUTO_SUB_OFFSET_Y)

// ==========================================
// Dialog 1: クール数
// ==========================================

var r1

try {

    r1 = app.displayDialog(
        "クール数を入力してください\n\n" +
        "補助OFF:\n" +
        "  1クール = メイン3タップ\n\n" +
        "補助ON:\n" +
        "  1クール = メイン3タップ + 補助1タップ\n\n" +
        "OK後、" + START_DELAY + "秒以内に\n" +
        "クリックしたい位置へマウスを移動\n\n" +
        "緊急停止: 画面左上隅へマウスを移動\n" +
        "DEBUG MODE = " + DEBUG_MODE,
        {
            defaultAnswer: "5",
            withTitle: "Training Boost Tap v12",
            buttons: ["キャンセル", "次へ"],
            defaultButton: "次へ"
        }
    )

} catch (e) { log("CANCEL"); throw e }

var cycleCount = parseInt(r1.textReturned, 10)
log("cycleCount=" + cycleCount)

if (isNaN(cycleCount) || cycleCount < 1) {
    log("invalid cycleCount")
    app.beep()
    throw new Error("invalid cycle count")
}

// ==========================================
// Dialog 2: 補助ブースト ON/OFF
// ==========================================

var r2

try {

    r2 = app.displayDialog(
        "補助ブースト使用しますか？\n\n" +
        "使用する場合:\n" +
        "  メイン3タップ → 補助1タップ を1クールとして繰り返します\n\n" +
        "補助座標はメイン座標から自動計算します\n" +
        "  ΔX = +" + AUTO_SUB_OFFSET_X + "\n" +
        "  ΔY = +" + AUTO_SUB_OFFSET_Y,
        {
            withTitle: "Training Boost Tap v12 — 補助ブースト",
            buttons: ["使用しない", "使用する"],
            defaultButton: "使用しない"
        }
    )

} catch (e) { log("CANCEL"); throw e }

var useSubBoost = (r2.buttonReturned === "使用する")

// ==========================================
// 総クリック数とモード確定
//
// 補助OFF: cycleCount × 3
// 補助ON:  cycleCount × 4
// ==========================================

var tapsPerCycle = useSubBoost ? 4 : 3
var totalClickCount = cycleCount * tapsPerCycle
var mode = useSubBoost ? "SUB_BOOST" : "MAIN_ONLY"

log("cycleCount=" + cycleCount)
log("totalClickCount=" + totalClickCount)
log("mode=" + mode)

// ==========================================
// 待機 → マウス座標取得
// ==========================================

notify("Training Boost Tap", START_DELAY + "秒以内にクリック位置へ移動してください")
log("wait " + START_DELAY + " sec")
delay(START_DELAY)

var target = getMousePosition()
var tx = target.nsX
var ty = target.nsY

// 補助座標: メイン座標 + オフセットで自動計算
var subNsX = tx + AUTO_SUB_OFFSET_X
var subNsY = ty + AUTO_SUB_OFFSET_Y

log("MAIN COORD = (" + tx + "," + ty + ")")
log("SUB  COORD = (" + subNsX + "," + subNsY + ")")

// ==========================================
// メイン座標確認通知（開始前の1回のみ）
// ==========================================

notify(
    "メイン座標を取得しました",
    "X: " + tx + "  Y: " + ty + "\n3秒後に開始します"
)

log("coordinate confirmed: nsX=" + tx + " nsY=" + ty)

delay(3)

// ==========================================
// Main Loop（クール単位）
//
// 補助OFF: 1クール = MAIN × 3
//
//   for c in cycleCount:
//     MAIN → wait
//     MAIN → wait
//     MAIN → wait (最終クール最終タップは wait なし)
//
// 補助ON: 1クール = MAIN × 3 + SUB × 1
//
//   for c in cycleCount:
//     MAIN → wait
//     MAIN → wait
//     MAIN → wait
//     SUB  → wait (最終クール最終タップは wait なし)
//
// clicksDone で全体の進捗を管理し、
// 最終タップのみ wait をスキップする
// ==========================================

var clicksDone = 0

for (var c = 0; c < cycleCount; c++) {

    log(
        "CYCLE " + (c + 1) + "/" + cycleCount +
        " (" + mode + ")"
    )

    // ---- MAIN × 3 ----
    for (var k = 0; k < 3; k++) {

        checkFailsafe()

        log(
            "MAIN CLICK" +
            " cycle=" + (c + 1) + "/" + cycleCount +
            " tap=" + (k + 1) + "/3"
        )

        clickAt(tx, ty)
        clicksDone++

        if (clicksDone < totalClickCount) {
            waitBetweenClicks()
        }
    }

    // ---- SUB × 1（補助ON 時のみ）----
    if (useSubBoost) {

        checkFailsafe()

        log(
            "SUB CLICK" +
            " cycle=" + (c + 1) + "/" + cycleCount
        )

        clickAt(subNsX, subNsY)
        clicksDone++

        if (clicksDone < totalClickCount) {
            waitBetweenClicks()
        }
    }
}

log("COMPLETE  totalClicks=" + clicksDone)

// 完了音
try {
    app.doShellScript('afplay "/System/Library/Sounds/Glass.aiff"')
    log("PLAY SOUND")
} catch (e) {
    log("SOUND ERROR=" + e)
    app.beep()
}

notify("Training Boost Tap", "完了しました")