const Database = {
	data: null,

	load: function(callback) {
		const self = this;

		d3.csv('data/dataset.csv', function(d) {
			for (var key in d)
				if (key != 'state') {
					var value = d[key];
					var valueIsMissing = value == '';
					d[key] = valueIsMissing ? null : +d[key];
				}
			return d;
		})
		.then(function(d) {
			self.data = d;
			callback();
		});
	}
}