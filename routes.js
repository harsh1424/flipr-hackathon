const express = require("express")
const routes = express.Router();
const mongoose = require('mongoose')
const bodyparser = require('body-parser')
const bcrypt = require('bcryptjs')
const user = require('./model')
const passport = require('passport');
const session = require('express-session')
const cookieparser = require('cookie-parser')
const flash = require('connect-flash')

routes.use(bodyparser.urlencoded({ extended : true}));
routes.use(cookieparser('secret'));
routes.use(session({
    secret : 'secret',
    maxAge : 3600000,
    resave : true,
    saveUninitialized :true,
}))

routes.use(passport.initialize());
routes.use(passport.session());

routes.use(flash());
// global variable
routes.use(function(req,res,next){
    res.locals.success_message = req.flash('success_message');
    res.locals.error_message = req.flash('error_message');
    res.locals.error = req.flash('error')
    next();
});

const checkauthenticated = function(req,res,next){
    if(req.isAuthenticated()){
        res.set('cache-control','no-cache,private, no-store, must-revalidate,post-check=0,pre-check=0')
        next();
    
    }else{
        res.redirect('/login')
    }
}

mongoose.connect('mongodb://localhost/hackathon', {useNewUrlParser: true ,useUnifiedTopology: true}).then(()=> console.log("database connected"));


routes.get('/',(req,res)=>{
    res.render('index')
});


routes.post('/register',(req,res)=>{
    var { email,username, password, confirmpassword} = req.body; 
    var err;
    if(!email ||!username, !password || !confirmpassword){
        err = "please fill all the field";
        res.render('index',{ 'err': err});
    }
    if(password!=confirmpassword){
        err = "password dont match ";
        res.render('index',{ 'err': err , 'email':email, 'username':username });
    }
    if(typeof err == 'undefined'){
        user.findOne({email : email},function(err,data){
            if (err) throw err;
            if(data){
                console.log('user exist')
                err = "user already exist with this email ";
                res.render('index',{ 'err': err , 'email':email, 'username':username });
            }else{
                bcrypt.genSalt(10,(err,salt) =>{
                    if(err) throw err;
                    bcrypt.hash(password, salt, (err,hash)=>{
                        if(err) throw err;
                        password = hash;
                        user({
                            email,
                            username,
                            password,
                        }).save((err,data)=>{
                            if(err) throw err;
                            req.flash('success_message', "Registered Successfully.. Login to Continue..")
                            res.redirect('/login')
                        });
                    })
                })
            }
            
        
        });
    }
   
});

// authentication Strategy
var localstrategy = require('passport-local').Strategy;
passport.use(new localstrategy({usernameField: 'email'},(email, password, done)=>{
    user.findOne({email : email},(err,data)=>{
        if (err) throw err;
        if(!data){
            return done(null, false, {message : "user doesn't exist"})
        }
        bcrypt.compare(password,data.password,(err,match)=>{
            if (err){
                return done(null,false)
            }
            if (!match){
                return done(null,false , {message : "password doesn't match.."})
            }
            if(match){
                return done(null, data)
            }

        });
    });
}));


passport.serializeUser(function(user, cb){
    cb(null,user.id);
});

passport.deserializeUser(function(id,cb){
    user.findById(id,function(err, user){
        cb(err,user)
    });
});
//  end of authentication strategy

routes.get('/login',(req,res)=>{
    res.render('login')
});

routes.post('/login',(req,res,next)=>{
    passport.authenticate('local',{
        failureRedirect : '/login',
        successRedirect : '/myfrontend',
        failureFlash : true,
    })(req,res,next);
});

routes.get('/myfrontend', checkauthenticated, (req,res)=>{
    res.render('myfrontend',{'user' : req.user})
});

routes.get('/logout', (req,res)=>{
    req.logout();
    res.redirect('/login' );
});

module.exports = routes;
