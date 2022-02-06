import FeatureHeader from "../FeatureHeader"

function ViewContact(props) {

    return([
        <FeatureHeader key="contHead" type="contact" text="Contact" />,
        <div key="contCont" className="viewContactCont featureCont"></div>
    ]);
}

export default ViewContact;
