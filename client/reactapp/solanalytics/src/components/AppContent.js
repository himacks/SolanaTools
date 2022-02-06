import NavEntry from './NavEntry';
import ViewCollections from './features/ViewCollections';
import ViewRarityCheck from './features/ViewRarityCheck';
import ViewUpcoming from './features/ViewUpcoming';
import ViewAnalytics from './features/ViewAnalytics';
import ViewMyNFTs from './features/ViewMyNFTs';
import ViewContact from './features/ViewContact';
import * as reactFeather from 'react-feather';
import { useState} from 'react';

function AppContent() {

    const [currentActiveFeature, setActiveFeature] = useState(<ViewCollections />);

    return(
        <div className ="appContent">
            <div className="navBarCont">
                <div className="navBarEntries">
                    <NavEntry text="Collections" iconType={reactFeather.Globe} onClick={() => setActiveFeature(<ViewCollections />)}/>
                    <NavEntry text="Rarity Check" iconType={reactFeather.DollarSign} onClick={() => setActiveFeature(<ViewRarityCheck />)}/>
                    <NavEntry text="Upcoming" iconType={reactFeather.Clock} onClick={() => setActiveFeature(<ViewUpcoming />)}/>
                    <NavEntry text="Analytics" iconType={reactFeather.TrendingUp} onClick={() => setActiveFeature(<ViewAnalytics />)}/>
                    <NavEntry text="My NFTs" iconType={reactFeather.Database} onClick={() => setActiveFeature(<ViewMyNFTs />)}/>
                    <NavEntry text="Contact" iconType={reactFeather.User} onClick={() => setActiveFeature(<ViewContact />)}/>
                </div>
            </div>
            <div className="dynamicFeatureDiv">
                {currentActiveFeature}
            </div>
      </div>
    );
}

export default AppContent;
