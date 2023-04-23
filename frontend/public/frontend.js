document.getElementById("submit-button").addEventListener("click", submitForm);
console.log("js file read")
function submitForm() {
	const account = document.getElementById("account").value;
	const password = document.getElementById("password").value

	// send request
	httpGetAsync(account, password);
}

function httpGetAsync(account, password) {
	let xmlHttp = new XMLHttpRequest();
	xmlHttp.onload = function() {
		if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
			window.location.href = "methods.html";
		} else {
			alert("Wrong account or password, plz 🙏 try again ¯\\_(ツ)_/¯")
		}
	}
	let uri = "http://localhost:4321/accounts?account=" + account + "&password=" + password;
	xmlHttp.open("GET", uri, true); // true for asynchronous
	// fields.jsonify
	xmlHttp.send();
}
