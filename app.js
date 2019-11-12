var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var lessMiddleware = require('less-middleware');
var logger = require('morgan');
var MongoClient = require('mongodb').MongoClient;
var redis = require('redis');
var zookeeper = require('node-zookeeper-client');
const request = require('request');

var zkclient = zookeeper.createClient('192.168.200.181:2181');
var pathzs = process.argv[2];



var APIGatewayURL = "";
//console.log('Start');
zkclient.once('connected',function(){

  zkclient.exists('/webnode', function (error, stat) {
    if (error) {
        console.log(error.stack);
        return;
    }
    if (stat) {
        console.log('Node exists.');
    } else {
      var JsonData = "{'webservernode':{'url':'https://192.168.200.148:5000'}}";
      zkclient.create('/webnode',JsonData, function (error) {
        if (error) {
            console.log('Failed to create node: %s due to: %s.', pathzs, error);
        } else {
            console.log('Node: %s is successfully created.', pathzs);
        }
    });
    }
  });
  
  zkclient.exists('/apigateway', function (error, stat) {
    if (error) {
        console.log(error.stack);
        zkclient.close()
        return;
    }
    if (stat) {
        console.log('Node exists.');
        zkclient.getData('/apigateway',function(error,stat){},function(error,data,stat){
          var apidata = data.toString('utf8');
          var jData = JSON.parse(apidata);
          APIGatewayURL = jData["endpoints"]["url"];
          zkclient.close()
        });
    } else {
            console.log('APIGateway Node Does Not Exists');
            zkclient.close()
      }
  });

});

zkclient.connect();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
global.__basedir = __dirname;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.post('/submit-userinfo',function(rq,rs){
 try{ 
  var userName = rq.body.username;
  var password = rq.body.password;
  var _resultObj = require("./models/verifycredrs");
  var _result = new _resultObj('','');

  //APIGatewayURL = "http://0.0.0.0:4001"
    console.log("Before validating username");
    uri = APIGatewayURL + "/auth/validate/" + userName + "/" + password;
    console.log("URL : " + uri);
    request.post(uri,{json:true},(err,res,body)=>{
    console.log("Response recieved")
    var header = "<div style='border-bottom: 5px solid #084e8a;'><div class='containerNewUI'><div class='containerBlock'><a href='#' id='headerLink_New' onclick='javascript:parent.ShowScreenHelper_OpenInTabOrPopUp('http://www.cubussolutions.com',screen.height,screen.width)' title='CUBUS Logo' class='logo'><img id='ctl00_ctl01_imgLogo_New' class='primarylogo' src='/images/logo.png' alt='CUBUS Logo' style='border-width:0px;'></a></div></div></div>";
    if(err){
      console.log("ERROR : " + err);
      rs.render('index', { header:header, title: 'CUBUS',label_login:'Login',label_username:'Username',label_password:'Password',Error:'Unable to validate username/password'});    
    }
    else {
      try{
        if(res.body.result.status=="true")
        {
          console.log("Response recieved about to redirect the user");
          rs.redirect("./users?id=" + res.body.result.data.id);
        }
        else
        {
          console.log("Recieved Status False");
          rs.render('index', { header:header, title: 'CUBUS',label_login:'Login',label_username:'Username',label_password:'Password',Error:'Unable to validate username/password'});
        }
      }
      catch(ex)
      {
        console.log("Exception Occured");
        rs.render('index', { header:header, title: 'CUBUS',label_login:'Login',label_username:'Username',label_password:'Password',Error:'Unable to validate username/password'});
      }
    }
  });
 }
 catch(e)
 {
   console.log("Exception occured : " + toString(e));
 }
  
  //Code to call DB and Redis directly
//   const uri = "mongodb+srv://cubus:@Cu2010bus@cluster0-kxvpc.mongodb.net/test?retryWrites=true&w=majority";
//   const client = new MongoClient(uri, { useNewUrlParser: true });
//   client.connect(err => {
//     var query = {userName:userName,password:password};
//     client.db("CubusDBTest").collection("users").find(query).toArray(function(err,collects){
//       if(err)
//       {
//         console.log(err);
//         _result.setError("Unable to verify the user. Please try again");
//       }
//       else if(collects.length>0)
//       {        
//         var jsonResult = JSON.stringify(collects[0]);
//         //console.log('json result : ' + jsonResult);
//         var jsonContent = JSON.parse(jsonResult);
//         //console.log("jsonContent Id : " + jsonContent._id);
//         _result.setId(jsonContent._id);
        
//         redisClient    = redis.createClient({port: 11737,host:'redis-11737.c1.asia-northeast1-1.gce.cloud.redislabs.com',password:'vPt0IxefzMh8SdhfgbwzI5ltabzkz8BK'});
  
//         redisClient.on('connect',function(){
//         //console.log('Redis connected');

//         redisClient.get(jsonContent._id,function(err,value){
//           if(err)
//           {
//             console.log('Error retrieving key from redis : ' + err);
//             redisClient.set(jsonContent._id,jsonResult,'EX',60*60*24,function(err){
//               if(err)
//               {
//                 console.log('Error setting redis key : ' + err);
//               }
//               else
//               {
//                 //console.log('Redis key set successfully');
//                 res.redirect("./users?id=" + jsonContent._id);
//               }
//             });
//           }
//           else if(value!=null)
//           {
//             //console.log('Redis key already exists : ' + value);
//             res.redirect("./users?id=" + jsonContent._id);
//           }
//           else
//           {
//             redisClient.set(jsonContent._id,jsonResult,'EX',60*60*24,function(err){
//               if(err)
//               {
//                 console.log('Error setting redis key : ' + err);
//               }
//               else
//               {
//                 //console.log('Redis key set successfully');
//                 res.redirect("./users?id=" + jsonContent._id);
//               }
//             });
//           }
//         });
//       });

//         redisClient.on('error', function(err){
//         console.log('Something went wrong', err);
//         });
//     }
//     else
//     {
//       console.log("No records found for the user.");
//       _result.setError("User not found. Please check whether you typed your username and password correctly.");
//     }
//       client.close();
//     });
//   });
 });


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
