function Header() {
    return (
        <div className="headerCont">
            <div className="pageLogoCont">
                <div className="iconCont headerCont">
                    <img id="appLogo" src="icon192.png"></img>
                </div>
                <div className="titleCont headerCont">
                    <text id="appTitle">Solanalytics</text>
                </div>
            </div>
            <div className="searchCont headerCont">
                <div className="searchBox">
                    <input id="searchBar" placeholder="Search for an NFT or Collection"></input>
                </div>
            </div>
        </div>
    );
}

export default Header;