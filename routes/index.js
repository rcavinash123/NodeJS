var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var header = "<div style='border-bottom: 5px solid #084e8a;'><div class='containerNewUI'><div class='containerBlock'><a href='#' id='headerLink_New' onclick='javascript:parent.ShowScreenHelper_OpenInTabOrPopUp('http://www.cubussolutions.com',screen.height,screen.width)' title='CUBUS Logo' class='logo'><img id='ctl00_ctl01_imgLogo_New' class='primarylogo' src='/images/logo.png' alt='CUBUS Logo' style='border-width:0px;'></a></div></div></div>";
  res.render('index', { header:header, title: 'CUBUS',label_login:'Login',label_username:'Username',label_password:'Password'});
});

module.exports = router;
