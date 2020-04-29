/*
 * Nook bot
 *
 * Main file 
 *
 * By Connor
 */

//Dependancies
const Discord = require('discord.js');

//Create Discord client
const client = new Discord.Client();

//Initialising variables
const fs = require('fs');
const { prefix, token } = require('./config.json');
const nookDB = require("./nookDB.js");
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

//Loads all commands from respective file
client.commands = new Discord.Collection();

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

//Initialize the database on start
client.once('ready', async () => {
	nookDB.initialize();
	console.log('I am ready!');
});

//Processor for all the messages
client.on('message', message => {
	//confirms the message starts with the prefix and is not a bot
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	//parses the message for any commands and parameters
	const args = message.content.slice(prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	//confirms the command is valid
	if (!client.commands.has(command)) return;

	//Try to execute the command with the given args
	try {
		client.commands.get(command).execute(message, args);
	} catch (error) {
		console.error(error);
		message.channel.send('there was an error trying to execute that command!');
	}
});

//login to the bot with the provided token
client.login(token);