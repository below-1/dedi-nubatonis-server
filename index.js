const createApp = require('./app')

const app = createApp(process.env)

app.listen(process.env.PORT, '0.0.0.0', (err, address) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }
  app.blipp()
})
