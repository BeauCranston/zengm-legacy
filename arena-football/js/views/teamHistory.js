/**
 * @name views.teamHistory
 * @namespace Team history.
 */
define(["db", "globals", "ui", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers", "views/components"], function (db, g, ui, player, $, ko, _, bbgmView, helpers, viewHelpers, components) {
    "use strict";

    var mapping;

    function get(req) {
        var inputs, out;

        inputs = {};

        inputs.show = req.params.show !== undefined ? req.params.show : "10";
        out = helpers.validateAbbrev(req.params.abbrev);
        inputs.tid = out[0];
        inputs.abbrev = out[1];

        return inputs;
    }

    mapping = {
        history: {
            create: function (options) {
                return options.data;
            }
        },
        players: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateTeamHistory(inputs, updateEvents, vm) {
        var deferred;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("gameSim") >= 0 || inputs.abbrev !== vm.abbrev()) {
            deferred = $.Deferred();

            g.dbl.transaction("teams").objectStore("teams").get(inputs.tid).onsuccess = function (event) {
                var abbrev, championships, history, i, playoffAppearances, totalWon, totalLost, userTeam, userTeamSeason;

                userTeam = event.target.result;

                history = [];
                totalWon = 0;
                totalLost = 0;
                playoffAppearances = 0;
                championships = 0;
                for (i = 0; i < userTeam.seasons.length; i++) {
                    history.push({
                        season: userTeam.seasons[i].season,
                        won: userTeam.seasons[i].won,
                        lost: userTeam.seasons[i].lost,
                        playoffRoundsWon: userTeam.seasons[i].playoffRoundsWon
                    });
                    totalWon += userTeam.seasons[i].won;
                    totalLost += userTeam.seasons[i].lost;
                    if (userTeam.seasons[i].playoffRoundsWon >= 0) { playoffAppearances += 1; }
                    if (userTeam.seasons[i].playoffRoundsWon === 4) { championships += 1; }
            	}
                history.reverse(); // Show most recent season first

                g.dbl.transaction("players").objectStore("players").index("statsTids").getAll(inputs.tid).onsuccess = function (event) {
                    var i, players;

                    players = player.filter(event.target.result, {
                        attrs: ["pid", "name", "pos", "injury", "tid", "hof", "watch"],
                        stats: ["gp", "min", "pts", "trb", "ast", "per", "ewa","qbr","ruya","reyc","fgaMidRange","gp","fgpAtRim","olr"],
                        tid: inputs.tid
                    });

                    for (i = 0; i < players.length; i++) {
                        delete players[i].ratings;
                        delete players[i].stats;
                    }

                    deferred.resolve({
                        abbrev: inputs.abbrev,
                        history: history,
                        players: players,
                        team: {
                            name: userTeam.name,
                            region: userTeam.region,
                            tid: inputs.tid
                        }
                    });
                };
            };

            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ui.title("Team History");

        ko.computed(function () {
            ui.datatable($("#team-history-players"), 2, _.map(vm.players(), function (p) {
                return [helpers.playerNameLabels(p.pid, p.name, p.injury, [], p.watch), p.pos, String(p.careerStats.gp), helpers.round(p.careerStats.qbr, 1), helpers.round(p.careerStats.ruya, 1), helpers.round(p.careerStats.reyc, 1), helpers.round(p.careerStats.olr, 0), helpers.round(p.careerStats.fgpAtRim, 1), helpers.round(p.careerStats.fgaMidRange, 0), p.hof, p.tid > g.PLAYER.RETIRED && p.tid !== vm.team.tid(), p.tid === vm.team.tid()];
            }), {
                fnRowCallback: function (nRow, aData) {
                    // Highlight active players
                    if (aData[aData.length - 1]) {
                        nRow.classList.add("success"); // On this team
                    } else if (aData[aData.length - 2]) {
                        nRow.classList.add("info"); // On other team
                    } else if (aData[aData.length - 3]) {
                        nRow.classList.add("danger"); // Hall of Fame
                    }
                }
            });
        }).extend({throttle: 1});

        ui.tableClickableRows($("#team-history-players"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("team-history-dropdown", ["teams"], [vm.abbrev()], updateEvents);
    }

    return bbgmView.init({
        id: "teamHistory",
        get: get,
        mapping: mapping,
        runBefore: [updateTeamHistory],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});