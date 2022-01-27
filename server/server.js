const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const metaplex = require('@metaplex/js');
const mplcore = require('@metaplex-foundation/mpl-core');
const mpltokenmetadata = require('@metaplex-foundation/mpl-token-metadata');
const fs = require('fs');
const web3 = require('@solana/web3.js')
const axios = require('axios');
const cliProgress = require('cli-progress');




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

        console.log("Recieved POST Request to parse collection using " + tokenType + ": " + tokenAddress);

        if(tokenType == "creatorAddress")
        {
            var creatorTokenAddress = tokenAddress;
            queryNewCollection(creatorTokenAddress);

        }
        else if(tokenType == "mintAddress")
        {
            getPDA(tokenAddress).then(async function(tokenPDA) {
                var NFTMetadata = await getNFTMetaData(tokenPDA, -1);

                if(NFTMetadata === undefined)
                {
                    console.log("Creator not Found from Mint Token Input. Invalid Token Input...");
                }
                else
                {
                    var creatorTokenAddress = NFTMetadata.data["data"]["creators"][0]["address"]

                    console.log("Creator Found from Mint Token Input...");
                
                    queryNewCollection(creatorTokenAddress);
                }
            });
        }

        


        

        //res.send(returnData);
    }
})

const connection = new metaplex.Connection("mainnet-beta");
const mainNetConnection = new web3.Connection("https://api.metaplex.solana.com/");
const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const collectionDatabase = {};


function queryNewCollection(creatorTokenAddress)
{
    return new Promise((resolve) =>
    {
        let queriedSerializedMap = getMintsFromCreator(creatorTokenAddress);

        queriedSerializedMap.then(function(serializedMap) {

            console.log("Found Serialized Map for Collection!")

            const promises = [];

            const collectionSize = serializedMap.length;

            //const collectionSize = 100; //for testing purposes

            var delay = 0; //ms

            console.log("Adding " + collectionSize + " Items To New Collection");
            const b1 = new cliProgress.SingleBar({
                format: 'Progress [{bar}] {percentage}% | {value}/{total} NFTs Parsed'
            }, cliProgress.Presets.shades_classic);

            b1.start(collectionSize, 0);

            for(let i = 0; i < collectionSize; i++) //timeout error happens here
            {
                var serializedNFT = serializedMap[i];

                var nftPDA = serializedNFT["pubkey"];

                if(i%20 == 0)
                {
                    delay += 300;
                }
                
                promises.push(
                    new Promise(function(resolve) {
                        addToCollection(nftPDA, collectionSize, delay).then( function(result) {
                            b1.increment();
                            resolve(result);
                        });
                    })
                );
            }
            
            Promise.all(promises).then((results) => {
            // do what you want on the results
                //console.log("promises finished");

                b1.stop();
                var numInvalidNFTs = 0;
                var collectionName;

                for(const item of results)
                {
                    if(item == "invalid")
                    {
                        numInvalidNFTs += 1;
                    }
                    else
                    {
                        collectionName = item;
                    }
                }

                if(collectionSize == 0)
                {
                    console.log("Error: Address provided contains no valid NFTs")
                }
                else
                {
                    console.log("Collection Size Post-Parsing: " + (collectionSize - numInvalidNFTs));
                    modifyCollectionSize(collectionName, numInvalidNFTs, "reduce");
                    validateCollectionRarities(collectionName);
                    saveToFile(collectionName);
                }

                resolve();

            });
        })
    })
}

function modifyCollectionSize(collectionName, inputCount, modifyType)
{
    if(collectionDatabase[collectionName] === undefined)
    {
        console.log("Error: Collection not Cataloged");
    }
    else if(modifyType == "reduce")
    {   
        collectionDatabase[collectionName]["collectionCount"] -= inputCount;
    }
    else if(modifyType == "overwrite")
    {
        collectionDatabase[collectionName]["collectionCount"] = inputCount;
    }


}

let getNFTMetaData = async function(tokenPDA, attempt) {

    if(attempt === undefined) { attempt = 0; }

    return new Promise(async function(resolve) {

        try {
            const mintAccInfo = await connection.getAccountInfo(tokenPDA);
            const metadata = mpltokenmetadata.Metadata.from(new mplcore.Account(tokenPDA, mintAccInfo));

            resolve(metadata);
        }
        catch(err)
        {
            console.log("Failed Attempt: "+ attempt + " - solana network request failed, retrying...");

            if(attempt == -1)
            {
                resolve(undefined);
            }
            else if(attempt < 12)
            {
                setTimeout( async function() {
                    resolve(await getNFTMetaData(tokenPDA, attempt+1));
                }, 10000);
            }
            else
            {
                resolve("invalid");
            }
        }
    });

    /*

    mpltokenmetadata.Metadata.load(connection, tokenPDA).then(function(foundMetaData) {
        console.log("Retrieving NFT Metadata")
        return foundMetaData.data["data"]
    });

    */
}

