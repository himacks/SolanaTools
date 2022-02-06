function FeatureHeader(props) {
    return(
        <div className={props.type + "Header featureHeader"}>
            <text id="collectionsTitle">{props.text}</text>
        </div>
    );
}

export default FeatureHeader;