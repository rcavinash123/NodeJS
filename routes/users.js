var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var hogan = require('hogan.js');
var redis = require('redis');
var router = express.Router();
var webSocketServer = require('websocket').server;
var https = require('https');
const fs = require('fs');
var clients = [ ];



var serv = https.createServer({
  key:fs.readFileSync('./server.key'),
  cert:fs.readFileSync('./server.cert')
});
serv.listen(8002, function() { });

var wsServer = new webSocketServer({
  httpServer:serv,
  rejectUnauthorized:false,
});

wsServer.on('request',function(request){
  console.log((new Date()) + ' Connection from origin '+ request.origin + '.');
  
  var connection = request.accept(null,request.origin);
  var index = clients.push(connection) - 1;
  console.log((new Date()) + ' Connection accepted.');

  connection.on('message',function(message){
    console.log('Client Message Recieved message type : ' + message.type);
    if(message.type==='utf8'){
      console.log('About to respond');
      var obj = {
        userCount : clients.length,
      };
      var json = JSON.stringify({ type:'message', data: obj });
      for (var i=0; i < clients.length; i++) {
      console.log('Sending JSON Data : ' + json);  
      clients[i].sendUTF(json);
      }
    }
    });

    connection.on('close',function(connection){
    console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
    clients.splice(index, 1);
    var obj = {
      userCount : clients.length,
    };
    var json = JSON.stringify({ type:'message', data: obj });
    for (var i=0; i < clients.length; i++) {
    console.log('Sending JSON Data : ' + json);  
    clients[i].sendUTF(json);
    }
    });
});

var userInfo = '';
/* GET users account info. */
router.get('/', function(req, res, next) {
  //console.log('Base URL : ' + req.baseUrl);
 if(req.query["id"]!=null && req.query["id"]!="" && typeof(req.query["id"])!="undefined")
 {

  /* MangoDB Connection String */
  const uri = "mongodb+srv://cubus:@Cu2010bus@cluster0-kxvpc.mongodb.net/test?retryWrites=true&w=majority";

  /* Initializing MangoDB Client*/
  const client = new MongoClient(uri, { useNewUrlParser: true });

  redisClient    = redis.createClient({port: 11737,host:'redis-11737.c1.asia-northeast1-1.gce.cloud.redislabs.com',password:'vPt0IxefzMh8SdhfgbwzI5ltabzkz8BK'});
  redisClient.on('connect',function(){
    console.log('Request Id : ' + req.query["id"]);
    redisClient.get(req.query["id"],function(err,value){
      if(err)
      {
        console.log('Redis key does not exists');
      }
      else if(value!=null && typeof(value)!='undefined' && value.length>0)
      {
        redisClient.expire(req.query["id"],1800);
        var JSONResult = JSON.parse(value);
        userInfo = JSONResult.result;
        console.log(JSON.stringify(userInfo))
        console.log(userInfo.userId);
        var userId = parseInt(userInfo.userId);
        console.log('Redis userId : ' + userId);

          /* Connecting to MangoDB*/
        client.connect(err => {

          /* Preparing the query, here in this case like SQL WHERE condition to pick the specific user's records */
          var query = {userId:userId};
      
          /* Fetching the data from the DB-CubusDBTest on collection(Table) - users  */
          client.db("CubusDBTest").collection("users").find(query).toArray(function(err,collects){
            if(err)
            {
              console.log(err);
            }
            else if(collects.length>0)
            {
              /* Preparing the aggregate pipeline query to join multiple collections */
              var aggregate = [
                {
                  '$lookup': {
                    'from': 'userToAcctMapping', 
                    'localField': 'userId', 
                    'foreignField': 'userId', 
                    'as': 'UserAccounts'
                  }
                }, {
                  '$lookup': {
                    'from': 'acctInfo', 
                    'localField': 'UserAccounts.userId', 
                    'foreignField': 'userId', 
                    'as': 'UserAccounts.AccountInfo'
                  }
                },
                { 
                  '$match' : { 
                    'userId' : userId,
                  } 
                }
              ];
      
              /* Fetching the account information from the mango db with aggregate function */
              client.db("CubusDBTest").collection("users").aggregate(aggregate).toArray(function(err,result){
                if(err)
                  console.log("Error occured while fetching accounts");
                else
                {
                  var JsonRes = JSON.stringify(result[0]);
                  var jsonContent = JSON.parse(JsonRes);
                  var Accounts = jsonContent.UserAccounts;
                  var Acct = new Object();
                  var AcctInfo = Accounts.AccountInfo;
                  if(AcctInfo.length>0)
                  {
                    AcctInfo.forEach(acct => {
                      var AcctId = acct.acctId;
                      if(AcctId==1)
                      acct.AccountType = "Savings";
                      else if(AcctId==2)
                      acct.AccountType = "Checking";
                      else if(AcctId==3)
                      acct.AccountType = "Loans";
                    });
                    Acct.Info = AcctInfo;
                    //console.log(Acct);
                    /* Preparing the HOGAN template for rendering multiple JSON objects for rendering */
                    var accttemplate  = hogan.compile("<div id='AccountContainer' style='box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);margin-left: 11%;margin-top:2%;width:50%;float:left;margin-right:2%;padding-top: 5%;padding:10px;max-width:400px;'><div id='AccountTitle' style='margin-top: -27px;margin-left: -10px;margin-right: -10px;height: 40px;margin-bottom: 10px;padding: 0px;border-bottom: 5px solid #ec8102;'><h2 style='padding: 2%;'>Accounts</h2></div><div id='Accounts' style=''>{{#Info}}<div style='float:left'>{{AccountType}}</div><div style='float:right'>A:{{availBal}}$</br>C:{{currBal}}$</div></br></br></br>{{/Info}}</div></div>");
                    var acctComp =  accttemplate.render(Acct);
                    //console.log(acctComp);
                    //console.log('UserInfo : ' + JSON.stringify(userInfo));
                    var userInfotemplate  = hogan.compile("<div id='UserInfoContainer' style='box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);margin-left: 2%;margin-top:2%;width:50%;float:right;margin-right:11%;max-width:400px;'><div id='ProfileTitle' style='height: 35px;margin-bottom: 10px;padding: 0px;border-bottom: 5px solid #69ab43;padding-top:10px;padding-left:10px;'><h2 style='padding: 0px;margin-top:0px;margin-bottom:2px;float:left;'>User Profile</h2><a href='http://127.0.0.1:8001/profile/?id="+ req.query["id"] + "'" + "style='float: right;display: inline-block;'><img src='/images/edit.svg' style='width: 20px;height: 20px;display: inline-block;padding-top:5px;padding-right:5px;'></a></div><div id='UserInfo' style='padding-left:10px;padding-right:10px;'><div style='float:left'>First Name</div><div style='float:right'>{{firstName}}</div></br></br><div style='float:left'>Last Name</div><div style='float:right'>{{lastName}}</div></br></br><div style='float:left'>Email Address</div><div style='float:right'>{{emailAddr}}</div></br></br></div></div>");
                    var UserInfo = userInfotemplate.render(userInfo);
                    //console.log(JSON.stringify(UserInfo));
                    /* Rendering the client side with rendered template data */
                    res.render('users',{title:"CUBUS Account Summary",AcctInfo:acctComp,userInfo:UserInfo,Name:userInfo.firstName + " " + userInfo.lastName});
                  }
                }
              });        
            }
            else
            {
              console.log("No accounts records found for the user.");
            }
            /* Closing the MangoDB client connection */
            client.close();
          });
        });
      }
    });
  });
}
else
{
  res.redirect("./");
}
});

module.exports = router;
