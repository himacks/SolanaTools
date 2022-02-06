import FeatureHeader from "../FeatureHeader"

function ViewAnalytics() {

    return([
        <FeatureHeader key="analHead" type="analytics" text="Analytics" />,
        <div key="analCont" className="viewAnalyticsCont featureCont"></div>

    ]);
}

export default ViewAnalytics;