let getExternalNFTMetaData = async function(tokenPDA, delay, attempt) {

    return new Promise(async function(resolve) {

        setTimeout( async function() {

            const metadataParent = (await getNFTMetaData(tokenPDA, 0));

            if(metadataParent == "invalid")
            {
                resolve("invalid");
                return;
            }

            const metadata = metadataParent.data["data"];

            try {
                const metadataFromURI = (await axios.get(metadata["uri"]));
                //console.log(metadataFromURI.data["name"] + " EXTERNAL Metadata Retrieved");
                resolve(metadataFromURI.data); 
            } catch (err) {


                //resolve("invalid");

                //console.log("URI: " + metadata["uri"]);
                //console.log("Name: " + metadata["name"]);

                
                //console.log(metadata["name"] + " Failed Attempt: "+ attempt + " - axios failed, retrying...")
                //console.log("URI: " + metadata["uri"]);

                if(attempt < 5)
                {
                    setTimeout(async function() {
                        resolve(await getExternalNFTMetaData(tokenPDA, 10000, attempt+1));
                    }, 1000 * Math.floor(Math.random() * (11) + 10)) //can rewrite this in future to adjust delay based on how many retry elements are in the stack, more items = more delay range, less items = less delay range
                }
                else
                {
                    //console.log(metadata["name"] + " Not Minted");
                    //console.log("Mint: " + metadataParent.data["mint"]);
                    resolve("invalid");
                }

                

            };
        
            //console.log("Got External Metadata from " + metadataFromURI["name"]);
        }, delay);

    });
  
  }
  


let getMintsFromCreator = async function(creatorTokenAddress)
{
    //console.log(creatorTokenAddress);

    //const creatorPDA = await mpltokenmetadata.Metadata.getPDA(creatorTokenAddress);
    const metaProgramPDA = new web3.PublicKey(METADATA_PROGRAM_ID);
    //console.log(metaProgramPDA);

    const filters = {
    "encoding": "base64",
    "filters": [
        {
        "memcmp": {
            "offset": 326,
            "bytes": creatorTokenAddress,
        },
        },
        {
        "memcmp": {
            "offset": 358, // first creator verified position
            "bytes": "2", // 1 as base58 string
        },
        },
    ],
    }
    const serializedMap = await mainNetConnection.getProgramAccounts(metaProgramPDA, filters);

    //console.log(serializedMap)

    return serializedMap;

}


function addToCollection(tokenPDA, collectionSize, delay)
{
    return new Promise((resolve) => {
        getExternalNFTMetaData(tokenPDA, delay, 0).then(function(thismetadata) {
            //console.log("Adding " + thismetadata["name"] + " to Collection");

            if(thismetadata == "invalid")
            {
                //console.log("Too many failed attempts or NFT is not minted... probably the latter")
                resolve("invalid");
            }
            else
            {
                collectionName = thismetadata["name"].replace(/[^a-zA-Z]+/g, '').toLowerCase();
        
                //console.log(collectionName);

                fetchCollection(collectionName, collectionSize).then( () => {
                    if(collectionDatabase[collectionName] !== undefined && collectionSize != collectionDatabase[collectionName]["collectionSize"])
                    {
                        modifyCollectionSize(collectionName, collectionSize, "overwrite");
                    }
                    
                    if(collectionDatabase[collectionName]["items"][thismetadata["name"]] === undefined)
                    {
                        collectionDatabase[collectionName]["items"][thismetadata["name"]] = thismetadata;
                    }
                
                    resolve(collectionName);
                });
            }
        });
    })
}

const collectionsInStack = [];

function fetchCollection(collectionName, collectionSize)
{
    return new Promise(function(resolve) {
        if(collectionDatabase[collectionName] === undefined)
        {
            if(collectionsInStack.includes(collectionName))
            {
                //console.log("Collection is being fetched from directory. Not opening instead waiting.");
                setTimeout(async function() {
                    resolve(await fetchCollection(collectionName, collectionSize));
                }, 1000);
            }
            else
            {
                //console.log("Reading lib directory for " + collectionName + "...")
                collectionsInStack.push(collectionName);
                fs.readFile('lib/' + collectionName + '.json', 'utf8' , (err, collectionData) => {
                    if (err) 
                    {
                        //console.log("Couldn't find collection in lib database, creating new one.");

                        createNewCollection(collectionName, collectionSize)
                    }
                    else
                    {
                        //console.log("Collection Already Exists in File Database. Opening file for update.")
                        collectionDatabase[collectionName] = JSON.parse(collectionData);
                    }
    
    
                    collectionsInStack.splice(collectionsInStack.indexOf(collectionName), 1);
                    resolve();
                });
            }
        }
        else
        {
            //console.log("Collection exists in var collectionDatabase. No further action needed.");

            resolve();
        }
    });
}

