const metaplex = require("./metaplex.js");
const fs = require('fs');

class nftCollection {

    constructor() {
        this.collectionName = "";
        this.collectionSize = ""; 
        this.attributeDictionary = {};
        this.items = {};
        this.fetched = false;
        this.beingFetched = false;
    }

    modifyCollectionSize = (inputCount, modifyType) =>
    {
        if(modifyType == "reduce")
        {   
            this.collectionSize -= inputCount;
        }
        else if(modifyType == "add")
        {   
            this.collectionSize += inputCount;
        }
        else if(modifyType == "overwrite")
        {
            this.collectionSize = inputCount;
        }
    }

    addToCollection = (tokenPDA, delay) =>
    {
        return new Promise((resolve) => {
            metaplex.getExternalNFTMetaData(tokenPDA, delay, 0).then((thismetadata) => {
                //console.log("Adding " + thismetadata["name"] + " to Collection");

                if(thismetadata == "invalid")
                {
                    //console.log("Too many failed attempts or NFT is not minted... probably the latter")
                    resolve("invalid");
                }
                else
                {
                    const parsedCollectionName = thismetadata["name"].replace(/[^a-zA-Z]+/g, '').toLowerCase();

                    if(this.collectionName != parsedCollectionName)
                    {
                        this.collectionName = parsedCollectionName;
                    }
            
                    //console.log(parsedCollectionName);

                    this.fetchSelfFromDatabase().then( () => {                    
                        if(this.items[thismetadata["name"]] === undefined)
                        {
                            this.items[thismetadata["name"]] = thismetadata;
                        }
                        //console.log("Adding " + thismetadata["name"] + " to Collection");
                        resolve();
                    });
                }
            });
        })
    }

    validateCollectionRarities = () =>
    {

        //console.log("Parsing Attributes...");

        var collectionSize = this.collectionSize;

        this.attributeDictionary = {};

        for(const [key, value] of Object.entries(this.items))
        {
            const attributeList = value["attributes"];

            for(const attribute of attributeList)
            {
                const traitType = attribute["trait_type"];
                const traitValue = attribute["value"];

                //console.log("Trait Type: " + traitType);
                //console.log("Trait Value: " + traitValue);
                

                if(this.attributeDictionary[traitType] === undefined)
                {   
                    this.attributeDictionary[traitType] = {"Items": {}};
                }

                if(this.attributeDictionary[traitType]["Items"][traitValue] === undefined)
                {
                    this.attributeDictionary[traitType]["Items"][traitValue] = {"Count": 1, "Rarity": collectionSize};
                }
                else
                {
                    this.attributeDictionary[traitType]["Items"][traitValue]["Count"]++;

                    this.attributeDictionary[traitType]["Items"][traitValue]["Rarity"] = this.attributeDictionary[traitType]["Items"][traitValue]["Count"] / collectionSize;
                }
            }
        }

        for(const [key, value] of Object.entries(this.items))
        {
            const attributeList = value["attributes"];

            var masterRarity = 1;

            for(const attribute of attributeList)
            {
                const traitType = attribute["trait_type"];
                const traitValue = attribute["value"];
                const traitValueRarity = this.attributeDictionary[traitType]["Items"][traitValue]["Rarity"];
                masterRarity *= traitValueRarity;
            }

            value["masterRarity"] = masterRarity;
        }

    }

    fetchSelfFromDatabase = () =>
    {
        return new Promise((resolve) => {
            if(!this.fetched)
            {
                if(this.beingFetched)
                {
                    //console.log("Collection is being fetched from directory. Not opening instead waiting.");
                    setTimeout(async () => {
                        resolve(await this.fetchSelfFromDatabase());
                    }, 1000);
                }
                else
                {
                    //console.log("Reading lib directory for " + collectionName + "...")
                    this.beingFetched = true;
                    fs.readFile('./lib/' + this.collectionName + '.json', 'utf8' , (err, collectionJSONData) => {
                        if (!err)
                        {
                            //console.log("Collection Already Exists in File Database. Opening file for update.")
                            const collectionData = JSON.parse(collectionJSONData);

                            this.collectionName = collectionData.collectionName;
                            this.collectionSize = collectionData.collectionSize;
                            this.attributeDictionary = collectionData.attributeDictionary
                            this.items = collectionData.items;
                            this.fetched = true;
                        }
        
                        this.beingFetched = false;
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

    saveToDatabase()
    {
        if (!fs.existsSync('./lib')){
            fs.mkdirSync('./lib');
        }

        fs.writeFile("./lib/" + this.collectionName +".json" , JSON.stringify(this), (err) => {
            if(err) {
                console.log(err);
            }
            console.log("Success: File was saved as " + this.collectionName + ".json");
        });   
    }
    
}

module.exports = { nftCollection : nftCollection};
