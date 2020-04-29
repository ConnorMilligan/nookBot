/*
 * Nook bot
 *
 * Store command
 * 
 * All the functionality of the store command 
 *
 * By Connor
 */

//Dependancies
const nookDB = require("../nookDB.js");
const nookToolkit = require("../nookToolkit.js");
const { prefix } = require('../config.json');
const items = require('../data/items.json');

//Store command
module.exports = {
    name: 'store',
    description: 'Acesses the store! Use this to buy and sell things!',
    execute(message, args) {
        //Gets the message author from the database
        async function result() {
            return await nookDB.getUser(message.author.id);
        }
        result().then(function (userList) {
            //Check if the user is in the database and if there are any args to the command
            if (userList.length === 0) {
                message.channel.send("You can't go to the store yet! Go to the bank to be added to the database.");
            } else if (args.length === 0) {
                message.channel.send("Welcome to the store! use commands `" + prefix + "store buy` or `" + prefix + "store sell` to use the store!");
            } else {
                //Once the list is confimed not to be empty, the first user set to the user variable
                var user = userList[0];

                //Store option processing
                switch (args[0]) {
                    //Buy option
                    case 'buy':
                        if (args.length === 1) {
                            message.channel.send(nookToolkit.buildStoreStockEmbed(user));
                            message.channel.send("If you would like to buy something, use the command `" + prefix + "store buy n` where \'n\' is the number of the item you would like to buy.");
                        } else if (args.length === 2) {
                            //ensure that the entered arg is a number
                            if (isNaN(parseInt(args[1]))) {
                                //confirms that the entered number is in range
                                if (parseInt(args[1]) < 1 && parseInt(args[1]) > items.items.length) {
                                    message.channel.send("The number you put in is out of range!");
                                } else {
                                    buildStoreBuyEmbed(items.items[parseInt(args[1])]);
                                    message.channel.send(embed);
                                }
                            } else {
                                message.channel.send("There was an issue with you parameter. Are you sure you are using a number?");
                            }
                        } else {
                            message.channel.send("You have put in an incorrect number of args for this command.");
                        }
                        break;

                        //Sell command
                    case 'sell':
                        //Check if there is the correct number of args for this command
                        if (args.length === 1) {
                            message.channel.send("If you would like to sell something, use the command `" + prefix + "store sell n` where \'n\' is the number of what you want to sell according to you inventory in the bank.");
                        } else if (!(args.length > 1 && args.length <= 3)) {
                            message.channel.send("You have put in an incorrect number of args for this command.");
                        } else {
                            //Checks if the entered args are valid
                            if (isNaN(parseInt(args[1]))) {
                                //Check if the the non number arg is 'a', for selling all
                                if (args[1] === 'a') {
                                    if (nookToolkit.checkIfEmpty(user)) {
                                        message.channel.send("You don't have any critters to sell!");
                                    } else {
                                        if (args.length === 3 && args[2] === 'y') {
                                            //Update the critter list and bell count in the user database
                                            var balance = nookToolkit.allCritterValue(user);
                                            user.bells += balance;
                                            user.critters = nookToolkit.makeEmptyCritterList();

                                            //Updates the database with the new user
                                            async function result() {
                                                return await nookDB.updateUser(user);
                                            }
                                            result().then(function (state) {
                                                if (state) {
                                                    message.channel.send(nookToolkit.buildStoreSoldAllEmbed(user, balance));
                                                    console.log(user.name + ' has sold all their critters for ' + balance + ' bells');
                                                } else {
                                                    message.channel.send("Sorry, there was a problem trying to sell your critter.");
                                                    console.log(user.name + " was unable to sell their critter.");
                                                }
                                            });

                                        } else {
                                            message.channel.send(nookToolkit.buildStoreSellAllEmbed(user, nookToolkit.allCritterValue(user)));
                                        }
                                    }
                                } else {
                                    message.channel.send("There was an issue with you parameter. Are you sure you are using a number?");
                                }
                            } else if (parseInt(args[1]) < 1 || parseInt(args[1]) > 9) {
                                message.channel.send("The number you put in is out of range!");
                            } else if (user.critters[parseInt(args[1]) - 1].price === 0) {
                                message.channel.send("You don't seem to have any critters in that slot.");
                            } else if (args.length === 2) {
                                //Send a sell information message based on the entered critter
                                message.channel.send(nookToolkit.buildStoreSellEmbed(user.critters[parseInt(args[1]) - 1]));
                            } else if (args.length === 3) {
                                //Checks if the user wishes to confirm the sale
                                if (args[2] === 'y') {
                                    //Updates the user with the new critterlist and balance
                                    var soldCritter = user.critters[parseInt(args[1]) - 1]
                                    user.bells += soldCritter.price;
                                    user.critters = nookToolkit.removeCritter(user, soldCritter);

                                    //Updates the user in the database
                                    async function result() {
                                        return await nookDB.updateUser(user);
                                    }
                                    result().then(function (state) {
                                        if (state) {
                                            message.channel.send(nookToolkit.buildStoreSoldEmbed(user, soldCritter));
                                            console.log('1 ' + soldCritter.name + ' has been sold by ' + user.name + ' for ' + soldCritter.price + ' bells');
                                        } else {
                                            message.channel.send("Sorry, there was a problem trying to sell your critter.");
                                            console.log(user.name + " was unable to sell their critter.");
                                        }
                                    });
                                } else {
                                    message.channel.send("Please use \'y\' to confirm your sale.");
                                }
                            }
                        }
                        break;
                    default:
                        message.channel.send("There is no such option for the store!");
                        break
                }
            }
        });
    }
}