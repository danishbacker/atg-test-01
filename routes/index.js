const csv = require('fast-csv'),
    fs = require('fs'),
    AWS = require('aws-sdk');

// Note: config file not present in repo
AWS.config.loadFromPath('./s3_config.json');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
// Bucket name in AWS account.
const myBucketName = 'atg-test-16052019';

/*
 * List all previously uploaded csv files in s3 bucket
 */
exports.index = function(req, res){
    let params = { 
        Bucket: myBucketName
    };
    s3.listObjects(params, function (err, data) {
        if (err) {
            return res.send({ "error": err });
        }
        let uploadedFiles = [];
        data.Contents.forEach(function(obj,index){
            uploadedFiles.push(obj.Key);
        });
        res.render("index", { title: 'Home', uploadedFiles: uploadedFiles });
    });
};

/*
 * Open file stored in s3 bucket and display contents
 */
exports.view = function (req, res) {
    let params = { 
        Bucket: myBucketName,
        Key: req.query.file
    };
    // Download s3 object
    s3.getObject(params, function (err, data) {
        if (err) {
            console.log("error", err);
            return res.send({ "error": err });
        }
        const csvRows = [];
        // convert buffer to utf8 string and parse csv rows
        csv.fromString(data.Body.toString('utf8'), { headers: false, ignoreEmpty: true })
        .on("data", function (data) {
            // push each row to array csvRows
            csvRows.push(data);
        })
        .on("end", function () {
            res.render("view", { title: 'View CSV', rows : csvRows, fileName: req.query.file });
        });
    });
}

/*
 * Upload file saved in local to s3 bucket
 */
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
            console.log("Error uploading data: ");
            console.error(err);
            let error = new Error('Error uploading');
            error.httpStatusCode = 400;
            return res.send({ "error": error });
        }
        console.log(`Successfully uploaded data to ${myBucketName}/${key}`, data);
        fs.unlinkSync(req.body.path);
        res.redirect("/");
    });
};

/*
 * Set s3 bucket life-cycle policy
 */
exports.bucketlifecycle = function (req, res){
    // Policy applies to all files in bucket as below.
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
            console.error(err);
            let error = new Error('Error setting lifecycle policy');
            error.httpStatusCode = 400;
            return res.send({ "error": error });
        }
        console.log(`Successfully applied life-cycle policy to ${myBucketName}`, data);
        res.redirect("/");
    });
};