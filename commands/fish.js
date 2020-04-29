/*
 * Nook bot
 *
 * Fish command
 * 
 * All the functionality of the fish command 
 *
 * By Connor
 */

//Dependencies
const nookDB = require("../nookDB.js");
const nookToolkit = require("../nookToolkit.js");
const { debug } = require('../config.json');

//Fish command
module.exports = {
    name: 'fish',
    description: 'Use this command to go fishing!',
    execute(message, args) {
        //Gets the message author from the database
        async function result() {
            return await nookDB.getUser(message.author.id);
        }
        result().then(function (userList) {
            //Confirms that the user is in the database
            if (userList.length === 0) {
                message.channel.send("You can't go fishing yet! Go to the bank to be added to the database.");
            } else {
                //Checks if the user is able to fish and if debug mode is enabled
                var dates = Math.floor((Math.abs(userList[0].time - new Date()) / 1000) / 60);
                if (dates < 60 && !debug) {
                    message.channel.send("You can only go fishing once per hour! Wait another " + (60 - dates) + " minutes and try again.");
                } else {
                    //Determine currently catchable fish
                    var user = userList[0];
                    var fishRarity = nookToolkit.getRarity();
                    var currentHour = new Date().getHours();
                    var currentMonth = new Date().getMonth();

                    //Get a list of valid fish in the specified parameters
                    async function result() {
                        return await nookDB.getFish(fishRarity, currentHour, currentMonth);
                    }
                    result().then(function (fishes) {
                        //Make sure the list has at least one fish in it
                        if (fishes.length === 0) {
                            message.channel.send("There's nothing biting!");
                        } else {
                            //Choose a random fish from the valid fish list, determine the size and send the embed
                            var caught = fishes[Math.floor(Math.random() * ((fishes.length - 1) - 0 + 1)) + 0];
                            caught.size = nookToolkit.critterSize(caught);

                            //Adds the caught fish to the critter list and reset the time
                            user.critters = nookToolkit.addCritter(user, caught, message.channel);
                            user.time = new Date();

                            //updates the database with the new user
                            async function result() {
                                return await nookDB.updateUser(user);
                            }
                            result().then(function (state) {
                                if (state) {
                                    message.channel.send(nookToolkit.buildCritterEmbed(caught));
                                    console.log('1 ' + caught.name + ' has been added to ' + user.name + '\'s bank');
                                } else {
                                    message.channel.send("Sorry, there was an issue while fishing.");
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