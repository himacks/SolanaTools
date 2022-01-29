


const btnGetMetaData = document.querySelector('#sendMetaDataBtn');
const btnGetAvailableCollections = document.querySelector('#getCollectionsBtn');

btnGetMetaData.addEventListener('click', function()
{
    var inputData = $("#tokenInput").val();

    var tokenType = $("#tokenType").val();

    var data = {"tokenAddress": inputData, "tokenType": tokenType};

    var extension = "/queryCollectionMetaData";

    postData(data, extension);
});

btnGetAvailableCollections.addEventListener('click', function () {
    getAvailableCollections().then( (availableCollections) => {
        availableCollections.forEach( (collectionName) => {
            insertCollectionsBox(collectionName);
        });
    });
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
        url: 'http://localhost:3000' + extension,
        data: data,
        type: 'POST',
        success: function( data, status, xhttp) {
            // data will be true or false if you returned a json bool

            insertCollectionsBox(data.collectionName);
       }
    });
}

function getAvailableCollections()
{
    return new Promise( (resolve) => {
        $.ajax({
            url: 'http://localhost:3000/getAvailableCollections',
            type: 'GET',
            success: function( data, status, xhttp) {
                // data will be true or false if you returned a json bool
    
                resolve(data.availableCollections);
           }
    
        })
    });
    
}