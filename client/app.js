


const btnGetMetaData = document.querySelector('#sendMetaDataBtn');

btnGetMetaData.addEventListener('click', function()
{
    var inputData = $("#creatorTokenInput").val();

    var data = {"creatorTokenAddress": inputData};

    var extension = "/getMetaData";

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