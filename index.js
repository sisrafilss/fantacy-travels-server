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

    // GET - Get all published blogs
    app.get("/all-blog", async (req, res) => {
      const cursor = blogsCollection.find({});
      const blogs = await cursor.toArray();
      res.json(blogs);
    });


    // GET - Get all published blogs
    app.get("/blogs", async (req, res) => {
      const query = { publish: "Published" };
      const cursor = blogsCollection.find(query);
      const blogs = await cursor.toArray();
      res.json(blogs);
    });

    // GET - Get Top 10 published Blogs
    app.get("/top-blogs", async (req, res) => {
      const query = { publish: "Published" };
      const cursor = blogsCollection.find(query);
      const topBlogs = await cursor.limit(10).toArray();
      res.json(topBlogs);
    });

    // GET - Get Single Blog by blog id
    app.get("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const blog = await blogsCollection.findOne(query);
      res.json(blog);
    });

    // GET -
    app.get("/all-blogs", async (req, res) => {
      const query = { email: req.query.email };
      const cursor = blogsCollection.find(query);
      const blogs = await cursor.toArray();
      res.json(blogs);
    });

    // POST - Add a new Blog
    app.post("/blogs", async (req, res) => {
      const blogObj = req.body;

      // Extract image data and convert it to binary base 64
      const pic = req.files.thumbnail;
      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");

      // Extract other information and make our blog object including image for saveing into MongoDB
      const newBlog = {
        email: blogObj.email,
        title: blogObj.title,
        thumbnail: imageBuffer,
        author: {
          name: blogObj.name,
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
        publish: "Pending",
      };
      const result = await blogsCollection.insertOne(newBlog);
      res.json(result);
    });

    // Delete - Delete a blog by id
    app.delete("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await blogsCollection.deleteOne(query);
      res.json(result);
    });

    // PUT - Update Blogs publish status
    app.put("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const found = await blogsCollection.findOne(query);
      found.publish = "Published";
      const filter = query;
      const options = { upsert: false };
      const updateDoc = { $set: found };
      const result = await blogsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    /* ================== USERs ========================= */

    // POST - Add user data to Database
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.json(result);
    });

    // PUT - Update user data to database for third party login system
    app.put("/users", async (req, res) => {
      const userData = req.body;
      const filter = { email: userData.email };
      const options = { upsert: true };
      const updateDoc = { $set: userData };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // PUT - Set an user role as admin
    app.put("/make-admin", async (req, res) => {
      const filter = req.body;
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // GET - Admin Status
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      let isAdmin = false;
      if (result?.role === "admin") {
        isAdmin = true;
        res.json({ admin: isAdmin });
      } else {
        res.json({ message: "You are not an Admin." });
      }
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
