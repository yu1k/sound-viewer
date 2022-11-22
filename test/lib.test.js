"use strict";

const lib = require("../lib/lib");

// テンプレート
describe("runs template", () => {
    test("1は1であることを確認する", () => {
        expect(1).toBe(1);
    });
});

describe("lib モジュールをテストする。", () => {
    // lib.removeElementsFalseValuesFromArray 関数のテスト
    test("引数に指定された配列からBooleanな値を要素削除することができるか。", () => {
        expect(lib.removeElementsFalseValuesFromArray(
            [
                '{"name": "BuiltInSpeakerDevice", "type": "output", "id": "01", "uid": "BuiltInSpeakerDevice"}',
                '{"name": "BuiltInMicrophoneDevice", "type": "input", "id": "11", "uid": "BuiltInMicrophoneDevice"}',
                ''
            ]
        )).toStrictEqual(
            [
                '{"name": "BuiltInSpeakerDevice", "type": "output", "id": "01", "uid": "BuiltInSpeakerDevice"}',
                '{"name": "BuiltInMicrophoneDevice", "type": "input", "id": "11", "uid": "BuiltInMicrophoneDevice"}',
            ]);
    });
    test("引数に指定されたものが配列でない場合はそのままreturnで終了することができるか。", () => {
        expect(lib.removeElementsFalseValuesFromArray(1)).toBe(undefined);
    });

    // trayアイコンのテスト
    test("メニューバーに設置するTrayアイコンのパスを取得できているか。", () => {
        expect(typeof (lib.backgroundIcon)).toBe("string");
    });
    test("メニューバーに設置するTrayアイコンのパスを取得できているか。lib.backgroundIcon 変数にアイコンのパスが含まれているか(indexOfで判定)。", () => {
        expect((lib.backgroundIcon.indexOf("icon_sound_output.png") != -1)).toStrictEqual(true);
    });
    test("メニューバーに設置するTrayアイコンのパスを取得できているか。lib.backgroundIcon 変数にアイコンのパスが含まれているか。含まれていた場合は配列(typeofで判定)が含まれているか。", () => {
        expect(typeof (lib.backgroundIcon.match(/icon_sound_output.png/))).toStrictEqual("object");
    });

    test("lib.getCurrentSoundOutputSourceInfo() で値を取得できているか。", () => {
        expect(typeof lib.getCurrentSoundOutputSourceInfo()).toBe("string"||"object");
    });

});