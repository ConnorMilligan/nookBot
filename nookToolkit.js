/*
 * Nook bot
 *
 * Nook Toolkit
 * 
 * Various functions for bot tasks
 *
 * By Connor
 */

//Dependencies
const Discord = require('discord.js');

const format = new Intl.NumberFormat();
const items = require('./data/items.json');

//Rarity chances
const catchChance = {
    'Very Common': 40,
    'Common': 30,
    'Uncommon': 20,
    'Rare': 9,
    'Very Rare': 2
}
const rarityList = [
    'Very Common',
    'Common',
    'Uncommon',
    'Rare',
    'Very Rare'
]

/* buildCritterEmbed
 * 
 * input type: critter
 * output type: Discord embed
 * 
 * Creates the catch message based on the critter caught
 */
function buildCritterEmbed(critter) {
    return new Discord.MessageEmbed().setTitle('You caught a ' + critter.name + '!')
        .setDescription(critter.catch)
        .setImage(critter.image)
        .addFields({
            name: 'Value',
            value: format.format(critter.price) + ' bells',
            inline: true
        }, {
            name: 'Size',
            value: critter.size + ' cm',
            inline: true
        }, {
            name: 'Rarity',
            value: critter.rarity,
            inline: true
        }, )
        .setTimestamp();
}

/* buildUserEmbed
 * 
 * input type: critter user
 * output type: Discord embed
 * 
 * Creates an embed for all user information
 */
function buildUserEmbed(user) {
    var entryList = [];

    //Fill list of fields with the users critters
    for (i = 0; i < 9; i++) {
        entryList.push({
            name: (i + 1) + '.',
            value: user.critters[i].name + '\n' + user.critters[i].size + ' cm',
            inline: true
        });
    }

    //Show fishing rod
    entryList.push({
        name: 'Your Fishing Rod',
        value: user.fishingrod.name,
        inline: true
    });

    //Show bug net
    entryList.push({
        name: 'Your Bug Net',
        value: user.bugnet.name,
        inline: true
    });

    return embed = new Discord.MessageEmbed().setTitle(user.name + '\'s bank!')
        .addField(greeting() + ', ' + user.name + '!', 'You currently have ' + format.format(user.bells) + ' bells.', false)
        .setThumbnail(user.image)
        .addFields(entryList)
        .setTimestamp();
}

/* buildStoreStockEmbed
 *
 * input type: user
 * output type: Discord embed
 * 
 * Creates the embed for available items at the store
 */
function buildStoreStockEmbed(user) {
    var entryList = [];

    for (i = 0; i < items.items.length; i++) {
        entryList.push({
            name: (i + 1) + '. ' + items.items[i].name,
            value: format.format(items.items[i].price) + ' bells',
            inline: true
        });
    }

    return new Discord.MessageEmbed().setTitle('Welcome to Nook\'s Cranny!')
        .addField(greeting() + ', ' + user.name + '!', 'Here\'s what we currently have for sale.', false)
        .setThumbnail('https://i.imgur.com/3JOuPBp.png')
        .addFields(entryList)
        .setTimestamp();
}

/* buildStoreBuyEmbed
 * 
 * input type: item
 * output type: Discord embed
 *
 * Creates the sell prompt
 */
function buildStoreBuyEmbed(item) {
    return new Discord.MessageEmbed().setTitle('Buy a ' + critter.name + '?')
        .addField(`Would you like to buy a ` + item.name + ' for ' + format.format(item.price) + ' bells?',
            'Confirm your sale by adding \'y\' to your sell command.', false)
        .setImage(item.image)
        .setTimestamp();
}

/* buildStoreSellEmbed
 * 
 * input type: critter
 * output type: Discord embed
 * 
 * Creates the sell prompt for the inputed critter
 */
function buildStoreSellEmbed(critter) {
    return new Discord.MessageEmbed().setTitle('Sell your ' + critter.name + '?')
        .addField(`Would you like to sell your ` + critter.name + ' for ' + format.format(critter.price) + ' bells?',
            'Confirm your sale by adding \'y\' to your sell command.', false)
        .setImage(critter.image)
        .addFields({
            name: 'Value',
            value: format.format(critter.price) + ' bells',
            inline: true
        }, {
            name: 'Size',
            value: critter.size + ' cm',
            inline: true
        }, {
            name: 'Rarity',
            value: critter.rarity,
            inline: true
        }, )
        .setTimestamp();
}

/* buildStoreSellAllEmbed
 * 
 * input type: user
 * output type: Discord embed
 * 
 * Creates the sell all prompt for the inputed user
 */
function buildStoreSellAllEmbed(user, balance) {
    return embed = new Discord.MessageEmbed().setTitle('Sell your all your critters?')
        .addField('Would you like to sell all your critters for ' + format.format(balance) + ' bells?',
            'Confirm your sale by adding \'y\' to your sell command.', false)
        .setThumbnail(user.image)
        .addFields({
            name: 'Current balance',
            value: format.format(user.bells) + ' bells',
            inline: true
        }, {
            name: 'Projected balance',
            value: format.format(balance + user.bells) + ' bells',
            inline: true
        })
        .setTimestamp();
}


/* buildStoreSoldEmbed
 * 
 * input type: user, critter
 * output type: Discord embed
 * 
 * Creates the sold prompt for the inputed critter and user
 */
function buildStoreSoldEmbed(user, critter) {
    return new Discord.MessageEmbed().setTitle('You sold your ' + critter.name + '!')
        .setDescription('You were paid ' + critter.price + ' bells.')
        .setThumbnail(user.image)
        .setImage(critter.image)
        .addFields({
            name: 'Old balance',
            value: format.format(user.bells - critter.price) + ' bells',
            inline: true
        }, {
            name: 'New balance',
            value: format.format(user.bells) + ' bells',
            inline: true
        })
        .setTimestamp();
}

