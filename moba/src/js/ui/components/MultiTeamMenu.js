// @flow

import React from 'react';
import {g} from '../../common';
import {emitter, realtimeUpdate, toWorker} from '../util';

const handleChange = async (e: SyntheticInputEvent) => {
    const userTid = parseInt(e.target.value, 10);
    await toWorker('updateGameAttributes', {userTid});

    // firstRun is kind of a hack, but it should update everything
    realtimeUpdate(['firstRun']);
    emitter.emit('updateMultiTeam');
};

type Props = {
    userTid: number,
    userTids: number[],
};

class MultiTeamMenu extends React.Component {
    props: Props;

    shouldComponentUpdate(nextProps: Props) {
        return this.props.userTid !== nextProps.userTid || JSON.stringify(this.props.userTids) !== JSON.stringify(nextProps.userTids);
    }

    render() {
        const {userTid, userTids} = this.props;

        // Hide if not multi team or not loaded yet
        if (userTids.length <= 1) {
            return null;
        }

        return <div className="multi-team-menu">
            <label htmlFor="multi-team-select">Currently controlling:</label><br />
            <select className="form-control" id="multi-team-select" onChange={handleChange} value={userTid}>
                {userTids.map((tid, i) => <option key={tid} value={tid}>
                    {g.teamRegionsCache[userTids[i]]}
                </option>)}
            </select>
        </div>;
    }
}

MultiTeamMenu.propTypes = {
    userTid: React.PropTypes.number.isRequired,
    userTids: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
};

export default MultiTeamMenu;
