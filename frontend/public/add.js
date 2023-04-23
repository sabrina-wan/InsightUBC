// import * as fs from "fs-exbuiltra";
console.log("reading js file");
document.getElementById("add-button").addEventListener("click", addDataset);

function addDataset() {
	const dataset_zip = document.getElementById("zip_upload").files[0];
	const dataset_id   = document.getElementById("dataset_id").value;
	const dataset_kind = document.getElementById("dataset_kind").value;

	httpGetAsync(dataset_zip, dataset_id, dataset_kind);

}

function httpGetAsync(zip, id, kind) {
	let xmlHttp = new XMLHttpRequest();

	xmlHttp.onload = function() {
		if (xmlHttp.status == 200) {
			alert("Successfully added! Currently holding information of datasets "
				+ JSON.parse(xmlHttp.responseText)["result"]);
		} else {
			alert("Please ensure correct id and dataset are added")
		}
	}

	let uri = "http://localhost:4321/dataset/"+ id + "/"+ kind;

	xmlHttp.open("PUT", uri, true); // true for asynchronous
	xmlHttp.send(zip);
}
