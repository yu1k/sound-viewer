"use strict";

const { app, Menu, MenuItem, Tray, BrowserWindow } = require("electron");
const path = require("path");
const { execSync } = require("child_process");

const lib = require("./lib/lib");

// ウィンドウ管理用
let win = null;
function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "./preload.js")
        }
    });

    win.loadFile("index.html");
}

/**
 * Electronが終了した際に呼び出される
 * 初期化され、再度ウィンドウを生成するための処理
 * 一部のAPIは、このイベントが発生した後にのみ使用できる
 */
app.whenReady().then(() => {
    createWindow();
    console.log("start: ");

    // 開いたウインドウがない場合にウインドウを開く (macOS)
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("ready", () => {
    // 実行している環境がmacOSかを判定する
    const isMac = (process.platform === "darwin");
    if (isMac != true) {
        console.log("Sound ViewerはmacOS専用アプリです。アプリ実行環境を確認してください。" + "\n" + "アプリを終了します。");
        // Electron appを終了する
        app.quit();
    }

    // appが起動した際の初回のみで実行する
    lib.initializeMenu();

    // appが起動した際に初回のメニュー生成で実行する, その後はあとのsetIntervalをかけて自動で更新する処理に任せる。
    lib.updateMenuItem();
    // メニューバーのTrayタイトル, メニューアイテム(各種サウンドデバイス等)を更新するために3秒に一回、updateMenuItem関数を実行する。
    setInterval(lib.updateMenuItem, 3000);

    // Dockのアプリアイコンを非表示にする
    app.dock.hide();
});