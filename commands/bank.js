/*
 * Nook bot
 *
 * Bank command
 * 
 * All the functionality of the bank command 
 *
 * By Connor
 */


//Dependencies
const nookDB = require("../nookDB.js");
const nookToolkit = require("../nookToolkit.js");

//Empty item
const emptyItem = {
    name: "None",
    price: 0,
    time: 120
}

//Bank command
module.exports = {
    name: 'bank',
    description: 'This command will give you access to the bank.',
    execute(message, args) {
        //Gets the message author from the database
        async function result() {
            return await nookDB.getUser(message.author.id);
        }
        result().then(function (userList) {
            //Makes sure the user exists in the database, if not add
            if (userList.length === 0) {
                message.channel.send("It appears you aren't in the database. Let me add you now!");

                //Create a new user based on the the message author
                var newUser = {
                    name: message.author.username,
                    id: message.author.id,
                    image: message.author.avatarURL(),
                    bells: 0,
                    fishingrod: emptyItem,
                    bugnet: emptyItem,
                    critters: nookToolkit.makeEmptyCritterList(),
                    time: new Date('2020/1/1 00:00:00')
                };

                //Add the user to the database
                async function addUser() {
                    return await nookDB.addUser(newUser);
                }
                addUser().then(function (state) {
                    if (state) {
                        message.channel.send("You are now in the database! Run the command again to see your menu.");
                    } else {
                        message.channel.send("There was some kind of issue when adding you to the database.");
                    }
                });
            } else {
                var user = userList[0];
                //update if profile icon is different
                if (user.image != message.author.avatarURL()) {
                    user.image = message.author.avatarURL()

                    async function result() {
                        return await nookDB.updateUser(user);
                    }
                    result();
                }
                //Build and send the bank information
                message.channel.send(nookToolkit.buildUserEmbed(user));
            }
        });
    }
}