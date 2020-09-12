/**
 * @name views.playerStats
 * @namespace Player stats table.
 */
define(["globals", "ui", "core/player", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, player, $, ko, _, components, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function get(req) {
        var abbrev;

        if (g.teamAbbrevsCache.indexOf(req.params.abbrev) >= 0) {
            abbrev = req.params.abbrev;
        } else {
            abbrev = "all";
        }

        return {
            abbrev: abbrev,
            season: req.params.season === "career" ? null : helpers.validateSeason(req.params.season),
            statType: req.params.statType !== undefined ? req.params.statType : "per_game",
            playoffs: req.params.playoffs !== undefined ? req.params.playoffs : "regular_season"
        };
    }

    function InitViewModel() {
        this.abbrev = ko.observable();
        this.season = ko.observable();
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
        var deferred;

        if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.abbrev !== vm.abbrev() || inputs.season !== vm.season() || inputs.statType !== vm.statType() || inputs.playoffs !== vm.playoffs()) {
            deferred = $.Deferred();

            g.dbl.transaction("players").objectStore("players").index("tid").getAll(IDBKeyRange.lowerBound(g.PLAYER.RETIRED)).onsuccess = function (event) {
                var gp, i, min, players, playersAll, tid;

                tid = g.teamAbbrevsCache.indexOf(inputs.abbrev);
                if (tid < 0) { tid = null; } // Show all teams

                playersAll = player.filter(event.target.result, {
                    attrs: ["pid", "name", "pos", "age", "injury", "tid", "hof", "watch"],
                    ratings: ["skills"],
//                    stats: ["abbrev", "tid", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per", "ewa","pya","tdp","inter","interp"], 
                    stats: ["abbrev", "tid", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per", "ewa","pya","tdp","inter","intp","tya","sackp","ruya","reyc","qbr"],
                    season: inputs.season, // If null, then show career stats!
                    tid: tid,
                    totals: inputs.statType === "totals",
                    per36: inputs.statType === "per_36",
                    playoffs: inputs.playoffs === "playoffs"
                });

                // Find max gp to use for filtering
                gp = 0;
                for (i = 0; i < playersAll.length; i++) {
                    if (playersAll[i].stats.gp > gp) {
                        gp = playersAll[i].stats.gp;
                    }
                }
                // Special case for career totals - use 82 games, unless this is the first season
                if (!inputs.season) {
                    if (g.season > g.startingSeason) {
                        gp = 82;
                    }
                }

                // Only keep players with more than 5 mpg
                players = [];
                for (i = 0; i < playersAll.length; i++) {
                    // Minutes played
                    if (inputs.statType === "totals") {
                        if (inputs.season) {
                            min = playersAll[i].stats.min;
                        } else {
                            min = playersAll[i].careerStats.min;
                        }
                    } else {
                        if (inputs.season) {
                            min = playersAll[i].stats.gp * playersAll[i].stats.min;
                        } else {
                            min = playersAll[i].careerStats.gp * playersAll[i].careerStats.min;
                        }
                    }

                    if (min > gp * 5) {
                        players.push(playersAll[i]);
                    }
                }

                deferred.resolve({
                    players: players,
                    abbrev: inputs.abbrev,
                    season: inputs.season,
                    statType: inputs.statType,
                    playoffs: inputs.playoffs
                });
            };
            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            var label;

            label = vm.season() !== null ? vm.season() : "Career Totals";
            ui.title("Player Stats - " + label);
        }).extend({throttle: 1});

        ko.computed(function () {
            var abbrev, d, i, p, players, rows, season, tid;

            season = vm.season();

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
                if (season === null) {
                    p.stats = p.careerStats;
                    abbrev = helpers.getAbbrev(p.tid);
                    tid = p.tid;
                    if (vm.playoffs() === "playoffs") {
                        p.stats = p.careerStatsPlayoffs;
                    }
                } else {
                    abbrev = p.stats.abbrev;
                    tid = p.stats.tid;
                    if (vm.playoffs() === "playoffs") {
                        p.stats = p.statsPlayoffs;
                    }
                }

                // Skip no stats: never played, didn't make playoffs, etc
                if (p.stats.gp) {
//					rows.push([helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.pos, '<a href="' + helpers.leagueUrl(["roster", abbrev, season]) + '">' + abbrev + '</a>', String(p.stats.gp), String(p.stats.gs), helpers.round(p.stats.min, d), helpers.round(p.stats.fg, d), helpers.round(p.stats.fga, d), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.tp, d), helpers.round(p.stats.tpa, d), helpers.round(p.stats.tpp, 1), helpers.round(p.stats.ft, d), helpers.round(p.stats.fta, d), helpers.round(p.stats.ftp, 1), helpers.round(p.stats.orb, d), helpers.round(p.stats.drb, d), helpers.round(p.stats.trb, d), helpers.round(p.stats.ast, d), helpers.round(p.stats.tov, d), helpers.round(p.stats.stl, 1), helpers.round(p.stats.blk, d), helpers.round(p.stats.pf, d), helpers.round(p.stats.pts, d), helpers.round(p.stats.per, 1), helpers.round(p.stats.ewa, 1), p.hof, tid === g.userTid]);
////					rows.push([helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.pos, '<a href="' + helpers.leagueUrl(["roster", abbrev, season]) + '">' + abbrev + '</a>', String(p.stats.gp), String(p.stats.gs), helpers.round(p.stats.fg, 0), helpers.round(p.stats.fga, 0), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.stl, 0), helpers.round(p.stats.pya, 1), helpers.round(p.stats.blk, 0), helpers.round(p.stats.tdp, 1), helpers.round(p.stats.inter, 0), helpers.round(p.stats.intp, 1), helpers.round(p.stats.tp, 0), helpers.round(p.stats.sackp, 1), helpers.round(p.stats.tov, 0), helpers.round(p.stats.drb, 0), helpers.round(p.stats.ruya, 1), helpers.round(p.stats.ft, 0), helpers.round(p.stats.ast, 0), helpers.round(p.stats.orb, 0), helpers.round(p.stats.reyc, 1), helpers.round(p.stats.pf, 0), helpers.round(p.stats.ewa, 1), p.hof, tid === g.userTid]);
					rows.push([helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.pos, '<a href="' + helpers.leagueUrl(["roster", abbrev, season]) + '">' + abbrev + '</a>', String(p.stats.gp), String(p.stats.gs), helpers.round(p.stats.fg, 0), helpers.round(p.stats.fga, 0), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.stl, 0), helpers.round(p.stats.pya, 1), helpers.round(p.stats.blk, 0), helpers.round(p.stats.tdp, 1), helpers.round(p.stats.inter, 0), helpers.round(p.stats.intp, 1), helpers.round(p.stats.tp, 0), helpers.round(p.stats.sackp, 1), helpers.round(p.stats.qbr, 1), helpers.round(p.stats.tov, 0), helpers.round(p.stats.drb, 0), helpers.round(p.stats.ruya, 1), helpers.round(p.stats.ft, 0), helpers.round(p.stats.ast, 0), helpers.round(p.stats.orb, 0), helpers.round(p.stats.reyc, 1), helpers.round(p.stats.pf, 0), p.hof, tid === g.userTid]);
     				
                    //rows.push([helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.pos, '<a href="' + helpers.leagueUrl(["roster", abbrev, season]) + '">' + abbrev + '</a>', String(p.stats.gp), String(p.stats.gs), helpers.round(p.stats.fg, 0), helpers.round(p.stats.fga, 0), helpers.round(p.stats.fgp, 1), helpers.round(p.stats.stl, 0), helpers.round(p.stats.blk, 0), helpers.round(p.stats.tdp, 1), helpers.round(p.stats.inter, 0), helpers.round(p.stats.interp, 1), helpers.round(p.stats.pya, 1), p.hof, tid === g.userTid]);
                }
            }

            ui.datatable($("#player-stats"), 2, rows, {
                fnRowCallback: function (nRow, aData) {
                    // Highlight HOF players
                    if (aData[aData.length - 2]) {
                        nRow.classList.add("danger");
                    }
                    // Highlight user's team
                    if (aData[aData.length - 1]) {
                        nRow.classList.add("info");
                    }
                }
            });
        }).extend({throttle: 1});

        ui.tableClickableRows($("#player-stats"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("player-stats-dropdown", ["teamsAndAll", "seasonsAndCareer", "statTypes", "playoffs"], [vm.abbrev(), vm.season(), vm.statType(), vm.playoffs()], updateEvents);
    }

    return bbgmView.init({
        id: "playerStats",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updatePlayers],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});