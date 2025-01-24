const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

// database connection
mongoose.connect(process.env.DB_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("successfully connected to mongodb");
});

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

// import schemas
const UserSchema = require("./schemas/userSchema.js");
const ExerciseSchema = require("./schemas/exerciseSchema.js");

// model schemas
const User = mongoose.model("User", UserSchema);
const Exercise = mongoose.model("Exercise", ExerciseSchema);

// list users
app.get("/api/users", async (request, response) => {
  const users = await User.find({}).select("_id username");
  if (!users) {
    response.send("No users");
  } else {
    response.json(users);
  }
});

// post user and store in database
app.post("/api/users", async (request, response) => {
  console.log(request.body);
  const userObj = new User({
    username: request.body.username,
  });

  try {
    const user = await userObj.save();
    console.log(user);
    response.json(user);
    if (user == undefined || user == "") throw new Error("Error saving user");
  } catch (error) {
    console.error(error);
  }
});

app.post("/api/users/:_id/exercises", async (request, response) => {
  const id = request.params._id;
  const { description, duration, date } = request.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      response.send("Could not find user");
      throw new Error("Could not find user");
    } else {
      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      });

      const exercise = await exerciseObj.save();

      response.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
      });
    }
  } catch (error) {
    response.send("There was an error saving the exercise");
    console.error(error);
  }
});

app.get("/api/users/:_id/logs", async (request, response) => {
  const { from, to, limit } = request.query;
  const id = request.params._id;
  const user = await User.findById(id);
  if (!user) {
    response.send("Could not find user");
    return;
  }
  let dateObj = {};
  if (from) {
    dateObj["$gte"] = new Date(from);
  }
  if (to) {
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    user_id: id,
  };
  if (from || to) {
    filter.date = dateObj;
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500);

  const log = exercises.map((e) => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString(),
  }));

  response.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
