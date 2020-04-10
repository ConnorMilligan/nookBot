/*
 * Discord Fish bot
 * By Connor
 */

//Dependancies
const Discord = require('discord.js');
const MongoClient = require('mongodb').MongoClient;

//Create Discord client
const client = new Discord.Client();

//Initialising variables
const fish = require('./fish.json');
const config = require('./config.json');
const url = "mongodb://localhost:27017/";
const prefix = config.prefix;
const format = new Intl.NumberFormat();

//Rarity chances
const catchChance = {
	'Very Common': 32,
	'Common': 27,
	'Uncommon': 19,
	'Rare': 15,
	'Very Rare': 7
}
const rarityList = [
	'Very Common',
	'Common',
	'Uncommon',
	'Rare',
	'Very Rare'
]


var embed = new Discord.MessageEmbed();

//Connect to mongodb
MongoClient.connect(url, function (err, db) {
	if (err) throw err;
	console.log("Database initialized");
	var dbo = db.db("fishbot");

	//Startup code
	client.on('ready', () => {
		//Create the fish collection
		dbo.createCollection("fish", function (err, res) {
			if (err) throw err;
			console.log("fish collection initialized");
		});

		//Create the user collection
		dbo.createCollection("user", function (err, res) {
			if (err) throw err;
			console.log("user collection initialized");
		});

		//Look for if there are more fish in the json and re-initialize the database if so
		dbo.collection("fish").countDocuments().then(num => {
			if (num < Object.keys(fish.fish).length) {
				//Remove all entries from the fish database
				dbo.collection("fish").deleteMany({
					image: /^http/
				}, function (err, obj) {
					if (err) throw err;
					//Readd all the fish again
					dbo.collection("fish").insertMany(fish.fish, function (err, res) {
						if (err) throw err;
						console.log((res.insertedCount - obj.result.n) + " new fish have been added into the database!");
					});
				});


			} else {
				console.log("fish database already up to date");
			}
		});
	});


	//Processor for all the messages
	client.on('message', message => {
		//Parses the message, confirming it's a command and not in a dm channel and separates any args
		if ((!message.content.startsWith(prefix) || message.author.bot) && message.channel.type != 'dm') return;
		const args = message.content.slice(prefix.length).split(/ +/);
		const command = args.shift().toLowerCase();

		/* Fish command
		 *
		 * The command used for actually fishing
		 */
		if (command === 'fish') {
			dbo.collection("user").find({
				id: message.author.id
			}).toArray(function (err, result) {
				//Check reasons the user may not be able to fish
				if (result.length === 0) {
					message.channel.send("You can't go fishing yet! Go to the bank to be added to the database.");
				} else {
					var dates = Math.floor((Math.abs(result[0].time - new Date()) / 1000) / 60);
					if (dates < 60) {
						message.channel.send("You can only go fishing once per hour! Wait another " + (60 - dates) + " minutes and try again.");
					} else {
						var fishRarity = getRarity();
						var currentHour = new Date().getHours();
						var currentMonth = new Date().getMonth();

						//Get a list of valid fish in the specified parameters
						dbo.collection("fish").find({
							rarity: fishRarity,
							time: currentHour,
							months: currentMonth
						}).toArray(function (err, fishes) {
							if (err) throw err;

							//Make sure the list has at least one fish in it
							if (fishes.length === 0) {
								message.channel.send("There's nothing biting!");
							} else {
								//Choose a random fish from the valid fish list, determine the size and build the embed
								var caught = fishes[Math.floor(Math.random() * ((fishes.length - 1) - 0 + 1)) + 0];
								caught.size = fishSize(caught);
								buildFishEmbed(caught);

								//Add updated fish array to the user in the database
								dbo.collection("user").updateOne({
									id: message.author.id
								}, {
									$set: {
										fish: addFish(result[0], caught, message.channel),
										time: new Date()
									}
								}, function (err, res) {
									if (err) throw err;
								});
							}
						});
					}
				}
			});
		}

		/* Bank command
		 * 
		 * For selling and checking balance
		 */
		else if (command === 'bank') {
			dbo.collection("user").find({
				id: message.author.id
			}).toArray(function (err, result) {
				//Check if the user exists in the database
				if (result.length === 0) {
					message.channel.send("It appears you aren't in the database. Let me add you now!");

					//Create a new user based on the the message author
					var fishList = makeEmptyFishList();
					var myobj = {
						name: message.author.username,
						id: message.author.id,
						image: message.author.avatarURL(),
						bells: 0,
						fish: fishList,
						time: new Date('2020/1/1 00:00:00')
					};

					//Add the new user to the database
					dbo.collection("user").insertOne(myobj, function (err, res) {
						if (err) throw err;
						console.log(myobj.name + " has been added to the database.");
						message.channel.send("You are now in the database! Run the command again to see your menu.");
					});
				} else {
					//Build and send the bank information
					buildUserEmbed(result[0]);
					message.channel.send(embed);
				}
			});
		}

		/* Store command
		 *
		 * buy: Not yet implemented
		 * sell: used to sell a specified fish
		 *
		 * Handles the fuctions of the store
		 *
		 * I would like to rewrite this at some point
		 */
		else if (command === 'store') {
			dbo.collection("user").find({
				id: message.author.id
			}).toArray(function (err, result) {
				//Check if the user is in the database and if there are any args to the command
				if (result.length === 0) {
					message.channel.send("You can't go to the store yet! Go to the bank to be added to the database.");
				} else if (args.length === 0) {
					message.channel.send("Welcome to the store! use commands `" + config.prefix + "store buy` or `" + config.prefix + "store sell` to use the store!");
				} else {
					switch (args[0]) {
						case 'buy':
							message.channel.send("Sorry, we're restocking at the moment. Please come back again soon!");
							break;
						case 'sell':
							//Check if there is the correct number of args for this command
							if (args.length === 1) {
								message.channel.send("If you would like to sell something, use the command `" + config.prefix + "store sell n` where \'n\' is the number of what you want to sell according to you inventory in the bank.");
							} else if (!(args.length > 1 && args.length <= 3)) {
								message.channel.send("You have put in an incorrect number of args for this command.");
							} else {
								//Checks if the entered args are valid
								if (isNaN(parseInt(args[1]))) {
									message.channel.send("There was an issue with you parameter. Are you sure you are using a number?");
								} else if (parseInt(args[1]) < 1 || parseInt(args[1]) > 9) {
									message.channel.send("The number you put in is out of range!");
								} else if (result[0].fish[parseInt(args[1]) - 1].price === 0) {
									message.channel.send("You don't seem to have a fish in that slot.");
								} else if (args.length === 2) {
									//Send a sell information message based on the entered fish
									buildShopEmbed(result[0].fish[parseInt(args[1]) - 1]);
									message.channel.send(embed);
								} else if (args.length === 3) {
									//Checks if the user wishes to confirm the sale
									if (args[2] === 'y') {
										//A new user with the fish removed and bell count updated
										var soldUser = sellFish(result[0], parseInt(args[1] - 1), message.channel);

										//Update the fish list and bell count in the user database
										dbo.collection("user").updateOne({
											id: message.author.id
										}, {
											$set: {
												fish: soldUser.fish,
												bells: soldUser.bells
											}
										}, function (err, res) {
											if (err) throw err;
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
	});

	/* buildFishEmbed
	 * 
	 * input type: fish
	 * 
	 * Creates the catch message based on the fish caught
	 */
	function buildFishEmbed(fish) {
		embed = new Discord.MessageEmbed().setTitle('You caught a ' + fish.name + '!')
			.setDescription(fish.catch)
			.setImage(fish.image)
			.addFields({
				name: 'Value',
				value: format.format(fish.price) + ' bells',
				inline: true
			}, {
				name: 'Size',
				value: fish.size + ' cm',
				inline: true
			}, {
				name: 'Rarity',
				value: fish.rarity,
				inline: true
			}, )
			.setTimestamp();
	}

	/* buildUserEmbed
	 * 
	 * input type: fish user
	 * 
	 * Creates the catch message based on the fish caught
	 */
	function buildUserEmbed(user) {
		var entryList = [];

		//Fill list of fields with the users fish
		for (i = 0; i < 9; i++) {
			entryList.push({
				name: (i + 1) + '.',
				value: user.fish[i].name + '\n' + user.fish[i].size + ' cm',
				inline: true
			});
		}

		embed = new Discord.MessageEmbed().setTitle(user.name + '\'s bank!')
			.addField(greeting() + ', ' + user.name + '!', 'You currently have ' + format.format(user.bells) + ' bells.', false)
			.setThumbnail(user.image)
			.addFields(entryList)
			.setTimestamp();
	}

	/* buildShopEmbed
	 * 
	 * input type: fish
	 * 
	 * Creates the sell prompt for the inputed fish
	 */
	function buildShopEmbed(fish) {
		embed = new Discord.MessageEmbed().setTitle('Sell your ' + fish.name + '?')
			.addField(`Would you like to sell your ` + fish.name + ' for ' + format.format(fish.price) + ' bells?',
				'Confirm your sale by adding \'y\' to your sell command.', false)
			.setImage(fish.image)
			.addFields({
				name: 'Value',
				value: format.format(fish.price) + ' bells',
				inline: true
			}, {
				name: 'Size',
				value: fish.size + ' cm',
				inline: true
			}, {
				name: 'Rarity',
				value: fish.rarity,
				inline: true
			}, )
			.setTimestamp();
	}

	/* buildSoldEmbed
	 * 
	 * input type: user, fish
	 * 
	 * Creates the sold prompt for the inputed fish and user
	 */
	function buildSoldEmbed(user, fish) {
		embed = new Discord.MessageEmbed().setTitle('You sold your ' + fish.name + '!')
			.setDescription('You were paid ' + fish.price + ' bells.')
			.setThumbnail(user.image)
			.setImage(fish.image)
			.addFields({
				name: 'Old balance',
				value: format.format(user.bells) + ' bells',
				inline: true
			}, {
				name: 'New balance',
				value: format.format(fish.price + user.bells) + ' bells',
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

	/* addFish
	 *
	 * input type: fish user, fish, message channel
	 * output type: array of user fish
	 *
	 * Manages the adding of fish to a user's inventory
	 */
	function addFish(user, fish, channel) {
		//Confirms that there is enough space in the user's inventory
		if (user.fish[user.fish.length - 1].price != 0) {
			channel.send("You don't have anymore space! The fish got away.");
		} else {
			//Loops through the user's inventory and places a fish in the first empty space
			for (i = 0; i < user.fish.length; i++) {
				if (user.fish[i].price === 0) {
					user.fish[i] = fish;
					i = user.fish.length;
				}
			}
			console.log('1 ' + fish.name + ' has been added to ' + user.name + '\'s bank');
			channel.send(embed);
		}
		return user.fish;
	}

	/* sellFish
	 *
	 * input type: fish user, fish, message channel
	 * output type: array of user fish
	 *
	 * Manages the selling of fish from a user's inventory
	 */
	function sellFish(user, num, channel) {
		var fish = makeEmptyFishList();
		var newUser = user;
		var index = 0;

		//Loop through the user's inventory and adds any fish to a new list
		for (i = 0; i < user.fish.length; i++) {
			if (user.fish[i].price != 0 && i != num) {
				fish[index] = user.fish[i];
				index++;
			}
		}

		//Builds the embed and updates the user with the new inventory and bell count
		buildSoldEmbed(user, user.fish[num]);
		channel.send(embed);
		console.log('1 ' + user.fish[num].name + ' has been sold by ' + user.name + ' for ' + user.fish[num].price + ' bells');
		newUser.fish = fish;
		newUser.bells = (user.fish[num].price + user.bells);
		return newUser;
	}

	/* makeEmptyFishList
	 *
	 * output type: empty array of fish
	 *
	 * Creates an empty array of fish
	 */
	function makeEmptyFishList() {
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

	/* fishSize
	 * 
	 * input type: fish
	 * return type: float
	 * 
	 * Generates the size of the fish based on it's possible size range
	 */
	function fishSize(fish) {
		return ((Math.random() * (fish.size[0] - fish.size[1]) + fish.size[1]).toFixed(1));
	}
});
client.login(config.token);