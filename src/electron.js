const fs = require('fs')
const path = require('path')
const electron = require('electron')
const { app, clipboard, nativeImage } = electron
const express = require('express')
const bodyParser = require('body-parser')
const server = express()

server.use(bodyParser.json())

process.send = msg => {
	process.stdout.write(JSON.stringify(msg) + '\n')
}

process.send({ action: 'info', data: process.versions['electron'] })

if (typeof electron === 'string') {
	process.send({ action: 'initerr', data: electron })
	process.exit(2)
}

const handleMessage = ({ action, data }) => {
	try {
		if (action === 'echo') {
			process.send({ action: 'echo', data })
		}
		if (action === 'copyText') {
			clipboard.writeText(data)
		}
		if (action === 'copyImgWithPath') {
			const img = nativeImage.createFromPath(data)
			clipboard.writeImage(img)
			process.send({ action: 'showMsg', data: 'Image copied to clipboard!' })
		}
	} catch (e) {
		process.send({ action: 'error', data: e.stack })
	}
}
server.post('/', (req, res) => {
	handleMessage(req.body)
	res.end()
})

setTimeout(() => {
	fs.readFile(path.join(__dirname, '.PORT'), 'utf-8', (err, p) => {
		p = parseInt(p)
		server.listen(p)
		process.send({ action: 'listen_on', data: p })
	})
}, 3000)

app.on('ready', function() {
	process.send({ action: 'info', data: 'electron ready' })
})
