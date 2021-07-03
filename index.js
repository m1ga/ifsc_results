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
				if (i < 10) {
					i = " " + i;
				}
				console.log(" " + colors.green(i) + ": " + leagues.name);
				leagueData.push(leagues.url);
			});

			readline.question('Which event: ', eventId => {
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
					cats.category_rounds.forEach((round, i) => {
						let eventNumber = eventData.length;
						let isActive = false;
						if (eventNumber < 10) {
							eventNumber = " " + eventNumber;
						}

						if (round.status == "active") {
							isActive = true;
							console.log("\t  " + colors.green(eventNumber) + ": " + colors.green(cats.name + " | " + round.name));
						} else {
							console.log("\t  " + colors.green(eventNumber) + ": " + cats.name + " | " + round.name);
						}
						eventData.push(round.category_round_id);
					});
				});
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
			let columns = require('columns').create();
			let a = columns.addColumn('c1', {
				header: false,
				raw: true
			})
			let b = columns.addColumn('c2', {
				header: false,
				raw: true
			})
			let c = columns.addColumn('c3', {
				header: false,
				raw: true
			})
			let count = 0;
			let currentColumn = a;
			let isLead = false;
			if (json.discipline.indexOf("Lead") > -1) {
				isLead = true;
			}
			console.log(json.discipline + " " + json.category + " " + json.round);
			if (json.ranking) {
				let pos = 1;
				json.ranking.forEach((athelete, i) => {
					let name = athelete.firstname + " " + athelete.lastname;
					let route = "";
					let topCount = 0;
					let zoneCount = 0;
					let score = "";
					if (athelete.active) name = colors.yellow(name);
					let country = athelete.country;
					if (athelete.ascents) {
						let isPending = false;
						athelete.ascents.forEach((ascents, i) => {
							let _tries = ascents.top_tries || 0;
							let _zones = ascents.zone_tries || 0;
							if (ascents.zone) zoneCount++;
							if (ascents.top) topCount++;
							if (ascents.score) score = "\n  Score: " + ascents.score;
							let currentRoute = "";
							if (isLead) {
								currentRoute = score;
							} else {
								currentRoute = "\n  " + ascents.route_name + "\tZone: " + ((ascents.zone) ? colors.green("yes") : "no") + " (" + _zones + " tries)\t|\tTop: " + ((ascents.top) ? colors.green("yes") : "no") + " (" + _tries + " tries)";
							}
							if (ascents.status == "pending" || isPending) {
								currentRoute = colors.grey(currentRoute);
								isPending = true;
							}
							if (ascents.status == "active") {
								isPending = true;
							}
							route += currentRoute;
						});
					}

					let boulderStats = (!isLead) ? " (T: " + topCount + ", Z: " + zoneCount + ")" : "";
					currentColumn.write("\n " + pos + ": " + name + " " + country + boulderStats + route + "\n ");
					pos++;

					++count;
					if (count >= 16) {
						currentColumn = c;
					} else if (count >= 8) {
						currentColumn = b;
					}

				});
			} else {
				// currentColumn.write("\n  - no ranking yet -");
			}
		});
}

getLeagues();
