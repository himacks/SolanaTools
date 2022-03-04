import FeatureHeader from "../FeatureHeader"
import NFTCard from "../NFTCard"
import { useParams } from "react-router-dom";
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';


function ViewCollection() {

    let { collectionid } = useParams();

    const [collectionTitle, setCollectionTitle] = useState();

    const [currentShowingNFTs, setShowingNFTs] = useState([]);

    let getCollectionNFTs = () =>
    {
        axios.get('http://localhost:4000/getCollectionsSummary', { params: { collectionNames: [collectionid] } }).then( (result) => {
            const collectionsData = result.data.collectionsData[0].value;

            setCollectionTitle(collectionsData.collectionName);

            axios.get('http://localhost:4000/getCollectionNFTs', { params: { collectionName: collectionid, skipAmt: 0, queryLimit: 20 } }).then( (result) => {
        
            if(result.data.nftListData)
                {
                    const nftList = result.data.nftListData.nftList;
                    let nftViewList = [];
                    let count = 0;
                    const limit = nftList.length;

                    //console.log(nftList);

                    nftList.forEach( (nftItem) => {

                        const nftName = nftItem.name;
                        const nftRank = nftItem.rank;
                        const nftImage = nftItem.properties.files[0].uri;

                        const nftKey = nftName.replaceAll(" ", "");

                        nftViewList.push(<NFTCard key={nftKey} nftName={nftName} nftRarity={nftRank} collectionImg={nftImage}  />);
                        count++;

                        if(count === limit)
                        {
                            setShowingNFTs(nftViewList);
                        }

                    });
                }
                //console.log(result);
            });

        });
    }

    useEffect(() => {
        getCollectionNFTs();
      }, []);

    const gridInnerRef = useRef();


    const onScroll = () => {
        if (gridInnerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = gridInnerRef.current;
          if (scrollTop + clientHeight === scrollHeight) {
            // TO SOMETHING HERE
            console.log('Reached bottom')
          }
        }
      };

    return([
        <FeatureHeader key="collHead" type="collections" text={collectionTitle} />,
        <div key="collCont" className="viewCardsCont featureCont" onScroll={() => { onScroll() } } ref={gridInnerRef}>
            <div key="collGrid" className="viewNFTGrid viewGrid"> 
                {currentShowingNFTs}
            </div>
        </div>
    ]);

}

export default ViewCollection;
