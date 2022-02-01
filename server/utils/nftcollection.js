const metaplex = require("./metaplex.js");
const fs = require('fs');
const e = require("express");

class nftCollection {

    constructor() {
        this.collectionName = "";
        this.collectionSize = ""; 
        this.updateAuthority = "";
        this.fetched = false;
        this.beingFetched = false;
        this.masterRaritiesAdded = false;
        this.attributeDictionary = {};
        this.items = [];
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
        return new Promise( (resolve) => {

            const nftItem = new nft();

            nftItem.getBlockchainMetadata(tokenPDA, delay).then((success) => {
                if(success)
                {
                    if(this.collectionName == "")
                    {
                        this.collectionName = nftItem.name.replace(/[^a-zA-Z]+/g, '').toLowerCase();
                    }

                    if(this.updateAuthority == "")
                    {
                        this.updateAuthority = nftItem.updateAuthority;
                    }

                    this.fetchSelfFromDatabase().then( () => {                    
                        this.collectionContains(nftItem).then( (contained) => 
                        {                             
                            this.items.push(nftItem);

                            resolve();

                        })
                        //console.log("Adding " + thismetadata["name"] + " to Collection");
                    });
                }
                else
                {
                    resolve("invalid");
                }

            });
        });
    }

    collectionContains(nftName)
    {

        let count = 0;
        let currentCollectionLength = this.items.length;

        return new Promise( (resolve) => {

            if(currentCollectionLength === 0)
            {
                resolve(false);
            }
            else
            {
                for(const nftItem of this.items)
                {
                    count++;
                    if(nftItem.name == nftName)
                    {
                        resolve(true);
                        break;
                    }
                    else if(count === currentCollectionLength)
                    {
                        resolve(false);
                    }
                }
            }
        });
    }

    sortByRarity = () =>
    {
        if(this.masterRaritiesAdded)
        {
            let merge = (leftSide, rightSide) =>
            {
                let sortedList = [];
    
                while(leftSide.length > 0 && rightSide.length > 0)
                {
                    if(leftSide[0].masterRarity < rightSide[0].masterRarity) {
                        sortedList.push(leftSide.shift());
                    }
                    else
                    {
                        sortedList.push(rightSide.shift());
                    }
                }

                return [...sortedList, ...leftSide, ...rightSide];
            }

            let mergeSort = (list) =>
            {
                const halfOfCollection = list.length / 2;

                if(list.length <= 1) {
                    return list;
                }
                else
                {
                    const leftSide = list.slice(0, halfOfCollection);
                    const rightSide = list.slice(halfOfCollection);
    
                    return( merge(mergeSort(leftSide), mergeSort(rightSide)));
                }
            }

            this.items = mergeSort([...this.items]);
        }
        else
        {
            console.error("Collection Rarities not added.");
        }

        for(let i = 1; i<=this.collectionSize; i++)
        {
            this.items[i-1].setRank("" + i + "/" + this.collectionSize);
        }
    }

    validateCollectionRarities = () =>
    {

        //console.log("Parsing Attributes...");

        var collectionSize = this.collectionSize;

        this.attributeDictionary = {};

        for(const nftItem of this.items)
        {
            const attributeList = nftItem.attributes;

            for(const attribute of attributeList)
            {
                const traitType = attribute.trait_type;
                const traitValue = attribute.value;

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

        for(const nftItem of this.items)
        {
            const attributeList = nftItem.attributes;

            var masterRarity = 1;

            for(const attribute of attributeList)
            {
                const traitType = attribute.trait_type;
                const traitValue = attribute.value;
                const traitValueRarity = this.attributeDictionary[traitType]["Items"][traitValue]["Rarity"];
                masterRarity *= traitValueRarity;
            }

            nftItem["masterRarity"] = masterRarity;
        }

        this.masterRaritiesAdded = true;

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

                            //console.log(collectionData);

                            this.collectionName = collectionData.collectionName;
                            this.collectionSize = collectionData.collectionSize;
                            this.attributeDictionary = collectionData.attributeDictionary;
                            this.masterRaritiesAdded = collectionData.masterRaritiesAdded;
                            this.items = [];               
                        }
                        else
                        {
                            //console.log(err);
                        }
                        
                        this.fetched = true;
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
}

class nft {
    constructor() {
        this.name = "";
        this.mintKey = "";
        this.updateAuthority = "";
        this.uri = "";
        this.symbol = "";
        this.attributes = [];
        this.collection = {};
        this.properties = {};
        this.masterRarity = 1;
        this.metaCollection = {};
        this.rank = "unranked";
    }

    setRank = (rankToSet) => {
        this.rank = rankToSet;
    }

    importChainMetaData = (metadata) => {
        this.mintKey = metadata.mint;
        this.metaCollection = metadata.collection;
        this.uri = metadata.data.uri;
        this.updateAuthority = metadata.updateAuthority;
    }

    importExternalMetaData = (metadata) => {
        this.name = metadata.name;
        this.symbol = metadata.symbol;
        this.attributes = metadata.attributes;
        this.collection = metadata.collection;
        this.properties = metadata.properties;
    }

    importFromDatabase = (metadata) => {
        this.mintKey = metadata.mintKey;
        this.metaCollection = metadata.metaCollection;
        this.uri = metadata.uri;
        this.updateAuthority = metadata.updateAuthority;
        this.name = metadata.name;
        this.symbol = metadata.symbol;
        this.attributes = metadata.attributes;
        this.collection = metadata.collection;
        this.properties = metadata.properties;
        this.rank = metadata.rank;
    }

    getBlockchainMetadata(tokenPDA, delay)
    {
        return new Promise( (resolve) => {
            metaplex.getAllNFTMetaData(tokenPDA, delay, 0).then((allMetadata) => {
                if(allMetadata == "invalid")
                {
                    resolve(false);
                }
                else
                {
                    const chainMetadata = allMetadata.chainMetaData;
                    const externalMetadata = allMetadata.externalMetadata;

                    this.importExternalMetaData(externalMetadata);
                    this.importChainMetaData(chainMetadata);

                    resolve(true);
                }
            });
        });

    }


}

module.exports = { nftCollection : nftCollection, nft : nft};
