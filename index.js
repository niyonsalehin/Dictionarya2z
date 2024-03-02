const express = require("express");
const app = express();
const ejs = require("ejs");
const fs = require("fs");
const compression = require('compression');
app.use(compression());

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

const mongoose = require("mongoose");

// Connection URL
// const url = 'mongodb+srv://doadmin:Jh38729EfUPb10x6@db-mongodb-sfo3-28271-1039369e.mongo.ondigitalocean.com/admin?authMechanism=DEFAULT'; // Replace with your MongoDB server URL

//const url ="mongodb+srv://doadmin:Jh38729EfUPb10x6@db-mongodb-sfo3-28271-1039369e.mongo.ondigitalocean.com/bdword_v5?tls=true&authSource=admin&replicaSet=db-mongodb-sfo3-28271";

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

app.get('/ads.txt', (req, res) => {
  const adsFilePath = __dirname + '/ads.txt';
  res.sendFile(adsFilePath);
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

app.get('/:language/gets-words/:page', async (req, res) => {
  const page = parseInt(req.params.page) || 1;
  const pageSize = 100; // Set the number of items per page
  const languagesWithSuffix = req.params.language;
  const language = languagesWithSuffix.split("-")[0];
  const UserModel = mongoose.model(language, UserSchema);

  try {
    const words = await UserModel.find({})
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const totalWords = await UserModel.countDocuments({});
    const totalPages = Math.ceil(totalWords / pageSize);

    res.json({ words, totalPages });
  } catch (error) {
    console.error('Error retrieving words:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/:language/word-data/:word/:page', async (req, res) => {
  const { word } = req.params;
  const page = parseInt(req.params.page) || 1;
  const pageSize = 100; // Set the number of items per page
  const languagesWithSuffix = req.params.language;
  const language = languagesWithSuffix.split("-")[0];
  const UserModel = mongoose.model(language, UserSchema);

  try {
    const words = await UserModel.find(
      { word: { $regex: new RegExp(`^${word}`, "i") } },
      "word -_id"
    ).skip((page - 1) * pageSize).limit(pageSize).exec();


    const totalWords = await UserModel.countDocuments({ word: { $regex: new RegExp(`^${word}`, "i") } });
    const totalPages = Math.ceil(totalWords / pageSize);
    const cPage= page;

    res.json({ words, totalPages , cPage });
  } catch (error) {
    console.error('Error retrieving words:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/:language/english-to-:language-wordList/", async (req, res) => {
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
      hasNextPage: (perPage * page) < totalUsers,
      hasPreviousPage: page > 1,
      nextPage: parseInt(page) + 1,
      previousPage: page - 1,
      totalPages: Math.ceil(totalUsers / perPage),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/:language/", async (req, res) => {

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var currentdate = new Date();
  var day = currentdate.getDate();
  var dayString = day < 10 ? '0' + day : day;  
  var datetime = monthNames[currentdate.getMonth()] + " " + dayString + " " + currentdate.getFullYear();
  console.log(datetime);
  const regex = new RegExp(datetime, "i"); 

  try {
    const WotdModel = mongoose.model("word_of_the_day", WotdSchema);
    const result1 =  await WotdModel.findOne({ date: {$regex : regex} });
    const words = result1.word;
    const languagesWithSuffix = req.params.language;
    const languages = languagesWithSuffix.split("-")[0];

    const UserModel = mongoose.model(languages, UserSchema);
    const result = await UserModel.findOne({ word: words });
    const wordsort = { name: -1 };
    const randomWords = await UserModel.aggregate([
        { $sample: { size: 5 } },
        { $project: { _id: 0, word: 1 } }
      ]).exec();

    if (!result) {

      const emptyArray = [];

      res.render("template2", {
          word:"Welcome",
          trans:"No Translation Found",
          language: languages,
          sentences: emptyArray,
          restricted:"No",
          randomWords,
        });
      //return res.status(404).json({ message: "Word not found" });
    }else{

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

        res.render("template2", {
          word,
          trans,
          language,
          sentences,
          restricted,
          randomWords,
        });

    }
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/:language/english-to-:language-wordHistory', async (req, res) => {

  const languagesWithSuffix = req.params.language;
  const language = languagesWithSuffix.split("-")[0];

  res.render('template5', {
      language,
    });

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
      res.redirect('/'+ languages +'/');
    }else{

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

    }

  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/:language/search/:word", async (req, res) => {
  const { word } = req.params;
  const languagesWithSuffix = req.params.language;
  const language = languagesWithSuffix.split("-")[0];

  try {
    const UserModel = mongoose.model(language, UserSchema);
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

app.get("/:language/GET-WORDS/:word", async (req, res) => {
  const { word } = req.params;
  const perPage = 100;
  const page = req.query.page || 1;
  const languagesWithSuffix = req.params.language;
  const language = languagesWithSuffix.split("-")[0];

  try {
    const UserModel = mongoose.model(language, UserSchema);
    const result = await UserModel.find(
      { word: { $regex: new RegExp(`^${word}`, "i") } },
      "word -_id"
    ).skip((page - 1) * perPage).limit(perPage).exec();

    const totalUsers = await UserModel.countDocuments({ word: { $regex: new RegExp(`^${word}`, "i") } });

    const cPage= page;
    const letterWords = result.map((entry) => entry.word);
    const tPages= Math.ceil(totalUsers / perPage);
    
    res.json({letterWords, cPage, tPages});
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
