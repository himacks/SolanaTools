import FeatureHeader from "../FeatureHeader"
import CollectionCard from "../CollectionCard"
import axios from 'axios';
import { useState, useEffect } from 'react';

function ViewCollections(props) {

    const [currentShowingCollections, setShowingCollections] = useState();

    let getCollectionCards = () =>
    {
        axios.get('http://localhost:4000/getAvailableCollections', { params: { parseLimit: 10, skipAmt: 0 } }).then( (result) => {
            let collectionsList = [];
            let count = 0;
            let collectionNames = result.data.availableCollections;

            
            axios.get('http://localhost:4000/getCollectionsSummary', { params: { collectionNames: collectionNames } }).then( (result) => {
                const collectionsData = result.data.collectionsData;

                let limit = result.data.collectionsData.length;

                collectionsData.forEach( (collectionResponse) => {
                    if (collectionResponse.status === 'fulfilled')
                    {
                        const collectionData = collectionResponse.value;
                        collectionsList.push(<CollectionCard key={collectionData.collectionName} onClick={sendNameUpChain} collectionTitle={collectionData.collectionName} collectionCount={collectionData.collectionSize} collectionText={collectionData.collectionDescription} collectionImgs={collectionData.imgList}/>);
                        count++;
                    }
                    else
                    {
                        limit--;
                    }

                    if(count === limit)
                    {
                        setShowingCollections(collectionsList);
                    }
                });
            });        
        });

    }

    const sendNameUpChain = (data) => {
        props.onCollectionClick(data);
    }

    useEffect(() => {
        getCollectionCards();
      }, []);

    return([
        <FeatureHeader key="collHead" type="collections" text="Collections" />,
        <div key="collCont" className="viewCollectionsCont featureCont">
            <div key="collGrid" className="viewCollectionGrid"> 
                {currentShowingCollections}
            </div>
        </div>
    ]);
}

export default ViewCollections;
