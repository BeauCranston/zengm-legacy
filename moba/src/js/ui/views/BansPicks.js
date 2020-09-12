import classNames from 'classnames';
import React from 'react';
import {helpers} from '../../common';
import {emitter, logEvent, realtimeUpdate, setTitle, toWorker} from '../util';
import {HelpPopover, NewWindowLink} from '../components';

class GodMode extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dirty: false,
            disableInjuries: String(props.disableInjuries),
            luxuryPayroll: props.luxuryPayroll,
            luxuryTax: props.luxuryTax,
            maxContract: props.maxContract,
            minContract: props.minContract,
            minPayroll: props.minPayroll,
            minRosterSize: props.minRosterSize,
            numGames: props.numGames,
            quarterLength: props.quarterLength,
            salaryCap: props.salaryCap,
			
            gameBalance: props.gameBalance,
			importRestriction: props.importRestriction,
			residencyRequirement: props.residencyRequirement,
			countryConcentration: props.countryConcentration,
			ratioEU: props.ratioEU,
			germanRatio: props.germanRatio,
			playoffWins: props.playoffWins,			
			
        };
        this.handleChanges = {
            disableInjuries: this.handleChange.bind(this, 'disableInjuries'),
            luxuryPayroll: this.handleChange.bind(this, 'luxuryPayroll'),
            luxuryTax: this.handleChange.bind(this, 'luxuryTax'),
            maxContract: this.handleChange.bind(this, 'maxContract'),
            minContract: this.handleChange.bind(this, 'minContract'),
            minPayroll: this.handleChange.bind(this, 'minPayroll'),
            minRosterSize: this.handleChange.bind(this, 'minRosterSize'),
            numGames: this.handleChange.bind(this, 'numGames'),
            quarterLength: this.handleChange.bind(this, 'quarterLength'),
            salaryCap: this.handleChange.bind(this, 'salaryCap'),
			
            gameBalance: this.handleChange.bind(this, 'gameBalance'),
            importRestriction: this.handleChange.bind(this, 'importRestriction'),
            residencyRequirement: this.handleChange.bind(this, 'residencyRequirement'),
            countryConcentration: this.handleChange.bind(this, 'countryConcentration'),
            ratioEU: this.handleChange.bind(this, 'ratioEU'),
            germanRatio: this.handleChange.bind(this, 'germanRatio'),
            playoffWins: this.handleChange.bind(this, 'playoffWins'),
			
			
        };
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleGodModeToggle = this.handleGodModeToggle.bind(this);
        this.handleCustomRosterToggle = this.handleCustomRosterToggle.bind(this);
        this.handleRegionalRestrictionToggle = this.handleRegionalRestrictionToggle.bind(this);		
    }

    componentWillReceiveProps(nextProps) {
        if (!this.state.dirty) {
            this.setState({
                disableInjuries: String(nextProps.disableInjuries),
                luxuryPayroll: nextProps.luxuryPayroll,
                luxuryTax: nextProps.luxuryTax,
                maxContract: nextProps.maxContract,
                minContract: nextProps.minContract,
                minPayroll: nextProps.minPayroll,
                minRosterSize: nextProps.minRosterSize,
                numGames: nextProps.numGames,
                quarterLength: nextProps.quarterLength,
                salaryCap: nextProps.salaryCap,

                gameBalance: nextProps.gameBalance,
                importRestriction: nextProps.importRestriction,				
                residencyRequirement: nextProps.residencyRequirement,
                countryConcentration: nextProps.countryConcentration,
                ratioEU: nextProps.ratioEU,
                germanRatio: nextProps.germanRatio,
                playoffWins: nextProps.playoffWins,				
						
            });
        }
    }

    handleChange(name, e) {
        this.setState({
            dirty: true,
            [name]: e.target.value,
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        await toWorker('updateGameAttributes', {
            disableInjuries: this.state.disableInjuries === 'true',
            numGames: parseInt(this.state.numGames, 10),
            quarterLength: parseFloat(this.state.quarterLength),
            minRosterSize: parseInt(this.state.minRosterSize, 10),
            salaryCap: parseInt(this.state.salaryCap*1000000),
            minPayroll: parseInt(this.state.minPayroll*1000000),
            luxuryPayroll: parseInt(this.state.luxuryPayroll*1000000),
            luxuryTax: parseFloat(this.state.luxuryTax),
            minContract: parseInt(this.state.minContract ),
            maxContract: parseInt(this.state.maxContract),

            gameBalance: parseInt(this.state.gameBalance),
            importRestriction: parseInt(this.state.importRestriction),
            residencyRequirement: parseInt(this.state.residencyRequirement),
            countryConcentration: parseInt(this.state.countryConcentration),
            ratioEU: parseInt(this.state.ratioEU),
            germanRatio: parseInt(this.state.germanRatio),
            playoffWins: parseInt(this.state.playoffWins),			
					
			
        });

        this.setState({
            dirty: false,
        });

        logEvent({
            type: "success",
            text: 'God Mode options successfully updated.',
            saveToDb: false,
        });

        realtimeUpdate(["toggleGodMode"], helpers.leagueUrl(["god_mode"]));
    }

    async handleGodModeToggle() {
        const attrs = {godMode: !this.props.godMode};

        if (attrs.godMode) {
            attrs.godModeInPast = true;
        }

        await toWorker('updateGameAttributes', attrs);
        emitter.emit('updateTopMenu', {godMode: attrs.godMode});
        realtimeUpdate(["toggleGodMode"]);
    }
	
   async handleCustomRosterToggle() {
        const attrs = {customRoster: !this.props.customRoster};

        await toWorker('updateGameAttributes', attrs);
        emitter.emit('updateTopMenu', {customRoster: attrs.customRoster});
        realtimeUpdate(["toggleCustomRoster"]);
    }

   async handleRegionalRestrictionToggle() {
        const attrs = {regionalRestriction: !this.props.regionalRestriction};


        await toWorker('updateGameAttributes', attrs);
        emitter.emit('updateTopMenu', {regionalRestriction: attrs.regionalRestriction});
        realtimeUpdate(["toggleRegionalRestriction"]);
    }	

    render() {
        const {godMode} = this.props;
        const {customRoster} = this.props;
        const {regionalRestriction} = this.props;

        setTitle('God Mode');

        return <div>
            <h1>God Mode <NewWindowLink /></h1>

            <p>God Mode is a collection of customization features that allow you to kind of do whatever you want. If you enable God Mode, you get access to the following features (which show up in the game as <span className="god-mode god-mode-text">purple text</span>):</p>

			<ul>
			  <li>Create custom players by going to Tools > Create A Player</li>
			  <li>Edit any player by going to their player page and clicking Edit Player</li>
			  <li>Force any trade to be accepted by checking the Force Trade checkbox before proposing a trade</li>
			  <li>You can become the GM of another team at any time</li>
			  <li>You will never be fired!</li>
			  <li>You will be able to change the options below</li>
			</ul>
			
            <p>However, if you enable God Mode within a league, you will not get credit for any <a href="/account">Achievements</a>. This persists even if you disable God Mode. You can only get Achievements in a league where God Mode has never been enabled.</p>

            <button
                className={classNames('btn', godMode ? 'btn-success' : 'btn-danger')}
                onClick={this.handleGodModeToggle}
            >
                {godMode ? 'Disable God Mode' : 'Enable God Mode'}
            </button>

            <h2 style={{marginTop: '1em'}}>God Mode Options</h2>

            <p className="text-danger">These options are not well tested and might make the AI do weird things.</p>

            <form onSubmit={this.handleFormSubmit}>
                <div className="row">
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Injuries <HelpPopover placement="right" title="Injuries">
                        This won't heal current injuries, but it will prevent any new ones from occurring.
                        </HelpPopover></label>
                        <select className="form-control" disabled={!godMode} onChange={this.handleChanges.disableInjuries} value={this.state.disableInjuries}>
                            <option value="false">Enabled</option>
                            <option value="true">Disabled</option>
                        </select>
                    </div>
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label># Games Per Season <HelpPopover placement="left" title="# Games Per Season">
                        This will only apply to seasons that have not started yet.
                        </HelpPopover></label>
                        <input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.numGames} value={this.state.numGames} />
                    </div>
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Quarter Length (minutes)</label>
                        <input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.quarterLength} value={this.state.quarterLength} />
                    </div>
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Min Roster Size</label>
                        <input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.minRosterSize} value={this.state.minRosterSize} />
                    </div>
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Min Contract</label>
                        <div className="input-group">
                            <span className="input-group-addon">$</span><input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.minContract} value={this.state.minContract} /><span className="input-group-addon">K</span>
                        </div>
                    </div>
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Custom Roster Mode <HelpPopover placement="right" title="Custom Roster Mode">
                        For custom roster that have very high ratings that are very close together this brings ratings performance more in line with the standard rosters. It can also be used to make the standard game less random
                        </HelpPopover></label>
                        <select className="form-control" disabled={!godMode} onChange={this.handleChanges.customRoster} value={this.state.customRoster}>
                            <option value="false">Disabled</option>
                            <option value="true">Enabled</option>
                        </select>
                    </div>					
					
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Regional Restrictions <HelpPopover placement="right" title="Regional Restrictions">
                        When enabled teams must have a certain number of players from the region of the team.
                        </HelpPopover></label>						
                        <select className="form-control" disabled={!godMode} onChange={this.handleChanges.regionalRestrictions} value={this.state.regionalRestrictions}>
                            <option value="true">Enabled</option>
                            <option value="false">Disabled</option>
                        </select>
                    </div>
					
					
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Team Balance</label>
                        <input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.gameBalance} value={this.state.gameBalance} />
                    </div>
					
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Residency Requirement</label>
                        <input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.residencyRequirement} value={this.state.residencyRequirement} />
                    </div>
					
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Import Restriction <HelpPopover placement="right" title="Import Restriction">
                        How many years a player from another region has to play for a team before his region changes to his current region.
                        </HelpPopover></label>	
                        <input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.importRestriction} value={this.state.importRestriction} />
                    </div>
					
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Country Concentration<HelpPopover placement="right" title="Concentration">
                        0 will have the greatest chance at keeping teams together from the same country, 5 is standard, and 30 will ignore country concentration.
                        </HelpPopover></label>	
                        <input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.countryConcentration} value={this.state.countryConcentration} />
                    </div>
					
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>EU Ratio<HelpPopover placement="right" title="Ratio">
                        0 will remove that country/region from the free agent list. 1 will keep the current ratio. 2 will double it and so on.
                        </HelpPopover></label>	
                        <input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.ratioEU} value={this.state.ratioEU} />
                    </div>

                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>German Ratio <HelpPopover placement="right" title="Ratio">
                        0 will remove that country/region from the free agent list. 1 will keep the current ratio. 2 will double it and so on.
                        </HelpPopover></label>							
                        <label></label>
                        <input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.germanRatio} value={this.state.germanRatio} />
                    </div>					

                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Max Contract</label>
                        <div className="input-group">
                            <span className="input-group-addon">$</span><input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.maxContract} value={this.state.maxContract} /><span className="input-group-addon">K</span>
                        </div>
                    </div>					
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Salary Cap</label>
                        <div className="input-group">
                            <span className="input-group-addon">$</span><input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.salaryCap} value={this.state.salaryCap} /><span className="input-group-addon">M</span>
                        </div>
                    </div>
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Min Payroll</label>
                        <div className="input-group">
                            <span className="input-group-addon">$</span><input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.minPayroll} value={this.state.minPayroll} /><span className="input-group-addon">M</span>
                        </div>
                    </div>
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Luxury Tax Threshold</label>
                        <div className="input-group">
                            <span className="input-group-addon">$</span><input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.luxuryPayroll} value={this.state.luxuryPayroll} /><span className="input-group-addon">M</span>
                        </div>
                    </div>
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Luxury Tax <HelpPopover placement="left" title="Luxury Tax">
                        Take the difference between a team's payroll and the luxury tax threshold. Multiply that by this number. The result is the penalty they have to pay.
                        </HelpPopover></label>
                        <input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.luxuryTax} value={this.state.luxuryTax} />
                    </div>
					
                    <div className="col-sm-3 col-xs-6 form-group">
                        <label>Playoff Wins <HelpPopover placement="right" title="Playoff wins to advance to next round">
						</HelpPopover></label>
                        <input type="text" className="form-control" disabled={!godMode} onChange={this.handleChanges.playoffWins} value={this.state.playoffWins} />
                    </div>					           
										

                </div>

                <button className="btn btn-primary" id="save-god-mode-options" disabled={!godMode}>Save God Mode Options</button>
            </form>
        </div>;
    }
}

GodMode.propTypes = {
    disableInjuries: React.PropTypes.bool.isRequired,
    godMode: React.PropTypes.bool.isRequired,

    luxuryPayroll: React.PropTypes.number.isRequired,
    luxuryTax: React.PropTypes.number.isRequired,
    maxContract: React.PropTypes.number.isRequired,
    minContract: React.PropTypes.number.isRequired,
    minPayroll: React.PropTypes.number.isRequired,
    minRosterSize: React.PropTypes.number.isRequired,
    numGames: React.PropTypes.number.isRequired,
    quarterLength: React.PropTypes.number.isRequired,
    salaryCap: React.PropTypes.number.isRequired,
	
    regionalRestriction: React.PropTypes.bool.isRequired,
    customRoster: React.PropTypes.bool.isRequired,	
	
	gameBalance: React.PropTypes.number.isRequired,
	importRestriction: React.PropTypes.number.isRequired,
	residencyRequirement: React.PropTypes.number.isRequired,
	countryConcentration: React.PropTypes.number.isRequired,
	ratioEU: React.PropTypes.number.isRequired,
	germanRatio: React.PropTypes.number.isRequired,
	playoffWins: React.PropTypes.number.isRequired,	
	
	
};

export default GodMode;
