import { choiceToggle, OnOffToggle } from './util.js'
import { Constants } from './constants.js'

export function updateActions() {
    const actions = {}



    actions[Constants.Power] = {
        name: 'Turn on/off outlet',
        options: [
            {
                type: 'dropdown',
                label: 'Mode',
                id: 'mode',
                default: OnOffToggle.Toggle,
                choices: choiceToggle,
            },
        ],
        callback: async (action, context) => {
            if (action.options.mode == OnOffToggle.On) {
                await this.setPower(true)
            } else if (action.options.mode == OnOffToggle.Off) {
                await this.setPower(false)
            } else if (action.options.mode == OnOffToggle.Toggle) {
                await this.setPower()
            } else {
                this.log('error', 'Invalid value for power command: ' + action.options.mode)
            }
        },
    }	        

    this.setActionDefinitions(actions);
}

