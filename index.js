import { InstanceBase, runEntrypoint, InstanceStatus, combineRgb } from '@companion-module/base'
import { upgradeScripts } from './upgrades.js'
import { updateActions } from './actions.js'
import { configFields } from './config.js'
import got from 'got'
import xml from 'xml2js'

class ProxicastEZOutlet5 extends InstanceBase {
    
    constructor(internal) {
        super(internal)

		this.updateActions = updateActions.bind(this);

        this.config = {}
        this.state = {}
        this.services = {}
        this.initDone = false
    }

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	async init(config) {
		this.config = config

		this.updateActions()

		// await this.configUpdated(this.config)

		// InitVariables(this, this.state)
		// this.setPresetDefinitions(GetPresetsList(this.state))
		// this.setFeedbackDefinitions(GetFeedbacksList(() => this.state))
		// this.setActionDefinitions(
		// 	GetActionsList(() => ({ state: this.state, services: this.services, client: this.client }))
		// )
		// updateVariables(this, this.state)

		// this.initActions()
		// this.initFeedbacks()
		// this.initVariables()

		this.updateStatus(InstanceStatus.Ok)
	}    

	/**
	 * Process an updated configuration array.
     * 
	 * @access public
	 * @since 1.0.0
	 */
	async configUpdated(config) {
		this.config = config

	}    

	/**
	 * Creates the configuration fields for web config.
	 */
	getConfigFields() {
		return configFields
	}


	/**
	 * Clean up the instance before it is destroyed.
	 */
	async destroy() {

		this.log('debug', `destroy ${this.id}`)
	}    

	 /**
	 * INTERNAL: Sets the power of the outlet
	 *
	 * @access protected
	 * @since 1.0.0
	 */
	 async setPower(on) {
		let url = 'http://' + this.config.ip + ':' + this.config.port + '/cgi-bin/control2.cgi?user=' + this.config.username + '&passwd=' + this.config.password + '&target=1&control='

		if (on) {
			this.log('debug', 'Sending a power-on');
			url = url + '1'
		}

		if (!on) {
			this.log('debug', 'Sending a power-off');
			url = url + '0'
		}


		const options = {
			retry: {
				limit: 0
			},
			url
		}

		try {

			const response = await got(options);

			const xmlParser = new xml.Parser();

			xmlParser.parseString(response.body, (err, result) => {
				this.updateStatus(InstanceStatus.Ok)
			})

		} catch (e) {
			this.log('error', `HTTP GET Request failed (${e.message})`)
			this.updateStatus(InstanceStatus.UnknownError, e.code)
		}
	}	
}

runEntrypoint(ProxicastEZOutlet5, upgradeScripts)
