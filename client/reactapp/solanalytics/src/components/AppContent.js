import NavEntry from './NavEntry';
import ViewCollections from './features/ViewCollections';
import ViewCollection from './features/ViewCollection';
import ViewRarityCheck from './features/ViewRarityCheck';
import ViewUpcoming from './features/ViewUpcoming';
import ViewAnalytics from './features/ViewAnalytics';
import ViewMyNFTs from './features/ViewMyNFTs';
import ViewContact from './features/ViewContact';
import * as reactFeather from 'react-feather';
import { useState } from 'react';
import Header from './Header';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'



function AppContent() {

    return(
        <Router>
            <div className="appDiv">
                <Header />
                <div className ="appContent">
                    <div className="navBarCont">
                        <div className="navBarEntries">
                            <NavEntry text="Collections" route="collections" iconType={reactFeather.Globe} />
                            <NavEntry text="Rarity Check" route="raritycheck" iconType={reactFeather.DollarSign} />
                            <NavEntry text="Upcoming" route="upcoming" iconType={reactFeather.Clock} />
                            <NavEntry text="Analytics" route="analytics" iconType={reactFeather.TrendingUp} />
                            <NavEntry text="My NFTs" route="mynfts" iconType={reactFeather.Database} />
                            <NavEntry text="Contact" route="contact" iconType={reactFeather.User} />
                        </div>
                    </div>
                    <div className="dynamicFeatureDiv">
                        <Routes>
                            <Route exact path="/" element={ <Navigate to="/collections" />} />
                            <Route path="/collections" element={<ViewCollections /> } />
                            <Route path="/collections/:collectionid" element={<ViewCollection />} />
                            <Route path="/raritycheck" element={<ViewRarityCheck />} />
                            <Route path="/upcoming" element={<ViewUpcoming />} />
                            <Route path="/analytics" element={<ViewAnalytics />} />
                            <Route path="/mynfts" element={<ViewMyNFTs />} />
                            <Route path="/contact" element={<ViewContact />} />
                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
}

export default AppContent;
