"use strict";

const { app, Menu, MenuItem, Tray, BrowserWindow } = require("electron");
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

/****************************************/
// 各種コマンド
/****************************************/
// SwitchAudioSourceコマンド
// intel mac
const iSwitchAudioSourceCommand = "/usr/local/bin/SwitchAudioSource";
// Apple silicon mac
const appleSiliconSwitchAudioSourceCommand = "/opt/homebrew/bin/SwitchAudioSource";

/**
 *
 * メニューバーにサウンド出力デバイスを表示する
 *
*/
// execSyncの実行結果を格納する変数
let stdOut = null;
function getCurrentSoundOutputSourceInfo() {
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
            stdOut = execSync(`${iSwitchAudioSourceCommand} -c -f json`);
        }
        // apple silicon mac
        if (process.arch === "arm64") {
            // brewでインストールしたコマンドなのでフルパスで指定したい
            stdOut = execSync(`${appleSiliconSwitchAudioSourceCommand} -c -f json`);
        }

        let stdOutJson = {
            stdOutObj: stdOut.toString()
        }

        // showSound = (`${JSON.stringify((stdOutJson.stdOutObj).replace(/\r?\n/g, "")).replace(/"/g, "")}`);
        showSound = (JSON.parse(stdOut)).name;
        return showSound;
    } catch (e) {
        console.error("error: " + e);
        console.log("予期しないエラーが発生しました。" + "\n" + "終了します。");

        // Electron appを終了する
        app.quit();
    }
    // return showSound;
};

/**
 * 引数に指定された配列からBooleanな値を要素削除する, もし引数に指定されたものが配列でない場合はreturnする。
 * Boolean: 0, -0, null, false, NaN, undefined, ""等の空文字列
 * reference: https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Boolean
 */
 function removeElementsFalseValuesFromArray(argsArray){
    if(!(Array.isArray(argsArray))){
        console.error(`引数 ${argsArray} は配列ではありませんでした。` + "\n" + `引数 ${argsArray} のデータ型は ${typeof argsArray} でした。`);
        return;
    }
    return argsArray.filter(Boolean);
}

/**
 * マシンの環境におけるすべてのサウンドソースを取得する。
 * JSONから文字列に変換し、各種データを整形後に文字列からJSONに変換してreturnで返す。
 * TODO: 出力と入力ソースを分けてJSONに格納し、returnで返す。
 */
function getAllAudioSourceDevicesInfo(){
    // SwitchAudioSource で取得したデータを格納する変数
    let allAudioSourceDevices = null;

    try {
        if(!(process.arch=== "x64" || process.arch === "arm64")){
            console.log("Intel macかApple Siliconのmacで実行してください。" + "\n" + "終了します。");
            // Electron appを終了する
            app.quit();
        }
        if(process.arch === "x64"){
            allAudioSourceDevices = execSync(`${iSwitchAudioSourceCommand} -a -f json`);
        }
        if(process.arch === "arm64"){
            allAudioSourceDevices = execSync(`${appleSiliconSwitchAudioSourceCommand} -a -f json`);
        }
        // JSONを文字列に変換し、改行ごとに分割して配列にする。
        let allAudioSourceDevicesJsonToStr = new String(allAudioSourceDevices).split(/\r\n|\n/);
        // 配列にfalseな要素が含まれていた場合は、それらの要素を削除する。
        allAudioSourceDevicesJsonToStr = removeElementsFalseValuesFromArray(allAudioSourceDevicesJsonToStr);

        // JSON形式に整形する。
        // let allAudioSourceDevicesStrToJson = ("[" + allAudioSourceDevicesJsonToStr + "]");
        // let allAudioSourceDevicesStrToJson = JSON.stringify(allAudioSourceDevicesJsonToStr);

        return allAudioSourceDevicesJsonToStr;
    } catch (e) {
        console.error("error: " + e);
        console.log("予期しないエラーが発生しました。" + "\n" + "終了します。");

        // Electron appを終了する
        app.quit();
    }
}

/**
 * Tray のタイトルについてsetとupdateをする関数
 * この関数が最初に実行された際は、Trayのタイトルを設定する。すでに実行された後に再度実行されるとTrayのタイトルを最新の状態に更新する。
 */
let tray;
function updateTrayTitle(){
    return tray.setTitle(getCurrentSoundOutputSourceInfo());
}

function main(){
    console.log("debug: " + getCurrentSoundOutputSourceInfo());
    console.log("debug getAllAudioSourceDevicesInfo: " + getAllAudioSourceDevicesInfo());
}

/**
 * メニューアイテムを作成する関数
 */
function createManuItem(){
    // 新しいメニューを作成する
    let menu = null;
    // メニューに動的に変更する
    // let menuItemArray = new MenuItem();
    menu = new Menu()
    menu.append(new MenuItem({ label: "状態を更新する", click: () => { updateTrayTitle } }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ label: "サウンド出力のデバイスを変更する", enabled: false }));

    // 実行環境のアーキテクチャを取得する
    const processArch = process.arch;
    let getAllAudioSourceDevicesInfoToObj = getAllAudioSourceDevicesInfo();
    for (let i = 0; i < getAllAudioSourceDevicesInfoToObj.length; i++) {
        if (JSON.parse(getAllAudioSourceDevicesInfoToObj[i]).type === "output") {
            menu.append(new MenuItem({
                    label: `${JSON.parse(getAllAudioSourceDevicesInfoToObj[i]).name} を選択`,
                    click: () => {
                        if(!(processArch === "x64" || processArch === "arm64")){
                            console.log("Intel macかApple Siliconのmacで実行してください。" + "\n" + "終了します。");
                            // Electron appを終了する
                            app.quit();
                        }
                        if(processArch === "x64"){
                            execSync(`${iSwitchAudioSourceCommand} -t output -s "${JSON.parse(getAllAudioSourceDevicesInfoToObj[i]).name}"`);
                        }
                        if(processArch === "arm64"){
                            execSync(`${appleSiliconSwitchAudioSourceCommand} -t output -s "${JSON.parse(getAllAudioSourceDevicesInfoToObj[i]).name}"`);
                        }
                    }
            }));
        }
    }
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ label: "Sound Viewer を終了", role: "quit" }));

    return menu;
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

    // set Tray
    tray = new Tray(backgroundIcon);
    tray.setContextMenu(createManuItem());
    // 初回の実行
    updateTrayTitle();

    // 更新のために3秒に一回実行する
    setInterval(updateTrayTitle, 3000);
    // メニューバーのアイテム(各種サウンドデバイス等)を更新するため、10秒に一回実行する
    setInterval(createManuItem, 10000);

    // Dockのアプリアイコンを非表示にする
    app.dock.hide();
});