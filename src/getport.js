const http = require('http')

module.exports = () =>
	new Promise((res, rej) => {
		const server = http.createServer()
		server.listen(0, () => {
			res(server.address().port)
			server.close()
		})
		server.on('error', () => {
			rej()
			server.close()
		})
	})

if (require.main === module) {
	module.exports().then(console.log)
}
