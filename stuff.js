var redirect = "http://localhost:8888/logged";

var client_id = "2b8a54e6dbb641aba6b2254ac8c0f785"
var client_secret = "9d139fae072d49d482ad6e830e7781ab"

const AUTHORIZE = "https://accounts.spotify.com/authorize"

const TOKEN = "https://accounts.spotify.com/api/token"
const ARTISTS = "https://api.spotify.com/v1/me/top/artists?offset=0&limit=10&time_range=long_term"
const TRACKS = "https://api.spotify.com/v1/me/top/tracks?offset=0&limit=10&time_range=short_term"

// list and cover are variables within html that will be manipulated and have data added to.
const list  = document.getElementById('list');
const cover = document.getElementById('cover');
cover.classList.add("hide");

// This is for the url. Basically, take the AUTHORIZE variable and add on to it.
function authorize() {
    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-read-playback-state user-top-read";
    // The scope is what we want to access from the user
    window.location.href = url;
}

// if there is anything following the url, call the handleRedirect function.
// else means that the user has already been on the page and nothing has been returned, so it will just get songs.
function onPageLoad() {
    if (window.location.search.length > 0) {
        handleRedirect();
    } else {
        getSongs();
    }
}

// gets the code using getCode(), which is then used to get an AccessToken.
function handleRedirect() {
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("","", redirect)
}

// this is going to get the code following the ? of the url
function getCode() {
    let code = null;
    const queryString = window.location.search;
    if (queryString.length > 0){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code');
    }
    return code;
}

// Allows access to user's info.
function fetchAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthApi(body);
}

// the api call is a "POST" call.
function callAuthApi(body) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthResponse;
}

function refreshAccessToken() {
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token"
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthApi(body);
}

// get a return fron the API. If successful, its status = 200, and parse that info to a variable called 'data', 
// which holds the access token and refresh token
// store the access token and refresh token in local storage.
function handleAuthResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        if (data.access_token != undefined) {
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if (data.refresh_token != undefined) {
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        getSongs();
    } else {
        console.log(this.responseText);
        alert(this.responseText)
    }
}

function getSongs() {
    callApi("GET", TRACKS, null, handleSongResponse);
}

// this is a generalization of API calls. 
// On spotify documentation, all API calls have a similar layout  with method, url, body, and callback.
    // The callback in this case is another function - handleSongResponse
function callApi (method, url, body, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem("access_token"));
    xhr.send(body);
    xhr.onload = callback;
}

// This is where we actually get the callback from the API.
function handleSongResponse () {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        songList(data);
    } else if (this.status == 401) {
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handleArtistsResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);

        artistList(data);
    } else if (this.status == 401) {
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function songList(data) {
    removeItem();
    cover.classList.remove('hide');
    for(i = 0; i < data.items.length; i++) {
        const list_item = document.createElement('div');
        const list_text = document.createElement('div');
        const song = document.createElement('div');
        const artist_album = document.createElement('div');
        const img = document.createElement('img');
        const span = document.createElement('span');
        const popu = document.createElement('div');
        const ref = document.createElement('a');
        const link = document.createTextNode("Link to Spotify");
        ref.appendChild(link);
        ref.title = "Link to Spotify"
        ref.href = data.items[i].external_urls.spotify;

        list_item.classList.add("list-item");
        list_text.classList.add("list-text");
        song.classList.add("song");
        artist_album.classList.add("artist-album");
        ref.classList.add("links");
        ref.setAttribute('target', 'blank');
        popu.classList.add("popu");
        img.classList.add("resize");

        // Create list item. 
        var li = document.createElement('li');
        img.src = data.items[i].album.images[1].url;

        popu.innerHTML = "Popularity Rating: " + data.items[i].popularity;
        span.innerHTML = data.items[i].name;
        artist_album.innerHTML = data.items[i].album.name + " . " + data.items[i].artists[0].name;
        
        // span.apendChild(a)
        song.appendChild(span);
        // artist_album.appendChild(b)

        list_text.appendChild(song);
        list_text.appendChild(artist_album);
        list_text.appendChild(popu);
        list_text.appendChild(ref);
        list_item.appendChild(list_text);
        list_item.appendChild(img);
        li.appendChild(list_item);

        // Add everything to list item, and then add the list item to the ordered list. 
        list.appendChild(li);

    }
}

// This lets us clear out the ordered list. We want to clear it out everytime the API is called to stop songs from keep being added.  
function removeItem() {
    list.innerHTML = '';
}

function getArtists() {
    callApi("GET", ARTISTS, null, handleArtistsResponse);
}

function artistList(data) {
    removeItem();
    API.classList.remove('hide');
    for(i = 0; i < data.items.length; i++) {
        const list_item = document.createElement('div');
        const list_text = document.createElement('div');
        const artist = document.createElement('div');
        const genres = document.createElement('div');
        const img = document.createElement('img');
        const span = document.createElement('span');
        const popu = document.createElement('div');
        const ref = document.createElement('a');
        const link = document.createTextNode("Link to Spotify");
        ref.appendChild(link);
        ref.title = "Link to Spotify"
        ref.href = data.items[i].external_urls.spotify;

        list_item.classList.add("list-item");
        list_text.classList.add("list-text");
        artist.classList.add("artist");
        genres.classList.add("genre");
        ref.classList.add("links");
        ref.setAttribute('target', 'blank');
        popu.classList.add("popu");
        img.classList.add("resize");

        var li = document.createElement('li');
        img.src = data.items[i].images[1].url;

        popu.innerHTML = "Popular Rating: " + data.items[i].popularity;
        span.innerHTML = data.items[i].name; 
        // If there are multiple genres, return only first 2.
        for(j = 0; j < data.items[i].genres.length; j++) {
            if(j > 1) {
                break;
            } else if (j == 1) {
                genres.innerHTML = genres.innerHTML + " . " + data.items[i].genres[j];   
            } else {
                genres.innerHTML = data.items[i].genres[j];
            }
        }

        artist.appendChild(span)

        list_text.appendChild(artist);
        list_text.appendChild(genres);
        list_text.appendChild(popu);
        list_text.appendChild(ref);
        list_item.appendChild(list_text);
        list_item.appendChild(img);
        li.appendChild(list_item);

        list.appendChild(li);
    }
}

