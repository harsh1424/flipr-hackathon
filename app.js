const express = require("express")
const app = express();
const routes = require('./routes.js'); 
const path = require('path');

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'))

app.use('/static', express.static('static')) // For serving static files
app.use(express.urlencoded()) 

app.get("/",routes);
app.post('/register',routes)
app.get('/login',routes)
app.post('/login',routes)
app.get('/myfrontend',routes)
app.get('/logout',routes);

// app.post("/register",routes);

const port = 5500;
app.listen(port,()=>console.log("server starts"))

