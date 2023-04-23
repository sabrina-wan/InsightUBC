document.getElementById("remove-button").addEventListener("click", httpDelAsync);

function httpDelAsync(){
	const datasetID = document.getElementById("dataset-id").value;
	const xmlHttp = new XMLHttpRequest();
	xmlHttp.onload = function() {
		if (xmlHttp.status == 200) {
			alert("Successfully removed dataset " + JSON.parse(xmlHttp.responseText)["result"]);
		} else if (xmlHttp.status == 400) {
			alert("Dataset name cannot contain underscore or whitespaces. " +
				"Please make sure to enter a valid dataset name");
		} else {
			alert("Dataset " + datasetID + " does not exist. Please make sure to enter an existing dataset")
		}
	}

	let uri = encodeURI("http://localhost:4321/dataset/" + datasetID);

	xmlHttp.open("DELETE", uri, true); // true for asynchronous
	xmlHttp.send();
}
