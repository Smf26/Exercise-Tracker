const express = require('express');
//const cors = require('cors');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const mongoose = require('mongoose');
const moment = require('moment');
const User = require('./models/User');
const Exercise = require('./models/Exercise')
require('dotenv').config();

// App init
const app = express();

// Database mounting
const uri = process.env.MONGO_URI;
const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });

    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
connectDB()

// Middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//app.use(cors());
app.use(express.static('public'));


//Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Create a user by posting form data username & return an object with username and _Id
app.post('/api/exercise/new-user', async(req, res) => {
  const { username } = req.body;
  if(username == null || username == "") {
    return res.status(401).json({
      error: 'Please enter username'
    });
  }
  const userObj = {
    _id: new mongoose.Types.ObjectId,
    username: username
  };
  const user = new User(userObj);
  try {
    const saveUser = await user.save()
    .then(data => {
      const response = {
        _id: data._id,
        username: data.username
      }
      res.status(200).json(response);
    })
  }catch (error) {
    res.status(500).json({
      error: error
    });
  }
});
// Get an array of All users with the new-user route returned object
app.get('/api/exercise/users', (req, res) => {
  try {
    User.find({}).select("_id username").exec()
      .then(user => {
        if(user) {
          res.status(200).json(user);
        } else {
          res.status(404).json({
            message: 'No users found'
          });
        }
      })
  }catch (error) {
    res.status(500).json({
      error: error
    });
  }
});

// Add an exercise to any user by posting  form data, userId(_id),description,duration, date(optional parse)
// If no date is supplied the returned object must have a default date current one
app.post('/api/exercise/add', async (req, res) => {
  let { description, duration, date, userId } = req.body;
  
  const exercise = new Exercise({
    _id: new mongoose.Types.ObjectId,
    description: description,
    duration: duration,
    date: date || Date.now(),
    user: userId
  });
  try {
    const user = await User.findOne({ _id: userId})
    user.exercises.push(exercise)
    const updated = await user.save()
    .then(data => {
      res.status(200).json(data.exercises.slice(-1)[0])
    })
     
  } catch (error) {
    res.status(500).json({
      error: error
    });
  }
});



app.get('/api/exercise/log/:userId', (req, res) => {
  let { userId, limit, from, to   } = req.query;

  try {
     User.findOne({_id: userId}).select()
    .exec((err, userExercises) => {
      if(userExercises == "" || userExercises == null) {
        return res.status(204).json({
          message: 'No resourses found with that userId'
        });
      } else {
        const dateFrom = new Date(from);
        const dateTo = new Date(to);
        const exrciseArr = userExercises.exercises;

        const logs = exrciseArr.filter((item) => {
          return item.date.getTime() >= dateFrom.getTime() && item.date.getTime() <= dateTo.getTime(); 
        })
        console.log(logs)
        const arr = logs.slice(0, limit);
        const response = {
          _id: userExercises._id,
          username: userExercises.username,
          data: {
            logs: arr,
            count: arr.length
          }
        }
        res.json(response);
      }
      
    })
  } catch (error) {
    res.status(500).json({
      error: error
    });
  }
})



// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})


app.listen(3000, () => {
  console.log(`Server started on port 3000`);
});