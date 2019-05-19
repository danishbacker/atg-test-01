const express = require("express");
const routes = require('./routes');
const bodyParser = require("body-parser");
const csv = require('fast-csv');
const multer  = require('multer');
const app = express();

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname + '/views');
app.set("view engine", "ejs");

app.use(express.static(__dirname + '/public'));

/*
 * POST route: Upload file to S3 bucket.
 */
app.post('/upload', routes.upload);

// Multer config set storage
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'tmp');
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + '.csv');
    }
});
// Apply multer config
let uploadlocal = multer({ storage: storage });

/*
 * POST route: To parse uploaded file and save in local to process.
 */
app.post('/parse', uploadlocal.single('soh'), (req, res, next) => {
    const file = req.file;
    if (!file) {
      const error = new Error('Please upload soh.csv file');
      error.httpStatusCode = 400;
      return next(error);
    }
    const csvRows = [];
    csv.fromPath(req.file.path, { headers: false, ignoreEmpty: true })
    .on("data", function (data) {
        csvRows.push(data);
    })
    .on("end", function () {
        res.render("parse", { title: 'Parser', rows: csvRows, path: req.file.path });
    });
});

/*
 * GET route: To view previously uploaded files.
 */
app.get('/view', routes.view);

/*
 * GET route: To set bucket life-cycyle policy.
 */
app.get('/bucketlifecycle', routes.bucketlifecycle);

/*
 * GET route: Home page with three actions, 
 * 1. List uploaded files in S3 bucket.
 * 2. Upload CSV file.
 * 3. Set bucket policy.
 */
app.get('/', routes.index);

app.listen(app.get('port'), () => {
  console.log('Server listening on port ' + app.get('port'));
});