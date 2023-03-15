export const configFields = [
	{
		type: 'textinput',
		id: 'ip',
		label: 'IP Address',
		width: 4,
		default: '',
	},
	{
		type: 'textinput',
		id: 'port',
		label: 'Port',
		width: 4,
		default: '80',
	},
	{
		type: 'textinput',
		id: 'username',
		label: 'Username',
		width: 4,
		default: 'admin',
	},
	{
		type: 'textinput',
		id: 'password',
		label: 'Password',
		width: 4,
		default: '',
	},
	{
		type: 'checkbox',
		id: 'polling',
		label: 'Enable Polling?',
		width: 6,
		default: false,
	},
	{
		type: 'number',
		id: 'interval',
		label: `Polling interval in milliseconds (default: 5000, min: 1000)`,
		width: 12,
		min: 1000,
		default: 5000,
		required: true,
	},
]


