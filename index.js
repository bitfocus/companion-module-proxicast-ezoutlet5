import { InstanceBase, runEntrypoint, InstanceStatus, combineRgb } from '@companion-module/base'
import got from 'got'
import xml from 'xml2js'
import { configFields } from './config.js'
import { upgradeScripts } from './upgrade.js'
import { initPolling } from './polling.js'
import { FIELDS } from './fields.js'
import JimpRaw from 'jimp'

// Webpack makes a mess..
const Jimp = JimpRaw.default || JimpRaw

const Constants = {
	Power: 'power',
	On: 'on',
	Off: 'off',
	Toggle: 'toggle',	
}

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

		this.choiceOnOff = [
			{ id: Constants.On, label: Constants.On },
			{ id: Constants.Off, label: Constants.Off },
		]

		this.choiceToggle = [
			{ id: Constants.On, label: Constants.On },
			{ id: Constants.Off, label: Constants.Off },
			{ id: Constants.Toggle, label: Constants.Toggle },
		]
	}

	configUpdated(config) {
		this.config = config

		this.initActions()
		this.initFeedbacks()
		this.initVariables()
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

	async prepareQuery(context, action, includeBody) {
		let url = await context.parseVariablesInString(action.options.url || '')
		if (url.substring(0, 4) !== 'http') {
			if (this.config.prefix && this.config.prefix.length > 0) {
				url = `${this.config.prefix}${url.trim()}`
			}
		}

		let body = {}
		if (includeBody && action.options.body && action.options.body.trim() !== '') {
			body = await context.parseVariablesInString(action.options.body || '')

			if (action.options.contenttype === 'application/json') {
				//only parse the body if we are explicitly sending application/json
				try {
					body = JSON.parse(body)
				} catch (e) {
					this.log('error', `HTTP ${action.action.toUpperCase()} Request aborted: Malformed JSON Body (${e.message})`)
					this.updateStatus(InstanceStatus.UnknownError, e.message)
					return
				}
			}
		}

		let headers = {}
		if (action.options.header.trim() !== '') {
			const headersStr = await context.parseVariablesInString(action.options.header || '')

			try {
				headers = JSON.parse(headersStr)
			} catch (e) {
				this.log('error', `HTTP ${action.action.toUpperCase()} Request aborted: Malformed JSON Header (${e.message})`)
				this.updateStatus(InstanceStatus.UnknownError, e.message)
				return
			}
		}

		if (includeBody && action.options.contenttype) {
			headers['Content-Type'] = action.options.contenttype
		}

		const options = {
			https: {
				rejectUnauthorized: this.config.rejectUnauthorized,
			},

			headers,
		}

		if (includeBody) {
			if (typeof body === 'string') {
				options.body = body
			} else if (body) {
				options.json = body
			}
		}

		return {
			url,
			options,
		}
	}

	initActions() {
		const urlLabel = this.config.prefix ? 'URI' : 'URL'

		const actions = {}

		actions[Constants.Power] = {
			name: 'Turn on/off outlet',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					default: Constants.Toggle,
					choices: this.choiceToggle,
				},
			],
			callback: async (action, context) => {
				if (action.options.mode == Constants.On) {
					await this.setPower(true)
				} else if (action.options.mode == Constants.Off) {
					await this.setPower(false)
				} else if (action.options.mode == Constants.Toggle) {
					await this.setPower()
				} else {
					this.log('error', 'Invalid value for power command: ' + action.options.mode)
				}
			},
		}		

		this.setActionDefinitions(actions)

		// this.setActionDefinitions({
		// 	post: {
		// 		name: 'POST',
		// 		options: [FIELDS.Url(urlLabel), FIELDS.Body, FIELDS.Header, FIELDS.ContentType],
		// 		callback: async (action, context) => {
		// 			const { url, options } = await this.prepareQuery(context, action, true)

		// 			try {
		// 				await got.post(url, options)

		// 				this.updateStatus(InstanceStatus.Ok)
		// 			} catch (e) {
		// 				this.log('error', `HTTP GET Request failed (${e.message})`)
		// 				this.updateStatus(InstanceStatus.UnknownError, e.code)
		// 			}
		// 		},
		// 	},
		// 	get: {
		// 		name: 'GET',
		// 		options: [
		// 			FIELDS.Url(urlLabel),
		// 			FIELDS.Header,
		// 			{
		// 				type: 'custom-variable',
		// 				label: 'JSON Response Data Variable',
		// 				id: 'jsonResultDataVariable',
		// 			},
		// 			{
		// 				type: 'checkbox',
		// 				label: 'JSON Stringify Result',
		// 				id: 'result_stringify',
		// 				default: true,
		// 			},
		// 		],
		// 		callback: async (action, context) => {
		// 			const { url, options } = await this.prepareQuery(context, action, false)

		// 			try {
		// 				const response = await got.get(url, options)

		// 				// store json result data into retrieved dedicated custom variable
		// 				const jsonResultDataVariable = action.options.jsonResultDataVariable
		// 				if (jsonResultDataVariable) {
		// 					this.log('debug', `Writing result to ${jsonResultDataVariable}`)

		// 					let resultData = response.body

		// 					if (!action.options.result_stringify) {
		// 						try {
		// 							resultData = JSON.parse(resultData)
		// 						} catch (error) {
		// 							//error stringifying
		// 						}
		// 					}

		// 					this.setCustomVariableValue(jsonResultDataVariable, resultData)
		// 				}

		// 				this.updateStatus(InstanceStatus.Ok)
		// 			} catch (e) {
		// 				this.log('error', `HTTP GET Request failed (${e.message})`)
		// 				this.updateStatus(InstanceStatus.UnknownError, e.code)
		// 			}
		// 		},
		// 	},
		// 	put: {
		// 		name: 'PUT',
		// 		options: [FIELDS.Url(urlLabel), FIELDS.Body, FIELDS.Header, FIELDS.ContentType],
		// 		callback: async (action, context) => {
		// 			const { url, options } = await this.prepareQuery(context, action, true)

		// 			try {
		// 				await got.put(url, options)

		// 				this.updateStatus(InstanceStatus.Ok)
		// 			} catch (e) {
		// 				this.log('error', `HTTP GET Request failed (${e.message})`)
		// 				this.updateStatus(InstanceStatus.UnknownError, e.code)
		// 			}
		// 		},
		// 	},
		// 	patch: {
		// 		name: 'PATCH',
		// 		options: [FIELDS.Url(urlLabel), FIELDS.Body, FIELDS.Header, FIELDS.ContentType],
		// 		callback: async (action, context) => {
		// 			const { url, options } = await this.prepareQuery(context, action, true)

		// 			try {
		// 				await got.patch(url, options)

		// 				this.updateStatus(InstanceStatus.Ok)
		// 			} catch (e) {
		// 				this.log('error', `HTTP GET Request failed (${e.message})`)
		// 				this.updateStatus(InstanceStatus.UnknownError, e.code)
		// 			}
		// 		},
		// 	},
		// 	delete: {
		// 		name: 'DELETE',
		// 		options: [FIELDS.Url(urlLabel), FIELDS.Body, FIELDS.Header],
		// 		callback: async (action, context) => {
		// 			const { url, options } = await this.prepareQuery(context, action, true)

		// 			try {
		// 				await got.delete(url, options)

		// 				this.updateStatus(InstanceStatus.Ok)
		// 			} catch (e) {
		// 				this.log('error', `HTTP GET Request failed (${e.message})`)
		// 				this.updateStatus(InstanceStatus.UnknownError, e.code)
		// 			}
		// 		},
		// 	},
		// })
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
					choices: this.choiceOnOff,
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

		// // existing from Generic HTTP - leave for reference only
		// feedbacks['imageFromUrl'] = {
		// 	type: 'advanced',
		// 	name: 'Image from URL',
		// 	options: [FIELDS.Url(urlLabel), FIELDS.Header, FIELDS.PollInterval],
		// 	subscribe: (feedback) => {
		// 		// Ensure existing timer is cleared
		// 		if (this.feedbackTimers[feedback.id]) {
		// 			clearInterval(this.feedbackTimers[feedback.id])
		// 			delete this.feedbackTimers[feedback.id]
		// 		}

		// 		// Start new timer if needed
		// 		if (feedback.options.interval) {
		// 			this.feedbackTimers[feedback.id] = setInterval(() => {
		// 				this.checkFeedbacksById(feedback.id)
		// 			}, feedback.options.interval)
		// 		}
		// 	},
		// 	unsubscribe: (feedback) => {
		// 		// Ensure timer is cleared
		// 		if (this.feedbackTimers[feedback.id]) {
		// 			clearInterval(this.feedbackTimers[feedback.id])
		// 			delete this.feedbackTimers[feedback.id]
		// 		}
		// 	},
		// 	callback: async (feedback, context) => {
		// 		try {
		// 			const { url, options } = await this.prepareQuery(context, feedback, false)

		// 			const res = await got.get(url, options)

		// 			// Scale image to a sensible size
		// 			const img = await Jimp.read(res.rawBody)
		// 			const png64 = await img
		// 				.scaleToFit(feedback.image?.width ?? 72, feedback.image?.height ?? 72)
		// 				.getBase64Async('image/png')

		// 			return {
		// 				png64,
		// 			}
		// 		} catch (e) {
		// 			// Image failed to load so log it and output nothing
		// 			this.log('error', `Failed to fetch image: ${e}`)
		// 			return {}
		// 		}
		// 	},
		// }

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

