const metaplex = require('@metaplex/js');
const mplcore = require('@metaplex-foundation/mpl-core');
const mpltokenmetadata = require('@metaplex-foundation/mpl-token-metadata');
const web3 = require('@solana/web3.js')
const axios = require('axios');
const spl = require('@solana/spl-token');
const borsh = require('borsh');
const { Keypair,
    AccountMeta,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    sendAndConfirmTransaction } = require('@solana/web3.js')



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

                
                console.log(metadataDataData["name"] + " Failed Attempt: "+ attempt + " - axios failed, retrying...")
                console.log("URI: " + metadataDataData["uri"]);

                if(attempt < 5)
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

async function getTokenAddressesFromMint(mintTokenAddress)
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

async function getAccountData(pubkey) {
    let nameAccount = await mainNetConnection.getAccountInfo(pubkey, 'processed');

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


module.exports = { getMintsFromCreator: getMintsFromCreator, getAllNFTMetaData: getAllNFTMetaData, getNFTChainMetaData: getNFTChainMetaData, getPDA: getPDA, getTokenAddressesFromMint : getTokenAddressesFromMint, getAccountData : getAccountData, deserializeData : deserializeData};
