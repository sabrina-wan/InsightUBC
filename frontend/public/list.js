document.getElementById("list-button").addEventListener("click", httpGetAsync);

function httpGetAsync() {
	let xmlHttp = new XMLHttpRequest();

	xmlHttp.onload = function() {
		let datasets = JSON.parse(xmlHttp.responseText)["result"];
		// console.log(datasets);
		createTable(datasets);
	}

	let uri = "http://localhost:4321/datasets";

	xmlHttp.open("GET", uri, true); // true for asynchronous
	xmlHttp.send();
}

function createTable(datasets) {
	if (document.getElementById("dataset-table")) {
		console.log("removed table");
		document.getElementById("dataset-table").remove();
	}
	const table = document.createElement("table");
	table.setAttribute("id", "dataset-table");
	// give table an ID
	createHeader(table);
	createBody(table, datasets);
	document.body.insertBefore(table, document.getElementById("back-to-menu"));
}

function createHeader(table) {
	const head = table.createTHead();
	const row = head.insertRow(0);
	row.insertCell(0).innerHTML = "<b>Dataset</b>";
	row.insertCell(1).innerHTML = "<b>Kind</b>";
	row.insertCell(2).innerHTML = "<b>Rows</b>";
}

function createBody(table, datasets) {
	const body = table.createTBody();
	for (let i = 0; i < datasets.length; i++) {
		const row = body.insertRow(i);
		row.insertCell(0).innerHTML = datasets[i]["id"];
		row.insertCell(1).innerHTML = datasets[i]["kind"];
		row.insertCell(2).innerHTML = datasets[i]["numRows"];
	}
}
