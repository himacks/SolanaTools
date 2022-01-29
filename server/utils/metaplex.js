const metaplex = require('@metaplex/js');
const mplcore = require('@metaplex-foundation/mpl-core');
const mpltokenmetadata = require('@metaplex-foundation/mpl-token-metadata');
const web3 = require('@solana/web3.js')
const axios = require('axios');


const connection = new metaplex.Connection("mainnet-beta");
const mainNetConnection = new web3.Connection("https://api.metaplex.solana.com/");
const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";


async function getPDA(tokenAddress)
{
    return (await mpltokenmetadata.Metadata.getPDA(tokenAddress));
}

async function getNFTMetaData(tokenPDA, attempt) {

    if(attempt === undefined) { attempt = 0; }

    return new Promise(async function(resolve) {

        try {
            const mintAccInfo = await connection.getAccountInfo(tokenPDA);
            const metadata = mpltokenmetadata.Metadata.from(new mplcore.Account(tokenPDA, mintAccInfo));
            //console.log("Metadata Retrieved");

            resolve(metadata);
        }
        catch(err)
        {
            //console.log("Failed Attempt: "+ attempt + " - solana network request failed, retrying...");


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

            const metadata = metadataParent.data.data;

            try {
                const metadataFromURI = (await axios.get(metadata.uri));
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


module.exports = { getMintsFromCreator: getMintsFromCreator, getExternalNFTMetaData: getExternalNFTMetaData, getNFTMetaData: getNFTMetaData, getPDA: getPDA};
