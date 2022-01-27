


const btnGetMetaData = document.querySelector('#sendMetaDataBtn');

btnGetMetaData.addEventListener('click', function()
{
    var inputData = $("#tokenInput").val();

    var tokenType = $("#tokenType").val();

    var data = {"tokenAddress": inputData, "tokenType": tokenType};

    var extension = "/getCollectionMetaData";

    postData(data, extension);
});




function postData(data, extension)
{
    $.ajax({
        url: 'http://localhost:3000' + extension,
        data: data,
        type: 'POST',
        success: function( data, status, xhttp) {
            // data will be true or false if you returned a json bool

            console.log("success");
       }

    })
}