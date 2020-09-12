import React from 'react';
import {helpers} from '../../common';
import {getCols, setTitle} from '../util';
import {DataTable, Dropdown, NewWindowLink, PlayerNameLabels} from '../components';

const UpcomingFreeAgents = ({players, season}) => {
    setTitle('Upcoming Free Agents');

    const cols = getCols('Name', 'Pos', 'Team', 'Age','Region','MMR', 'Ovr', 'Pot', 'Min', 'K', 'D', 'A', 'KDA', 'CS', 'Current Contract', 'Desired Contract');

    const rows = players.map(p => {
        return {
            key: p.pid,
            data: [
                <PlayerNameLabels
                    injury={p.injury}
                    pid={p.pid}
                    skills={p.ratings.skills}
                    watch={p.watch}
                >{p.name}</PlayerNameLabels>,
                p.ratings.pos,
                <a href={helpers.leagueUrl(['roster', p.abbrev])}>{p.abbrev}</a>,
                p.age,
                p.born.loc,				
                p.ratings.MMR,
                p.ratings.ovr,
                p.ratings.pot,
                p.stats.min.toFixed(1),
                p.stats.fg.toFixed(1),
                p.stats.fga.toFixed(1),
                p.stats.fgp.toFixed(1),
                p.stats.kda.toFixed(1),
                p.stats.tp.toFixed(1),
                <span>{helpers.formatCurrency(p.contract.amount, 'K')} thru {p.contract.exp}</span>,
                <span>{helpers.formatCurrency(p.contractDesired.amount, 'K')} thru {p.contractDesired.exp}</span>,
            ],
        };
    });

    return <div>
        <Dropdown view="upcoming_free_agents" fields={["seasonsUpcoming"]} values={[season]} />
        <h1>Upcoming Free Agents <NewWindowLink /></h1>
        <p>More: <a href={helpers.leagueUrl(['free_agents'])}>Current Free Agents</a></p>

        <p>Keep in mind that many of these players will choose to re-sign with their current team rather than become free agents.</p>

        <DataTable
            cols={cols}
            defaultSort={[3, 'desc']}
            name="UpcomingFreeAgents"
            rows={rows}
            pagination
        />
    </div>;
};

UpcomingFreeAgents.propTypes = {
    players: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    season: React.PropTypes.number.isRequired,
};

export default UpcomingFreeAgents;
