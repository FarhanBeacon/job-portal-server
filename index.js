const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Custom middleware to verify JWT token
const verifyJWT = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vasbeiy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const jobsCollections = client.db("jobPortal").collection("jobs");
    const jobApplicationsCollections = client
      .db("jobPortal")
      .collection("jobApplications");

    // Auth Related APIs
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "5h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false, // Set to true if using HTTPS, false for local development
        })
        .send({ success: true });
    });

    // Job Related APIs
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }
      const cursor = jobsCollections.find(query);
      const jobs = await cursor.toArray();
      res.send(jobs);
    });

    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const job = await jobsCollections.findOne(query);
      res.send(job);
    });

    app.post("/jobs", async (req, res) => {
      const job = req.body;
      const result = await jobsCollections.insertOne(job);
      res.send(result);
    });

    app.post("/jobApplications", async (req, res) => {
      const application = req.body;
      const result = await jobApplicationsCollections.insertOne(application);
      res.send(result);
    });

    app.get("/jobApplications/job/:JobId", async (req, res) => {
      const jobId = req.params.JobId;
      query = { JobId: jobId };
      const cursor = jobApplicationsCollections.find(query);
      const applications = await cursor.toArray();
      res.send(applications);
    });

    app.patch("/jobApplications/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          Status: req.body.status,
        },
      };
      const result = await jobApplicationsCollections.updateOne(
        filter,
        updateDoc
      );
      res.send(result);
    });

    // Get job applications by email
    // Example: http://localhost:5000/jobApplications?email=farhanahmedbeacon@gmail.com
    app.get("/jobApplications", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = { Applicant_Email: email };
      const cursor = jobApplicationsCollections.find(query);
      const applications = await cursor.toArray();

      if (req.decoded.email !== req.query.email) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      // It's not a professional way to fetch job details in a loop.
      for (const application of applications) {
        const jobQuery = { _id: new ObjectId(application.JobId) };
        const job = await jobsCollections.findOne(jobQuery);
        if (job) {
          application.JobTitle = job.title;
          application.CompanyName = job.company;
          application.JobLocation = job.location;
          application.CompanyLogo = job.company_logo;
        }
      }
      res.send(applications);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.listen(port);
