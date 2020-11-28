const LineChart = {
	margin: { top: 50, left: 50, bottom: 50, right: 50 },
	x: 'year',
	y: 'influenceByRussia',

	init: function() {
		const self = this;
		var data = Database.data;
		var margin = self.margin;

		var group = d3.select('#chart > svg').append('g')
			.attr('transform', 'translate(' + [ margin.left, margin.top ] + ')');

		group.append('g').attr('class', 'x axis');
    	group.append('g').attr('class', 'y axis');
    	group.append('path').attr('class', 'line');
	},
	draw: function() {
		const self = this;
		var data = Database.data;
		var yearVar = self.x;
		var yVar = self.y;
		var margin = self.margin;
		var yRange = Database.range;
		var yearRange = d3.extent(Database.data, function(d) { return d[yearVar] });

		var canvasWidth = $('#chart > svg').width();
		var canvasHeight = $('#chart > svg').height();

		var yearScale = d3.scaleTime()
			.domain(yearRange)
			.range([ 0, canvasWidth - margin.left - margin.right ]);
		var yScale = d3.scaleLinear()
			.domain([ yRange[1], yRange[0] ])
			.range([ 0, canvasHeight - margin.top - margin.bottom ]);
		var lineGenerator = d3.line()
			.x(function(d) { return yearScale(d[yearVar]) })
			.y(function(d) { return yScale(d[yVar]) });

		// axes
		var group = d3.select('#chart > svg > g');
		group.select('.x.axis')
			.call(d3.axisBottom(yearScale))
			.attr('transform', 'translate(0,' + (canvasHeight - margin.top - margin.bottom) + ')');
		group.select('.y.axis')
			.call(d3.axisLeft(yScale).ticks(5));

		// line
		group.select('.line')
			.datum(data)
			.attr('d', lineGenerator)
			.style('fill', 'none')
			.style('stroke', 'steelblue')
			.style('stroke-width', 1.5);
	}
}