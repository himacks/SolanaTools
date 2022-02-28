const cliProgress = require('cli-progress');
const metaplex = require("./metaplex.js");
const { nftCollection } = require('./nftcollection.js');
const fs = require('fs');


function queryNewCollection(creatorTokenAddress)
{
    return new Promise((resolve, reject) =>
    {
        metaplex.getMintsFromCreator(creatorTokenAddress).then(function(serializedMap) {

            console.log("Found Serialized Map for Collection!")

            const promises = [];

            const collectionSize = serializedMap.length;

            const newNFTCollection = new nftCollection();

            //const collectionSize = 20; //for testing purposes

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
                        newNFTCollection.addToCollection(nftPDA, delay).then( function(result) {
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
            
            Promise.all(promises).then(() => {

                b1.stop();

                if(collectionSize == 0)
                {
                    console.log("Error: Address provided contains no valid NFTs")
                    reject();
                }
                else
                {
                    console.log("Collection Size Post-Parsing: " + successfulNFTParsed);
                    newNFTCollection.modifyCollectionSize(successfulNFTParsed, "overwrite");
                    newNFTCollection.validateCollectionRarities();
                    newNFTCollection.sortByRarity();
                    saveToDatabase(newNFTCollection);
                    resolve(newNFTCollection);
                }

            });
        })
    })
}

let saveToDatabase = (nftCollection) =>
    {
        if (!fs.existsSync('./lib')){
            fs.mkdirSync('./lib');
        }

        fs.writeFile("./lib/" + nftCollection.collectionID +".json" , JSON.stringify(nftCollection), (err) => {
            if(err) {
                console.log(err);
            }
            console.log("Success: File was saved as " + nftCollection.collectionID + ".json");
        });   
    }


async function getAvailableCollections(limit, skipAmt)
{
    return new Promise((resolve) => {

        if (!fs.existsSync('./lib')){
            fs.mkdirSync('./lib');
        }

        fs.readdir("./lib/", function (err, files) {

            var collections = [];
    
            var count = 0;

            var parseLimit = Math.min(files.length, limit);
    
            for(let i = 0; i < parseLimit; i++) {
    
                const collectionID = files[i].replace(".json", "");
    
                collections.push(collectionID);

                count++;
    
                if(count === parseLimit)
                {
                    resolve(collections.slice(skipAmt));
                }
            }
        });
    });
}

function getCollectionNFTs(collectionID, limit, skipAmt)
{
    return new Promise( (resolve, reject) => {
        fs.readFile('./lib/' + collectionID + '.json', 'utf8' , (err, collectionJSONData) => {
            if (!err)
            {
                const collectionData = JSON.parse(collectionJSONData);

                const name = collectionData.collectionName;
                const nftList = collectionData.items.slice(skipAmt, skipAmt + limit);
                const retrievedData = {"collectionName": name, "nftList": nftList};
                
                resolve(retrievedData);

            }
            else
            {
                reject("Collection not found.");
            }
        });
    });
}

function getCollectionsSummary(collectionIDs)
{
    return new Promise( (resolve) => {
        var promiseList = [];
    
        collectionIDs.forEach( (collectionId) =>
        {
            //console.log(collectionId);
            promiseList.push( new Promise( (resolve, reject) => {
                fs.readFile('./lib/' + collectionId + '.json', 'utf8' , (err, collectionJSONData) => {
                    if (!err)
                    {
                        const collectionData = JSON.parse(collectionJSONData);
            
                        const name = collectionData.collectionName;
                        const id = collectionData.collectionID;
                        const size = collectionData.collectionSize;
                        const description = collectionData.collectionDescription;
                        const imgList = [];
                        for(let i = 0; i < Math.min(collectionData.items.length, 5); i++)
                        {
                            imgList.push(collectionData.items[i].properties.files[0].uri);
                        }
            
                        const retrievedData = {"collectionName": name, "collectionSize": size, "collectionDescription": description, "imgList": imgList, "collectionID": id};
            
                        resolve(retrievedData);
                    }
                    else
                    {
                        reject("Collection not found.");
                    }
                });
            }));
        });
            
        Promise.allSettled(promiseList).then( (result) => {
            resolve(result);
        });
    });

    
    
}


module.exports = { getCollectionNFTs: getCollectionNFTs, queryNewCollection : queryNewCollection, getAvailableCollections : getAvailableCollections, getCollectionsSummary: getCollectionsSummary };