import FeatureHeader from "../FeatureHeader"
import CollectionCard from "../CollectionCard"
import axios from 'axios';
import { useState, useEffect } from 'react';

function ViewCollections() {

    const [currentShowingCollections, setShowingCollections] = useState();

    function getCollectionCards()
    {
        return new Promise( (resolve) => {
            axios.get('http://localhost:4000/getAvailableCollections', { params: { parseLimit: 5 } }).then( (result) => {
                let collectionsList = [];
                let count = 0;
                const limit = result.data.availableCollections.length;
                result.data.availableCollections.forEach( (collectionName) => {
                    axios.get('http://localhost:4000/getCollectionSummary', { params: { collectionName: collectionName } }).then( (result) => {
                        const collectionData = result.data.collectionData;
                        collectionsList.push(<CollectionCard collectionTitle={collectionData.collectionName} collectionCount={collectionData.collectionSize} collectionText={collectionData.collectionDescription} collectionImgs={collectionData.imgList}/>);
                        count++;

                        if(count == limit)
                        {
                            setShowingCollections(collectionsList);
                            resolve(collectionsList);
                        }
                    });
                });
            });
        });

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
