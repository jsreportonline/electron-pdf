const http = require('http')
const convertFactory = require('electron-html-to')

const conversion = convertFactory({
  converterPath: convertFactory.converters.PDF,
  numberOfWorkers: 2,
  timeout: 60000,
  tmpDir: process.env.temp
})

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain')
    return res.end('OK')
  }
  console.log('processing request')

  var data = ''
  req.on('data', function (chunk) {
    data += chunk.toString()
  })

  req.on('end', function () {
    let opts
    try {
      opts = JSON.parse(data)
    } catch (e) {
      console.error(e)
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/plain')

      return res.end(e.stack)
    }

    conversion(opts, (err, result) => {
      if (err) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        return res.end(JSON.stringify({
          error: {
            message: 'Error when executing electron ' + err.message,
            stack: err.stack
          }
        }))
      }

      console.log('conversion finished')
      result.stream.pipe(res)
    })
  })
})

server.listen(8000)
