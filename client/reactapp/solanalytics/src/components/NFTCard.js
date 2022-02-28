import { useState, useEffect } from 'react';
import {Link} from 'react-router-dom';

function NFTCard(props) {

    const [currentShowingImage, setShowingImage] = useState((props.collectionImgs)[0]);

    function MouseOver() {

    }

    function MouseOut() {

    }

    return(
        <div className="cardCont" onMouseOver={MouseOver} onMouseOut={MouseOut}>
            <Link to={null}>
                <div className="cardAttrCont">
                    <div className="cardImgCont">
                        <img className="cardImgSrc" src={currentShowingImage} alt="new" />
                    </div>
                    <div className="cardInfoCont">
                        <div className="cardTitleCont">
                            <div className="cardTextCont">
                                <text className="cardTitleText">
                                    {props.nftName}
                                </text>
                            </div>
                            <div className="cardCountCont">
                                <div className="cardcountBox">
                                    <text className="cardCountText">{props.nftRarity}</text>
                                </div>
                            </div>
                        </div>
                        <div className="cardDetailsCont">
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
