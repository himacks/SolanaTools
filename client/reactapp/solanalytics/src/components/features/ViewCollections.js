import FeatureHeader from "../FeatureHeader"

function ViewCollections() {


    return([
        <FeatureHeader key="collHead" type="collections" text="Collections" />,
        <div key="collCont" className="viewCollectionsCont featureCont"></div>
    ]);
}

export default ViewCollections;
