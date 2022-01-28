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

        var letterNumber = /^[0-9a-zA-Z]+$/;
        
        if(tokenAddress.match(letterNumber))
        {
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
        }
        else
        {
            console.log("Invalid Input Given...");
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
        getMintsFromCreator(creatorTokenAddress).then(function(serializedMap) {

            console.log("Found Serialized Map for Collection!")

            const promises = [];

            const collectionSize = serializedMap.length;

            //const collectionSize = 100; //for testing purposes

            var delay = 0; //ms

            console.log("Adding " + collectionSize + " Found Tokens To New Collection");
            const b1 = new cliProgress.SingleBar({
                format: 'Progress [{bar}] {percentage}% | {value}/{total} NFTs Parsed'
            }, cliProgress.Presets.shades_classic);

            b1.start(collectionSize, 0);

            var successfulNFTParsed = 0;

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
                            if(result != "invalid")
                            {
                                successfulNFTParsed++;
                            }
                            resolve(result);
                        });
                    })
                );
            }
            
            Promise.all(promises).then((results) => {

                b1.stop();
                var collectionName = "invalid";

                for(const item of results)
                {
                    if(item != "invalid")
                    {
                        collectionName = item;
                        break;
                    }
                }

                if(collectionSize == 0)
                {
                    console.log("Error: Address provided contains no valid NFTs")
                }
                else
                {
                    console.log("Collection Size Post-Parsing: " + successfulNFTParsed);
                    modifyCollectionSize(collectionName, successfulNFTParsed, "overwrite");
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
    else if(modifyType == "add")
    {   
        collectionDatabase[collectionName]["collectionCount"] += inputCount;
    }
    else if(modifyType == "overwrite")
    {
        collectionDatabase[collectionName]["collectionCount"] = inputCount;
    }


}

async function getNFTMetaData(tokenPDA, attempt) {

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
}

async function getExternalNFTMetaData(tokenPDA, delay, attempt) {

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
  


async function getMintsFromCreator(creatorTokenAddress)
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


function addToCollection(tokenPDA, delay)
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

                fetchCollection(collectionName).then( () => {                    
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

function fetchCollection(collectionName)
{
    return new Promise(function(resolve) {
        if(collectionDatabase[collectionName] === undefined)
        {
            if(collectionsInStack.includes(collectionName))
            {
                //console.log("Collection is being fetched from directory. Not opening instead waiting.");
                setTimeout(async function() {
                    resolve(await fetchCollection(collectionName));
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

                        createNewCollection(collectionName)
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
            const attributeList = value["attributes"];

            for(const attribute of attributeList)
            {
                const traitType = attribute["trait_type"];
                const traitValue = attribute["value"];

                //console.log("Trait Type: " + traitType);
                //console.log("Trait Value: " + traitValue);
                

                if(attributeDictionary[traitType] === undefined)
                {   
                    attributeDictionary[traitType] = {"Items": {}};
                }

                if(attributeDictionary[traitType]["Items"][traitValue] === undefined)
                {
                    attributeDictionary[traitType]["Items"][traitValue] = {"Count": 1, "Rarity": collectionSize};
                }
                else
                {
                    attributeDictionary[traitType]["Items"][traitValue]["Count"]++;

                    attributeDictionary[traitType]["Items"][traitValue]["Rarity"] = attributeDictionary[traitType]["Items"][traitValue]["Count"] / collectionSize;
                }
            }
        }

        collectionDatabase[collectionName]["attributeDictionary"] = attributeDictionary;

        for(const [key, value] of Object.entries(collectionDatabase[collectionName]["items"]))
        {
            const attributeList = value["attributes"];

            var masterRarity = 1;

            for(const attribute of attributeList)
            {
                const traitType = attribute["trait_type"];
                const traitValue = attribute["value"];
                const traitValueRarity = attributeDictionary[traitType]["Items"][traitValue]["Rarity"];
                masterRarity *= traitValueRarity;
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


function createNewCollection(collectionName)
{
    collectionData = {
            "name": collectionName,
            "collectionCount": 0,
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

async function getPDA(tokenAddress)
{
    return (await mpltokenmetadata.Metadata.getPDA(tokenAddress));
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


*/

