const fs = require("fs");
const axios = require("axios");
const inquirer = require("inquirer");

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

            });

    });