/**
 * @name views.negotiation
 * @namespace Contract negotiation.
 */
define(["dao", "globals", "ui", "core/contractNegotiation", "core/player", "core/team", "lib/knockout", "lib/underscore", "util/bbgmView", "util/helpers"], function (dao, g, ui, contractNegotiation, player, team, ko, _,  bbgmView, helpers) {
    "use strict";

    // Show the negotiations list if there are more ongoing negotiations
    function redirectNegotiationOrRoster(cancelled) {
        dao.negotiations.getAll().then(function (negotiations) {
            if (negotiations.length > 0) {
                ui.realtimeUpdate([], helpers.leagueUrl(["negotiation"]));
            } else if (cancelled) {
                ui.realtimeUpdate([], helpers.leagueUrl(["free_agents"]));
            } else {
                ui.realtimeUpdate([], helpers.leagueUrl(["roster"]));
            }
        });
    }

    function get(req) {
        var pid;

        pid = parseInt(req.params.pid, 10);

        return {
            pid: pid >= 0 ? pid : null // Null will load whatever the active one is
        };
    }

    function post(req) {
        var pid, teamAmountNew, teamYearsNew;

        pid = parseInt(req.params.pid, 10);

        if (req.params.hasOwnProperty("cancel")) {
            contractNegotiation.cancel(pid).then(function () {
                redirectNegotiationOrRoster(true);
            });
        } else if (req.params.hasOwnProperty("accept")) {
            contractNegotiation.accept(pid).then(function (error) {
                if (error !== undefined && error) {
                    helpers.errorNotify(error);
                }
                redirectNegotiationOrRoster(false);
            });
        } else if (req.params.hasOwnProperty("new")) {
            // If there is no active negotiation with this pid, create it
            dao.negotiations.get({key: pid}).then(function (negotiation) {
                if (!negotiation) {
                    contractNegotiation.create(null, pid, false).then(function (error) {
                        if (error !== undefined && error) {
                            helpers.errorNotify(error);
                            ui.realtimeUpdate([], helpers.leagueUrl(["free_agents"]));
                        } else {
                            ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
                        }
                    });
                } else {
                    ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
                }
            });
        } else {
            // Make an offer to the player;
            teamAmountNew = parseInt(req.params.teamAmount , 10);
            teamYearsNew = parseInt(req.params.teamYears, 10);

            // Any NaN?
            if (teamAmountNew !== teamAmountNew || teamYearsNew !== teamYearsNew) {
                ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
            } else {
                contractNegotiation.offer(pid, teamAmountNew, teamYearsNew).then(function () {
                    ui.realtimeUpdate([], helpers.leagueUrl(["negotiation", pid]));
                });
            }
        }
    }

    function updateNegotiation(inputs) {
        // Call getAll so it works on null key
        return dao.negotiations.getAll({key: inputs.pid}).then(function (negotiations) {
            var negotiation;

            if (negotiations.length === 0) {
                return {
                    errorMessage: "No recruiting with player " + inputs.pid + " in progress."
                };
            }

            negotiation = negotiations[0];

            negotiation.player.expiration = negotiation.player.years + g.season;
            // Adjust to account for in-season signings
            if (g.phase <= g.PHASE.AFTER_TRADE_DEADLINE) {
                negotiation.player.expiration -= 1;
            }

            // Can't flatten more because of the return errorMessage above
            return dao.players.get({
                key: negotiation.pid
            }).then(function (p) {
                p = player.filter(p, {
                    attrs: ["pid", "name", "freeAgentMood","age","city","state","age","miles"],
                    ratings: ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills"],
                    season: g.season,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true
                });

				p.miles = helpers.round(p.miles[g.userTid], 0);
                // See views.freeAgents for moods as well
                if (p.freeAgentMood[g.userTid] < 0.25) {
                    p.mood = '<span class="text-success"><b>Eager to play for you.</b></span>';
                } else if (p.freeAgentMood[g.userTid] < 0.5) {
                    p.mood = '<b>Willing to play at your school.</b>';
                } else if (p.freeAgentMood[g.userTid] < 0.75) {
                    p.mood = '<span class="text-warning"><b>Thinks he can do better.</b></span>';
                } else {
                    p.mood = '<span class="text-danger"><b>Thinks playing for your program is a joke.</b></span>';
                }
                delete p.freeAgentMood;

				return dao.players.getAll({
                index: "tid",
                key: g.userTid
				}).then(function (userPlayers) {		
//            }),
			
					return team.filter({
							seasonAttrs: ["cash"],			
							season: g.season
					}).then(function (t) {		
				
						return team.getPayroll(null, g.userTid).get(0).then(function (payroll) {
						    var cash,cashAvailable;
							cash = _.pluck(t, "cash");
							cashAvailable = cash[g.userTid] - payroll  ;
							return {							
								salaryCap: g.salaryCap ,
								cash: cash[g.userTid],
								payroll: payroll ,
								cashAvailable: cashAvailable ,
								numRosterSpots: 13 - userPlayers.length,							
								team: {region: g.teamRegionsCache[g.userTid], name: g.teamNamesCache[g.userTid]},
								player: p,
								negotiation: {
									team: {
										amount: negotiation.team.amount ,
										years: negotiation.team.years
									},
									player: {
										amount: negotiation.player.amount ,
										expiration: negotiation.player.expiration,
										years: negotiation.player.years
									},
									resigning: negotiation.resigning
								}
				//			 })
							 };
							 //}
						 });
					});
				});
					
            });
        });
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title("Recruiting - " + vm.player.name());
        }).extend({throttle: 1});
    }

    return bbgmView.init({
        id: "negotiation",
        get: get,
        post: post,
        runBefore: [updateNegotiation],
        uiFirst: uiFirst
    });
});