import FeatureHeader from "../FeatureHeader"

function ViewRarityCheck(props) {

    return([
        <FeatureHeader key="rarHead" type="rarityCheck" text="Rarity Check" />,
        <div key="rarCont" className="viewRarityCheckCont featureCont"></div>
    ]);
}

export default ViewRarityCheck;
