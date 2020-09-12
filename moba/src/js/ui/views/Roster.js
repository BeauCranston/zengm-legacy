import classNames from 'classnames';
import React from 'react';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import {SortableContainer, SortableElement, SortableHandle, arrayMove} from 'react-sortable-hoc';
import {PHASE, g, helpers} from '../../common';
import {logEvent, realtimeUpdate, setTitle, toWorker} from '../util';
import {Dropdown, HelpPopover, NewWindowLink, PlayerNameLabels, RatingWithChange, RecordAndPlayoffs} from '../components';
import clickable from '../wrappers/clickable';

const ptStyles = {
    0: {
        backgroundColor: '#a00',
        color: '#fff',
    },
    0.75: {
        backgroundColor: '#ff0',
        color: '#000',
    },
    1: {
        backgroundColor: '#ccc',
        color: '#000',
    },
    1.25: {
        backgroundColor: '#0f0',
        color: '#000',
    },
    1.75: {
        backgroundColor: '#070',
        color: '#fff',
    },
};

const handleAutoSort = async () => {
    await toWorker('autoSortRoster');

    realtimeUpdate(["playerMovement"]);
};

const handleRelease = async p => {
    // If a player was just drafted by his current team and the regular season hasn't started, then he can be released without paying anything
    const justDrafted = p.tid === p.draft.tid && ((p.draft.year === g.season && g.phase >= g.PHASE.DRAFT) || (p.draft.year === g.season - 1 && g.phase < g.PHASE.REGULAR_SEASON));

    let releaseMessage;
    if (justDrafted) {
        releaseMessage = `Are you sure you want to release ${p.name}?  He will become a free agent and no longer take up a roster spot on your team. Because you just drafted him and the regular season has not started yet, you will not have to pay his contract.`;
    } else {
        releaseMessage = `Are you sure you want to release ${p.name}?  He will become a free agent and no longer take up a roster spot on your team, but you will still have to pay his salary (and have it count against the salary cap) until his contract expires in ${p.contract.exp}.`;
    }

    if (window.confirm(releaseMessage)) {
        const errorMsg = await toWorker('releasePlayer', p.pid, justDrafted);
        if (errorMsg) {
            logEvent({
                type: 'error',
                text: errorMsg,
                saveToDb: false,
            });
        } else {
            realtimeUpdate(["playerMovement"]);
        }
    }
};

const handlePtChange = async (p, event) => {
    const ptModifier = parseFloat(event.target.value);

    if (isNaN(ptModifier)) {
        return;
    }

    // NEVER UPDATE AI TEAMS
    // This shouldn't be necessary, but just in case...
    if (p.tid !== g.userTid) {
        return;
    }

    await toWorker('updatePlayingTime', p.pid, ptModifier);

    realtimeUpdate(["playerMovement"]);
};

const PlayingTime = ({p}) => {
    const ptModifiers = [
        {text: "0", ptModifier: "0"},
        {text: "-", ptModifier: "0.75"},
        {text: " ", ptModifier: "1"},
        {text: "+", ptModifier: "1.25"},
        {text: "++", ptModifier: "1.75"},
    ];

    return <select
        className="form-control pt-modifier-select"
        value={p.ptModifier}
        onChange={event => handlePtChange(p, event)}
        style={ptStyles[String(p.ptModifier)]}
    >
        {ptModifiers.map(({text, ptModifier}) => {
            return <option key={ptModifier} value={ptModifier}>{text}</option>;
        })}
    </select>;
};

PlayingTime.propTypes = {
    p: React.PropTypes.object.isRequired,
};

const ReorderHandle = SortableHandle(({i, pid, selectedPid}) => {
    let backgroundColor = 'rgb(91, 192, 222)';
    if (selectedPid === pid) {
        backgroundColor = '#d9534f';
    } else if (selectedPid !== undefined) {
        if (i <= 4) {
            backgroundColor = 'rgba(66, 139, 202, 0.6)';
        } else {
            backgroundColor = 'rgba(91, 192, 222, 0.6)';
        }
    } else if (i <= 4) {
        backgroundColor = 'rgb(66, 139, 202)';
    }

    return <td className="roster-handle" style={{backgroundColor}} />;
});

ReorderHandle.propTypes = {
    i: React.PropTypes.number.isRequired,
    pid: React.PropTypes.number.isRequired,
    selectedPid: React.PropTypes.number,
};

