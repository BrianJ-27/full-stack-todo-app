// Load environment variables (optional but good for local development)
// This reads .env and sets process.env.MONGO_URI
require('dotenv').config()

// create Express server
let express = require('express')
let sanitizeHtml = require('sanitize-html')

// connect to MongoDB
let { MongoClient } = require('mongodb')
const { ObjectId } = require('mongodb')

// app is my local web server
let app = express()

// db will hold the reference to my MongoDB database
let db

// Serve static files from the 'public' directory
app.use(express.static('public'))

// Connect to MongoDB and start the server
async function go() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
  const client = new MongoClient(uri)

  try {
    await client.connect()
    db = client.db('todoApp')
    app.listen(3000, () => console.log('Server listening on http://localhost:3000'))
  } catch (err) {
    console.error('MongoDB connection error:', err)
  }
}

go().catch(console.error)

// Parse incoming form data
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Basic HTTP auth middleware
function passwordProtected(req, res, next) {
  res.set('WWW-Authenticate', 'Basic realm="Simple To-Do App"')
  if (req.headers.authorization === 'Basic bGVhcm46amF2YXNjcmlwdA==') {
    next()
  } else {
    res.status(401).send('Authentication required.')
  }
}

// Apply auth to all routes
app.use(passwordProtected)

// HTML response for home page
app.get('/', async (req, res) => {
  const items = await db.collection('items').find().toArray()

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Simple To-Do App</title>
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css">
    </head>
    <body>
      <div class="container">
        <h1 class="display-4 text-center py-1">To-Do App</h1>

        <div class="jumbotron p-3 shadow-sm">
          <form id="create-form" action="/create-item" method="POST">
            <div class="d-flex align-items-center">
              <input id="create-field" name="item" autofocus autocomplete="off" class="form-control mr-3" type="text" style="flex: 1;">
              <button class="btn btn-primary">Add New Item</button>
            </div>
          </form>
        </div>

        <ul id="item-list" class="list-group pb-5"></ul>
      </div>

      <script>
        let items = ${JSON.stringify(items)}
      </script>
      <script src="https://unpkg.com/axios@1.6.7/dist/axios.min.js"></script>
      <script src="/browser.js"></script>
    </body>
    </html>
  `)
})

// Create item
app.post('/create-item', async (req, res) => {
  const userInput = req.body.text?.trim()
  const safeText = sanitizeHtml(userInput, { allowedTags: [], allowedAttributes: {} })

  if (!safeText) {
    return res.status(400).json({ error: 'Text cannot be empty.' })
  }

  const info = await db.collection('items').insertOne({ text: safeText })
  res.json({ _id: info.insertedId, text: safeText })
})

// Update item
app.post('/update-item', async (req, res) => {
  const userInput = req.body.textInput?.trim()
  const safeText = sanitizeHtml(userInput, { allowedTags: [], allowedAttributes: {} })

  await db.collection('items').findOneAndUpdate(
    { _id: ObjectId.createFromHexString(req.body.id) },
    { $set: { text: safeText } }
  )
  res.send('Success')
})

// Delete item
app.post('/delete-item', async (req, res) => {
  await db.collection('items').deleteOne({ _id: ObjectId.createFromHexString(req.body.id) })
  res.send('Success')
})

