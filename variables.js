import { isFunction } from './util.js'

export function initVariables() {
	this.state.variables = {}

	if (!this.config.polling) {
		// not necessary, since we aren't polling for status
		this.setVariableDefinitions([])
		return
	}

	this.state.variables.outlet_mode = {
		label: 'Outlet Mode',
		name: 'outlet_mode',
		getValue: (value) => (parseInt(value) == 1 ? 'auto' : 'manual'),
	}

	this.state.variables.outlet_status = {
		label: 'Outlet Status',
		name: 'outlet_status',
		getValue: (value) => (parseInt(value) == 1 ? 'on' : 'off'),
	}

	this.setVariableDefinitions(
		Object.keys(this.state.variables).map((name) => ({
			name: this.state.variables[name].label,
			variableId: this.state.variables[name].name,
		}))
	)
}

export function setVariables(status) {
	const variablesToUpdate = {}

	Object.keys(this.state.variables).forEach((id) => {
		const value = status[id]
		const name = this.state.variables[id].name

		if (this.state.status[name] !== value) {
			if (isFunction(this.state.variables[id].getValue)) {
				variablesToUpdate[name] = this.state.variables[id].getValue(value)
			} else {
				variablesToUpdate[name] = value
			}

			this.state.status[name] = variablesToUpdate[name]
		}
	})

	// update as batch - recommended by Bitfocus
	this.setVariableValues(variablesToUpdate)

	// check the feedbacks
	Object.keys(variablesToUpdate).forEach((variable) => {
		this.checkFeedbacks(variable)
	})
}
