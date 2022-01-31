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

        fs.writeFile("./lib/" + nftCollection.collectionName +".json" , JSON.stringify(nftCollection), (err) => {
            if(err) {
                console.log(err);
            }
            console.log("Success: File was saved as " + nftCollection.collectionName + ".json");
        });   
    }


async function getAvailableCollections()
{
    return new Promise((resolve) => {

        if (!fs.existsSync('./lib')){
            fs.mkdirSync('./lib');
        }

        fs.readdir("./lib/", function (err, files) {

            var collections = [];
    
            var count = 0;
    
            files.forEach( (file) => {
    
                const collectionName = file.replace(".json", "");
    
                collections.push(collectionName);

                count++;
    
                if(count === files.length)
                {
                    resolve(collections);
                }
            });
        });
    });
    


}


module.exports = { queryNewCollection : queryNewCollection, getAvailableCollections : getAvailableCollections };