//caching starships for later use
var starshipCache = [];
//current page in pagination
var currentPage = 1;
//number of pages in pagination
var pageCount = 1;
//the current film object in starship page
var currentFilm = null;

window.onload = function () {
    //getting url params to check if this is index or starship page
    let queryString = window.location.search;
    //if search query is id=x, then this page is starship page, else, this is index page
    if (queryString.startsWith("?id=")) {
        let id = queryString.substring(4);
        id = parseInt(id);
        starshipPage(id);
    } else {
        indexPage();
    }
};

function indexPage() {
    //requesting to get the movie list
    let filmsJson = swapi("films");
    if (filmsJson !== false) {
        //convert json to js object
        let films = JSON.parse(filmsJson);
        //get the html elemnt to edit
        const movieList = document.getElementById("movie_list");
        let id = 1;
        for (const film of films.results) {
            //add movies to <ul>
            movieList.innerHTML += '<li><div class="movie"><div>' + film.title + ' | ' + film.episode_id + ' | ' + film.release_date + '</i></div><a href="starship.html?id=' + id + '">Starships</a></div></li>';
            id++;
        }
    }
}

function starshipPage(id) {
    //get the film to find the starships
    let filmJson = swapi("films/" + id);
    if (filmJson !== false) {
        //convert json to js object
        let film = JSON.parse(filmJson);
        //setting global variable
        currentFilm = film;
        //get the html elemnt to edit
        const starshipList = document.getElementById("starship_list");
        let count = film.starships.length;
        //only show the first page starships
        if (count > 6)
            count = 6;
        for (let i = 0; i < count; i++) {
            const starshipUrl = film.starships[i];
            //get the starships details and cache them
            let starshipJson = swapi(starshipUrl, true);
            let starship = JSON.parse(starshipJson);
            //caching starships by name for later use (instead of requesting multiple times)
            starshipCache[starship.url] = starship;
            //add starships to <ul>
            starshipList.innerHTML += '<li><button onclick="getStarShip(\'' + starship.url + '\')">' + starship.name + '</button></li>';
        }

        //pagination
        let paginationElement = document.getElementById("pagination");
        //calculate the number of pages in pagination
        pageCount = Math.ceil(film.starships.length / 6);
        let html = '';
        for (let i = 0; i < pageCount; i++) {
            const num = i + 1;
            if (num !== 1)
                html += '<button id="page_' + num + '" onclick="getPage(' + num + ')">' + num + '</button>';
            else
                html += '<button id="page_' + num + '" class="active-page" onclick="getPage(' + num + ')">' + num + '</button>';
        }
        paginationElement.innerHTML = '<button onclick="prevPage()">Prev</button>' + html + '<button onclick="nextPage()">Next</button>';
    }
}

function getStarShip(url) {
    const starshipElement = document.getElementById("starship");
    //get the cached starship data
    let starship = starshipCache[url];
    //use the cached data to fill the details
    let html = '<h2>' + starship.name + '</h2><ul><li>' + starship.name + '</li><li>' + starship.manufacturer + '</li><li>' + starship.crew + '</li><li>' + starship.passengers + '</li>';
    //get the films, and add their names to the end of list
    for (const filmUrl of starship.films) {
        //get all the films details
        let filmJson = swapi(filmUrl, true);
        let film = JSON.parse(filmJson);
        //add to <ul>
        html += '<li>' + film.title + '</li>';
    }
    //closing the list tag
    html += '</ul>';
    starshipElement.innerHTML = html;
    //make this part of the page visible
    starshipElement.className = "visible";
}

function nextPage() {
    if (currentPage >= pageCount)
        return;
    currentPage++;
    getPage(currentPage);
}

function prevPage() {
    if (currentPage <= 1)
        return;
    currentPage--;
    getPage(currentPage);
}

function getPage(num) {
    currentPage = num;
    document.getElementsByClassName("active-page")[0].className = "";
    document.getElementById("page_" + num).className = "active-page";
    //calculating boundaries
    let from = 6 * (num - 1) + 1;
    let to = 6 * num;
    if (to > currentFilm.starships.length)
        to = currentFilm.starships.length;
    const starshipList = document.getElementById("starship_list");
    let html = '';
    for (let i = from; i < to; i++) {
        const starshipUrl = currentFilm.starships[i];
        //get the starships details and cache them
        let starshipJson = swapi(starshipUrl, true);
        let starship = JSON.parse(starshipJson);
        //caching starships by name for later use (instead of requesting multiple times)
        starshipCache[starship.url] = starship;
        //add starships to <ul>
        html += '<li><button onclick="getStarShip(\'' + starship.url + '\')">' + starship.name + '</button></li>';
    }
    starshipList.innerHTML = html;
}

//a simple function to fetch json from swapi.dev (returns false on failure)
function swapi(url, absoluteUrl = false) {
    if (absoluteUrl === false)
        url = "https://swapi.dev/api/" + url;
    let req = new XMLHttpRequest();
    //synced request for simplicity (async needs callback)
    req.open("GET", url, false);
    //no body, since the request is GET
    req.send(null);
    if (req.status === 200)
        return req.responseText;
    return false;
}