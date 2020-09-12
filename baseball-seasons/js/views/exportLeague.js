/**
 * @name views.exportRosters
 * @namespace Export rosters.
 */
define(["globals", "ui", "core/league", "lib/jquery", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, league, $, bbgmView, helpers, viewHelpers) {
    "use strict";

    function post(req) {
        var downloadLink, objectStores;

        downloadLink = document.getElementById("download-link");
        downloadLink.innerHTML = "Generating...";

        // Get array of object stores to export
        objectStores = req.params.objectStores.join(",").split(",");

        // Can't export player stats without players
        if (objectStores.indexOf("playerStats") >= 0 && objectStores.indexOf("players") === -1) {
            downloadLink.innerHTML = '<span class="text-danger">You can\'t export player stats without exporting players!</span>';
            return;
        }
		
        league.export_(objectStores).then(function (data) {
			var a, blob, fileName, json, url;

			json = JSON.stringify(data, undefined, 2);
			blob = new Blob([json], {type: "application/json"});
			url = window.URL.createObjectURL(blob);

			fileName = data.meta !== undefined ? data.meta.name : "League";
			a = document.createElement("a");
			a.download = "BASEBALLGMS - " + fileName + ".json";
			a.href = url;
			a.textContent = "Download Exported League File";
			a.dataset.noDavis = "true";
//                a.click(); // Works in Chrome to auto-download, but not Firefox

            downloadLink.innerHTML = ""; // Clear "Generating..."
            downloadLink.appendChild(a);
			
                // Delete object, eventually
            window.setTimeout(function () {
                window.URL.revokeObjectURL(url);
                downloadLink.innerHTML = "Download link expired."; // Remove expired link
            }, 60 * 1000);
        });
    }

    function updateExportLeague(inputs, updateEvents, vm) {
        var categories;

        if (updateEvents.indexOf("firstRun") >= 0) {
            categories = [
                {
                    objectStores: "players,releasedPlayers,awards",
                    name: "Players",
                    desc: "All player info, ratings, and awards - but not stats!",
                    checked: true
                },
                {
                    objectStores: "playerStats",
                    name: "Player Stats",
                    desc: "All player stats.",
                    checked: true
                },
                {
                    objectStores: "teams",
                    name: "Teams",
                    desc: "All team info and stats.",
                    checked: true
                },
                {
                    objectStores: "schedule,playoffSeries",
                    name: "Schedule",
                    desc: "Current regular season schedule and playoff series.",
                    checked: true
                },
                {
                    objectStores: "draftPicks",
                    name: "Draft Picks",
                    desc: "Traded draft picks.",
                    checked: true
                },
                {
                    objectStores: "trade,negotiations,gameAttributes,draftOrder,messages,events",
                    name: "Game State",
                    desc: "Interactions with the owner, current contract negotiations, current game phase, etc. Useful for saving or backing up a game, but not for creating custom rosters.",
                    checked: true
                },
                {
                    objectStores: "games",
                    name: "Box Scores",
                    desc: '<span class="text-danger">If you\'ve played more than a few seasons, this takes up a ton of space!</span>',
                    checked: false
                }
            ];
            return {categories: categories};
        }
    }

    function uiFirst() {
        ui.title("Export League");
    }

    return bbgmView.init({
        id: "exportLeague",
        post: post,
        runBefore: [updateExportLeague],
        uiFirst: uiFirst
    });
});