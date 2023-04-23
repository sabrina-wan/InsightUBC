window.onload = (event) => {
    let xmlHttp = new XMLHttpRequest();

	xmlHttp.onload = function() {
		let datasets = JSON.parse(xmlHttp.responseText)["result"];
        if (datasets.length === 0) {
            document.getElementById("message").innerHTML = "no dataset to query";
            document.getElementById("resultDiv").style.display = "inline-block"
            document.getElementById("submit-query").disabled = true; 
        }
	}

	let uri = "http://localhost:4321/datasets";

	xmlHttp.open("GET", uri, true); // true for asynchronous
	xmlHttp.send();
}

function handleSubmitQuery() {
    const query = document.getElementById("plain-query").value

    const requester = new XMLHttpRequest();
    requester.open('POST', '/query');
    requester.setRequestHeader("Content-Type", "application/json");
    requester.send(query);
    requester.onload = function () {
        if (requester.status != 200) {
            const errors = JSON.parse(requester.responseText)
            document.getElementById("message").innerHTML = errors.error
            document.getElementById("result").innerHTML = ""
            document.getElementById("resultDiv").style.display = "inline-block"
        } else {
            const results = JSON.parse(requester.responseText)

            var table = document.getElementById("result")
            table.innerHTML = ""

            var rowCount = results.result.length
            if (rowCount > 0) {
                document.getElementById("message").innerHTML = rowCount + " results"
                const keys = Object.keys(results.result[0])
                var columnCount = Object.keys(results.result[0]).length;
                var headerRow = table.insertRow(-1);
                for (var i = 0; i < columnCount; i++) {
                    var headerCell = document.createElement("th");
                    headerCell.innerHTML = keys[i];
                    headerRow.appendChild(headerCell);
                }

                for (var i = 0; i < rowCount; i++) {
                    var row = table.insertRow(-1)
                    for (var j = 0; j < columnCount; j++) {
                        var cell = row.insertCell(-1);
                        cell.innerHTML = results.result[i][keys[j]];
                    }
                }
                document.getElementById("resultDiv").style.display = "inline-block"
            } else {
                document.getElementById("message").innerHTML = "empty result"
                document.getElementById("resultDiv").style.display = "inline-block"
            }
        }
    };
};

function handleSubmitStats() {
    const dept = document.getElementById("course-dept").value
    const id = document.getElementById("course-id").value
    if (dept === "" || id === "") {
        alert("Please select dept and id")
        document.getElementById("title").innerHTML = ""
        document.getElementById("avgDiv").style.display = "none"
        document.getElementById("maxDiv").style.display = "none"
        document.getElementById("minDiv").style.display = "none"
        document.getElementById("tableDiv").style.display = "none"
        return false
    }

    const requester = new XMLHttpRequest();
    requester.open('GET', `/stats?dept=${dept}&id=${id}`);
    requester.send();
    requester.onload = function () {
        if (requester.status != 200) {
        } else {
            const results = JSON.parse(requester.responseText)
            document.getElementById("title").innerHTML = results.stats.courses_title
            document.getElementById("avg").innerHTML = results.stats.overallAvg
            document.getElementById("avgDiv").style.display = "block"
            document.getElementById("max").innerHTML = results.stats.overallMax
            document.getElementById("maxDiv").style.display = "block"
            document.getElementById("min").innerHTML = results.stats.overallMin
            document.getElementById("minDiv").style.display = "block"
            
            var table = document.getElementById("instructor")
            table.innerHTML = "<thead><th>Instructor</th><th>Year</th></thead>"
            for (let i of results.profs) {
                var row = table.insertRow(-1)
                var cell1 = row.insertCell(0)
                cell1.innerHTML = i.courses_instructor
                var cell2 = row.insertCell(1)
                cell2.innerHTML = i.courses_year
            }
            document.getElementById("tableDiv").style.display = "block"
        }
    };
};

function populateOptions(options) {
    var select = document.getElementById("course-id");
    select.innerHTML = "<option></option>"
    if (typeof options !== "undefined" && options !== null) {
        for (let id of options) {
            var option = document.createElement("option");
            option.text = id;
            select.add(option);
        }
    }
}
