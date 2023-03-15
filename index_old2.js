import { InstanceBase, runEntrypoint, InstanceStatus, combineRgb } from '@companion-module/base'
import got from 'got'
import xml from 'xml2js'
import { configFields, choiceOnOff, choiceToggle } from './config.js'
import { Constants } from './constants.js'
import { upgradeScripts } from './upgrades.js'
import { updateActions } from './actions.js'
import { initPolling } from './polling.js'
import { FIELDS } from './fields.js'
import JimpRaw from 'jimp'

// Webpack makes a mess..
const Jimp = JimpRaw.default || JimpRaw

function foregroundPicker(defaultValue) {
	return {
		type: 'colorpicker',
		label: 'Foreground color',
		id: 'fg',
		default: defaultValue,
	}
}

function backgroundPicker(defaultValue) {
	return {
		type: 'colorpicker',
		label: 'Background color',
		id: 'bg',
		default: defaultValue,
	}
}

class ProxicastEZOutlet5 extends InstanceBase {

		/**
	 * Create an instance of a projector module.
	 *
	 * @param {EventEmitter} system - the brains of the operation
	 * @param {string} id - the instance ID
	 * @param {Object} config - saved user configuration parameters
	 * @since 1.0.0
	 */
	constructor(internal) {
		super(internal)

		//this.connection = undefined
	}

	async configUpdated(config) {
		this.config = config

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

		this.initActions()
		this.initFeedbacks()
		this.initVariables()

		this.updateStatus(InstanceStatus.Ok)
	}

	// Return config fields for web config
	getConfigFields() {
		return configFields
	}

	// When module gets deleted
	async destroy() {
		// Stop any running feedback timers
		for (const timer of Object.values(this.feedbackTimers)) {
			clearInterval(timer)
		}
	}

	initActions() {
		updateActions(this);
	}

	feedbackTimers = {}

	/**
	 * INTERNAL: initialize feedbacks. TODO
	 *
	 * @access protected
	 * @since 1.1.0
	 */
	initFeedbacks() {
		const feedbacks = {}

		feedbacks[Constants.Power] = {
			type: 'advanced',
			name: 'Change background color by power status',
			description:
				'If the state of the outlet (power) matches the specified value, change background color of the bank',
			options: [
				foregroundPicker(combineRgb(0, 0, 0)),
				backgroundPicker(combineRgb(255, 0, 0)),
				{
					type: 'dropdown',
					label: 'Power state',
					id: 'state',
					default: Constants.On,
					choices: choiceOnOff,
				},
			],
			callback: (feedback) => {
				if (this.variables[Constants.Power] === (feedback.options.state === Constants.On)) {
					return {
						color: feedback.options.fg,
						bgcolor: feedback.options.bg,
					}
				}
			},			
		}

		this.setFeedbackDefinitions(feedbacks)
	}


	/**
	 * INTERNAL: initialize variables.
	 *
	 * @access protected
	 * @since 1.0.0
	 */
	initVariables() {
		const variables = []

		variables.push({
			name: 'Name',
			variableId: 'name',
		})

		variables.push({
			name: 'Model',
			variableId: 'model',
		})

		variables.push({
			name: 'Power state',
			variableId: Constants.Power,
		})


		this.setVariableDefinitions(variables)
		this.setVariableValues({
			[Constants.Power]: undefined,
			name: '',
			model: '',
		})
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