/* buildSoldAllEmbed
 * 
 * input type: user, balance
 * output type: Discord embed
 * 
 * Creates the sold prompt for when all critters are sold
 */
function buildStoreSoldAllEmbed(user, balance) {
    return new Discord.MessageEmbed().setTitle('You sold your all your critters!')
        .setDescription('You were paid ' + format.format(balance) + ' bells.')
        .setThumbnail(user.image)
        .addFields({
            name: 'Old balance',
            value: format.format(user.bells - balance) + ' bells',
            inline: true
        }, {
            name: 'New balance',
            value: format.format(user.bells) + ' bells',
            inline: true
        })
        .setTimestamp();
}

/* greeting
 *
 * output type: string
 *
 * Makes a personalized greeting message based on the time
 */
function greeting() {
    if (new Date().getHours() >= 5 && new Date().getHours() <= 11) {
        return "Good morning"
    } else if (new Date().getHours() >= 12 && new Date().getHours() <= 17) {
        return "Good Afternoon"
    } else if (new Date().getHours() >= 18 && new Date().getHours() <= 20) {
        return "Good Evening"
    } else if (new Date().getHours() >= 21 || new Date().getHours() <= 4) {
        return "Good Night"
    } else {
        return "Hello"
    }
}

/* addCritter
 *
 * input type: critter user, critter, message channel
 * output type: array of user critter
 *
 * Outputs the user critter list with the inputted critter added
 */
function addCritter(user, critter, channel) {
    //Confirms that there is enough space in the user's inventory
    if (user.critters[user.critters.length - 1].price != 0) {
        channel.send("You don't have anymore space! The critter got away.");
    } else {
        //Loops through the user's inventory and places a critter in the first empty space
        for (i = 0; i < user.critters.length; i++) {
            if (user.critters[i].price === 0) {
                user.critters[i] = critter;
                i = user.critters.length;
            }
        }
        console.log('1 ' + critter.name + ' has been added to ' + user.name + '\'s bank');
    }
    return user.critters;
}

/* removeCritter
 *
 * input type: critter user, critter
 * output type: array of user critter
 *
 * Outputs the user critter list with the inputted critter removed
 */
function removeCritter(user, soldCritter) {
    var critters = makeEmptyCritterList();
    var index = 0;

    //Loop through the user's inventory and adds any critter to a new list
    for (i = 0; i < user.critters.length; i++) {
        if (user.critters[i].price != 0 && user.critters[i] != soldCritter) {
            critters[index] = user.critters[i];
            index++;
        }
    }
    return critters;
}

/* allCritterValue
 *
 * input type: critter user
 * output type: total value
 *
 * Outputs the value of all the critters in a user's inventory
 */
function allCritterValue(user) {
    var balance = 0;

    //Loop through the user's inventory and add up total sell price
    for (i = 0; i < user.critters.length; i++) {
        if (user.critters[i].price != 0) {
            balance += user.critters[i].price;
        }
    }

    return balance;
}

/* makeEmptyCritterList
 *
 * output type: empty array of critter
 *
 * Creates an empty array of critter
 */
function makeEmptyCritterList() {
    var fishList = [];
    for (i = 0; i < 9; i++) {
        fishList.push({
            name: "Empty",
            size: 0.0,
            price: 0,
        });
    }
    return fishList;
}

/* checkIfEmpty
 *
 * input type: critter user
 * output type: bool
 *
 * Returns true or false based on if the critter list is empty
 */
function checkIfEmpty(user) {

    for (i = 0; i < user.critters.length; i++) {
        if (user.critters[i].price != 0) {
            return false;
        }
    }
    return true;
}


/* getRarity
 *
 * output type: a rarity
 *
 * Determins a rarity based on the stats set in catchChance
 */
function getRarity() {
    return getRarityRecursion(Math.floor(Math.random() * Math.floor(100)), -1, 0);

}

function getRarityRecursion(chance, index, number) {
    if (index === 0 && chance <= catchChance[rarityList[0]]) {
        return rarityList[0]
    } else if (index >= rarityList.length - 1 && chance >= catchChance[rarityList[rarityList.length - 1]]) {
        return rarityList[rarityList.length - 1]
    } else if (chance > number && chance <= (number + catchChance[rarityList[index + 1]])) {
        return rarityList[index + 1];
    } else {
        return getRarityRecursion(chance, index + 1, (number + catchChance[rarityList[index + 1]]));
    }

}

/* critterSize
 * 
 * input type: critter
 * return type: float
 * 
 * Generates the size of the critter based on it's possible size range
 */
function critterSize(critter) {
    return ((Math.random() * (critter.size[0] - critter.size[1]) + critter.size[1]).toFixed(1));
}

module.exports.buildCritterEmbed = buildCritterEmbed;
module.exports.buildUserEmbed = buildUserEmbed;
module.exports.buildStoreStockEmbed = buildStoreStockEmbed;
module.exports.buildStoreBuyEmbed = buildStoreBuyEmbed;
module.exports.buildStoreSellEmbed = buildStoreSellEmbed;
module.exports.buildStoreSoldEmbed = buildStoreSoldEmbed;
module.exports.buildStoreSellAllEmbed = buildStoreSellAllEmbed;
module.exports.buildStoreSoldAllEmbed = buildStoreSoldAllEmbed;
module.exports.greeting = greeting;
module.exports.addCritter = addCritter;
module.exports.removeCritter = removeCritter;
module.exports.allCritterValue = allCritterValue;
module.exports.makeEmptyCritterList = makeEmptyCritterList;
module.exports.checkIfEmpty = checkIfEmpty;
module.exports.getRarity = getRarity;
module.exports.critterSize = critterSize;