const metaplex = require('@metaplex/js');
const mplcore = require('@metaplex-foundation/mpl-core');
const mpltokenmetadata = require('@metaplex-foundation/mpl-token-metadata');
const web3 = require('@solana/web3.js')
const axios = require('axios');
const spl = require('@solana/spl-token');
const borsh = require('borsh');



const connection = new metaplex.Connection("mainnet-beta");
const mainNetConnection = new web3.Connection("https://api.metaplex.solana.com/");
const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const TOKEN_ACCOUNT_LEN = 165;


async function getPDA(tokenAddress)
{
    return (await mpltokenmetadata.Metadata.getPDA(tokenAddress));
}

async function getNFTChainMetaData(tokenPDA, attempt) {

    if(attempt === undefined) { attempt = 0; }

    return new Promise(async function(resolve) {

        try {
            const mintAccInfo = await connection.getAccountInfo(tokenPDA);
            const metadata = mpltokenmetadata.Metadata.from(new mplcore.Account(tokenPDA, mintAccInfo));
            //console.log(metadata.data);

            resolve(metadata.data);
        }
        catch(err)
        {

            console.log("Failed Attempt: "+ attempt + " - solana network request failed, retrying...");

            if(attempt == -1)
            {
                resolve(undefined);
            }
            else if(attempt < 6)
            {
                setTimeout( async function() {
                    resolve(await getNFTChainMetaData(tokenPDA, attempt+1));
                }, 10000);
            }
            else
            {
                resolve("invalid");
            }
        }
    });
}

