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
            await this.setPower(action.options.mode)
        },
    }	        

    this.setActionDefinitions(actions);
}