const RosterRow = SortableElement(clickable(props => {
    const {clicked, editable, i, p, season, selectedPid, showTradeFor, toggleClicked} = props;
    return <tr
        key={p.pid}
        className={classNames({separator: i === 4, warning: clicked})}
        data-pid={p.pid}
    >
        {editable ? <ReorderHandle i={i} pid={p.pid} selectedPid={selectedPid} /> : null}

        <td onClick={toggleClicked}>
            <PlayerNameLabels
                pid={p.pid}
                injury={p.injury}
                skills={p.ratings.skills}
                watch={p.watch}
            >{p.name}</PlayerNameLabels>
        </td>
        <td onClick={toggleClicked}>{p.ratings.pos}</td>
        <td onClick={toggleClicked}>{p.age}</td>
        <td onClick={toggleClicked}>{p.born.loc}</td>
        <td onClick={toggleClicked}>{p.stats.yearsWithTeam}</td>
        <td onClick={toggleClicked}>{p.ratings.MMR}</td>
        <td onClick={toggleClicked}>
            <RatingWithChange change={p.ratings.dovr}>{p.ratings.ovr}</RatingWithChange>
        </td>
        <td onClick={toggleClicked}>
            <RatingWithChange change={p.ratings.dpot}>{p.ratings.pot}</RatingWithChange>
        </td>
        {season === g.season ? <td>
            {helpers.formatCurrency(p.contract.amount, 'K')} thru {p.contract.exp}
        </td> : null}
        <td onClick={toggleClicked}>{p.stats.gp}</td>
        <td onClick={toggleClicked}>{p.stats.min.toFixed(1)}</td>
        <td onClick={toggleClicked}>{p.stats.kda.toFixed(1)}</td>
        <td onClick={toggleClicked}>{p.stats.trb.toFixed(1)}</td>
        {editable ? <td onClick={toggleClicked}>
            <button
                className="btn btn-default btn-xs"
                disabled={!p.canRelease}
                onClick={() => handleRelease(p)}
            >
                Release
            </button>
        </td> : null}
        {showTradeFor ? <td onClick={toggleClicked} title={p.untradableMsg}>
            <button
                className="btn btn-default btn-xs"
                disabled={p.untradable}
                onClick={() => toWorker('actions.tradeFor', {pid: p.pid})}
            >Trade For</button>
        </td> : null}
        <td onClick={toggleClicked}>{p.ratings.languagesGrouped}</td>
        <td onClick={toggleClicked}>{p.born.country}</td>
    </tr>;
}));

RosterRow.propTypes = {
    editable: React.PropTypes.bool.isRequired,
    i: React.PropTypes.number.isRequired,
    p: React.PropTypes.object.isRequired,
    season: React.PropTypes.number.isRequired,
    selectedPid: React.PropTypes.number,
    showTradeFor: React.PropTypes.bool.isRequired,
};

const TBody = SortableContainer(({editable, players, season, selectedPid, showTradeFor}) => {
    return <tbody id="roster-tbody">
        {players.map((p, i) => {
            return <RosterRow
                key={p.pid}
                editable={editable}
                i={i}
                index={i}
                p={p}
                season={season}
                selectedPid={selectedPid}
                showTradeFor={showTradeFor}
            />;
        })}
    </tbody>;
});

TBody.propTypes = {
    editable: React.PropTypes.bool.isRequired,
    players: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    season: React.PropTypes.number.isRequired,
    selectedPid: React.PropTypes.number,
    showTradeFor: React.PropTypes.bool.isRequired,
};

// Ideally, this function wouldn't be necessary https://github.com/clauderic/react-sortable-hoc/issues/175
const onSortStart = ({clonedNode, node}) => {
    const clonedChildren = clonedNode.childNodes;
    const children = node.childNodes;
    for (let i = 0; i < children.length; i++) {
        clonedChildren[i].style.padding = '5px';
        clonedChildren[i].style.width = `${children[i].offsetWidth}px`;
    }
};

