const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const fileUpload = require("express-fileupload");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Database Info
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.quv1r.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();

    console.log("database connected successfully");

    const database = client.db("fantacyTravels");
    // Collections
    const usersCollection = database.collection("users");
    const blogsCollection = database.collection("blogs");

    /* ========================== Blogs ========================== */

    // GET - Get all blogs
    app.get("/blogs", async (req, res) => {
      const cursor = blogsCollection.find({});
      const blogs = await cursor.toArray();
      res.json(blogs);
    });

    // GET - Get Top 10 Blogs
    app.get("/top-blogs", async (req, res) => {
      const cursor = blogsCollection.find({});
      const topBlogs = await cursor.limit(10).toArray();
      res.json(topBlogs);
    });

    // GET - Get Single Blog by blog id
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const banner = await blogsCollection.findOne(query);
      res.json(banner);
    });

    // POST - Add a new Blog
    app.post("/blogs", async (req, res) => {
      console.log(req.body);

      const blogObj = req.body;

      // Extract image data and convert it to binary base 64
      const pic = req.files.thumbnail;
      // console.log(pic);
      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");

      // Extract other information and make our blog object including image for saveing into MongoDB
      const newBlog = {
        title: blogObj.title,
        thumbnail: imageBuffer,
        author: {
          name: blogObj.name,
          email: blogObj.email,
          photoURL: blogObj.image,
          postedOn: blogObj.postedOn,
        },
        description: blogObj.description.split("\r\n"),
        travelInfo: {
          date: blogObj.date,
          location: blogObj.location,
          expence: blogObj.expense,
          rating: blogObj.rating,
        },
      };
      const result = await blogsCollection.insertOne(newBlog);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Fantacy Travels Express Server is running...");
});

app.listen(port, () => {
  console.log("Server has started at port:", port);
});
