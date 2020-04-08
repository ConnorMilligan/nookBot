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


var embed = new Discord.MessageEmbed();

//Connect to mongodb
MongoClient.connect(url, function (err, db) {
	if (err) throw err;
	console.log("Database initialized");
	var dbo = db.db("fishbot");

	//Startup code
	client.on('ready', () => {
		console.log('I am ready!');
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

		dbo.collection("fish").countDocuments().then(num => {
			if (num === 0) {
				dbo.collection("fish").insertMany(fish.fish, function (err, res) {
					if (err) throw err;
					console.log("Inserted " + res.insertedCount + " fish into the database!");
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
			}).toArray(function(err, result) {
				if (result.length === 0) {
					message.channel.send("You can't go fishing yet! Go to the bank to be added to the database.");
				} else {
					if (args.length != 1) {
						buildFishEmbed(fish.fish[0]);
					} else {
						var caught = fish.fish[Number(args[0])];
						caught.size = fishSize(caught);
						
						buildFishEmbed(caught);

						dbo.collection("user").updateOne({id: message.author.id}, {$set: {fish: addFish(result[0], caught, message.channel)}}, function(err, res) {
							if (err) throw err;
							console.log("1 document updated");
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
			}).toArray(function(err, result) {
				
				if (result.length === 0) {
					message.channel.send("It appears you aren't in the database. Let me add you now!");

					var fishList = [];
					for (i = 0; i < 9; i++) {
						fishList.push({name: "Empty", size: 0.0, price: 0});
					}

					var myobj = {
						name: message.author.username,
						id: message.author.id,
						bells: 0,
						fish: fishList
					};

					console.log(fish);

					dbo.collection("user").insertOne(myobj, function (err, res) {
						if (err) throw err;
						console.log(myobj.name + " has been added to the database.");
						message.channel.send("You are now in the database! Run the command again to see your menu.");
					});
				} else {
					buildUserEmbed(message.author, result[0]);
					message.channel.send(embed);
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
				value: fish.price + ' bells',
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
	 * input type: discord user, fish user
	 * 
	 * Creates the catch message based on the fish caught
	 */
	function buildUserEmbed(disUser, user) {
		var entryList = [];
			for (i = 0; i < 9; i++) {
				entryList.push({
					name: (i+1) + '.',
					value: user.fish[i].name + '\n' + user.fish[i].size + ' cm',
					inline: true
				});
			}

		embed = new Discord.MessageEmbed().setTitle(disUser.username + '\'s bank!')
			//.setDescription(greeting() + ', ' + disUser.username + '!\nYou currently have ' + format.format(user.bells) + ' bells.')
			.addField(greeting() + ', ' + disUser.username + '!', 'You currently have ' + format.format(user.bells) + ' bells.', false)
			.setThumbnail(disUser.avatarURL())
			.addFields(entryList)
			.setTimestamp();
	}

	/* greeting
	*
	* output type: string
	*
	* Makes a personalized greeting message based on the time
	*/
	function greeting() {
		if (new Date().getHours() > 5 && new Date().getHours() < 12) {
			return "Good morning"
		} else if (new Date().getHours() > 12 && new Date().getHours() < 18) {
			return "Good Afternoon"
		} else if (new Date().getHours() > 18 && new Date().getHours() < 20) {
			return "Good Evening"
		} else if (new Date().getHours() > 20 && new Date().getHours() < 23) {
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
		if (user.fish[user.fish.length - 1].price != 0) {
			channel.send("You don't have anymore space! The fish got away.");
		} else {
			for (i = 0; i < user.fish.length; i++) {
				if (user.fish[i].price === 0) {
					user.fish[i].name = fish.name;
					user.fish[i].size = fish.size;
					user.fish[i].price = fish.price;
					i = user.fish.length;
				}
			}
			channel.send(embed);
		}
		return user.fish;
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