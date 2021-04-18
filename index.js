const fetch = require('node-fetch');
const colors = require('colors');
let category_id = -1;
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});
let settings = {
	method: "Get"
};

function clearOutput() {
	process.stdout.write("\u001b[3J\u001b[2J\u001b[1J");
	console.clear();
}

function getLeagues() {
	clearOutput()
	const url = "https://components.ifsc-climbing.org/results-api.php?api=event_full_results&result_url=/api/v1/";
	let leagueData = [];

	fetch(url, settings)
		.then(res => res.json())
		.then((json) => {
			json.current.leagues.forEach((leagues, i) => {
				console.log(" " + colors.green(i) + ": " + leagues.name);
				leagueData.push(leagues.url);
			});

			readline.question('Which event: ', eventId => {
				// readline.close();
				getEvents(leagueData[eventId]);
			});

		})
}

function getEvents(urlPart) {
	clearOutput();
	const url = "https://components.ifsc-climbing.org/results-api.php?api=event_full_results&result_url=" + urlPart;
	let eventData = [];

	fetch(url, settings)
		.then(res => res.json())
		.then((json) => {
			json.events.forEach((event, i) => {
				console.log(" " + colors.bold(event.event));
				event.d_cats.forEach((cats, i) => {
					console.log("\t" + cats.name);
					cats.category_rounds.forEach((round, i) => {
						console.log("\t  " + colors.green(eventData.length) + ": " + round.name);
						eventData.push(round.category_round_id);
					});
				});
				console.log("\n");
			});
			readline.question('Which round: ', eventId => {
				readline.close();
				category_id = eventData[eventId];
				resultLoop()
			});
		})
}

function resultLoop() {
	if (category_id != -1) {
		getResults();
		setInterval(function() {
			getResults();
		}, 60 * 1000);
	} else {
		console.log("category id not found :(");
	}
}

function getResults() {
	const url = "https://components.ifsc-climbing.org/results-api.php?api=event_full_results&result_url=/api/v1/category_rounds/" + category_id + "/results";
	fetch(url, settings)
		.then(res => res.json())
		.then((json) => {
			clearOutput();
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

getLeagues();
