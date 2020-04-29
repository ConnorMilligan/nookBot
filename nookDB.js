/*
 * Nook bot
 *
 * Nook DB
 * 
 * All required database functions
 *
 * By Connor
 */

//Dependancies
const MongoClient = require('mongodb').MongoClient;

//Initialising variables
const fish = require('./data/fish.json');
const bug = require('./data/bug.json');
const { database } = require('./config.json');
const url = "mongodb://localhost:27017/";
const client = new MongoClient(url);

//Connects to the database
client.connect(function (err) {
    if (err) throw err;
    console.log("Database opened");
    var dbo = client.db(database);


    /* initialize
     * 
     * Prepares the collections, creates new if non-existant
     * Updates bug and fish collections if new are found in json
     */
    async function initialize() {
        var init = () => {
            return new Promise((resolve, reject) => {
                //Create the fish collection
                dbo.createCollection("fish", function (err, res) {
                    if (err) reject(err);
                    console.log("fish collection initialized");
                });

                //Create the bug collection
                dbo.createCollection("bug", function (err, res) {
                    if (err) reject(err);
                    console.log("bug collection initialized");
                });

                //Create the user collection
                dbo.createCollection("user", function (err, res) {
                    if (err) reject(err);
                    console.log("user collection initialized");
                });

                //Look for if there are more fish in the json and re-initialize the database if so
                dbo.collection("fish").countDocuments().then(num => {
                    if (num < Object.keys(fish.fish).length) {
                        //Remove all entries from the fish database
                        dbo.collection("fish").deleteMany({
                            image: /^http/
                        }, function (err, obj) {
                            if (err) reject(err);
                            //Readd all the fish again
                            dbo.collection("fish").insertMany(fish.fish, function (err, res) {
                                if (err) reject(err);
                                console.log((res.insertedCount - obj.result.n) + " new fish have been added into the database!");
                            });
                        });


                    } else {
                        console.log("fish database already up to date");
                    }
                });

                //Do the same for the bug database
                dbo.collection("bug").countDocuments().then(num => {
                    if (num < Object.keys(bug.bug).length) {
                        //Remove all entries from the bgu database
                        dbo.collection("bug").deleteMany({
                            image: /^http/
                        }, function (err, obj) {
                            if (err) reject(err);
                            //Readd all the bugs again
                            dbo.collection("bug").insertMany(bug.bug, function (err, res) {
                                if (err) reject(err);
                                console.log((res.insertedCount - obj.result.n) + " new bugs have been added into the database!");
                            });
                        });
                    } else {
                        console.log("bug database already up to date");
                        resolve(true);
                    }
                });
            });
        }
        var result = await init();
        if (result) {
            console.log("Database sucessfully initialized");
        }
    }

    /* getUser
     * 
     * input type: userid
     * 
     * Returns the user in the databse corresponding the the inputed id
     */
    async function getUser(userid) {
        var user = () => {
            return new Promise((resolve, reject) => {
                //Search database for user
                dbo.collection("user").find({
                    id: userid
                }).toArray(function (err, data) {
                    if (err) {
                        console.log("There was an error fetching the user.");
                        reject([]);
                    } else {
                        //Print if user was not found
                        if (data.length === 0) {
                            console.log("We did not find " + userid + "in the database, returning empty list");
                        }
                        resolve(data);
                    }
                });
            });

        }
        return await user();
    }

    /* addUser
     * 
     * input type: user
     * 
     * Adds a new user into the database
     */
    async function addUser(user) {
        var userAdd = () => {
            return new Promise((resolve, reject) => {
                dbo.collection("user").insertOne(user, function (err, res) {
                    if (err) {
                        console.log("There was an issue adding " + user.name + " to the database.");
                        reject(false);
                    } else {
                        console.log(user.name + " has been added to the database.");
                        resolve(true);
                    }
                });
            });

        }
        return await userAdd();
    }

    /* updateUser
     * 
     * input type: user
     * 
     * Replace the inputted user with the coresponding user in the database
     */
    async function updateUser(newUser) {
        var user = () => {
            return new Promise((resolve, reject) => {
                dbo.collection("user").replaceOne({
                    id: newUser.id
                }, newUser, function (err) {
                    if (err) {
                        console.log("There was an issue updating " + newUser.name);
                        reject(false);
                    } else {
                        console.log(newUser.name + " has been updated.");
                        resolve(true);
                    }
                });
            });
        }
        return await user();
    }

    /* getfish
     * 
     * input type: rarity, hour, month
     * output type: list of fish
     * 
     * Returns a list off possible fish to be caught based on the parameters
     */
    async function getFish(fishRarity, currentHour, currentMonth) {
        var fish = () => {
            return new Promise((resolve, reject) => {
                dbo.collection("fish").find({
                    rarity: fishRarity,
                    time: currentHour,
                    months: currentMonth
                }).toArray(function (err, data) {
                    if (err) {
                        console.log("There was an error fetching fish.");
                        reject([]);
                    } else {
                        console.log("List of fish found.");
                        resolve(data);
                    }
                });
            });

        }
        return await fish();
    }


    module.exports.initialize = initialize;
    module.exports.getUser = getUser;
    module.exports.addUser = addUser;
    module.exports.updateUser = updateUser;
    module.exports.getFish = getFish;
});