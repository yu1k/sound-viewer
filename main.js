"use strict";

const { app, Menu, Tray, BrowserWindow } = require("electron");
const path = require("path");
const { execSync } = require("child_process");

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

/**
 *
 * メニューバーにサウンド出力デバイスを表示する
 *
*/
// execSyncの実行結果を格納する変数
let stdOut = null;
function getSoundInfo() {
    // returnする内容を格納する変数
    let showSound = null;

    try {
        /**
         * 実行環境がintel or Apple silicon のmacか判定する
         */
        if (!(process.arch === "x64" || process.arch === "arm64")) {
            console.log("Intel macかApple Siliconのmacで実行してください。" + "\n" + "終了します。");
            // Electron appを終了する
            app.quit();
        }
        // intel mac
        if (process.arch === "x64") {
            // brewでインストールしたコマンドなのでフルパスで指定したい
            stdOut = execSync("/usr/local/bin/SwitchAudioSource -c");
        }
        // apple silicon mac
        if (process.arch === "arm64") {
            // brewでインストールしたコマンドなのでフルパスで指定したい
            stdOut = execSync("/opt/homebrew/bin/SwitchAudioSource -c");
        }

        let stdOutJson = {
            stdOutObj: stdOut.toString()
        }

        showSound = (`${JSON.stringify((stdOutJson.stdOutObj).replace(/\r?\n/g, "")).replace(/"/g, "")}`);
        return showSound;
    } catch (e) {
        console.error("error: " + e);
        console.log("予期しないエラーが発生しました。" + "\n" + "終了します。");

        // Electron appを終了する
        app.quit();
    }
    // return showSound;
};

let tray;
function main() {
    console.log("debug: " + getSoundInfo());
    tray.setTitle(getSoundInfo());
}

// メニューバーのアイコン: ${__dirname}/icon_sound_output.jpg
const backgroundIcon = path.join(__dirname, "./icon_sound_output.png");

app.on("ready", () => {
    // 実行している環境がmacOSかを判定する
    const isMac = (process.platform === "darwin");
    if (isMac != true) {
        console.log("Sound ViewerはmacOS専用アプリです。アプリ実行環境を確認してください。" + "\n" + "アプリを終了します。");
        // Electron appを終了する
        app.quit();
    }

    // 新しいメニューを作成する
    let menu = null;
    menu = new Menu.buildFromTemplate([{
        label: "状態を更新する",
        click: main
    }, {
        label: "Sound Viewer を終了",
        role: "quit"
    }]);

    tray = new Tray(backgroundIcon);
    tray.setContextMenu(menu);
    main();

    // 更新のために3秒に一回実行する
    setInterval(main, 3000);

    // Dockのアプリアイコンを非表示にする
    app.dock.hide();
});