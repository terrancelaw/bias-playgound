const Scatterplot = {
	margin: { top: 50, left: 50, bottom: 50, right: 50 },
	x: 'life expectancy',
	y: 'percentage of people who have poor health',

	init: function() {
		const self = this;
		var data = Database.data;
		var margin = self.margin;

		var group = d3.select('#chart > svg').append('g')
			.attr('transform', 'translate(' + [ margin.left, margin.top ] + ')');

		group.append('g').attr('class', 'x axis');
    	group.append('g').attr('class', 'y axis');
    	group.append('g').attr('class', 'grids');
    	group.append('g').attr('class', 'plot');
	},
	draw: function() {
		const self = this;
		var data = Database.data;
		var xVar = self.x;
		var yVar = self.y;
		var margin = self.margin;

		var xMaxVal = d3.max(data, function(d) { return d[xVar] });
		var yMaxVal = d3.max(data, function(d) { return d[yVar] });

		var canvasWidth = $('#chart > svg').width();
		var canvasHeight = $('#chart > svg').height();

		var xScale = d3.scaleLinear()
			.domain([ 0, xMaxVal ])
			.range([ 0, canvasWidth - margin.left - margin.right ]);
		var yScale = d3.scaleLinear()
			.domain([ yMaxVal, 0 ])
			.range([ 0, canvasHeight - margin.top - margin.bottom ]);

		// axes
		var group = d3.select('#chart > svg > g');
		group.select('.x.axis')
			.call(d3.axisBottom(xScale))
			.attr('transform', 'translate(0,' + (canvasHeight - margin.top - margin.bottom) + ')');
		group.select('.y.axis')
			.call(d3.axisLeft(yScale));

		// y grid
    	var yGridUpdate = group.select('.grids').selectAll('.y.grid')
    		.data(yScale.ticks());
    	var yGridEnter = yGridUpdate.enter()
    		.append('line')
    		.attr('class', 'y grid');
    	yGridUpdate.merge(yGridEnter)
    		.attr('x1', 0)
    		.attr('x2', canvasWidth - margin.left - margin.right)
    		.attr('y1', function(d){ return yScale(d) })
    		.attr('y2', function(d){ return yScale(d) })
    		.attr('fill', 'none')
    		.attr('stroke', '#d3d3d3')
    		.attr('stroke-width', 1);
    	var yGridExit = yGridUpdate.exit()
			.remove();

		// x grid
		var xGridUpdate = group.select('.grids').selectAll('.x.grid')
    		.data(xScale.ticks());
    	var xGridEnter = xGridUpdate.enter()
    		.append('line')
    		.attr('class', 'x grid');
    	xGridUpdate.merge(xGridEnter)
    		.attr('x1', function(d){ return xScale(d) })
    		.attr('x2', function(d){ return xScale(d) })
    		.attr('y1', 0)
    		.attr('y2', canvasHeight - margin.top - margin.bottom)
    		.attr('fill', 'none')
    		.attr('stroke', '#d3d3d3')
    		.attr('stroke-width', 1);
    	var xGridExit = xGridUpdate.exit()
			.remove();

		// dots
		var dotUpdate = group.select('.plot').selectAll('circle')
			.data(data);
		var dotEnter = dotUpdate.enter()
			.append('circle')
		dotUpdate.merge(dotEnter)
			.attr('cx', function(d) { return xScale(d[xVar]) })
			.attr('cy', function(d) { return yScale(d[yVar]) })
			.style('r', 5)
			.style('fill', 'steelblue');
		var dotExit = dotUpdate.exit()
			.remove();
	}
}