//dependencies required for the app
const express = require("express");
const http = require('http');
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
//render css files
// app.use(express.static("public"));
app.use(express.static(__dirname + '/public'));

//post route for uploading file to s3 bucket.
app.post('/upload', routes.upload);

// Set temp storage
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'tmp');
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + '.csv');
    }
});
   
let uploadlocal = multer({ storage: storage });

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
        csvRows.push(data); // push each row
    })
    .on("end", function () {
        res.render("parse", { title: 'Parser', rows: csvRows, path: req.file.path });
    });
});

app.get('/view', routes.view);

app.get('/bucketlifecycle', routes.bucketlifecycle);

// app.post('/removetask', routes.remove);

app.get('/', routes.index);

app.listen(app.get('port'), () => {
  console.log('Express server listening on port ' + app.get('port'));
  console.log(process.env);
});

// http.createServer(app).listen(app.get('port'), function(){
//     console.log('Express server listening on port ' + app.get('port'));
// });