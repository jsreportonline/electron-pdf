const http = require('http')
const toArray = require('stream-to-array')
const convertFactory = require('electron-html-to')

const conversion = convertFactory({
  electronArgs: ['--disable-gpu'],
  converterPath: convertFactory.converters.PDF,
  numberOfWorkers: 2,
  timeout: 20000,
  tmpDir: process.env.temp
})

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain')
    return res.end('OK')
  }
  console.log('processing request')

  var data = []
  req.on('data', function (chunk) {
    data.push(chunk)
  })

  const error = (err, critical) => {
    if (critical === true) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/plain')

      res.end(err.stack)
    } else {
      res.statusCode = 400
      res.setHeader('Content-Type', 'application/json')

      res.end(JSON.stringify({
        error: {
          message: err.message,
          stack: err.stack
        }
      }))
    }
  }

  req.on('end', function () {
    let opts
    try {
      opts = JSON.parse(Buffer.concat(data).toString())
    } catch (e) {
      console.error(e)
      return error(e, true)
    }

    conversion(opts, (err, result) => {
      if (err) {
        return error(err, true)
      }

      console.log('conversion finished')

      toArray(result.stream, (err, arr) => {
        if (err) {
          return error(err, true)
        }

        console.log('sending response')

        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')

        delete result.stream
        result.content = Buffer.concat(arr).toString('base64')
        res.end(JSON.stringify(result))
      })
    })
  })
})

server.listen(8000)
