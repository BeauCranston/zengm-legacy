import classNames from 'classnames';
import React from 'react';
import {helpers} from '../../common';
import {NewWindowLink} from '../components';
import {logEvent, realtimeUpdate, setTitle, toWorker} from '../util';

// Show the negotiations list if there are more ongoing negotiations
async function redirectNegotiationOrRoster(cancelled) {
    const count = await toWorker('countNegotiations');
    if (count > 0) {
        realtimeUpdate([], helpers.leagueUrl(["negotiation"]));
    } else if (cancelled) {
        realtimeUpdate([], helpers.leagueUrl(["free_agents"]));
    } else {
        realtimeUpdate([], helpers.leagueUrl(["roster"]));
    }
}

const cancel = async pid => {
    await toWorker('cancelContractNegotiation', pid);
    redirectNegotiationOrRoster(true);
};

const sign = async (pid, amount, exp) => {
    const errorMsg = await toWorker('acceptContractNegotiation', pid, Math.round(amount * 1000), exp);
    if (errorMsg !== undefined && errorMsg) {
        logEvent({
            type: 'error',
            text: errorMsg,
            saveToDb: false,
        });
    }
    redirectNegotiationOrRoster(false);
};

const Negotiation = ({contractOptions, errorMessage, payroll, player = {}, resigning, salaryCap, userTid}) => {
    setTitle(`Contract Negotiation - ${player.name}`);

    if (errorMessage) {
        return <div>
            <h1>Error</h1>
            <p>{errorMessage}</p>
        </div>;
    }

    // See views.freeAgents for moods as well
    let mood;
    if (player.freeAgentMood[userTid] < 0.5) {
        mood = <span className="text-success"><b>Eager to reach an agreement.</b></span>;
    } else if (player.freeAgentMood[userTid] < 1.0) {
        mood = <b>Willing to sign for the right price.</b>;
    } else if (player.freeAgentMood[userTid] < 1.5) {
        mood = <span className="text-warning"><b>Annoyed at you.</b></span>;
    } else {
        mood = <span className="text-danger"><b>Insulted by your presence.</b></span>;
    }

    let message;
    if (resigning) {
        message = <p>You are allowed to go over the salary cap to make this deal because you are re-signing <a href={helpers.leagueUrl(['player', player.pid])}>{player.name}</a> to a contract extension. <b>If you do not come to an agreement here, <a href={helpers.leagueUrl(['player', player.pid])}>{player.name}</a> will become a free agent.</b> He will then be able to sign with any team, and you won't be able to go over the salary cap to sign him.</p>;
    } else {
        message = <p>You are not allowed to go over the salary cap to make this deal because <a href={helpers.leagueUrl(['player', player.pid])}>{player.name}</a> is a free agent.</p>;
    }

    return <div>
        <h1>Contract Negotiation <NewWindowLink /></h1>

        {message}

        <p>
            Current Payroll: {helpers.formatCurrency(payroll, 'K')}<br />
        </p>

        <h2> <a href={helpers.leagueUrl(['player', player.pid])}>{player.name}</a> <NewWindowLink parts={['player', player.pid]} /></h2>
        <p>
            Mood: {mood}<br />
            {player.age} years old; Overall: {player.ratings.ovr}; Potential: {player.ratings.pot}
        </p>

        <h3>Contract Options</h3>

        <div className="row">
            <div className="col-sm-8 col-md-6">
                <div className="list-group">
                    {contractOptions.map((contract, i) => {
                        return <div key={i} className={classNames('list-group-item', {'list-group-item-success': contract.smallestAmount})} style={{height: '54px'}}>
                            <div className="pull-left" style={{paddingTop: '8px'}}>
                                ${contract.amount.toFixed(2)}K per year<span className="hidden-xs">, through {contract.exp}</span> ({contract.years} {contract.years === 1 ? 'season' : 'seasons'})
                            </div>

                            <button
                                className="btn btn-success pull-right"
                                onClick={() => sign(player.pid, contract.amount, contract.exp)}
                            >
                                Sign<span className="hidden-xs"> Contract</span>
                            </button>
                        </div>;
                    })}
                </div>
            </div>
        </div>

        <button className="btn btn-danger" onClick={() => cancel(player.pid)}>
            Can't reach a deal? End negotiation
        </button>
    </div>;
};

Negotiation.propTypes = {
    contractOptions: React.PropTypes.arrayOf(React.PropTypes.shape({
        smallestAmount: React.PropTypes.bool.isRequired,
        amount: React.PropTypes.number.isRequired,
        years: React.PropTypes.number.isRequired,
        exp: React.PropTypes.number.isRequired,
    })),
    errorMessage: React.PropTypes.string,
    payroll: React.PropTypes.number,
    player: React.PropTypes.object,
    resigning: React.PropTypes.bool,
    salaryCap: React.PropTypes.number,
    userTid: React.PropTypes.number,
};

export default Negotiation;
