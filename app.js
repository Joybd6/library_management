//module loading
const express= require('express');
const bodyparser= require('body-parser');
const ejs= require('ejs');
const app=express();
const con=require('./config/database.js');
const rout=require('./routes')
var sess=require('./config/session');
const cookieParser = require('cookie-parser');
const flash=require('connect-flash');
const passport=require('./config/passport')


//database connection
con.connect(function(err) {
    if(err) throw err;
    console.log("Database Connected");
});

//middleware configuration
app.use(sess)                                   //session initialization
app.set('view engine',ejs)                      //ejs template engine configuration
app.use(express.static('public'))               // public folder for serving static content
app.use(bodyparser.urlencoded({extended:true})) //body parser
app.use(cookieParser());                        // cookie parser
app.use(flash())                                // flash message middleware
app.use(passport.initialize())                  //passport.js module initialization for authentication
app.use(passport.session());                    // passport session initization
app.use('/',rout)                               //routes middleware for handling routes

//server initialization
app.listen(3000, function()
{
    console.log("listening on 3000");
})