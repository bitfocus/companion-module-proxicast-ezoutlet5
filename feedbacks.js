import { combineRgb } from '@companion-module/base'
import { choiceOnOff, OnOffToggle } from './util.js'

export function initFeedbacks() {

    const feedbacks = {};

    feedbacks.outlet_status = {
        type: 'boolean',
        name: 'Change background color by power status',
        description:
            'If the state of the projector (power) matches the specified value, change background color of the bank',
        options: [
            {
                type: 'dropdown',
                label: 'Outlet Power State',
                id: 'outlet_status',
                default: OnOffToggle.On,
                choices: choiceOnOff,
            },
        ],
        defaultStyle: {
            color: combineRgb(0, 0, 0),
            bgcolor: combineRgb(0, 255, 0),
        },        
        callback: (feedback) => {
            return this.state.status.outlet_status === feedback.options.outlet_status
        },
    }

    

    this.setFeedbackDefinitions(feedbacks)
}