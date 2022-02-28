import FeatureHeader from "../FeatureHeader"
import NFTCard from "../NFTCard"
import { useParams } from "react-router-dom";
import axios from 'axios';
import { useState, useEffect } from 'react';


function ViewCollection() {

    let { collectionid } = useParams();

    const [collectionTitle, setCollectionTitle] = useState();

    const [currentShowingNFTs, setShowingCollections] = useState([]);

    let getCollectionNFTs = () =>
    {
        axios.get('http://localhost:4000/getCollectionsSummary', { params: { collectionNames: [collectionid] } }).then( (result) => {
            const collectionsData = result.data.collectionsData[0].value;

            setCollectionTitle(collectionsData.collectionName);

            console.log(collectionsData);

            axios.get('http://localhost:4000/getCollectionNFTs', { params: { collectionName: collectionid, skipAmt: 0, queryLimit: 5 } }).then( (result) => {
                if(result.data.nftListData)
                {
                    const nftList = result.data.nftListData.nftList;

                    nftList.forEach( (nftItem) => {
                        console.log(nftItem);

                        const nftName = nftItem.name;
                        const nftRank = nftItem.rank;
                        const nftImage = nftItem.properties.files[0].uri;

                        console.log(nftImage);
                    });
                }
                //console.log(result);
            });

        });
    }

    useEffect(() => {
        getCollectionNFTs();
      }, []);

    return([
        <FeatureHeader key="collHead" type="collections" text={collectionTitle} />,
        <div key="collCont" className="viewNFTsCont featureCont">
            <div key="collGrid" className="viewNFTGrid"> 
                {currentShowingNFTs}
            </div>
        </div>
    ]);

}

export default ViewCollection;
