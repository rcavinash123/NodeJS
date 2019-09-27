var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var hogan = require('hogan.js');
var redis = require('redis');
var router = express.Router();
var webSocketServer = require('websocket').server;
var https = require('https');
const fs = require('fs');
var clients = [ ];
const request = require('request');
var zookeeper = require('node-zookeeper-client');

var userInfo = '';
var APIGatewayURL = "";




/* GET users account info. */
router.get('/', function(req, res, next) {
  console.log("Request Recieved")
  //console.log('Base URL : ' + req.baseUrl);
  var zkclient = zookeeper.createClient('192.168.200.198:4184,192.168.200.197:4184');
  console.log("Zookeeper client created");
  if(req.query["id"]!=null && req.query["id"]!="" && typeof(req.query["id"])!="undefined")
  {
    console.log("Before connecting to zookeeper");
    zkclient.once('connected',function(){
      console.log("Zookeeper connected");
      zkclient.exists('/apigateway', function (error, stat) {
        if (error) {
            console.log("zookeeper error : " + error.stack);
            zkclient.close()
            return res.error;
        }
        if (stat) {
            console.log('Node exists.');
            zkclient.getData('/apigateway',function(error,stat){},function(error,data,stat){
              var apidata = data.toString('utf8');
              var jData = JSON.parse(apidata);
              APIGatewayURL = jData["endpoints"]["url"];
              zkclient.close()
    
              console.log("GatwayURL : " + APIGatewayURL);
              var accountServiceURI = APIGatewayURL + "/acct/balanceget/" + req.query["id"];
    
              request.get(accountServiceURI,{json:true},(err,response,body)=>{
        var accttemplate
        var acctComp
        var userInfotemplate
        var UserInfo
    
          if(err){
            console.log("Error occured : " + err);
          }
          else{
          try{
            if(response.body.result.status=="true")
            {
              var Accounts = response.body.result.data.UserAccounts;
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
                accttemplate  = hogan.compile("<div id='AccountContainer' style='box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);margin-left: 11%;margin-top:2%;width:50%;float:left;margin-right:2%;padding-top: 5%;padding:10px;max-width:400px;'><div id='AccountTitle' style='margin-top: -27px;margin-left: -10px;margin-right: -10px;height: 40px;margin-bottom: 10px;padding: 0px;border-bottom: 5px solid #ec8102;'><h2 style='padding: 2%;'>Accounts</h2></div><div id='Accounts' style=''>{{#Info}}<div style='float:left'>{{AccountType}}</div><div style='float:right'>A:{{availBal}}$</br>C:{{currBal}}$</div></br></br></br>{{/Info}}</div></div>");
                acctComp =  accttemplate.render(Acct);
              }   
              else
              {
                console.log("No accounts records found for the user.");
                acctComp = "<div id='AccountContainer' style='box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);margin-left: 11%;margin-top:2%;width:50%;float:left;margin-right:2%;padding-top: 5%;padding:10px;max-width:400px;'><div id='AccountTitle' style='margin-top: -27px;margin-left: -10px;margin-right: -10px;height: 40px;margin-bottom: 10px;padding: 0px;border-bottom: 5px solid #ec8102;'><h2 style='padding: 2%;'>Accounts</h2></div><div id='Accounts' style=''>Unable to get account information</div></div>"
              }
    
              userInfotemplate  = hogan.compile("<div id='UserInfoContainer' style='box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);margin-left: 2%;margin-top:2%;width:50%;float:right;margin-right:11%;max-width:400px;'><div id='ProfileTitle' style='height: 35px;margin-bottom: 10px;padding: 0px;border-bottom: 5px solid #69ab43;padding-top:10px;padding-left:10px;'><h2 style='padding: 0px;margin-top:0px;margin-bottom:2px;float:left;'>User Profile</h2><a href='http://127.0.0.1:8001/profile/?id="+ req.query["id"] + "'" + "style='float: right;display: inline-block;'><img src='/images/edit.svg' style='width: 20px;height: 20px;display: inline-block;padding-top:5px;padding-right:5px;'></a></div><div id='UserInfo' style='padding-left:10px;padding-right:10px;'><div style='float:left'>First Name</div><div style='float:right'>{{firstName}}</div></br></br><div style='float:left'>Last Name</div><div style='float:right'>{{lastName}}</div></br></br><div style='float:left'>Email Address</div><div style='float:right'>{{emailAddr}}</div></br></br></div></div>");
              UserInfo = userInfotemplate.render(response.body.result.data);
              res.render('users',{title:"CUBUS Account Summary",AcctInfo:acctComp,userInfo:UserInfo,Name:userInfo.firstName + " " + userInfo.lastName}); 
            }
            else{
              acctComp = "<div id='AccountContainer' style='box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);margin-left: 11%;margin-top:2%;width:50%;float:left;margin-right:2%;padding-top: 5%;padding:10px;max-width:400px;'><div id='AccountTitle' style='margin-top: -27px;margin-left: -10px;margin-right: -10px;height: 40px;margin-bottom: 10px;padding: 0px;border-bottom: 5px solid #ec8102;'><h2 style='padding: 2%;'>Accounts</h2></div><div id='Accounts' style=''>Unable to get account information</div></div>"
              UserInfo = "<div id='UserInfoContainer' style='box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);margin-left: 2%;margin-top:2%;width:50%;float:right;margin-right:11%;max-width:400px;'><div id='ProfileTitle' style='height: 35px;margin-bottom: 10px;padding: 0px;border-bottom: 5px solid #69ab43;padding-top:10px;padding-left:10px;'><h2 style='padding: 0px;margin-top:0px;margin-bottom:2px;float:left;'>User Profile</h2><a href='http://127.0.0.1:8001/profile/?id="+ req.query["id"] + "'" + "style='float: right;display: inline-block;'><img src='/images/edit.svg' style='width: 20px;height: 20px;display: inline-block;padding-top:5px;padding-right:5px;'></a></div><div id='UserInfo' style='padding-left:10px;padding-right:10px;'>Unable to fetch user profile details</br></br></div></div>"
              res.render('users',{title:"CUBUS Account Summary",AcctInfo:acctComp,userInfo:UserInfo,Name:""}); 
            }
          }
          catch(ex)
          {
            acctComp = "<div id='AccountContainer' style='box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);margin-left: 11%;margin-top:2%;width:50%;float:left;margin-right:2%;padding-top: 5%;padding:10px;max-width:400px;'><div id='AccountTitle' style='margin-top: -27px;margin-left: -10px;margin-right: -10px;height: 40px;margin-bottom: 10px;padding: 0px;border-bottom: 5px solid #ec8102;'><h2 style='padding: 2%;'>Accounts</h2></div><div id='Accounts' style=''>Unable to get account information</div></div>"
            UserInfo = "<div id='UserInfoContainer' style='box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);margin-left: 2%;margin-top:2%;width:50%;float:right;margin-right:11%;max-width:400px;'><div id='ProfileTitle' style='height: 35px;margin-bottom: 10px;padding: 0px;border-bottom: 5px solid #69ab43;padding-top:10px;padding-left:10px;'><h2 style='padding: 0px;margin-top:0px;margin-bottom:2px;float:left;'>User Profile</h2><a href='http://127.0.0.1:8001/profile/?id="+ req.query["id"] + "'" + "style='float: right;display: inline-block;'><img src='/images/edit.svg' style='width: 20px;height: 20px;display: inline-block;padding-top:5px;padding-right:5px;'></a></div><div id='UserInfo' style='padding-left:10px;padding-right:10px;'>Unable to fetch user profile details</br></br></div></div>"
            res.render('users',{title:"CUBUS Account Summary",AcctInfo:acctComp,userInfo:UserInfo,Name:""}); 
          }
          }
        });
    
            });
        } else {
                console.log('APIGateway Node Does Not Exists');
                zkclient.close()
          }
      });
    });
    zkclient.connect();
  }
  else
  {
    console.log("UserID is null");
    res.redirect("./");
  }
});

module.exports = router;
