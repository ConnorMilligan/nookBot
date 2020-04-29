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

//Empty item
const emptyItem = {
    name: "None",
    price: 0,
    time: 120
}

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
                var user = userList[0];
                //Checks if the user is able to fish and if debug mode is enabled
                var dates = Math.floor((Math.abs(user.time - new Date()) / 1000) / 60);
                if (user.fishingrod.price === 0) {
                    message.channel.send("How do you expect to go fishing without a fishingrod!");
                } else if (dates < user.fishingrod.time && !debug) {
                    message.channel.send("You need to wait before fishing again! Wait another " + (user.fishingrod.time - dates) + " minutes and try again.");
                } else {
                    //Determine currently catchable fish
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
                            user.fishingrod.duribility--;
                            user.time = new Date();

                            //Check the durability of the rod and remove if broken
                            if (user.fishingrod.duribility < 1) {
                                var broken = nookToolkit.buildItemBreak(user.fishingrod);
                                user.fishingrod = emptyItem;
                                console.log(user.name + ' has broken their ' + user.fishingrod.name + ' while fishing');
                            }

                            //updates the database with the new user
                            async function result() {
                                return await nookDB.updateUser(user);
                            }
                            result().then(function (state) {
                                if (state) {
                                    message.channel.send(nookToolkit.buildCritterEmbed(caught));
                                    if (user.fishingrod.price === 0) {
                                        message.channel.send(broken);
                                    }
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