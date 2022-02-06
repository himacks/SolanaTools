import FeatureHeader from "../FeatureHeader"

function ViewUpcoming(props) {

    return([
        <FeatureHeader key="upcoHead" type="upcoming" text="Upcoming" />,
        <div key="upcoCont" className="viewUpcomingCont featureCont"></div>
    ]);
}

export default ViewUpcoming;
