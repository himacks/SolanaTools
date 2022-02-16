import FeatureHeader from "../FeatureHeader"

function ViewCollection(props) {

    return([
        <FeatureHeader key="collHead" type="collections" text={props.name} />,
        <div key="collCont" className="viewNFTsCont featureCont">
            <div key="collGrid" className="viewNFTGrid"> 
            </div>
        </div>
    ]);

}

export default ViewCollection;
