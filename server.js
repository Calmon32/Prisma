var fs = require('fs');
var http = require('http');
var express = require('express');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var app = express();
var httpServer = http.createServer(app);
var bodyparser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookie = cookieParser('mymonkeystolemybanana');
var multer = require('multer');
var upload = multer({ dest: './tempimg/', limits: { fileSize: 20500000 } });
var _html = __dirname + "/html/";
var serverFunction = require(__dirname + "/mods/serverFunctions.js");
var path = require('path');
var handlebars = require('express-handlebars').create();

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.static(_html + 'files'));
app.use(session({
  	secret: 'mymonkeystolemybanana',
  	name: 'sessID',
  	resave: false,
 	saveUninitialized: true,
  	cookie: { secure: false },
  	store: new MongoStore({ 
  		url: "mongodb://admin:j4D1K3YveJBDcLXe@cluster0-shard-00-00-wwswd.gcp.mongodb.net:27017,cluster0-shard-00-01-wwswd.gcp.mongodb.net:27017,cluster0-shard-00-02-wwswd.gcp.mongodb.net:27017/prisma?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true",
      	autoRemove: 'native' 
      })
}));
function getUser(req, res, next) {
	serverFunction.getUser(req, res, next);
}
app.use(getUser);
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.get('/feed', function(req, res){
	serverFunction.feedPage(req,res,req.user);
	console.log(req.connection.remoteAddress + " accessed the Feed page.");
});
app.get('/', function(req, res){
    res.render('landing');
     console.log(req.connection.remoteAddress + " accessed the Landing page.");
});
app.get('/profile', function(req, res){
	serverFunction.profilePage(req,res,req.user);
 	console.log(req.connection.remoteAddress + " accessed the Profile page.");
});
app.get('/search', function(req, res){
	res.render('search', { sessname: req.user.name , userid: req.user.id});
	console.log(req.connection.remoteAddress + " accessed the Search page.");
});
app.post('/search', function(req, res){
	serverFunction.search(req,res,req.user);
});
app.get('/messages', function(req, res){
	serverFunction.messagePage(req,res,req.user);
  	console.log(req.connection.remoteAddress + " accessed the Messages page.");
});
app.get('/user/:username', function(req, res){
	if (req.user.username == req.params.username) {
		res.redirect('/profile');
	}
	else {
		serverFunction.userPage(req,res,req.user);
	}
});

app.get('/forms', function(req, res){
  	res.sendFile(_html +'forms.html');
  	console.log(req.connection.remoteAddress + " accessed the Forms page.");
});
app.post('/forms', function(req, res){
	serverFunction.register(req,res);
});
app.get('/login', function(req, res){
  	res.sendFile(_html +'login.html');
  	console.log(req.connection.remoteAddress + " accessed the Login page.");
});
app.post('/login', function(req, res){
	serverFunction.login(req,res);
});
app.get('/logout', function(req, res){
	serverFunction.logout(req,res);
});

app.post('/uploadimg', function(req, res){
	upload.single('postIMG')(req,res, function(err) {
		if (err) {
			console.log(err.code);
			if (err.code == 'LIMIT_FILE_SIZE') {
				res.end('Image size too big.');
			}
		}
		else {
			serverFunction.uploadIMG(req,res,req.user);
		}
	});
});

app.post('/profileimage', function(req, res){
	upload.single('profileIMG')(req,res, function(err) {
		if (err) {
			console.log(err.code);
			if (err.code == 'LIMIT_FILE_SIZE') {
				res.end('Image size too big.');
			}
		}
		else {
			serverFunction.changeProfileIMG(req,res,req.user);
		}
	});
});


app.post('/follow', function(req, res){
	serverFunction.followUser(req,res,req.user,req.body.userid);
});
app.post('/unfollow', function(req, res){
	serverFunction.unfollowUser(req,res,req.user,req.body.userid);
});
app.post('/like', function(req, res){
	serverFunction.likePost(req,res,req.user,req.body.photoid);
});
app.post('/unlike', function(req, res){
	serverFunction.unlikePost(req,res,req.user,req.body.photoid);
});

app.post('/comment', function(req, res){
	serverFunction.comment(req,res,req.user,req.body.photoid);
});

app.post('/changesett', function(req, res){
	serverFunction.changeSettings(req,res,req.user);
});

app.get('/chat', function(req, res){
	console.log(req.connection.remoteAddress + ' just accessed the chat page');
	res.sendFile(chatPagePath);
});

app.get('/postdata/:postid', function(req, res){
	serverFunction.postdata(req,res,req.user,req.params.postid);
});

app.get('/getfriends', function(req, res){
	serverFunction.getFriends(req,res,req.user);
});
app.get('/get-message/:user', function(req, res){
	serverFunction.getMsg(req,res,req.user);
});
app.post('/insert', function(req, res){
	serverFunction.insertMsg(req,res,req.user);
});


httpServer.listen(8080, function(){
    console.log('listening on *:8080');
});