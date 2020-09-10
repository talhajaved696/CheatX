const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
var favicon = require('serve-favicon')
const multer = require('multer');
const methodOverride = require('method-override');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
// Load config (Global Variables)
dotenv.config({
  path: './config/config.env',
});
// Passport config
require('./config/passport')(passport);
// Database connection
connectDB();

const app = express();
app.use(favicon(path.join(__dirname, '/public/images/favicon.ico')))
// Form Body Parser
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());

//Method override
app.use(
  methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);
// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Handlebars Helpers
const {
  formDate,
  stripTags,
  truncate,
  editIcon,
  select,
} = require('./helpers/hbs');

// Handlebars
app.engine(
  '.hbs',
  exphbs({
    helpers: {
      formDate,
      stripTags,
      truncate,
      editIcon,
      select,
    },
    defaultLayout: 'main',
    extname: '.hbs',
  })
);
app.set('view engine', '.hbs');
// Express session must be above passort middleware
app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
    }),
  })
);
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
// Set global var
app.use(function (req, res, next) {
  res.locals.user = req.user || null;
  next();
});
// Static Folder
app.use(express.static(path.join(__dirname, 'public')));
// Routers
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/course', require('./routes/courses'));
const PORT = process.env.PORT || 3000;
app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
