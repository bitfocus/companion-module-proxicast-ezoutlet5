export function initPolling() {
	if (this.state.pollTimer) {
		clearInterval(this.state.pollTimer)
	}

	if (this.config.ip && this.config.polling && this.config.interval > 0) {
		this.state.pollTimer = setInterval(() => {
			this.getStatus()
			this.checkFeedbacks()
		}, this.config.interval)
	}
}
