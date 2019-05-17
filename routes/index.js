const csv = require('fast-csv'),
    fs = require('fs'),
    AWS = require('aws-sdk');

AWS.config.loadFromPath('./s3_config.json');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const myBucketName = 'atg-test-16052019';

exports.index = function(req, res){
    let params = { 
        Bucket: myBucketName
    };
    s3.listObjects(params, function (err, data) {
        if (err) {
            // console.log("error", err);
            // return 'There was an error viewing your album: ' + err.message
            return res.send({ "error": err });
        }
        // console.log(data.Contents,"<<<all content");
        let uploadedFiles = [];
        data.Contents.forEach(function(obj,index){
            // console.log(obj.Key,"<<<file path")
            uploadedFiles.push(obj.Key);
        });
        res.render("index", { title: 'Home', uploadedFiles: uploadedFiles });
    });
};

exports.view = function (req, res) {
    let params = { 
        Bucket: myBucketName,
        Key: req.query.file
    };
    s3.getObject(params, function (err, data) {
        if (err) {
            console.log("error", err);
            return res.send({ "error": err });
        }
        // let content = data.Body.toString('utf8');
        // console.log(content,"<<<all content");
        const csvRows = [];
        csv.fromString(data.Body.toString('utf8'), { headers: false, ignoreEmpty: true })
        .on("data", function (data) {
            csvRows.push(data); // push each row
        })
        .on("end", function () {
            res.render("view", { title: 'View CSV', rows : csvRows, fileName: req.query.file });
        });
    });
}

exports.upload = function (req, res){
    let item = fs.readFileSync(req.body.path,'utf8');
    let key = req.body.path.split('/').pop();
    let params = {
        Bucket: myBucketName,
        Key: key,
        Body: item
    };
  
    s3.putObject(params, function (err, data) {
        if (err) {
            console.log("Error uploading data: ", err);
            let error = new Error('Error uploading');
            error.httpStatusCode = 400;
            // return next(error);
            return res.send({ "error": error });
        }
        console.log(`Successfully uploaded data to ${myBucketName}/${key}`, data);
        fs.unlinkSync(req.body.path);
        res.redirect("/");
    });
};

exports.bucketlifecycle = function (req, res){
    let params = {
        Bucket: myBucketName, 
        LifecycleConfiguration: {
        Rules: [{
            Expiration: {
                Days: 14
            }, 
            Filter: {
                Prefix: ""
            }, 
            ID: "ArchivePolicy", 
            Status: "Enabled", 
            Transitions: [{
                    Days: 7, 
                    StorageClass: "GLACIER"
                }]
            }]
        }
    };
  
    s3.putBucketLifecycleConfiguration(params, function (err, data) {
        if (err) {
            console.log("Error setting lifecycle policy: ");
            console.error("Error setting lifecycle policy: ", err);
            let error = new Error('Error setting lifecycle policy');
            error.httpStatusCode = 400;
            // return next(error);
            return res.send({ "error": error });
        }
        res.redirect("/");
    });
};