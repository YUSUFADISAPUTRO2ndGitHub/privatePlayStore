process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const app = express();
const port = 3006;
app.use(express.json())
const { MongoClient } = require("mongodb");

// Replace the uri string with your MongoDB deployment's connection string.
// const uri =
//   "mongodb+srv://<user>:<password>@<cluster-url>?retryWrites=true&writeConcern=majority";
const uri =
  "mongodb://172.31.207.222:27017/?readPreference=primary&ssl=false";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
async function run() {
  try {
    await client.connect();
    const database = client.db('uploadData');
    const image = database.collection('fs.chunks');
    // Query for a movie that has the title 'Back to the Future'
    const query = {files_id:"d4b460ed714a4931814a45041a1f79f6"};
    const theimage = await image.findOne(query);
    console.log(theimage);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})