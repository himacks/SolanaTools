const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const metaplex = require("./utils/metaplex.js");
const database = require("./utils/database.js");
const axios = require('axios');
const { PythonShell } = require('python-shell');


const collectionDatabase = [];

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cors());

app.listen(3000, function () {
    console.log('server is running');
})

app.get('/', (req, res) => {
    res.send("Welcome to the server");
})

app.use("/queryCollectionMetaData", (req, res) => {
    if (req.method == 'POST') {

        var tokenAddress = req.body.tokenAddress;

        var tokenType = req.body.tokenType;

        var letterNumber = /^[0-9a-zA-Z]+$/;
        
        if(tokenAddress.match(letterNumber))
        {
            console.log("Recieved POST Request to parse collection using " + tokenType + ": " + tokenAddress);

            if(tokenType == "creatorAddress")
            {
                var creatorTokenAddress = tokenAddress;
                database.queryNewCollection(creatorTokenAddress);
    
            }
            else if(tokenType == "mintAddress")
            {
                metaplex.getPDA(tokenAddress).then(async function(tokenPDA) {
                    var NFTMetadata = await metaplex.getNFTMetaData(tokenPDA, -1);
    
                    if(NFTMetadata === undefined)
                    {
                        console.log("Creator not Found from Mint Token Input. Invalid Token Input...");
                    }
                    else
                    {
                        var creatorTokenAddress = NFTMetadata.data["data"]["creators"][0]["address"]
    
                        console.log("Creator Found from Mint Token Input...");
                    
                        database.queryNewCollection(creatorTokenAddress).then((newNFTCollection) => {
                            collectionDatabase.push(newNFTCollection);
                            res.send({"collectionName" : newNFTCollection.collectionName});
                        });
                    }
                });
            }
        }
        else
        {
            console.log("Invalid Input Given...");
        }

    }
})

app.use("/getAvailableCollections", (req, res) => {
    if (req.method == 'GET') {
        database.getAvailableCollections().then( (collectionList) => {
            res.send({ "availableCollections" : collectionList });
        });
    }
});


var collection = "space_runners";

var skip = 0;

var urlLink = 'https://api-mainnet.magiceden.io/rpc/getListedNFTsByQuery?q={"$match":{"collectionSymbol":"' + collection + '"},"$sort":{"takerAmount":1,"createdAt":-1},"$skip":' + skip + '}'

let options = {
    mode: 'text',
    pythonOptions: ['-u'], // get print results in real-time
      scriptPath: 'python', //If you are having python_test.py script in same folder, then it's optional.
    args: [urlLink] //An argument which can be accessed in the script using sys.argv[1]
};

PythonShell.run('requestData.py', options, function (err, result){
    if (err) throw err;
    // result is an array consisting of messages collected
    //during execution of script.
    console.log('result: ', result.toString());
});


/*

TESTING ZONE

mpltokenmetadata.Metadata.getPDA("3qVjgom4fNf3Y9KrCSxSN8VLLeMsgJ2Wks3KsPhNa1Sw").then(function(tokenPDA) {
    getExternalNFTMetaData(tokenPDA, 0 , 0).then(function(metadata) {
        console.log(metadata);
    });
});



mpltokenmetadata.Metadata.getPDA("APm74uCQVbLPRi13PPjk85Kew8bLs1qfzTNgB4Sc6y7W").then(function(tokenPDA) {
    mpltokenmetadata.Metadata.load(connection, tokenPDA).then(function(testMetaData) {
        console.log("Result New");
        console.log(testMetaData.data["data"]);
        console.log(testMetaData.data);
    });
});


getPDA("FDcyyfZk98A6atFzXuWXmcRq2eQiD2tT4vT2azrHe69q").then(function(tokenPDA) {
    getNFTMetaData(tokenPDA).then(function(testMetaData) {
        console.log(testMetaData.data);
    });
});



//TEST FUNCTION EXECUTION TIME
const startTime = Date.now();
fetchCollection("spacerunnersxnbachampions", 10000).then( () => {
    const endTime = Date.now();

    const msElapsed = endTime - startTime;

    console.log(`Async function took ${msElapsed / 1000} seconds to complete.`);
});





var testCollection = new nftCollection();

testCollection.collectionName = "boryokumonkeyz";

testCollection.fetchSelfFromDatabase().then( () => {
    testCollection.sort();
    setTimeout( () => {
        testCollection.saveToDatabase();
    }, 1000);
});


*/