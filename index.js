import { InstanceBase, runEntrypoint, InstanceStatus, combineRgb } from '@companion-module/base'
import { upgradeScripts } from './upgrades.js'
import { updateActions } from './actions.js'
import { initPolling } from './polling.js'
import { initFeedbacks } from './feedbacks.js'
import { initVariables, setVariables } from './variables.js'
import { configFields } from './config.js'
import got from 'got'
import xml from 'xml2js'
import { OnOffToggle } from './util.js'

class ProxicastEZOutlet5 extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.updateActions = updateActions.bind(this)
		this.initPolling = initPolling.bind(this)
		this.initFeedbacks = initFeedbacks.bind(this)
		this.initVariables = initVariables.bind(this)
		this.setVariables = setVariables.bind(this)

		this.config = {}
		this.state = {
			status: {
				outlet_mode: null,
				outlet_status: null,
			},
		}
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
		this.initPolling()
		this.initFeedbacks()
		this.initVariables()
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

		this.initPolling()
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
	async setPower(powerMode) {
		let url = `cgi-bin/control2.cgi?user=${this.config.username}&passwd=${this.config.password}&target=1&control=`

		switch (powerMode) {
			case OnOffToggle.On:
				this.log('debug', 'Sending a power-on')
				url = url + '1'
				break
			case OnOffToggle.Off:
				this.log('debug', 'Sending a power-off')
				url = url + '0'
				break
			case OnOffToggle.Toggle:
				this.log('debug', 'Sending a toggle/switch')
				url = url + '2'
				break
			case OnOffToggle.Reset:
				this.log('debug', 'Sending a reset')
				url = url + '3'
				break
		}

		const options = {
			retry: {
				limit: 0,
			},
			prefixUrl: 'http://' + this.config.ip + ':' + this.config.port,
		}

		got(url, options)
			.then((response) => {
				const xmlParser = new xml.Parser()

				xmlParser.parseString(response.body, (err, result) => {
					this.setVariables(result.request)
					this.updateStatus(InstanceStatus.Ok)
				})
			})
			.catch((e) => {
				this.log('error', `Power toggle request failed (${e.message})`)
				this.updateStatus(InstanceStatus.UnknownError, e.code)
			})
	}
	async getStatus() {
		const url = `http://${this.config.username}:${this.config.password}@${this.config.ip}:${this.config.port}/xml/outlet_status.xml`

		const options = {
			retry: {
				limit: 0,
			},
		}

		got(url, options)
			.then((response) => {
				const xmlParser = new xml.Parser()

				xmlParser.parseString(response.body, (err, result) => {
					this.setVariables(result.request)
					this.updateStatus(InstanceStatus.Ok)
				})
			})
			.catch((e) => {
				this.log('error', `Status request failed (${e.message})`)
				this.updateStatus(InstanceStatus.UnknownError, e.code)
			})
	}
}

runEntrypoint(ProxicastEZOutlet5, upgradeScripts)
