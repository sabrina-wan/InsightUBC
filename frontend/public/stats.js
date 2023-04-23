let map;

window.onload = (event) => {
    const requester = new XMLHttpRequest();
    requester.open('GET', `/options`);
    requester.send();
    requester.onload = function () {
        if (requester.status != 200) {
            const errors = JSON.parse(requester.responseText)
            document.getElementById("title").innerHTML = errors.error
        } else {
            const results = JSON.parse(requester.responseText)
            if (typeof results.map !== "string") {
                console.log(results.map)
                map = results.map
                var select = document.getElementById("course-dept");
                for (let dept of Object.keys(results.map)) {
                    var option = document.createElement("option");
                    option.text = dept;
                    select.add(option);
                }
            } else {
                document.getElementById("title").innerHTML = results.map;
                document.getElementById("submit-stats").disabled = true; 
            }
   
        }
    }
}

function populateOptions() {
    const dept = document.querySelector('.course-dept').value;
    console.log(dept)
    var select = document.getElementById("course-id");
    select.innerHTML = "<option></option>"
    if (typeof map !== "undefined" && map !== null) {
        for (let id of map[dept]) {
            var option = document.createElement("option");
            option.text = id;
            select.add(option);
        }
    }
}

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
            const errors = JSON.parse(requester.responseText)
            document.getElementById("title").innerHTML = errors.error
        } else {
            const results = JSON.parse(requester.responseText)
            console.log(results.results)
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