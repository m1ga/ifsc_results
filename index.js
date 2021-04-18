const category_id = 6377;
const urlCompetition = "https://components.ifsc-climbing.org/results-api.php?api=event_full_results&result_url=/api/v1/category_rounds/" + category_id + "/results";
const fetch = require('node-fetch');
const colors = require('colors');
let settings = {
	method: "Get"
};

function getResults(url) {
	fetch(url, settings)
		.then(res => res.json())
		.then((json) => {
			console.clear();
			console.log("  " + json.discipline + " " + json.category + " " + json.round);
			if (json.ranking) {
				json.ranking.forEach((athelete, i) => {
					let name = athelete.firstname + " " + athelete.lastname;
					let route = "";
					let topCount = 0;
					let zoneCount = 0;
					if (athelete.active) name = colors.yellow(name);
					if (athelete.ascents) {
						athelete.ascents.forEach((ascents, i) => {
							let _tries = ascents.top_tries || 0;
							let _zones = ascents.zone_tries || 0;
							if (ascents.zone) zoneCount++;
							if (ascents.top) topCount++;

							let currentRoute = "\n    | " + ascents.route_name + " Zone: " + ((ascents.zone) ? colors.green("yes") : "no") + "\ttries: " + _zones + "\t| Top: " + ((ascents.top) ? colors.green("yes") : "no") + "\ttries: " + _tries;
							if (ascents.status == "pending") {
								currentRoute = colors.grey(currentRoute);
							}
							route += currentRoute;
						});
					}

					console.log("\n  " + name + " | T:" + topCount + " | Z:" + zoneCount + route);
				});
				console.log("-----------");
			} else {
				console.log("\n  - no ranking yet -");
			}
		});
}

getResults(urlCompetition);
setInterval(function() {
	getResults(urlCompetition);
}, 60 * 1000);
