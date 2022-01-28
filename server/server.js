const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const metaplex = require("./utils/metaplex.js");
const database = require("./utils/database.js");

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

app.use("/getCollectionMetaData", (req, res) => {
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
                        });
                    }
                });
            }
        }
        else
        {
            console.log("Invalid Input Given...");
        }

        //res.send(returnData);
    }
})


function testSort(collectionName)
{
    fs.readFile('lib/' + collectionName + '.json', 'utf8' , (err, collectionData) => {
        if (err) {
            console.log("Collection is not saved to file.");
            return
        }
        else
        {
            var collectionData = JSON.parse(collectionData);
            var nftList = Object.values(collectionData["items"]);

            nftList.sort(function(a, b) { 
                return a.masterRarity - b.masterRarity;
            })
            
            fs.writeFile("lib/testing.json" , JSON.stringify(nftList), function(err) {
                if(err) {
                    console.log(err);
                }
                console.log("Success: File was saved as testing.json");
        
            }); 
        }
    })
}




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





var testCollection = new collection.nftCollection();

metaplex.getPDA("GGEikoeYT143nYd7YMGGMapBuZERsG3vUS61i8td1s93").then( function(tokenPDA) {
    testCollection.addToCollection(tokenPDA, 0).then( () => {
        console.log(JSON.stringify(testCollection));
    })

})

*/