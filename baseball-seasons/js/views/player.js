/**
 * @name views.player
 * @namespace View a single message.
 */
define(["dao","globals", "ui", "core/freeAgents", "core/player", "lib/faces", "lib/jquery", "lib/knockout", "lib/knockout.mapping", "util/bbgmView", "util/viewHelpers"], function (dao,g, ui, freeAgents, player, faces, $, ko, komapping, bbgmView, viewHelpers) {
    "use strict";

    var mapping;

    function get(req) {
        return {
            pid: req.params.pid !== undefined ? parseInt(req.params.pid, 10) : undefined
        };
    }

    mapping = {
        player: {
            create: function (options) {
                return new function () {
                    komapping.fromJS(options.data, {
                        face: {
                            create: function (options) {
//console.log('mapping');
//console.log(options.data);
                                return ko.observable(options.data);
                            }
                        }
                    }, this);
                }();
            }
        }
    };

    function updatePlayer(inputs, updateEvents, vm) {
        if (updateEvents.indexOf("dbChange") >= 0 || updateEvents.indexOf("firstRun") >= 0 || !vm.retired()) {
            return dao.players.get({
                key: inputs.pid,
                statsSeasons: "all",
                statsPlayoffs: true
            }).then(function (p) {
                var currentRatings;

                p = player.filter(p, {
                    attrs: ["pid", "name", "tid", "abbrev", "teamRegion", "teamName", "pos", "age", "hgtFt", "hgtIn", "weight", "born", "contract", "draft", "face", "mood", "injury", "salaries", "salariesTotal", "awardsGrouped", "freeAgentMood", "imgURL", "watch"],
                    ratings: ["season", "abbrev", "age", "ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills"],
                    stats: ["season", "abbrev", "age", "gp", "gs", "min", "fg", "fga", "fgp", "fgAtRim", "fgaAtRim", "fgpAtRim", "fgLowPost", "fgaLowPost", "fgpLowPost", "fgMidRange", "fgaMidRange", "fgpMidRange", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per", "ewa","winP","lossP","save","ld","fb","gb","gbp","fbp","abP","babip","babipP","war","warS","warH","warHF","warF","warP","wOBA","ISO","errors","fieldAttempts"],
                    playoffs: true,
                    showNoStats: true,
                    showRookies: true,
                    fuzz: true
                });

                // Account for extra free agent demands
                if (p.tid === g.PLAYER.FREE_AGENT) {
                    p.contract.amount = freeAgents.amountWithMood(p.contract.amount, p.freeAgentMood[g.userTid]);
                }

                currentRatings = p.ratings[p.ratings.length - 1];

                return {
                    player: p,
                    currentRatings: currentRatings,
                    showTradeFor: p.tid !== g.userTid && p.tid >= 0,
                    freeAgent: p.tid === g.PLAYER.FREE_AGENT,
                    retired: p.tid === g.PLAYER.RETIRED,
                    showContract: p.tid !== g.PLAYER.UNDRAFTED && p.tid !== g.PLAYER.UNDRAFTED_2 && p.tid !== g.PLAYER.UNDRAFTED_3 && p.tid !== g.PLAYER.UNDRAFTED_FANTASY_TEMP && p.tid !== g.PLAYER.RETIRED,
                    injured: p.injury.type !== "Healthy",
                    godMode: g.godMode							
                };
            });
        }
    }

    function uiFirst(vm) {
        ko.computed(function () {
            ui.title(vm.player.name());
        }).extend({throttle: 1});

        ko.computed(function () {
            var img, pic;

            // If playerImgURL is not an empty string, use it instead of the generated face
            if (vm.player.imgURL()) {
                pic = document.getElementById("picture");
                img = document.createElement("img");
                img.src = vm.player.imgURL();
                img.style.maxHeight = "100%";
                img.style.maxWidth = "100%";
                pic.appendChild(img);
            } else {
                faces.display("picture", vm.player.face());
            }
        }).extend({throttle: 1});

        ui.tableClickableRows($(".table-clickable-rows"));
    }

    return bbgmView.init({
        id: "player",
        get: get,
        mapping: mapping,
        runBefore: [updatePlayer],
        uiFirst: uiFirst
    });
});
