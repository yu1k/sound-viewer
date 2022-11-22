"use strict";

const { app, Menu, MenuItem, Tray } = require("electron");
const path = require("path");
const { execSync } = require("child_process");

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
        console.log(`引数 ${argsArray} は配列ではありませんでした。` + "\n" + `引数 ${argsArray} のデータ型は ${typeof argsArray} でした。`);
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
// Trayを格納する変数
let tray = null;
function updateTrayTitle(){
    return tray.setTitle(getCurrentSoundOutputSourceInfo());
}

/**
 * メニューアイテムを作成する関数
 */
// メニューを格納する変数
let menu = null;
function createManuItem(){
    // メニューに動的に変更する
    // let menuItemArray = new MenuItem();
    // 新しいメニューを作成する
    menu = new Menu()
    menu.append(new MenuItem({ label: "状態を更新する", click: () => { updateTrayTitle } }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ label: "サウンド出力のデバイスを変更する", enabled: false }));

    selectSoundOutputDevicesFromContextMenuItem();

    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ label: "Sound Viewer を終了", role: "quit" }));

    tray.setContextMenu(menu);

    return menu;
}

/**
 * 各種サウンド出力デバイスをメニューバーのコンテキストメニューに表示 && メニューバーのコンテキストメニューから選択するための関数
 */
function selectSoundOutputDevicesFromContextMenuItem(){
    let getAllAudioSourceDevicesInfoToObj = getAllAudioSourceDevicesInfo();
    for (let i = 0; i < getAllAudioSourceDevicesInfoToObj.length; i++) {
        if (JSON.parse(getAllAudioSourceDevicesInfoToObj[i]).type === "output") {
            menu.append(new MenuItem({
                label: `${JSON.parse(getAllAudioSourceDevicesInfoToObj[i]).name} を選択`,
                click: () => {
                    if (!(process.arch === "x64" || process.arch === "arm64")) {
                        console.log("Intel macかApple Siliconのmacで実行してください。" + "\n" + "終了します。");
                        // Electron appを終了する
                        app.quit();
                    }
                    if (process.arch === "x64") {
                        execSync(`${iSwitchAudioSourceCommand} -t output -s "${JSON.parse(getAllAudioSourceDevicesInfoToObj[i]).name}"`);
                    }
                    if (process.arch === "arm64") {
                        execSync(`${appleSiliconSwitchAudioSourceCommand} -t output -s "${JSON.parse(getAllAudioSourceDevicesInfoToObj[i]).name}"`);
                    }
                }
            }));
        }
    }
}

/**
 * メニューバーのTrayアイテム、メニューアイテム等を更新する関数
 */
 function updateMenuItem(){
    updateTrayTitle();
    createManuItem();
}

// メニューバーのアイコン: ${__dirname}../assets/icon_sound_output.jpg
const backgroundIcon = path.join(__dirname, "../assets/icon_sound_output.png");

/**
 * メニューバーにおいてテンプレートを作成する関数。初期実行したあとは変動しない情報の処理をこの関数に記述する。1回だけ実行する。
 */
function initializeMenu(){
    // backgroundIcon を利用して tray アイコンを作成する
    tray = new Tray(backgroundIcon);
    return tray;
}

module.exports = {
    getCurrentSoundOutputSourceInfo,
    removeElementsFalseValuesFromArray,
    getAllAudioSourceDevicesInfo,
    updateTrayTitle,
    createManuItem,
    selectSoundOutputDevicesFromContextMenuItem,
    updateMenuItem,
    initializeMenu,

    backgroundIcon
};