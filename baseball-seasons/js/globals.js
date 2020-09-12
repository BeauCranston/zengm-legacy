/**
 * @name globals
 * @namespace Defines the constant portions of g.
 */
define(["lib/knockout"], function (ko) {
    "use strict";

    // The way this works is... any "global" variables that need to be widely available are stored in g. Some of these are constants, like the ones defined below. Some others are dynamic, like the year of the current season, and are stored in the gameAttributes object store. The dynamic components of g are retrieved/updated/synced elsewhere. Yes, it's kind of confusing and arbitrary.

    var g, splitUrl;

    g = {};

    // If any of these things are supposed to change at any point, they should be stored in gameAttributes rather than here.

    g.confs = [{cid: 0, name: "National League"}, {cid: 1, name: "American League"}];
    g.divs = [{did: 0, cid: 0, name: "NL East"}, {did: 1, cid: 0, name: "NL Central"}, {did: 3, cid: 1, name: "AL East"}, {did: 4, cid: 1, name: "AL Central"}, {did: 2, cid: 0, name: "NL West"}, {did: 5, cid: 1, name: "AL West"}];
//    g.salaryCap = 60000;  // [thousands of dollars]
    g.salaryCap = 189000;  // [thousands of dollars]
    g.minPayroll = 50000;  // [thousands of dollars]
//    g.minPayroll = 40000;  // [thousands of dollars]
    g.luxuryPayroll = 189000;  // [thousands of dollars]
    g.luxuryTax = 1.5;
    g.minContract = 500;  // [thousands of dollars]
//    g.maxContract = 20000;  // [thousands of dollars]
    g.maxContract = 1000000;  // [thousands of dollars]
    g.minRosterSize = 25;
//    g.minRosterSize = 10;

    // Constants in all caps
    g.PHASE = {
        FANTASY_DRAFT: -1,
        PRESEASON: 0,
        REGULAR_SEASON: 1,
        AFTER_TRADE_DEADLINE: 2,
        PLAYOFFS: 3,
        BEFORE_DRAFT: 4,
        DRAFT: 5,
        AFTER_DRAFT: 6,
        RESIGN_PLAYERS: 7,
        FREE_AGENCY: 8
    };
    g.PLAYER = {
        FREE_AGENT: -1,
        UNDRAFTED: -2,
        RETIRED: -3,
        UNDRAFTED_2: -4, // Next year's draft class
        UNDRAFTED_3: -5, // Next next year's draft class
        UNDRAFTED_FANTASY_TEMP: -6 // Store current draft class here during fantasy draft
    };

/*    // Web workers - create only if we're not already inside a web worker!
    g.gameSimWorkers = [];
    if (typeof document !== "undefined") {
        for (i = 0; i < 1; i++) {
            g.gameSimWorkers[i] = new Worker("/js/core/gameSimWorker.js");
        }
    }*/

    g.vm = {
        topMenu: {
            lid: ko.observable(),
			godMode: ko.observable(),			
            options: ko.observable([]),
            phaseText: ko.observable(),
            statusText: ko.observable(),
            template: ko.observable(), // Used for left menu on large screens for highlighting active page, so g.vm.topMenu should really be g.vm.menu, since it's used by both
            username: ko.observable(null)
        }
    };

    g.enableLogging = window.enableLogging;

    // .com or .dev TLD
    if (!window.inCordova) {
        splitUrl = window.location.hostname.split(".");
        g.tld = splitUrl[splitUrl.length - 1];
    } else {
        // From within Cordova, window.location.hostname is not set, so always use .com
        g.tld = "com";
    }

	
 

	g.sport = "baseball"; // For account ajax stuff



     // THIS MUST BE ACCURATE OR BAD STUFF WILL HAPPEN

//-    g.notInDb = ["dbm", "dbl", "lid", "confs", "divs", "salaryCap", "minPayroll", "luxuryPayroll", "luxuryTax", "minContract", "maxContract", "minRosterSize", "PHASE", "PLAYER", "gameSimWorkers", "vm", "enableLogging", "tld", "notInDb"];

//+    g.notInDb = ["dbm", "dbl", "lid", "confs", "divs", "salaryCap", "minPayroll", "luxuryPayroll", "luxuryTax", "minContract", "maxContract", "minRosterSize", "PHASE", "PLAYER", "gameSimWorkers", "vm", "enableLogging", "tld", "sport", "notInDb"];

	
    // THIS MUST BE ACCURATE OR BAD STUFF WILL HAPPEN
    g.notInDb = ["dbm", "dbl", "lid", "confs", "divs", "salaryCap", "minPayroll", "luxuryPayroll", "luxuryTax", "minContract", "maxContract", "minRosterSize", "PHASE", "PLAYER", "gameSimWorkers", "vm", "enableLogging", "tld", "notInDb","sport"];
//    g.notInDb = ["dbm", "dbl", "lid", "confs", "divs", "salaryCap", "minPayroll", "luxuryPayroll", "luxuryTax", "minContract", "maxContract", "minRosterSize", "PHASE", "PLAYER", "gameSimWorkers", "vm", "enableLogging", "tld", "sport", "notInDb"];

    return g;
});