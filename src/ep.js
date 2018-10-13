const path = require('path')
const cp = require('child_process')
const JSONStream = require('JSONStream')
const getport = require('./getport')
const xf = require('xfetch-js')
const fs = require('fs')
const electron = require('electron') // return electron executable path

let port
getport().then(p => {
	port = p
	process.env.POLACODE_TMP_PORT = p
	fs.writeFile(path.join(__dirname, '.PORT'), p, () => {})
})
const newEnv = Object.assign({}, process.env)
delete newEnv.ATOM_SHELL_INTERNAL_RUN_AS_NODE
delete newEnv.ELECTRON_RUN_AS_NODE
const ep = cp.spawn(electron, [path.join(__dirname, './electron.js')], {
	env: newEnv
})
ep.send = msg =>
	xf
		.post(`http://localhost:${port}`, { json: msg })
		.then(() => true)
		.catch(() => false)
ep.stdout.pipe(JSONStream.parse()).on('data', data => ep.emit('message', data))
module.exports = ep

if (require.main === module) {
	ep.on('message', console.log)
	ep.stderr.on('data', d => console.error(d.toString()))
}
