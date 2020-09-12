import React from 'react';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import {PLAYER, helpers} from '../../common';
import {getCols, realtimeUpdate, setTitle, toWorker} from '../util';
import {DataTable, Dropdown, NewWindowLink, PlayerNameLabels} from '../components';

class WatchList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clearing: false,
        };
        this.clearWatchList = this.clearWatchList.bind(this);
    }

    async clearWatchList() {
        this.setState({
            clearing: true,
        });

        await toWorker('clearWatchList');
        realtimeUpdate(["clearWatchList"]);

        this.setState({
            clearing: false,
        });
    }

    render() {
        const {players, playoffs, statType} = this.props;

        setTitle('Watch List');

        const cols = getCols('Name', 'Pos', 'Age', 'Region', 'Team', 'Ovr', 'Pot', 'Contract', 'GP', 'Min', 'K', 'D', 'A', 'KDA','CS');

        // Number of decimals for many stats
        const d = statType === "totals" ? 0 : 1;

        const rows = players.map(p => {
            let contract;
            if (p.tid === PLAYER.RETIRED) {
                contract = "Retired";
            } else if (p.tid === PLAYER.UNDRAFTED || p.tid === PLAYER.UNDRAFTED_2 || p.tid === PLAYER.UNDRAFTED_3) {
                contract = `${p.draft.year} Draft Prospect`;
            } else {
                contract = `${helpers.formatCurrency(p.contract.amount, "M")} thru ${p.contract.exp}`;
            }

            return {
                key: p.pid,
                data: [
                    <PlayerNameLabels injury={p.injury} pid={p.pid} skills={p.ratings.skills} watch={p.watch}>{p.name}</PlayerNameLabels>,
                    p.ratings.pos,
                    p.age,
                    p.born.loc,					
                    <a href={helpers.leagueUrl(["roster", p.abbrev])}>{p.abbrev}</a>,
                    p.ratings.ovr,
                    p.ratings.pot,
                    contract,
                    p.stats.gp,
                    p.stats.min.toFixed(d),
                    p.stats.fg.toFixed(d),
                    p.stats.fga.toFixed(d),
                    p.stats.fgp.toFixed(d),
                    p.stats.kda.toFixed(d),
                    p.stats.tp.toFixed(d),
                ],
            };
        });

        return <div>
            <Dropdown view="watch_list" fields={['statTypes', 'playoffs']} values={[statType, playoffs]} />
            <div className="pull-right">
                <DropdownButton id="dropdown-other-reports" title="Other Reports">
                    <MenuItem href={helpers.leagueUrl(['player_stats', 'watch'])}>Player Stats</MenuItem>
                    <MenuItem href={helpers.leagueUrl(['player_ratings', 'watch'])}>Player Ratings</MenuItem>
                </DropdownButton>
            </div>
            <h1>Watch List <NewWindowLink /></h1>

            <p>Click the watch icon <span className="glyphicon glyphicon-flag" /> next to a player's name to add or remove him from this list.</p>

            <button className="btn btn-danger" disabled={this.state.clearing} onClick={this.clearWatchList}>Clear Watch List</button>

            <p className="clearfix" />

            <DataTable
                cols={cols}
                defaultSort={[0, 'asc']}
                name="WatchList"
                pagination
                rows={rows}
            />
        </div>;
    }
}

WatchList.propTypes = {
    players: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    playoffs: React.PropTypes.oneOf(['playoffs', 'regularSeason']).isRequired,
    statType: React.PropTypes.oneOf(['per36', 'perGame', 'totals']).isRequired,
};

export default WatchList;
