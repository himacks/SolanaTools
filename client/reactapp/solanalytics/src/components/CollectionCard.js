import { useState, useEffect } from 'react';

function CollectionCard(props) {


    const [currentShowingImage, setShowingImage] = useState((props.collectionImgs)[0]);
    const [intervalId, setIntervalId] = useState(0);
    /*
    useEffect(() => {
        
        
        const interval = setInterval(() => {
            setShowingImage((props.collectionImgs)[(++count)%props.collectionImgs.length]) 
        }, 500);
        return () => {
          clearInterval(interval);
        };
      }, []);

      */

    var count = 0;
    
    function MouseOver() {
        const newIntervalId = setInterval(() => {
            setShowingImage((props.collectionImgs)[(++count)%props.collectionImgs.length]);
        }, 300);
        setIntervalId(newIntervalId);
    }

    function MouseOut() {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(0);
            return;
        }
    }

    const sendNameUpChain = () => {
        props.onClick(props.collectionTitle)
    };

    return(
        <div className="cardCont" onMouseOver={MouseOver} onMouseOut={MouseOut} onClick={ sendNameUpChain }>
            <div className="cardAttrCont">
                <div className="cardImgCont">
                    <img className="cardImgSrc" src={currentShowingImage} alt="new" />
                </div>
                <div className="cardInfoCont">
                    <div className="cardTitleCont">
                        <div className="cardTextCont">
                            <text className="cardTitleText">
                                {props.collectionTitle}
                            </text>
                        </div>
                        <div className="cardCountCont">
                            <div className="cardcountBox">
                                <text className="cardCountText">{props.collectionCount}</text>
                            </div>
                        </div>
                    </div>
                    <div className="cardDetailsCont">
                        <text className="cardDetailsText">
                            {props.collectionText}
                        </text>
                    </div>
                </div>
            </div>
            
        </div>
    );
}

export default CollectionCard;
