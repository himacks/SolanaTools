import { useNavigate } from "react-router-dom";

function Navbar(props) {
    
    const CustomTag = props.iconType;

    const navigate = useNavigate();

    return(
        <div className="navBarEntry" onClick={ () => { navigate("/"+props.route)}}>

            <CustomTag className="svgIcon"/>
            <div className="navBarTextDiv">
                <text className="navbarText" >{props.text}</text>
            </div>
        </div>
    );
}

export default Navbar;