function calculateNFTRarity(collectionName)
{
    if(collectionDatabase[collectionName] === undefined)
    {
        console.log("Error: Collection not Cataloged");
    }
    else
    {   

        var attributeDictionary = collectionDatabase[collectionName]["attributeDictionary"];

        for(const [key, value] of Object.entries(collectionDatabase[collectionName]["items"]))
        {
            var attributeList = value["attributes"];
            var masterRarity = 1.0;

            for(const attribute of attributeList)
            {
                var traitType = attribute["trait_type"];
                var traitValue = attribute["value"];

                var rarity = attributeDictionary[traitType]["Items"][traitValue]["Rarity"];

                masterRarity *= rarity;
            }

            value["masterRarity"] = masterRarity;

        }
    }
}


/*

var attributeList = [
    {
        "trait_type": "Backdround",
        "value": "Blue"
    },
    {
        "trait_type": "Body",
        "value": "Monkey"
    },
    {
        "trait_type": "Cloth",
        "value": "Bone"
    },
    {
        "trait_type": "Face",
        "value": "Cigarette"
    },
    {
        "trait_type": "Head",
        "value": "IceCreamWhite"
    },
    {
        "trait_type": "Ears",
        "value": "Knife"
    }
];


const collectionDatabase = {
    "boryokumonkeyz":
    {
        "name": "boryokumonkeyz",
        "collectionCount": 20,
        "attributeDictionary": {
            
            "BackgroundTest" : {"Items": {"Blue": {"Count": 1, "Rarity": 1/20}, "None": {"Count": 3, "Rarity": 3/20}, "Black": {"Count": 4, "Rarity": 4/20}, "Red": {"Count": 5, "Rarity": 5/20}}}
            
        },
        "items": []
    }
}

*/

function validateCollectionRarities(collectionName)
{
    if(collectionDatabase[collectionName] === undefined)
    {
        console.log("Error: Collection not Cataloged");
    }
    else
    {   
        //console.log("Parsing Attributes...");

        var collectionSize = collectionDatabase[collectionName]["collectionCount"];

        var attributeDictionary = {};

        for(const [key, value] of Object.entries(collectionDatabase[collectionName]["items"]))
        {
            var attributeList = value["attributes"];

            for(const attribute of attributeList)
            {
                var traitType = attribute["trait_type"];
                var traitValue = attribute["value"];

                //console.log("Trait Type: " + traitType);
                //console.log("Trait Value: " + traitValue);
                

                if(attributeDictionary[traitType] === undefined)
                {   
                    attributeDictionary[traitType] = {"Items": {}};
                }

                if(attributeDictionary[traitType]["Items"][traitValue] === undefined)
                {
                    attributeDictionary[traitType]["Items"][traitValue] = {"Count": 1, "Rarity": 1/collectionSize};
                }
                else
                {
                    attributeDictionary[traitType]["Items"][traitValue]["Count"] += 1;
                    attributeDictionary[traitType]["Items"][traitValue]["Rarity"] = (attributeDictionary[traitType]["Items"][traitValue]["Rarity"] * collectionSize + 1) / collectionSize;
                }
            }
        }

        collectionDatabase[collectionName]["attributeDictionary"] = attributeDictionary;

        for(const [key, value] of Object.entries(collectionDatabase[collectionName]["items"]))
        {
            var attributeList = value["attributes"];

            var masterRarity = 1;


            for(const attribute of attributeList)
            {
                var traitType = attribute["trait_type"];
                var traitValue = attribute["value"];
                masterRarity *= attributeDictionary[traitType]["Items"][traitValue]["Rarity"];
            }

            value["masterRarity"] = masterRarity;

        }

    }
}

function saveToFile(collectionName)
{
    if(collectionDatabase[collectionName] === undefined)
    {
        console.log("Error: Collection not Cataloged");
    }
    else
    {
        fs.writeFile("lib/" + collectionName +".json" , JSON.stringify(collectionDatabase[collectionName]), function(err) {
            if(err) {
                console.log(err);
            }
            console.log("Success: File was saved as " + collectionName + ".json");
    
        }); 
    }

    
}


function createNewCollection(collectionName, collectionSize)
{
    collectionData = {
            "name": collectionName,
            "collectionCount": collectionSize,
            "attributeDictionary": {
                /*
                "attributeName (eg. Background)": {"possibleValues": {"Red": {"Count": 5, "Rarity": 0.05}, "None": {"Count": 95, "Rarity": 0.95}}}}
                */
            }
            ,
            "items": {}
        };

    collectionDatabase[collectionName] = collectionData;
}

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
                return b.masterRarity - a.masterRarity;
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


async function getPDA(tokenAddress)
{
    return (await mpltokenmetadata.Metadata.getPDA(tokenAddress));
}

testSort('solanaboredfolks');

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


*/