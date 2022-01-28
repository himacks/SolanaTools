const cliProgress = require('cli-progress');
const metaplex = require("./utils/metaplex.js");
const collection = require("./utils/collection.js");

function queryNewCollection(creatorTokenAddress)
{
    return new Promise((resolve) =>
    {
        metaplex.getMintsFromCreator(creatorTokenAddress).then(function(serializedMap) {

            console.log("Found Serialized Map for Collection!")

            const promises = [];

            const collectionSize = serializedMap.length;

            const newNFTCollection = new collection.nftCollection();

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
            
            Promise.all(promises).then((results) => {

                b1.stop();

                if(collectionSize == 0)
                {
                    console.log("Error: Address provided contains no valid NFTs")
                }
                else
                {
                    console.log("Collection Size Post-Parsing: " + successfulNFTParsed);
                    newNFTCollection.modifyCollectionSize(successfulNFTParsed, "overwrite");
                    newNFTCollection.validateCollectionRarities();
                    newNFTCollection.saveToDatabase();
                    collectionDatabase.push(newNFTCollection);
                }

                resolve();
            });
        })
    })
}


module.exports = { queryNewCollection : queryNewCollection };