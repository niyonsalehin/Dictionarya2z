const express = require("express");
const app = express();
const ejs = require("ejs");
const fs = require("fs");

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

const mongoose = require("mongoose");

// Connection URL
// const url = 'mongodb+srv://doadmin:Jh38729EfUPb10x6@db-mongodb-sfo3-28271-1039369e.mongo.ondigitalocean.com/admin?authMechanism=DEFAULT'; // Replace with your MongoDB server URL

// const url =
//   "mongodb+srv://doadmin:Jh38729EfUPb10x6@db-mongodb-sfo3-28271-1039369e.mongo.ondigitalocean.com/bdword_v5?tls=true&authSource=admin&replicaSet=db-mongodb-sfo3-28271";


  const url = "mongodb://localhost:27017/urdu"

mongoose.connect(url).then((data) => {
  console.log(`mongodb connected with server : ${data.connection.host}`);
});

const UserSchema = new mongoose.Schema({
  sqlId: Number,
  word: String,
  gptans: String,
  trans: String,
  restriction: String,
  language: String,
  synonyms: [String],
  sentences: [String],
  subtitles: [
    {
      subs: { type: String },
      series_season_episode: { type: String },
      start_time: { type: String },
      end_time: { type: String },
    },
  ],
  randomWordSql: [String],
  restricted: String,
});

const WotdSchema = new mongoose.Schema({
  sqlId: Number,
  word: String,
  date: String,
});

app.get("/test", async (req, res) => {
  const D = new Date();
  const WotdModel = mongoose.model("word_of_the_day", WotdSchema);
  const result1 =  await WotdModel.findOne({ date: "Sun Oct 29 2023 00:00:00 GMT+0600 (GMT+06:00)" });
  const result2 =  await WotdModel.find({});
  console.log(result1.word);
  console.log(D);
  res.json(result1.word);
});

app.get("/:language/english-to-:language-wordList", async (req, res) => {
  const perPage = 100;
  const page = req.query.page || 1;
  const languagesWithSuffix = req.params.language;

    // Extract the language without the "-language" suffix
    const language = languagesWithSuffix.split("-")[0];
    const UserModel = mongoose.model(language, UserSchema);

  try {
    const users = await UserModel.find({})
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    const totalUsers = await UserModel.countDocuments({});
    res.render('template4', {
      language,
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / perPage),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/:language/index", async (req, res) => {

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var currentdate = new Date(); 
  var datetime = monthNames[currentdate.getMonth()] + " " + currentdate.getDate() + " " + currentdate.getFullYear();
  const regex = new RegExp(datetime, 'i'); 

  try {
    const WotdModel = mongoose.model("word_of_the_day", WotdSchema);
    const result1 =  await WotdModel.findOne({ date: "Sun Oct 29 2023 00:00:00 GMT+0600 (GMT+06:00)" });;
    const words = result1.word;
    const languagesWithSuffix = req.params.language;

    // Extract the language without the "-language" suffix
    const languages = languagesWithSuffix.split("-")[0];

    const UserModel = mongoose.model(languages, UserSchema);
    const result = await UserModel.findOne({ word: words });
    const wordsort = { name: -1 };
    const result2 =  await UserModel.find({}).limit(50);
    console.log(result1.word);

    if (!result) {
      return res.status(404).json({ message: "Word not found" });
    }

    const {
      word,
      trans,
      language,
      sentences,
      restricted,
  } = result;

  // Fisher-Yates shuffle algorithm to randomize the order
  const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  };

  // Randomize sentences, subtitles, and randomWordSqlfullDB
  shuffleArray(sentences);
  shuffleArray(result2);

    res.render("template2", {
      word,
      trans,
      language,
      sentences,
      restricted,
      result2,
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/:language/english-to-:language-meaning-wordHistory', async (req, res) => {
  res.render("searched-words");

})

app.get("/:language/english-to-:language-meaning-:word", async (req, res) => {
  try {
    const words = req.params.word;
    const languagesWithSuffix = req.params.language;

    // Extract the language without the "-language" suffix
    const languages = languagesWithSuffix.split("-")[0];

    // Replace hyphens in the word parameter with spaces
    const updatedWord = words.replace(/-/g, " ");

    const UserModel = mongoose.model(languages, UserSchema);
    const result = await UserModel.findOne({ word: updatedWord });
    console.log(result);

    if (!result) {
      return res.status(404).json({ message: "Word not found" });
    }

    const {
      word,
      gptans,
      trans,
      language,
      synonyms,
      sentences,
      subtitles,
      randomWordSql,
      restricted,
  } = result;

  // Map subtitles and create links
  const subtitlesWithLinks = subtitles.map((subtitle) => {
      const { series_season_episode, start_time } = subtitle;
      subtitle.link = `https://test.english-dictionary.help/screenshots/${series_season_episode}_${start_time}.webp`;
      return subtitle;
  });

  // Fisher-Yates shuffle algorithm to randomize the order
  const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  };

  // Randomize sentences, subtitles, and randomWordSql
  shuffleArray(sentences);
  shuffleArray(subtitlesWithLinks);
  shuffleArray(randomWordSql);

    res.render("template3", {
      word,
      gptans,
      trans,
      language,
      synonyms,
      sentences,
      subtitleResult: subtitlesWithLinks,
      randomWordSql,
      restricted,
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/search/:word", async (req, res) => {
  const { word } = req.params;

  try {
    const UserModel = mongoose.model("urdu", UserSchema);
    const result = await UserModel.find(
      { word: { $regex: new RegExp(`^${word}`, "i") } },
      "word -_id"
    ).limit(5);

    const similarWords = result.map((entry) => entry.word);

    // Send the similar words back to the client
    console.log(similarWords);
    res.json(similarWords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/GET-WORDS/:word", async (req, res) => {
  const { word } = req.params;
  const perPage = 100;
  const page = req.query.page || 1;

  try {
    const UserModel = mongoose.model("urdu", UserSchema);
    const result = await UserModel.find(
      { word: { $regex: new RegExp(`^${word}`, "i") } },
      "word -_id"
    ).skip((page - 1) * perPage).limit(perPage).exec();

    const totalUsers = await UserModel.countDocuments({ word: { $regex: new RegExp(`^${word}`, "i") } });

    const cPage= page;
    const letterWords = result.map((entry) => entry.word);
    const tPages= Math.ceil(totalUsers / perPage);
    
    console.log(tPages);
    res.json(letterWords, cPage, tPages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use((req, res, next) => {
  res.status(404).send("Custom 404 - Route Not Found");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on port 8080");
});
