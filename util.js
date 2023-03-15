export const OnOffToggle = {
	On: 'on',
	Off: 'off',
	Toggle: 'toggle',
	Reset: 'reset',
}

export const choiceOnOff = [
	{ id: OnOffToggle.On, label: OnOffToggle.On },
	{ id: OnOffToggle.Off, label: OnOffToggle.Off },
]
export const choiceToggle = [
	{ id: OnOffToggle.On, label: OnOffToggle.On },
	{ id: OnOffToggle.Off, label: OnOffToggle.Off },
	{ id: OnOffToggle.Toggle, label: OnOffToggle.Toggle },
	{ id: OnOffToggle.Reset, label: OnOffToggle.Reset },
]

export const isFunction = (identifier) => typeof identifier === 'function'
