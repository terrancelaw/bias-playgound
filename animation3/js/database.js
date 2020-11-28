const Database = {
	data: null,
	range: [ 0, 1 ],

	load: function(callback) {
		const self = this;

		d3.csv('data/influenceOnVenezuela.csv', function(d) {
			d.year = d3.timeParse("%Y")(d.year);
			d.influenceByRussia = +d.influenceByRussia;
			return d;
		})
		.then(function(d) {
			self.data = d;
			callback();
		});
	}
}