import { useState, useEffect } from 'react';
import {Link} from 'react-router-dom';

function NFTCard(props) {

    const [currentShowingImage, setShowingImage] = useState(props.collectionImg);

    function MouseOver() {

    }

    function MouseOut() {

    }

    return(
        <div className="cardCont" onMouseOver={MouseOver} onMouseOut={MouseOut}>
            <Link to={"/"}>
                <div className="cardAttrCont">
                    <div className="cardImgCont">
                        <img className="cardImgSrc" src={currentShowingImage} alt="new" />
                    </div>
                    <div className="cardInfoCont">
                        <div className="cardTitleCont">
                            <div className="nftCardTextCont cardTextCont">
                                <text className="nftCardTitleText">
                                    {props.nftName}
                                </text>
                            </div>
                            <div className="cardCountCont">
                                <div className="cardcountBox">
                                    <text className="cardCountText">{props.nftRarity}</text>
                                </div>
                            </div>
                        </div>
                        <div className="nftCardDetailsCont cardDetailsCont">
                            <text className="cardDetailsText">

                            </text>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}


export default NFTCard;