async function getAllNFTMetaData(tokenPDA, delay, attempt) {

    return new Promise(async function(resolve) {

        setTimeout( async function() {

            const metadataParent = (await getNFTChainMetaData(tokenPDA, 0));

            if(metadataParent == "invalid")
            {
                resolve("invalid");
                return;
            }

            const metadataData = metadataParent;
            const metadataDataData = metadataParent.data;

            try {
                const metadataFromURI = (await axios.get(metadataDataData.uri));
                //console.log(metadataFromURI.data["name"] + " EXTERNAL Metadata Retrieved");
                resolve({"chainMetaData": metadataData, "externalMetadata": metadataFromURI.data}); 
            } catch (err) {


                //resolve("invalid");

                //console.log("URI: " + metadata["uri"]);
                //console.log("Name: " + metadata["name"]);

                if(err.response.data.includes("Not Found"))
                {
                    resolve("invalid");
                }
                console.log(metadataDataData["name"] + " Failed Attempt: "+ attempt + " - axios failed, retrying...")
                console.log("URI: " + metadataDataData["uri"]);

                if(attempt < 10)
                {
                    setTimeout(async function() {
                        resolve(await getAllNFTMetaData(tokenPDA, 10000, attempt+1));
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

async function getTokenAddresses(mintTokenAddress)
{


    const filters = {
        "encoding": "base64",
        "filters": [
            { 
                "dataSize": TOKEN_ACCOUNT_LEN
            },
            {
            "memcmp": {
                "offset": 0, // first creator verified position
                "bytes": mintTokenAddress.toString()
                }
            }
        ]
    }

    const serializedMap = await mainNetConnection.getProgramAccounts(spl.TOKEN_PROGRAM_ID, filters);

    return serializedMap;
    
}

async function getAccountData(tokenPDA) {
    let nameAccount = await mainNetConnection.getAccountInfo(tokenPDA, 'processed');

    return nameAccount;
}

class Assignable {
    constructor(properties) {
        Object.keys(properties).map((key) => {
            return (this[key] = properties[key]);
        });
    }
}

class AccoundData extends Assignable { }

const dataSchema = new Map([
    [
        AccoundData,
        {
            "kind": "struct",
            "fields": [
                ["initialized", "u8"],
                ["tree_length", "u32"],
                ["map", { "kind": 'map', "key": 'string', "value": 'string' }]
            ]
        }
    ]
]);

async function deserializeData(serializedData)
{
    return borsh.deserializeUnchecked(dataSchema, AccoundData, serializedData)
}

function truncateDecimals(number, digits) {
    var multiplier = Math.pow(10, digits),
        adjustedNum = number * multiplier,
        truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum);

    return truncatedNum / multiplier;
};

async function getNFTSales(tokenMintAddress)
{

    const accountKeysDeterminingSale = [
        "2NZukH2TXpcuZP4htiuT8CFxcaQSWzkkR6kepSWnZ24Q",
        "GUfCR9mK6azb9vcpsxgXyj7XRPAKJd4KMHTTVvtncGgp"
    ]

    return new Promise( (resolve) => {
        this.getTokenAddresses(tokenMintAddress).then( async (tokenAccounts) => {

            var transactionListSize = 0;
            var validTransactions = 0;
            var invalidTransactions = 0;
            const dataList = [];


            for(const item of tokenAccounts)
            {

                //console.log(item.account.data); // same thing as calling getAccountData and getting the ["data"] of the returned result
                
                connection.getSignaturesForAddress(item.pubkey).then( (signatureList) => {
    

                    transactionListSize += signatureList.length;
                    

                    for(const item of signatureList)
                    {
                        connection.getTransaction(item.signature).then( (result) => {

    
                            if(result.meta.status.Ok !== undefined)
                            {
                                //console.log(result.transaction.message.instructions[0].programIdIndex);
                                
                                /*
                                
                                var validTransaction = true;
                                Alternative Method for finding valid transactions
        
                                const transactionKeys = JSON.parse(JSON.stringify(result.transaction.message.accountKeys));
                                //console.log(transactionKeys);
                                
                                for(validAccountKey of accountKeysDeterminingSale)
                                {
                                    if( ! ((transactionKeys).includes(validAccountKey)))
                                    {
                                        validTransaction = false;
                                    }
                                }
        
                                if(validTransaction)
                                {
        
        
                                    
                                }
        
                                */
        
                                var keys = Object.keys(result.transaction.message.header);
                                var transactionHeader = [];
                                keys.forEach(function(key){
                                    transactionHeader.push(result.transaction.message.header[key]);
                                });
        
                                //console.log(transactionHeader);
                                if(compareArrays(transactionHeader, [0,5,1]))
                                {
                                    const postBalances = result.meta.postBalances;
                                    const preBalances = result.meta.preBalances;
                                    const blockTime = result.blockTime;
                                    var date = new Date(blockTime * 1000);

                                    //console.log(JSON.stringify(result, null, "\t"));

                                    const transactionBlockChainFee = result.meta.fee;
                                    const transactionSignature = result.transaction.signatures[0];
                                    //const transactionSaleAmt = (preBalances[0] - postBalances[0] - transactionBlockChainFee) / 1000000000;

                                    let transactionSaleAmt = 0;
                                    for(let i = 0; i<postBalances.length; i++)
                                    {
                                        if(transactionSaleAmt < Math.abs(preBalances[i] - postBalances[i]))
                                        {
                                            transactionSaleAmt = Math.abs(preBalances[i] - postBalances[i])
                                        }
                                    }

                                    //console.log(transactionSignature);
        
                                    //console.log(transactionSignature);
        
                                    //console.log(date);
        
                                    //console.log(transactionSaleAmt);
    
                                    const data = {"transactionBlockChainFee" : transactionBlockChainFee, "transactionSignature": transactionSignature, "transactionSaleAmt": truncateDecimals(transactionSaleAmt / 1000000000, 4), "transactionDate": date};
    
                                    //console.log(data);
    
                                    dataList.push(data);
                                    //console.log(data);
                                    validTransactions++;

                                }
                                else
                                {
                                    invalidTransactions++;
                                }

                            }

                            //console.log("Invalid Transactions: " + invalidTransactions);
                            //console.log("Valid Transactions: " + validTransactions);
                            //console.log("Total Transactions: " + transactionListSize);

                            if(invalidTransactions + validTransactions == transactionListSize - 1)
                            {
                                resolve(dataList);
                                //console.log("resolved");
                            }

                            
                        });

                    }
        
                }); // THESE ARE THE TOKEN ADDRESSES
            }
        });
    });

    
}

function compareArrays(array1, array2)
{
    const array2Sorted = array2.slice().sort();
    return (array1.length === array2.length && array1.slice().sort().every(function(value, index) {
        return value === array2Sorted[index];
    }));
}


module.exports = { getMintsFromCreator: getMintsFromCreator, 
                   getAllNFTMetaData: getAllNFTMetaData, 
                   getNFTChainMetaData: getNFTChainMetaData, 
                   getPDA: getPDA, 
                   getTokenAddresses : getTokenAddresses, 
                   getAccountData : getAccountData, 
                   deserializeData : deserializeData,
                   getNFTSales : getNFTSales
                };
