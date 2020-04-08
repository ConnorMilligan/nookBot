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

var embed = new Discord.MessageEmbed()

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
			db.close();
		});

		//Create the user collection
		dbo.createCollection("user", function (err, res) {
			if (err) throw err;
			console.log("user collection initialized");
			db.close();
		});

		console.log(dbo.collection("fish").countDocuments());
		if (dbo.collection("fish").countDocuments() === 0) {
			dbo.collection("fish").insertMany(fish.fish, function (err, res) {
				if (err) throw err;
				console.log("Inserted " + res.insertedCount + " fish into the database!");
				db.close();
			});
		} else {
			console.log("Fish database alread initalized");
		}
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
			if (args.length != 1) {
				buildFishEmbed(fish.fish[0]);
			} else {
				buildFishEmbed(fish.fish[Number(args[0])]);
			}
			message.channel.send(embed);
		}

		/* Bank command
		 * 
		 * For selling and checking balance
		 */
		else if (command === 'bank') {
			var myobj = { username: "kyroxus", address: "Highway 37" };
			dbo.collection("customers").insertOne(myobj, function(err, res) {
				if (err) throw err;
				console.log("1 document inserted");
				db.close();
			});

			console.log(dbo.collection('user').find({username : "kyroxus"}).limit(1));

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
				value: fishSize(fish) + ' cm',
				inline: true
			}, {
				name: 'Rarity',
				value: fish.rarity,
				inline: true
			}, )
			.setTimestamp();
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