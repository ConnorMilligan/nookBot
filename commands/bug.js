/*
 * Nook bot
 *
 * Bug command
 * 
 * All the functionality of the bug command 
 *
 * By Connor
 */

//Dependencies
const nookDB = require("../nookDB.js");
const nookToolkit = require("../nookToolkit.js");
const {
    debug
} = require('../config.json');

//Empty item
const emptyItem = {
    name: "None",
    price: 0,
    time: 120
}

//Bug command
module.exports = {
    name: 'bug',
    description: 'Use this command to go search for bugs!',
    execute(message, args) {
        //Gets the message author from the database
        async function result() {
            return await nookDB.getUser(message.author.id);
        }
        result().then(function (userList) {
            //Confirms that the user is in the database
            if (userList.length === 0) {
                message.channel.send("You can't search for bugs yet! Go to the bank to be added to the database.");
            } else {
                var user = userList[0];
                //Checks if the user is able to search for bugs and if debug mode is enabled
                var dates = Math.floor((Math.abs(user.time - new Date()) / 1000) / 60);
                //Check if the user doesn't have a bugnet
                //If so the user may only catch Very Common bugs
                if (user.bugnet.price === 0) {
                    if (dates < user.bugnet.time && !debug) {
                        message.channel.send("You need to wait before searching for bugs again! Wait another " + (user.bugnet.time - dates) + " minutes and try again.");
                    } else {
                        var currentHour = new Date().getHours();
                        var currentMonth = new Date().getMonth();

                        //Get a list of valid bugs in the specified parameters
                        async function result() {
                            return await nookDB.getBugs("Very Common", currentHour, currentMonth);
                        }
                        result().then(function (bugs) {
                            //Make sure the list has at least one bug in it
                            if (bugs.length === 0) {
                                message.channel.send("I couldn't find anything!");
                            } else {
                                //Choose a random bug from the valid bug list, determine the size and send the embed
                                var caught = bugs[Math.floor(Math.random() * ((bugs.length - 1) - 0 + 1)) + 0];
                                caught.size = nookToolkit.critterSize(caught);

                                //Adds the caught bug to the critter list and reset the time
                                user.critters = nookToolkit.addCritter(user, caught, message.channel);
                                user.time = new Date();

                                //updates the database with the new user
                                async function result() {
                                    return await nookDB.updateUser(user);
                                }
                                result().then(function (state) {
                                    if (state) {
                                        message.channel.send(nookToolkit.buildCritterEmbed(caught));
                                    } else {
                                        message.channel.send("Sorry, there was an issue while searching for bugs.");
                                        console.log(caught.name + ' was unable to be added to ' + user.name + '\'s bank');
                                    }
                                });
                            }
                        });
                    }
                } else if (dates < user.bugnet.time && !debug) {
                    message.channel.send("You need to wait before searching for bugs again! Wait another " + (user.bugnet.time - dates) + " minutes and try again.");
                } else {
                    //Determine currently catchable bugs
                    var rarity = nookToolkit.getRarity();
                    var currentHour = new Date().getHours();
                    var currentMonth = new Date().getMonth();

                    //Get a list of valid bugs in the specified parameters
                    async function result() {
                        return await nookDB.getBugs(rarity, currentHour, currentMonth);
                    }
                    result().then(function (bugs) {
                        //Make sure the list has at least one bug in it
                        if (bugs.length === 0) {
                            message.channel.send("I couldn't find anything!");
                        } else {
                            //Choose a random bug from the valid bug list, determine the size and send the embed
                            var caught = bugs[Math.floor(Math.random() * ((bugs.length - 1) - 0 + 1)) + 0];
                            caught.size = nookToolkit.critterSize(caught);

                            //Adds the caught bug to the critter list and reset the time
                            user.critters = nookToolkit.addCritter(user, caught, message.channel);
                            user.bugnet.duribility--;
                            user.time = new Date();

                            //Check the durability of the rod and remove if broken
                            if (user.bugnet.duribility < 1) {
                                var broken = nookToolkit.buildItemBreak(user.bugnet);
                                user.bugnet = emptyItem;
                                console.log(user.name + ' has broken their ' + user.bugnet.name + ' while searching for bugs');
                            }

                            //updates the database with the new user
                            async function result() {
                                return await nookDB.updateUser(user);
                            }
                            result().then(function (state) {
                                if (state) {
                                    message.channel.send(nookToolkit.buildCritterEmbed(caught));
                                    if (user.bugnet.price === 0) {
                                        message.channel.send(broken);
                                    }
                                } else {
                                    message.channel.send("Sorry, there was an issue while searching for bugs.");
                                    console.log(caught.name + ' was unable to be added to ' + user.name + '\'s bank');
                                }
                            });
                        }
                    });
                }
            }
        });
    }
}