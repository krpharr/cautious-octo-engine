const fs = require("fs");
const axios = require("axios");
const inquirer = require("inquirer");
const convertFactory = require('electron-html-to');

inquirer
    .prompt([{
        message: "Enter a GitHub username",
        name: "username"
    }, {
        message: "Enter your favorite color",
        name: "favColor"
    }])
    .then(function({ username, favColor }) {
        console.log(favColor);
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

                let str = `${image}
                ${name}
                ${location}
                ${profile}
                ${blog}
                ${bio}
                ${numRepos}
                ${followers}
                ${following}
                ${starred_url}`;
                console.log(str);
                //////////////////////////////
                // TODO work out async on getting stars set 
                let numPages = Math.ceil(numRepos / 100);
                var stars = 0;
                for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                    const queryRepos = `https://api.github.com/users/${username}/repos?page=${pageNum}&per_page=100`;
                    axios
                        .get(queryRepos)
                        .then(res => {
                            // console.log(res.data);
                            res.data.forEach(repo => {
                                stars += parseInt(repo.stargazers_count);
                                console.log(repo.name, repo.stargazers_count, stars);
                            })
                        });
                }
                //////////////////////////////////

                let htmlStr =
                    `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge"> 
    <link rel="stylesheet" href="/Users/randallpharr/bootcamp/cautious-octo-engine/assets/css/style.css">
    <title>${name}</title>
</head>
<body style="background-color: ${favColor};">
    <div class="container">
        <div class="headerStyle">
            <img src="${image}">
            <div class="name-location bdr">
                <h1  class="info">${name}</h1>
                <div class="info">${location}</div>
            </div>
        </div>
        <div class="bio info bdr">${bio}</div>
        <div class="links">
            <div class="info bdr"><a href=${profile}>${profile}</a></div>
            <div class="info bdr"><a href=${blog}>${blog}</a></div>
        </div>
        <div class="stats">
            <div class="info bdr">Repositories: ${numRepos}</div>
            <div class="info bdr">Followers: ${followers}</div>
            <div class="info bdr">Following: ${following}</div>
            <div class="info bdr">Stars: todo</div>
        </div>
    </div>
</body>
</html>`;



                // console.log(htmlStr);

                var conversion = convertFactory({
                    converterPath: convertFactory.converters.PDF,
                    allowLocalFilesAccess: true
                });

                conversion({ html: htmlStr }, function(err, result) {
                    if (err) {
                        return console.error(err);
                    }

                    console.log(result.numberOfPages);
                    console.log(result.logs);
                    result.stream.pipe(fs.createWriteStream(`${githubName}.pdf`));
                    conversion.kill(); // necessary if you use the electron-server strategy, see bellow for details
                });

            });

    });