// imports
const express = require('express');
const app = express();
const port = 8888;

// static files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));
app.use('/images', express.static(__dirname + 'public/images'));

//displays html files on local host specified port number. 
// the '' is for the url
app.get('', (req, res) => {
    res.sendFile(__dirname + "/views/web.html")
})

// '/logged' would be the local host followed by port number followed by /logged
app.get('/logged', (req, res) => {
    res.sendFile(__dirname + "/views/logged.html")
})

// tell app to listn to specified port
app.listen(port, () => console.info(`Listening on port ${port}`));