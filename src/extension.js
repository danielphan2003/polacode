const vscode = require('vscode')
const path = require('path')
const fs = require('fs')
const {
    writeFileSync
} = require('fs')
const {
    homedir
} = require('os')
const initClipboard = require('node-clipboardwriter')
const customizations = vscode.workspace.getConfiguration("polacode").container;

let clipboard
initClipboard().then(clip => (clipboard = clip))

const serializedBlobToBuffer = serializeBlob => {
    const bytes = new Uint8Array(serializeBlob.split(','))
    return new Buffer(bytes)
}
const writeSerializedBlobToFile = (serializeBlob, fileName) => {
    writeFileSync(fileName, serializedBlobToBuffer(serializeBlob))
}

function activate(context) {
    const htmlPath = path.resolve(context.extensionPath, 'src/webview/index.html')
    const indexUri = vscode.Uri.file(htmlPath)

    let lastUsedImageUri = vscode.Uri.file(path.resolve(homedir(), 'Desktop/code.png'))
    vscode.commands.registerCommand('polacode.shoot', serializedBlob => {
        vscode.window
            .showSaveDialog({
                defaultUri: lastUsedImageUri,
                filters: {
                    Images: ['png']
                }
            })
            .then(uri => {
                if (uri) {
                    writeSerializedBlobToFile(serializedBlob, uri.fsPath)
                    lastUsedImageUri = uri
                }
            })
    })

    vscode.commands.registerCommand('polacode.copyToClipboard', serializedBlob => {
        clipboard.writeImage(serializedBlobToBuffer(serializedBlob)).then(success => {
            if (success) {
                vscode.window.showInformationMessage('Image copied to clipboard!')
            } else {
                vscode.window.showInformationMessage('Failed to copy image to clipboard!')
            }
        })
    })

    vscode.commands.registerCommand('polacode.activate', () => {
        const v = vscode.window.createWebview(indexUri, 2, {
            enableCommandUris: true,
            enableScripts: true,
            retainContextWhenHidden: false
        });
        v.html = fs.readFileSync(htmlPath, 'utf-8');
        const fontFamily = vscode.workspace.getConfiguration('editor').fontFamily
        const bgColor = context.globalState.get('polacode.bgColor', '#2e3440')
        v.postMessage({
            type: 'init',
            fontFamily,
            bgColor,
            customizations
        })
        v.onDidReceiveMessage(data => {
            if (data.type === 'shoot') {
                vscode.commands.executeCommand('polacode.shoot', data.serializedBlob)
            }
        })

        // vscode.commands
        //   .executeCommand('vscode.previewHtml', indexUri, 2, 'Polacode 📸', {
        //     allowScripts: true
        //   })
        //   .then(() => {
        //     const fontFamily = vscode.workspace.getConfiguration('editor').fontFamily
        //     const bgColor = context.globalState.get('polacode.bgColor', '#2e3440')
        //     vscode.commands.executeCommand('_workbench.htmlPreview.postMessage', indexUri, {
        //       type: 'init',
        //       fontFamily,
        //       bgColor
        //     })
        //   })
    })

    vscode.window.onDidChangeTextEditorSelection(e => {
        if (e.selections[0] && !e.selections[0].isEmpty) {
            vscode.commands.executeCommand('editor.action.clipboardCopyAction')
            vscode.commands.executeCommand('_workbench.htmlPreview.postMessage', indexUri, {
                type: 'update'
            })
        }
    })

    vscode.commands.registerCommand('polacode._onmessage', ({
        type,
        data
    }) => {
        if (type === 'updateBgColor') {
            context.globalState.update('polacode.bgColor', data.bgColor)
        } else if (type === 'invalidPasteContent') {
            vscode.window.showInformationMessage(
                // eslint-disable-next-line max-len
                'Pasted content is invalid. Only copy from VS Code and check if your shortcuts for copy/paste have conflicts.'
            )
        }
    })
}

exports.activate = activate
