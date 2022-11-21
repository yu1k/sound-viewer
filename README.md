# Sound Viewer 

[![CI](https://github.com/yu1k/sound-viewer/actions/workflows/ci.yml/badge.svg)](https://github.com/yu1k/sound-viewer/actions/workflows/ci.yml)

## description

macのメニューバーに現在のサウンド出力しているデバイスを表示するElectronアプリです。

バックグラウンドで動きます。

## Requirement

### 確認済みの環境:

- OS: macOS
- Node.js version: v18.12.0
- npm version: 8.19.x

## Usage

```
$ brew install switchaudio-osx
$ git clone https://github.com/yu1k/sound-viewer sound-viewer && cd $_
$ npm install && npm run build
```

## Run test

```
$ npm run test
```

自動テストを実行する。

## Thanks

Sound Viewer ではサウンド出力デバイスを取得するため、 [switchaudio-osx](https://github.com/deweller/switchaudio-osx) を使用しています。

```
$ brew install switchaudio-osx
$ SwitchAudioSource -c
```