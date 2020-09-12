/**
 * @name api
 * @namespace Functions called directly in response to user action (clicking a button, etc).
 */
define(["dao", "db", "globals", "ui", "core/freeAgents", "core/game", "core/league", "core/season", "lib/jquery"], function (dao, db, g, ui, freeAgents, game, league, season, $) {
    "use strict";

    function play(amount) {
        var numDays;

        if (['day', 'week', 'month', 'throughPlayoffs', 'throughPlayoffs64', "untilPreseason"].indexOf(amount) >= 0) {
            if (amount === "day") {
                numDays = 1;
            } else if (amount === "week") {
                numDays = 7;
            } else if (amount === "month") {
                numDays = 30;
            } else if (amount === "throughPlayoffs") {
                numDays = 100;  // There aren't 100 days in the playoffs, so 100 will cover all the games and the sim stops when the playoffs end
            } else if (amount === "throughPlayoffs64") {
                numDays = 100;  // There aren't 100 days in the playoffs, so 100 will cover all the games and the sim stops when the playoffs end
            } else if (amount === "untilPreseason") {
					console.log(numDays);
					console.log(g.daysLeft);
                numDays = g.daysLeft;
            }

//            if (g.phase <= g.PHASE.PLAYOFFS) {
			// below didn't work, may not know what it means
            if (g.phase <= g.PHASE.PLAYOFFS64) {
		//	console.log("playing numdays: "+numDays);
                ui.updateStatus("Playing..."); // For quick UI updating, before game.play
                // Start playing games
                game.play(numDays);
            } else if (g.phase === g.PHASE.FREE_AGENCY) {
                if (numDays > g.daysLeft) {
					console.log(numDays);
					console.log(g.daysLeft);
					
                    numDays = g.daysLeft;
                }
                freeAgents.play(numDays);
            }
        } else if (amount === "untilPlayoffs") {
//            if (g.phase < g.PHASE.PLAYOFFS) {
            if (g.phase < g.PHASE.PLAYOFFS64) {
			    
                ui.updateStatus("Playing..."); // For quick UI updating, before game.play
                season.getDaysLeftSchedule().then(game.play);
            }
        } else if (amount === "stop") {
            league.setGameAttributes({stopGames: true}).then(function () {
                if (g.phase !== g.PHASE.FREE_AGENCY) {
                    // This is needed because we can't be sure if core.game.play will be called again
//                    ui.updateStatus("Idle");
                    ui.updateStatus("Idle");
                }
                league.setGameAttributes({gamesInProgress: false}).then(ui.updatePlayMenu);
            });
        } else if (amount === "viewPlaysoff64") {
		
		    console.log("viewPlaysoff64");
            if (g.phase === g.BEFORE_PLAYOFFS64) {
                season.newPhase(g.PHASE.PLAYOFFS64);
            }
		
          /////  if (g.phase === g.PHASE.PLAYOFFS64) {
                //season.newPhase(g.PHASE.DRAFT);
           /* if (g.phase < g.PHASE.PLAYOFFS64) {
                ui.updateStatus("Playing..."); // For quick UI updating, before game.play
                season.getDaysLeftSchedule().then(game.play);
            }*/				
////            }
        } else if (amount === "untilDraft") {
            if (g.phase === g.PHASE.BEFORE_DRAFT) {
                season.newPhase(g.PHASE.DRAFT);
            }
        } else if (amount === "untilResignPlayers") {
            if (g.phase === g.PHASE.AFTER_DRAFT) {
                season.newPhase(g.PHASE.RESIGN_PLAYERS);
            }
        } else if (amount === "untilFreeAgency") {

		         console.log("start g.daysLeft "+g.daysLeft);
                            ui.updateStatus("Loading recruits...");
			////	numdays = 30;
				g.daysLeft = 30;
          ////  if (g.phase === g.PHASE.RESIGN_PLAYERS) {
          ////     dao.negotiations.count().then(function (numRemaining) {
                    // Show warning dialog only if there are players remaining un-re-signed
         ////           if (numRemaining === 0 || window.confirm("Are you sure you want to proceed to free agency while " + numRemaining + " of your players remain unsigned? If you do not re-sign them before free agency begins, they will be free to sign with any team, and you won't be able to go over the salary cap to sign them.")) {
                        season.newPhase(g.PHASE.FREE_AGENCY).then(function () {
		       //  console.log("during g.daysLeft "+g.daysLeft);
						
                            ui.updateStatus(g.daysLeft + " days left");
                        });
           ////         }
           ////     });
          ////  }
        } else if (amount === "untilRegularSeason") {
            if (g.phase === g.PHASE.PRESEASON) {
                season.newPhase(g.PHASE.REGULAR_SEASON);
            }
        }

        // Close the menu
        $("#play-menu .dropdown-toggle").dropdown("toggle");
    }

    return {
        play: play
    };
});