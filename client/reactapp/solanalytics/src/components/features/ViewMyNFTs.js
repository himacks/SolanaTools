import FeatureHeader from "../FeatureHeader"

function ViewMyNFTs(props) {

    return([
        <FeatureHeader key="nftHead" type="myNFTs" text="My NFTs" />,
        <div key="nftCont" className="viewMyNFTsCont featureCont"></div>
    ]);
}

export default ViewMyNFTs;
