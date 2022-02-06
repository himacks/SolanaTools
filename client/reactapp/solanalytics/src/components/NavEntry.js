import { useState } from "react";

function Navbar(props) {
    
    const CustomTag = props.iconType;

    return(
        <div className="navBarEntry" onClick={props.onClick}>
            <CustomTag className="svgIcon"/>
            <div className="navBarTextDiv">
                <text className="navbarText" >{props.text}</text>
            </div>
        </div>
    );
}

export default Navbar;