class Roster extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedPid: undefined,
            sortedPids: undefined,
        };

        this.handleReorderDrag = this.handleReorderDrag.bind(this);
    }

    async handleReorderDrag({oldIndex, newIndex}) {
        const pids = this.props.players.map((p) => p.pid);
        const sortedPids = arrayMove(pids, oldIndex, newIndex);
        this.setState({
            sortedPids,
        });
        await toWorker('reorderRosterDrag', sortedPids);
        realtimeUpdate(['playerMovement']);
    }

    componentWillReceiveProps() {
        this.setState({
            sortedPids: undefined,
        });
    }

    render() {
        const {abbrev, editable, payroll, players, salaryCap, season, showTradeFor, t, godMode, maxRosterSize} = this.props;

        setTitle(`${t.region} Roster - ${season}`);

        const logoStyle = {};
        if (t.imgURL) {
            logoStyle.display = "inline";
            logoStyle.backgroundImage = `url('${t.imgURL}')`;
        }

        const countryStyle = {};
        if (t.imgURLCountry) {
            countryStyle.display = "inline";
            countryStyle.backgroundImage = `url('${t.imgURLCountry}')`;
        }

        // Use the result of drag and drop to sort players, before the "official" order comes back as props
        let playersSorted;
        if (this.state.sortedPids !== undefined) {
            playersSorted = this.state.sortedPids.map((pid) => {
                return players.find((p) => p.pid === pid);
            });
        } else {
            playersSorted = players;
        }

        return <div>
            <Dropdown view="roster" fields={["teams", "seasons"]} values={[abbrev, season]} />
            <div className="pull-right">
                <DropdownButton id="dropdown-more-info" title="More Info">
                    <MenuItem href={helpers.leagueUrl(['player_stats', abbrev, season])}>Player Stats</MenuItem>
                    <MenuItem href={helpers.leagueUrl(['player_ratings', abbrev, season])}>Player Ratings</MenuItem>
                </DropdownButton>
            </div>

            <h1>{t.region} Roster <NewWindowLink /></h1>
            <p>More: <a href={helpers.leagueUrl(['team_finances', abbrev])}>Finances</a> | <a href={helpers.leagueUrl(['game_log', abbrev, season])}>Game Log</a> | <a href={helpers.leagueUrl(['team_history', abbrev])}>History</a> | <a href={helpers.leagueUrl(['transactions', abbrev])}>Transactions</a></p>
            <div className="team-picture" style={logoStyle} />
            <div className="team-picture" style={countryStyle} />

            <div>
                <h3>
                    Record: <RecordAndPlayoffs
                        abbrev={abbrev}
                        season={season}
                        wonSpring={t.seasonAttrs.wonSpring}
                        lostSpring={t.seasonAttrs.lostSpring}
						levelStart={t.seasonAttrs.levelStart}
						levelMid={t.seasonAttrs.levelMid}
                        won={t.seasonAttrs.wonSummer}
                        lost={t.seasonAttrs.lostSummer}
                        playoffRoundsWon={t.seasonAttrs.playoffRoundsWon}
						playoffRoundsWonWorldsGr={t.seasonAttrs.playoffRoundsWonWorldsGr}
                        option="noSeason"
                    />

                </h3>

				Region:   {t.country} <br />
				Country:  {t.countrySpecific}


                {season === g.season ? <p>
                    {maxRosterSize - players.length} open roster spots<br />
                    Payroll: {helpers.formatCurrency(payroll, 'K')}<br />
                    Profit: {helpers.formatCurrency(t.seasonAttrs.profit, 'K')}<br />
					{godMode ? <div><a href={helpers.leagueUrl(['customize_team', t.tid])} className="god-mode god-mode-text">Edit Team</a><br /></div> : null}<br />

                </p> : null}

            </div>
            {editable ? <p>Drag row handles to move players between the starting lineup (<span className="roster-starter">&#9632;</span>) and the bench (<span className="roster-bench">&#9632;</span>).</p> : null}
            {editable ? <p><button className="btn btn-default" onClick={handleAutoSort}>Auto sort roster</button>
            </p> : null}

            <div className="table-responsive">
                <table className="table table-striped table-bordered table-condensed table-hover">
                    <thead>
                        <tr>
                            {editable ? <th /> : null}
                            <th>Name</th>
                            <th title="Position">Pos</th>
                            <th>Age</th>
                            <th>Region</th>
                            <th title="Years With Team">YWT</th>
							<th title="Ranked Match Making Rating">MMR</th>
                            <th title="Overall Rating">Ovr</th>
                            <th title="Potential Rating">Pot</th>
                            {season === g.season ? <th>Contract</th> : null}
                            <th title="Games Played">GP</th>
                            <th title="Minutes Per Game">Min</th>
							<th title="(Kills + Assists) / Deaths">KDA</th>
							<th title="Gold in thousands">G(k)</th>
                            {editable ? <th>Release <HelpPopover placement="left" title="Release Player">
                                <p>To free up a roster spot, you can release a player from your team. You will still have to pay his salary (and have it count against the salary cap) until his contract expires (you can view your released players' contracts in your <a href={helpers.leagueUrl(["team_finances"])}>Team Finances</a>).</p>
                                <p>However, if you just drafted a player and the regular season has not started yet, his contract is not guaranteed and you can release him for free.</p>
                            </HelpPopover></th> : null}
                            {showTradeFor ? <th>Trade For</th> : null}
							<th title="Languages Fluent In">Languages</th>
							<th title="Country Born">Country</th>
                        </tr>
                    </thead>
                    <TBody
                        players={playersSorted}
                        editable={editable}
                        onSortEnd={this.handleReorderDrag}
                        onSortStart={onSortStart}
                        season={season}
                        selectedPid={this.state.selectedPid}
                        showTradeFor={showTradeFor}
                        transitionDuration={0}
                        useDragHandle
                    />
                </table>
            </div>
        </div>;
    }
}

Roster.propTypes = {
    abbrev: React.PropTypes.string.isRequired,
    editable: React.PropTypes.bool.isRequired,
    payroll: React.PropTypes.number,
    players: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    salaryCap: React.PropTypes.number.isRequired,
    season: React.PropTypes.number.isRequired,
    showTradeFor: React.PropTypes.bool.isRequired,
    t: React.PropTypes.object.isRequired,
    godMode: React.PropTypes.bool.isRequired,
    maxRosterSize: React.PropTypes.number.isRequired,
};

export default Roster;
