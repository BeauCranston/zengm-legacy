// @flow

import {g} from '../../common';
import {idb} from '../db';
import type {UpdateEvents} from '../../common/types';

async function updateTeams(
    inputs: {season: number},
    updateEvents: UpdateEvents,
    state: any,
): void | {[key: string]: any} {
    if ((inputs.season === g.season && (updateEvents.includes('gameSim') || updateEvents.includes('playerMovement'))) || inputs.season !== state.season) {
        const teams = await idb.getCopies.teamsPlus({
            attrs: ["tid", "abbrev"],
            seasonAttrs: ["won", "lost"],
            stats: ["gp", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "ba", "pf", "pts", "oppPts", "diff","fgLowPost","fgaLowPost","fgMidRange","oppJM","oppTw","oppInh","kda","scTwr","scKills",'grExpTwr','grExpKills','grGldTwr','grGldKills','tmBuffTwr','tmBuffKills','tmBAdjTwr','tmBAdjKills',
				'TPTwr',
				'TPKills',
				'TwTwr',
				'CKKills',
				'CSTwr',
				'CSKills',
				'AgTwr',
				'AgKills',
				'ChmpnTwr',				
				'ChmpnKills',	
				'oppPts',"oppJM","oppTw","oppInh",
				'riftKills','riftAssists','firstBlood',
			],
            season: inputs.season,
        });

        // Sort stats so we can determine what percentile our team is in.
        const stats = {};
        const statTypes = ['won', 'lost', 'fg', 'fga', 'fgp', 'tp', 'tpa', 'tpp', 'ft', 'fta', 'ftp', 'orb', 'drb', 'trb', 'ast', 'tov', 'stl', 'blk', 'ba', 'pf', 'pts', 'oppPts', 'diff',"fgLowPost","fgaLowPost","fgMidRange","kda","scTwr","scKills",'grExpTwr','grExpKills','grGldTwr','grGldKills','tmBuffTwr','tmBuffKills','tmBAdjTwr','tmBAdjKills',
				'TPTwr',
				'TPKills',
				'TwTwr',
				'CKKills',
				'CSTwr',
				'CSKills',
				'AgTwr',
				'AgKills',
				'ChmpnTwr',				
				'ChmpnKills',
				'oppPts',"oppJM","oppTw","oppInh",
				'riftKills','riftAssists','firstBlood',				
		];
        const lowerIsBetter = ['lost', 'fga', 'fta','tpa', 'oppPts',"oppTw","oppInh"];

        // Loop teams and stat types.
        for (const t of teams) {
            for (const statType of statTypes) {
                const value = t.stats.hasOwnProperty(statType) ? t.stats[statType] : t.seasonAttrs[statType];

                if (!stats[statType]) {
                    stats[statType] = [value];
                } else {
                    stats[statType].push(value);
                }
            }
        }

        // Sort stat types. "Better" values are at the start of the arrays.
        for (const statType of Object.keys(stats)) {
            stats[statType].sort((a, b) => {
                // Sort lowest first.
                if (lowerIsBetter.includes(statType)) {
                    if (a < b) {
                        return -1;
                    } else if (a > b) {
                        return 1;
                    }

                    return 0;
                }

                // Sort highest first.
                if (a < b) {
                    return 1;
                } else if (a > b) {
                    return -1;
                }

                return 0;
            });
        }

        return {
            season: inputs.season,
            stats,
            teams,
        };
    }
}

export default {
    runBefore: [updateTeams],
};
