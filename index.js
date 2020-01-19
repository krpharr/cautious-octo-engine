const fs = require("fs");
const axios = require("axios");
const inquirer = require("inquirer");
const convertFactory = require('electron-html-to');
const util = require("util");
const moment = require("moment");

const readFileAysnc = util.promisify(fs.readFile);


readFileAysnc("assets/json/css-color-names.json", "utf8").then(function(data) {

    const colorDict = JSON.parse(data);
    const colorArray = Object.keys(colorDict).map(function(key) {
        return key;
    });

    inquirer
        .prompt([{
            message: "Enter a GitHub username",
            name: "username"
        }, {
            type: "rawlist",
            message: "Enter your favorite color",
            name: "favColor",
            choices: colorArray,
            filter: function(val) {
                return val.toLowerCase();
            }
        }])
        .then(function({ username, favColor }) {
            const queryUrl = `https://api.github.com/users/${username}`;

            axios
                .get(queryUrl)
                .then(res => {
                    let {
                        login: githubName,
                        avatar_url: image,
                        name,
                        location,
                        html_url: profile,
                        blog,
                        bio,
                        public_repos: numRepos,
                        followers,
                        following,
                        starred_url
                    } = res.data;

                    if (name === null) name = githubName;
                    if (location === null) location = "";
                    if (bio === null) bio = "Bio not available.";
                    if (blog === null) blog = "N/A";
                    let stars = 0;

                    async function getNumStars(user, nPages) {
                        let numStars = 0;
                        try {
                            for (let pageNum = 1; pageNum <= nPages; pageNum++) {
                                let { data } = await axios.get(`https://api.github.com/users/${user}/repos?page=${pageNum}&per_page=100`);
                                numStars += getStarsFromRepos(data);
                            }
                            return numStars;
                        } catch (err) {
                            console.log(err);
                        }
                    };

                    function getStarsFromRepos(repos) {
                        let n = 0;
                        repos.forEach(r => {
                            n += parseInt(r.stargazers_count);
                        });
                        return n;
                    };

                    let numPages = Math.ceil(numRepos / 100);
                    getNumStars(username, numPages).then(res => {
                        stars = res;
                        let mapUrl = `https://www.google.com/maps/place/${location.replace(" ", "+")}`;
                        let htmlStr =
                            `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta http-equiv="X-UA-Compatible" content="ie=edge"> 
                        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
                        <link rel="stylesheet" href="/Users/randallpharr/bootcamp/cautious-octo-engine/assets/css/style.css">
                        <title>${name}</title>
                    </head>
                    <body style="background-color: ${favColor};">
                        <div class="container">
                            <div class="headerStyle">
                                <img src="${image}">
                                <div class="name-location bdr">
                                    <h1  class="info">${name}</h1>
                                    <div class="info"><a href="${mapUrl}" targer="_blank"><i class="material-icons">near_me</i>${location}</a></div>
                                </div>
                            </div>
                            <div class="bio info bdr">${bio}</div>
                            <div class="links bdr">
                                <div class="info">
                                    <div class="github-user">
                                        <img class="github-logo" src="/Users/randallpharr/bootcamp/cautious-octo-engine/assets/images/github.png">
                                        <h3>GitHub: ${username}</h3>
                                    </div>
                                    <a class="link" href="${profile}">${profile}</a>
                                </div>
                                <div class="info">
                                    <h3>Blog:</h3>
                                    <a class="link" href="${blog}">${blog}</a>
                                </div>
                            </div>
                            <div class="stats">
                                <div class="info bdr stat">Repositories: ${numRepos.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                                <div class="info bdr stat">Stars: ${stars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                            </div>
                            <div class="stats">
                                <div class="info bdr stat">Followers: ${followers.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                                <div class="info bdr stat">Following: ${following.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</div>
                            </div>
                        </div>
                    </body>
                    </html>`;

                        var conversion = convertFactory({
                            converterPath: convertFactory.converters.PDF,
                            allowLocalFilesAccess: true
                        });

                        conversion({
                            html: htmlStr,
                            delay: 10,
                            pdf: {
                                marginsType: 0,
                                pageSize: "A4",
                                printBackground: true,
                                landscape: false
                            }

                        }, function(err, result) {
                            if (err) {
                                return console.error(err);
                            }
                            result.stream.pipe(fs.createWriteStream(`${githubName}.pdf`));
                            conversion.kill();
                            console.log(`${githubName}.pdf written to disk. - ${moment()}`);
                        });
                    });
                });
        });
});