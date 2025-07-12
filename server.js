// create Express server
let express = require('express');
let sanitizeHtml = require('sanitize-html');
// connect to MongoDB
let { MongoClient} = require('mongodb');
const { ObjectId } = require('mongodb');


// app is my local web server
let app = express();
// db will hold the reference to my MongoDB database
// I will use MongoDB to perform CRUD operations
let db;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// connect to local MongoDB and start the server
// The server waits or awaits to start until the database is ready
async function go() {
  let client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  db = client.db('todoApp');
  app.listen(3000, () => console.log('Server listening on http://localhost:3000'));
}
// Call the go function to start the server
// If there is an error, it will be caught and logged to the terminal console
go().catch(console.error);

//Boilplate code to parse incoming Form data with the body-parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function passwordProtected(req, res, next) {
  res.set('WWW-Authenticate', 'Basic realm="Simple To-Do App"');
  console.log(req.headers.authorization);
  if( req.headers.authorization == 'Basic bGVhcm46amF2YXNjcmlwdA==' ) {
    next();
  } else {
    res.status(401).send('Authentication required.');
  }
 }

 // Apply the password protection middleware to all routes
 app.use(passwordProtected);

// When user visits the root URL, they get the form
// Form uses POST method to send back data to the server
app.get('/', passwordProtected,  async (req, res) => {
 const items = await db.collection('items').find().toArray()
 
 res.send(`
  <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple To-Do App</title>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css" integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
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
    
    <ul id="item-list" class="list-group pb-5">
     
    </ul>
    
  </div>
  <script>
  let items = ${JSON.stringify(items)};
  </script>
  <script src="https://unpkg.com/axios@1.6.7/dist/axios.min.js"></script>
  <script src="/browser.js"></script>
</body>
</html>
  `)
})

// Handle form submission
app.post('/create-item', async (req, res) => {
  const userInput = req.body.text?.trim();
  const safeText = sanitizeHtml(userInput, { allowedTags: [], allowedAttributes: {} });
  // Reject empty or whitespace-only submissions
  if (!safeText) {
    return res.status(400).json({ error: "Text cannot be empty." });
  }
  const info = await db.collection('items').insertOne({ text: safeText });
  res.json({ _id: info.insertedId, text: safeText });
});


app.post('/update-item', async (req, res) => {
  const userInput = req.body.textInput?.trim();
  const safeText = sanitizeHtml(userInput, { allowedTags: [], allowedAttributes: {} });
  await db.collection('items').findOneAndUpdate(
    { _id: ObjectId.createFromHexString(req.body.id) },
    { $set: { text: safeText } }
  );
  res.send('Success');
});


app.post('/delete-item', async (req, res) => {
   await db.collection('items').deleteOne({_id: ObjectId.createFromHexString(req.body.id)})
   res.send('Success');
})

