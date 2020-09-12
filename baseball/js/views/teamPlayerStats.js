/**
 * @name views.trade
 * @namespace Trade.
 */
define(["globals", "ui", "core/player", "core/trade", "lib/davis", "lib/jquery", "lib/knockout", "lib/knockout.mapping", "lib/underscore", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, player, trade, Davis, $, ko, komapping, _, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    // This relies on vars being populated, so it can't be called in parallel with updateTrade
    function updateSummary(vars, cb) {
        trade.getOtherTid(function (otherTid) {
            var teams;

            teams = [
                {
                    tid: g.userTid,
                    pids: vars.userPids,
                    dpids: vars.userDpids
                },
                {
                    tid: otherTid,
                    pids: vars.otherPids,
                    dpids: vars.otherDpids
                }
            ];
            trade.summary(teams, function (summary) {
                var i;

                vars.summary = {
                    enablePropose: !summary.warning && (teams[0].pids.length > 0 || teams[0].dpids.length > 0 || teams[0].dpids.length > 0 || teams[1].dpids.length > 0),
                    warning: summary.warning
                };

                vars.summary.teams = [];
                for (i = 0; i < 2; i++) {
                    vars.summary.teams[i] = {
                        name: summary.teams[i].name,
                        payrollAfterTrade: summary.teams[i].payrollAfterTrade,
                        total: summary.teams[i].total,
                        trade: summary.teams[i].trade,
                        picks: summary.teams[i].picks,
                        other: i === 0 ? 1 : 0  // Index of other team
                    };
                }

                cb(vars);
            });
        });
    }

    // Validate that the stored player IDs correspond with the active team ID
    function validateSavedPids(cb) {
        trade.get(function (teams) {
            trade.updatePlayers(teams, function (teams) {
                cb(teams);
            });
        });
    }

    function get(req) {
     //   if ((g.phase >= g.PHASE.AFTER_TRADE_DEADLINE && g.phase <= g.PHASE.PLAYOFFS) || g.phase === g.PHASE.FANTASY_DRAFT) {
     //       return {
     //           errorMessage: "You're not allowed to make trades now."
     //       };
     //   }

        return {
            message: req.raw.message !== undefined ? req.raw.message : null
        };
    }

    function post(req) {
        var askButtonEl, newOtherTid, otherDpids, otherPids, out, pid, userDpids, userPids, teams;

        pid = req.params.pid !== undefined ? parseInt(req.params.pid, 10) : null;
        if (req.raw.abbrev !== undefined) {
            out = helpers.validateAbbrev(req.raw.abbrev);
            newOtherTid = out[0];
        } else if (req.params.tid !== undefined) {
            newOtherTid = parseInt(req.params.tid, 10);
        } else {
            newOtherTid = null;
        }

        userPids = req.params.userPids !== undefined && req.params.userPids.length > 0 ? _.map(req.params.userPids.split(","), function (x) { return parseInt(x, 10); }) : [];
        otherPids = req.params.otherPids !== undefined && req.params.otherPids.length > 0 ? _.map(req.params.otherPids.split(","), function (x) { return parseInt(x, 10); }) : [];
        userDpids = req.params.userDpids !== undefined && req.params.userDpids.length > 0 ? _.map(req.params.userDpids.split(","), function (x) { return parseInt(x, 10); }) : [];
        otherDpids = req.params.otherDpids !== undefined && req.params.otherDpids.length > 0 ? _.map(req.params.otherDpids.split(","), function (x) { return parseInt(x, 10); }) : [];

        teams = [
            {
                tid: g.userTid,
                pids: userPids,
                dpids: userDpids
            },
            {
                tid: newOtherTid,
                pids: otherPids,
                dpids: otherDpids
            }
        ];

        if (req.params.clear !== undefined) {
            // Clear trade
            trade.clear(function () {
//                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]));
                ui.realtimeUpdate([], helpers.leagueUrl(["teamPlayerStats"]));
            });
        } else if (req.params.propose !== undefined) {
            // Propose trade
            trade.propose(function (accepted, message) {
//                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]), undefined, {message: message});
                ui.realtimeUpdate([], helpers.leagueUrl(["teamPlayerStats"]), undefined, {message: message});
            });
        } else if (req.params.ask !== undefined) {
            // What would make this deal work?
            askButtonEl = document.getElementById("ask-button");
            askButtonEl.textContent = "Waiting for answer...";
            askButtonEl.disabled = true;
            trade.makeItWorkTrade(function (message) {
//                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]), undefined, {message: message});
                ui.realtimeUpdate([], helpers.leagueUrl(["teamPlayerStats"]), undefined, {message: message});
                askButtonEl.textContent = "What would make this deal work?";
                askButtonEl.disabled = false;
            });
        } else if (pid !== null) {
            // Start new trade for a single player
            teams[1].pids = [pid];
            trade.create(teams, function () {
//                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]));
                ui.realtimeUpdate([], helpers.leagueUrl(["teamPlayerStats"]));
            });
        } else if (newOtherTid !== null || userPids.length > 0 || otherPids.length > 0 || userDpids.length > 0 || otherDpids.length > 0) {
            // Start a new trade based on a list of pids and dpids, like from the trading block
            trade.create(teams, function () {
//                ui.realtimeUpdate([], helpers.leagueUrl(["trade"]));
                ui.realtimeUpdate([], helpers.leagueUrl(["teamPlayerStats"]));
            });
        }
    }

    function InitViewModel() {
        this.teams = [];
        this.userTeamName = undefined;
        this.summary = {
            enablePropose: ko.observable(false)
        };
    }

    mapping = {
        userPicks: {
            create: function (options) {
                return options.data;
            }
        },
        userRoster: {
            create: function (options) {
                return options.data;
            }
        },
        otherPicks: {
            create: function (options) {
                return options.data;
            }
        },
        otherRoster: {
            create: function (options) {
                return options.data;
            }
        },
        teams: {
            create: function (options) {
                return options.data;
            }
        }
    };

    function updateTrade(inputs, updateEvents, vm) {
        var deferred, vars;

        deferred = $.Deferred();

        validateSavedPids(function (teams) {
            var playerStore;

            playerStore = g.dbl.transaction("players").objectStore("players");

            playerStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
                var attrs, i, ratings, stats, userRoster;

                attrs = ["pid", "name", "pos", "age", "contract", "yearsWithTeam", "injury", "watch", "gamesUntilTradable"];
                ratings = ["ovr", "pot", "skills"];
                stats = ["min", "pts", "trb", "ast", "per","fga","blk","fta","fgAtRim","war", "gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per", "ewa","war","wOBA","babip","ISO","errors", "fgAtRim", "fgaAtRim", "fgpAtRim", "fgLowPost", "fgaLowPost", "fgpLowPost", "fgMidRange", "fgaMidRange", "fgpMidRange", "tp", "tpa", "tpp","fta","warP","fbp","gbp","babipP","pf","drb","winP","lossP","save","warH"];

                userRoster = player.filter(event.target.result, {
                    attrs: attrs,
                    ratings: ratings,
                    stats: stats,
                    season: g.season,
                    tid: g.userTid,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true
                });
                userRoster = trade.filterUntradable(userRoster);

                for (i = 0; i < userRoster.length; i++) {
                    if (teams[0].pids.indexOf(userRoster[i].pid) >= 0) {
                        userRoster[i].selected = true;
                    } else {
                        userRoster[i].selected = false;
                    }
                }

                playerStore.index("tid").getAll(teams[1].tid).onsuccess = function (event) {
                    var draftPickStore, i, otherRoster, showResigningMsg;

                    otherRoster = player.filter(event.target.result, {
                        attrs: attrs,
                        ratings: ratings,
                        stats: stats,
                        season: g.season,
                        tid: teams[1].tid,
                        showNoStats: true,
                        showRookies: true,
                        fuzz: true
                    });
                    otherRoster = trade.filterUntradable(otherRoster);

                    // If the season is over, can't trade players whose contracts are expired
                    if (g.phase > g.PHASE.PLAYOFFS && g.phase < g.PHASE.FREE_AGENCY) {
                        showResigningMsg = true;
                    } else {
                        showResigningMsg = false;
                    }

                    for (i = 0; i < otherRoster.length; i++) {
                        if (teams[1].pids.indexOf(otherRoster[i].pid) >= 0) {
                            otherRoster[i].selected = true;
                        } else {
                            otherRoster[i].selected = false;
                        }
                    }

                    draftPickStore = g.dbl.transaction("draftPicks").objectStore("draftPicks");

                    draftPickStore.index("tid").getAll(g.userTid).onsuccess = function (event) {
                        var i, userPicks;

                        userPicks = event.target.result;
                        for (i = 0; i < userPicks.length; i++) {
                            userPicks[i].desc = helpers.pickDesc(userPicks[i]);
                        }

                        draftPickStore.index("tid").getAll(teams[1].tid).onsuccess = function (event) {
                            var i, otherPicks;

                            otherPicks = event.target.result;
                            for (i = 0; i < otherPicks.length; i++) {
                                otherPicks[i].desc = helpers.pickDesc(otherPicks[i]);
                            }

                            g.dbl.transaction("teams").objectStore("teams").get(teams[1].tid).onsuccess = function (event) {
                                var t;

                                t = event.target.result;

                                vars = {
                                    salaryCap: g.salaryCap / 1000,
                                    userDpids: teams[0].dpids,
                                    userPicks: userPicks,
                                    userPids: teams[0].pids,
                                    userRoster: userRoster,
                                    otherDpids: teams[1].dpids,
                                    otherPicks: otherPicks,
                                    otherPids: teams[1].pids,
                                    otherRoster: otherRoster,
                                    message: inputs.message,
                                    strategy: t.strategy,
                                    won: t.seasons[t.seasons.length - 1].won,
                                    lost: t.seasons[t.seasons.length - 1].lost,
                                    showResigningMsg: showResigningMsg
                                };

                                updateSummary(vars, function (vars) {
                                    if (vm.teams.length === 0) {
                                        vars.teams = helpers.getTeams(teams[1].tid);
                                        vars.teams.splice(g.userTid, 1); // Can't trade with yourself
                                        vars.userTeamName = g.teamRegionsCache[g.userTid] + " " + g.teamNamesCache[g.userTid];
                                    }

                                    deferred.resolve(vars);
                                });
                            };
                        };
                    };
                };
            };
        });

        return deferred.promise();
    }

    function uiFirst(vm) {
        var rosterCheckboxesOther, rosterCheckboxesUser, tradeable;

//        ui.title("Trade");
        ui.title("Team Player Stats");

        // Don't use the dropdown function because this needs to be a POST
        $("#trade-select-team").change(function (event) {
            // ui.realtimeUpdate currently can't handle a POST request
            Davis.location.replace(new Davis.Request({
                abbrev: $("#trade-select-team").val(),
//                fullPath: helpers.leagueUrl(["trade"]),
                fullPath: helpers.leagueUrl(["teamPlayerStats"]),
                method: "get"
//                method: "post"
            }));
        });

        // This would disable the propose button when it's clicked, but it prevents form submission in Chrome.
        /*$("#propose-trade button").click(function (event) {
            vm.summary.enablePropose(false); // Will be reenabled in updateSummary, if appropriate
        });*/

        rosterCheckboxesUser = $("#roster-user input");
        rosterCheckboxesOther = $("#roster-other input");

        $("#rosters").on("click", "input", function (event) {
            var serialized, teams;

            vm.summary.enablePropose(false); // Will be reenabled in updateSummary, if appropriate
            vm.message("");

            trade.getOtherTid(function (otherTid) {
                var serialized, teams;

                serialized = $("#rosters").serializeArray();

                teams = [
                    {
                        tid: g.userTid,
                        pids: _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "user-pids"; }), "value"), Math.floor),
                        dpids: _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "user-dpids"; }), "value"), Math.floor)
                    },
                    {
                        tid: otherTid,
                        pids: _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "other-pids"; }), "value"), Math.floor),
                        dpids: _.map(_.pluck(_.filter(serialized, function (o) { return o.name === "other-dpids"; }), "value"), Math.floor)
                    }
                ];

                trade.updatePlayers(teams, function (teams) {
                    var vars;

                    vars = {};
                    vars.userPids = teams[0].pids;
                    vars.otherPids = teams[1].pids;
                    vars.userDpids = teams[0].dpids;
                    vars.otherDpids = teams[1].dpids;

                    updateSummary(vars, function (vars) {
                        var found, i, j;

                        komapping.fromJS(vars, mapping, vm);

                        for (i = 0; i < rosterCheckboxesUser.length; i++) {
                            found = false;
                            for (j = 0; j < teams[0].pids.length; j++) {
                                if (Math.floor(rosterCheckboxesUser[i].value) === teams[0].pids[j]) {
                                    rosterCheckboxesUser[i].checked = true;
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                rosterCheckboxesUser[i].checked = false;
                            }
                        }
                        for (i = 0; i < rosterCheckboxesOther.length; i++) {
                            found = false;
                            for (j = 0; j < teams[1].pids.length; j++) {
                                if (Math.floor(rosterCheckboxesOther[i].value) === teams[1].pids[j]) {
                                    rosterCheckboxesOther[i].checked = true;
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                rosterCheckboxesOther[i].checked = false;
                            }
                        }
                    });
                });
            });
        });

        tradeable = function (userOrOther, roster) {
            var playersAndPicks;

            playersAndPicks = _.map(roster, function (p) {
                var checkbox, disabled, selected;

                if (p.selected) {
                    selected = ' checked = "checked"';
                }
                if (p.untradable) {
                    disabled = ' disabled = "disabled"';
                }

//                checkbox = '<input name="' + userOrOther + '-pids" type="checkbox" value="' + p.pid + '" title="' + p.untradableMsg + '"' + selected + disabled + '>';
                checkbox = '';

                return [checkbox, helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.pos, String(p.age), String(p.yearsWithTeam), String(p.ratings.ovr), String(p.ratings.pot), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, String(p.stats.fga), helpers.round(p.stats.fg, 0), helpers.round(p.stats.ft, 0), helpers.round(p.stats.orb, 0), helpers.round(p.stats.blk, 0), helpers.round(p.stats.pts, 0), helpers.round(p.stats.stl, 0), helpers.round(p.stats.tp, 0), helpers.round(p.stats.ast, 0), helpers.round(p.stats.tov, 0), helpers.round(p.stats.ISO, 3), helpers.round(p.stats.babip, 3), helpers.round(p.stats.trb, 3), helpers.round(p.stats.drb, 3), helpers.round(p.stats.ftp, 3), helpers.round(p.stats.tpp, 3), helpers.round(p.stats.wOBA, 3), helpers.round(p.stats.errors, 0),helpers.round(p.stats.warH, 2),helpers.round(p.stats.war, 2),  helpers.round(p.stats.winP, 0),  helpers.round(p.stats.lossP, 0),  helpers.round(p.stats.save, 0), helpers.round(p.stats.fta, 2), helpers.round(p.stats.fgAtRim, 2), helpers.round(p.stats.fgaAtRim, 2), helpers.round(p.stats.fgLowPost, 2), helpers.round(p.stats.babipP, 3), helpers.round(p.stats.gbp, 2),helpers.round(p.stats.fbp, 2), helpers.round(p.stats.pf, 2), helpers.round(p.stats.fgaMidRange, 2), helpers.round(p.stats.warP, 2)];
 //               return [helpers.playerNameLabels(p.pid, p.name, p.injury, p.ratings.skills, p.watch), p.pos, String(p.age), String(p.ratings.ovr), String(p.ratings.pot), helpers.formatCurrency(p.contract.amount, "M") + ' thru ' + p.contract.exp, helpers.round(p.stats.fga, 0), helpers.round(p.stats.blk, 0), helpers.round(p.stats.fta, 0), helpers.round(p.stats.fgAtRim, 2), helpers.round(p.stats.war, 2)];
            });

            return playersAndPicks;
        };

        ko.computed(function () {
            ui.datatableSinglePage($("#roster-user"), 5, tradeable("user", vm.userRoster()),
                                   {aoColumnDefs: [{bSortable: false, aTargets: [0]}]});
        }).extend({throttle: 1});

        ko.computed(function () {
            ui.datatableSinglePage($("#roster-other"), 5, tradeable("other", vm.otherRoster()),
                                   {aoColumnDefs: [{bSortable: false, aTargets: [0]}]});
        }).extend({throttle: 1});

        ui.tableClickableRows($("#roster-user"));
        ui.tableClickableRows($("#roster-other"));
    }

    return bbgmView.init({
        id: "teamPlayerStats",
        get: get,
        post: post,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateTrade],
        uiFirst: uiFirst
    });
});