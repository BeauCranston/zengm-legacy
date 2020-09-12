/**
 * @name views.watchList
 * @namespace List of players to watch.
 */
define(["db", "globals", "ui", "core/freeAgents", "core/player", "lib/jquery", "lib/knockout", "views/components", "util/bbgmView", "util/helpers"], function (db, g, ui, freeAgents, player, $, ko, components, bbgmView, helpers) {
    "use strict";

    var mapping;

    function get(req) {
        return {
            statType: req.params.statType !== undefined ? req.params.statType : "per_game",
            playoffs: req.params.playoffs !== undefined ? req.params.playoffs : "regular_season"
        };
    }

    function InitViewModel() {
        this.statType = ko.observable();
        this.playoffs = ko.observable();
    }

    mapping = {
        players: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updatePlayers(inputs, updateEvents, vm) {
        var deferred, playersUnfiltered;

        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("watchList") >= 0 || updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0 || inputs.statType !== vm.statType() || inputs.playoffs !== vm.playoffs()) {
            deferred = $.Deferred();

            playersUnfiltered = [];

            // Can't index on a boolean in IndexedDB, so loop through them all
            g.dbl.transaction("players").objectStore("players").openCursor().onsuccess = function (event) {
                var cursor, i, p, players;

                cursor = event.target.result;
                if (cursor) {
                    p = cursor.value;
                    if (p.watch && typeof p.watch !== "function") { // In Firefox, objects have a "watch" function
                        playersUnfiltered.push(p);
                    }
                    cursor.continue();
                } else {
                    players = player.filter(playersUnfiltered, {
                        attrs: ["pid", "name", "pos", "age", "injury", "tid", "abbrev", "watch", "contract", "freeAgentMood", "draft"],
                        ratings: ["ovr", "pot", "skills"],
                        stats: ["gp", "min", "fgp", "tpp", "ftp", "trb", "ast", "tov", "stl", "blk", "pts", "per", "ewa","qbr","pya","ruya","drb","reyc","orb","olrmpa","olr","fgpAtRim","derpatp","der","fgaMidRange"],
                        season: g.season,
                        totals: inputs.statType === "totals",
                        per36: inputs.statType === "per_36",
                        playoffs: inputs.playoffs === "playoffs",
                        fuzz: true,
                        showNoStats: true,
                        showRookies: true,
                        showRetired: true,
                        oldStats: true
                    });

                    // Add mood to free agent contracts
                    for (i = 0; i < players.length; i++) {
                        if (players[i].tid === g.PLAYER.FREE_AGENT) {
                            players[i].contract.amount = freeAgents.amountWithMood(players[i].contract.amount, players[i].freeAgentMood[g.userTid]);
                        }
                    }

                    deferred.resolve({
                        players: players,
                        statType: inputs.statType,
                        playoffs: inputs.playoffs
                    });
                }
            };
            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ui.title("Watch List");

        ko.computed(function () {
            var contract, d, i, p, players, rows, category, categories;

            // Number of decimals for many stats
            if (vm.statType() === "totals") {
                d = 0;
            } else {
                d = 1;
            }

            rows = [];
            players = vm.players();
            for (i = 0; i < vm.players().length; i++) {
                p = players[i];

                // HACKS to show right stats, info
                if (vm.playoffs() === "playoffs") {
                    p.stats = p.statsPlayoffs;

                    // If no playoff stats, blank them
                    ["gp", "min", "fgp", "tpp", "ftp", "trb", "ast", "tov", "stl", "blk", "pts", "per", "ewa","qbr","pya","ruya","drb","reyc","orb","olrmpa","olr","fgpAtRim","derpatp","der","fgaMidRange"].forEach(function (category) {
                        if (p.stats[category] === undefined) {
                            p.stats[category] = 0;
                        }
                    });
                }

                if (p.tid === g.PLAYER.RETIRED) {
                    contract = "Retired";
                } else if (p.tid === g.PLAYER.UNDRAFTED || p.tid === g.PLAYER.UNDRAFTED_2 || p.tid === g.PLAYER.UNDRAFTED_3) {
                    contract = p.draft.year + " Draft Prospect";
                } else {
                    contract = helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp
                }

                rows.push([helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.pos, String(p.age), '<a href="' + helpers.leagueUrl(["roster", p.abbrev]) + '">' + p.abbrev + '</a>', String(p.ratings.ovr), String(p.ratings.pot), contract, String(p.stats.gp), helpers.round(p.stats.qbr, 1), helpers.round(p.stats.stl, 1), helpers.round(p.stats.pya, 1), helpers.round(p.stats.drb, 0), helpers.round(p.stats.ruya, 1), helpers.round(p.stats.ast, 0), helpers.round(p.stats.reyc, 1), helpers.round(p.stats.olrmpa, 2), helpers.round(p.stats.olr, 0), helpers.round(p.stats.fgpAtRim, 1), helpers.round(p.stats.derpatp, 2), helpers.round(p.stats.der, 0), helpers.round(p.stats.fgaMidRange, 0)]);
            }

            ui.datatable($("#watch-list"), 0, rows);
        }).extend({throttle: 1});

        ui.tableClickableRows($("#watch-list"));

        document.getElementById("clear-watch-list").addEventListener("click", function () {
            g.dbl.transaction("players", "readwrite").objectStore("players").openCursor().onsuccess = function (event) {
                var cursor, p;

                cursor = event.target.result;
                if (cursor) {
                    p = cursor.value;
                    if (p.watch) {
                        p.watch = false;
                        cursor.update(p);
                    }
                    cursor.continue();
                } else {
                    db.setGameAttributes({lastDbChange: Date.now()}, function () {
                        ui.realtimeUpdate(["watchList"]);
                    });
                }
            };
        });
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("watch-list-dropdown", ["statTypes", "playoffs"], [vm.statType(), vm.playoffs()], updateEvents);
    }

    return bbgmView.init({
        id: "watchList",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updatePlayers],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});