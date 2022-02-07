


const btnGetMetaData = document.querySelector('#sendMetaDataBtn');
const btnGetAvailableCollections = document.querySelector('#getCollectionsBtn');
const btnGetCollectionSummary = document.querySelector("#getCollectionSummaryBtn");

btnGetMetaData.addEventListener('click', function()
{
    var inputData = $("#tokenInput").val();

    var tokenType = $("#tokenType").val();

    var data = {"tokenAddress": inputData, "tokenType": tokenType};

    var extension = "/queryCollectionMetaData";

    postData(data, extension);
});

btnGetAvailableCollections.addEventListener('click', function () {
    getAvailableCollections({"parseLimit": 5}).then( (availableCollections) => {
        availableCollections.forEach( (collectionName) => {
            insertCollectionsBox(collectionName);
        });
    });
});

btnGetCollectionSummary.addEventListener('click', function() {
    var collectionName = $("#collectionName").val();

    var data = {"collectionName": collectionName};

    getCollectionSummary(data);
});


const collectionsBox = [];

function insertCollectionsBox(collectionName)
{
    if(!collectionsBox.includes(collectionName))
    {
        $("#availableCollections").val($("#availableCollections").val() + collectionName + "\n")
        collectionsBox.push(collectionName);
    }
}

function postData(data, extension)
{
    $.ajax({
        url: 'http://localhost:4000' + extension,
        data: data,
        type: 'POST',
        success: function( data, status, xhttp) {
            // data will be true or false if you returned a json bool
            
            insertCollectionsBox(data.collectionName);
       }
    });
}

function getAvailableCollections(data)
{
    return new Promise( (resolve) => {
        $.ajax({
            url: 'http://localhost:4000/getAvailableCollections',
            type: 'GET',
            data: data,
            success: function( data, status, xhttp) {
                // data will be true or false if you returned a json bool
    
                resolve(data.availableCollections);
           }
    
        })
    });
    
}

function getCollectionSummary(data)
{

    return new Promise( (resolve) => {
        $.ajax({
            url: 'http://localhost:4000/getCollectionSummary',
            data: data,
            type: 'GET',
            success: function( data, status, xhttp) {
                // data will be true or false if you returned a json bool
                console.log(data.collectionData);
                resolve(data.collectionData);
           }
    
        })
    });
    
}