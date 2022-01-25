const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const metaplex = require('@metaplex/js');
const mplcore = require('@metaplex-foundation/mpl-core');
const mpltokenmetadata = require('@metaplex-foundation/mpl-token-metadata');
const request = require('request');
const fs = require('fs');
const web3 = require('@solana/web3.js')
const axios = require('axios');



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

app.use("/getMetaData", (req, res) => {
    if (req.method == 'POST') {


        var creatorTokenAddress = req.body.creatorTokenAddress;

        queryNewCollection(creatorTokenAddress).then((collectionName) => {
            console.log('Added ' + collectionName + " To Database!");
            calculateNFTRarity(collectionName);
            saveToFile(collectionName);
        });

        console.log("Recieved POST Request to parse " + creatorTokenAddress);

        

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

            for(let i = 0; i < serializedMap.length; i++)
            {
                var serializedNFT = serializedMap[i];

                var nftPDA = serializedNFT["pubkey"];

                promises.push(addToCollection(nftPDA, serializedMap.length));
                
            }   
            
            Promise.all(promises).then((results) => {
            // do what you want on the results
                resolve(results[0]);
            });
        })
    })
}

let getNFTMetaData = async function(tokenPDA) {

  const mintAccInfo = await connection.getAccountInfo(tokenPDA);

  const {
    data: { data: metadata }
  } = mpltokenmetadata.Metadata.from(new mplcore.Account(tokenPDA, mintAccInfo));

  return metadata;

}

let getExternalNFTMetaData = async function(tokenPDA) {

    const metadata = await getNFTMetaData(tokenPDA);
  
    const metadataFromURI = (await axios.get(metadata["uri"]));

    if(metadataFromURI === undefined)
    {
        setTimeout( () => {
            return(getExternalNFTMetaData(tokenPDA).data);
        }, 10000);
    }
    else
    {
        return(metadataFromURI.data);
    }
  
    //console.log("Got External Metadata from " + metadataFromURI["name"]);

  
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


function addToCollection(tokenPDA, collectionSize)
{
    return new Promise((resolve) => {
        getExternalNFTMetaData(tokenPDA).then(function(thismetadata) {
            //console.log("Adding " + thismetadata["name"] + " to Collection");
    
            collectionName = (thismetadata["name"].substring(0, thismetadata["name"].lastIndexOf(" ")).replaceAll(" ", "")).toLowerCase();
        
            //console.log(collectionName);
        
            if(collectionDatabase[collectionName] === undefined)
            {
                createNewCollection(collectionName, collectionSize)
            }
            
            collectionDatabase[collectionName]["items"].push(thismetadata);

            parseAttributesRarities(thismetadata["attributes"], collectionName);
        
            resolve(collectionName);
        });
    })
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

        for(const NFT of collectionDatabase[collectionName]["items"])
        {
            var attributeList = NFT["attributes"];
            var masterRarity = 1.0;

            for(const attribute of attributeList)
            {
                var traitType = attribute["trait_type"];
                var traitValue = attribute["value"];

                var rarity = attributeDictionary[traitType]["Items"][traitValue]["Rarity"];

                masterRarity *= rarity;
            }

            NFT["masterRarity"] = masterRarity;

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

function parseAttributesRarities(attributeList, collectionName)
{
    if(collectionDatabase[collectionName] === undefined)
    {
        console.log("Error: Collection not Cataloged");
    }
    else
    {   
        //console.log("Parsing Attributes...");

        var collectionSize = collectionDatabase[collectionName]["collectionCount"];

        var attributeDictionary = collectionDatabase[collectionName]["attributeDictionary"];

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
            "items": []
        };

    collectionDatabase[collectionName] = collectionData;
}

function testSort(collectionName)
{
    fs.readFile('lib/' + collectionName + '.json', 'utf8' , (err, collectionData) => {
        if (err) {
            console.error(err)
            return
        }
        else
        {
            var collectionData = JSON.parse(collectionData);
            var nftList = collectionData["items"];

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


testSort('boryokudragonz');