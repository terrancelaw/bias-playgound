const Scatterplot = {
	margin: { top: 50, left: 50, bottom: 50, right: 50 },
	x: 'life expectancy',
	y: 'percentage of people who have poor health',
	leftEdgeVal: null,
	rightEdgeVal: null,
	bottomEdgeVal: null,
	topEdgeVal: null,

	init: function() {
		const self = this;
		var data = Database.data;
		var margin = self.margin;
		var xVar = self.x;
		var yVar = self.y;

		var group = d3.select('#chart > svg').append('g')
			.attr('transform', 'translate(' + [ margin.left, margin.top ] + ')');

		group.append('g').attr('class', 'x axis');
    	group.append('g').attr('class', 'y axis');
    	group.append('g').attr('class', 'grids');

    	group.append('line').attr('class', 'left bound');
    	group.append('line').attr('class', 'right bound');
    	group.append('line').attr('class', 'top bound');
    	group.append('line').attr('class', 'bottom bound');

    	group.append('g').attr('class', 'plot');

    	self.leftEdgeVal = 0;
    	self.bottomEdgeVal = 0;
    	self.rightEdgeVal = d3.max(data, function(d) { return d[xVar] });
		self.topEdgeVal = d3.max(data, function(d) { return d[yVar] });
	},
	draw: function() {
		const self = this;
		var data = Database.data;

		var xVar = self.x;
		var yVar = self.y;
		var margin = self.margin;
		var leftEdgeVal = self.leftEdgeVal;
		var bottomEdgeVal = self.bottomEdgeVal;
		var rightEdgeVal = self.rightEdgeVal;
		var topEdgeVal = self.topEdgeVal;
		
		var canvasWidth = $('#chart > svg').width();
		var canvasHeight = $('#chart > svg').height();
		
		var xScale = d3.scaleLinear()
			.domain([ leftEdgeVal, rightEdgeVal ])
			.range([ 0, canvasWidth - margin.left - margin.right ]);
		var yScale = d3.scaleLinear()
			.domain([ topEdgeVal, bottomEdgeVal ])
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
	},
	drawBBox: function() {
		const self = this;
		var data = Database.data;

		var xVar = self.x;
		var yVar = self.y;
		var margin = self.margin;
		var leftEdgeVal = self.leftEdgeVal;
		var bottomEdgeVal = self.bottomEdgeVal;
		var rightEdgeVal = self.rightEdgeVal;
		var topEdgeVal = self.topEdgeVal;
		
		var canvasWidth = $('#chart > svg').width();
		var canvasHeight = $('#chart > svg').height();

		var xExtent = d3.extent(data, function(d) { return d[xVar] });
		var yExtent = d3.extent(data, function(d) { return d[yVar] });
		
		var xScale = d3.scaleLinear()
			.domain([ leftEdgeVal, rightEdgeVal ])
			.range([ 0, canvasWidth - margin.left - margin.right ]);
		var yScale = d3.scaleLinear()
			.domain([ topEdgeVal, bottomEdgeVal ])
			.range([ 0, canvasHeight - margin.top - margin.bottom ]);

		var group = d3.select('#chart > svg > g');

		group.select('.left.bound')
			.attr('x1', xScale(xExtent[0]))
			.attr('x2', xScale(xExtent[0]))
			.attr('y1', yScale(yExtent[0]))
			.attr('y2', yScale(yExtent[1]));
		group.select('.right.bound')
			.attr('x1', xScale(xExtent[1]))
			.attr('x2', xScale(xExtent[1]))
			.attr('y1', yScale(yExtent[0]))
			.attr('y2', yScale(yExtent[1]));
		group.select('.top.bound')
			.attr('x1', xScale(xExtent[0]))
			.attr('x2', xScale(xExtent[1]))
			.attr('y1', yScale(yExtent[1]))
			.attr('y2', yScale(yExtent[1]));
		group.select('.bottom.bound')
			.attr('x1', xScale(xExtent[0]))
			.attr('x2', xScale(xExtent[1]))
			.attr('y1', yScale(yExtent[0]))
			.attr('y2', yScale(yExtent[0]));
	},
	initDrag: function() {
		const self = this;
		
		self.initDragLeft();
		self.initDragRight();
		self.initDragTop();
		self.initDragBottom();
	},
	initDragLeft: function() {
		const self = this;
		var data = Database.data;
		var margin = self.margin;
		var xVar = self.x;
		var minVal = d3.min(data, function(d) { return d[xVar] });
		var maxVal = d3.max(data, function(d) { return d[xVar] });

		var dragBehaviour = d3.drag()
			.on('start', onDrag)
			.on('drag', onDrag);

		var group = d3.select('#chart > svg > g');
		group.select('.left.bound')
			.call(dragBehaviour);

		function onDrag(event) {
			var canvasWidth = $('#chart > svg').width();

			var leftHandleX = event.x < 0 ? 0 : event.x;
			var leftHandleVal = minVal;
			var rightHandleX = +d3.select('#chart > svg > g > .right.bound').attr('x1');
			var rightHandleVal = maxVal;

			var rightEdgeX = canvasWidth - margin.left - margin.right;
			var rightEdgeVal = (rightEdgeX - rightHandleX) / (rightHandleX - leftHandleX) * (rightHandleVal - leftHandleVal) + rightHandleVal;
			var leftEdgeX = 0;
			var leftEdgeVal = leftHandleVal - (leftHandleX - leftEdgeX) / (rightHandleX - leftHandleX) * (rightHandleVal - leftHandleVal);

			self.rightEdgeVal = rightEdgeVal;
			self.leftEdgeVal = leftEdgeVal;
			self.drawBBox();
			self.draw();
		}
	},
	initDragRight: function() {
		const self = this;
		var margin = self.margin;
		var data = Database.data;
		var margin = self.margin;
		var xVar = self.x;
		var minVal = d3.min(data, function(d) { return d[xVar] });
		var maxVal = d3.max(data, function(d) { return d[xVar] });

		var dragBehaviour = d3.drag()
			.on('start', onDrag)
			.on('drag', onDrag);

		var group = d3.select('#chart > svg > g');
		group.select('.right.bound')
			.call(dragBehaviour);

		function onDrag(event) {
			var canvasWidth = $('#chart > svg').width();
			var svgWidth = canvasWidth - margin.left - margin.right;

			var rightHandleX = event.x > svgWidth ? svgWidth : event.x;
			var rightHandleVal = maxVal;
			var leftHandleX = +d3.select('#chart > svg > g > .left.bound').attr('x1');
			var leftHandleVal = minVal;

			var rightEdgeX = canvasWidth - margin.left - margin.right;
			var rightEdgeVal = (rightEdgeX - rightHandleX) / (rightHandleX - leftHandleX) * (rightHandleVal - leftHandleVal) + rightHandleVal;
			var leftEdgeX = 0;
			var leftEdgeVal = leftHandleVal - (leftHandleX - leftEdgeX) / (rightHandleX - leftHandleX) * (rightHandleVal - leftHandleVal);

			self.rightEdgeVal = rightEdgeVal;
			self.leftEdgeVal = leftEdgeVal;
			self.drawBBox();
			self.draw();
		}
	},
	initDragTop: function() {
		const self = this;
		var data = Database.data;
		var margin = self.margin;
		var yVar = self.y;
		var minVal = d3.min(data, function(d) { return d[yVar] });
		var maxVal = d3.max(data, function(d) { return d[yVar] });

		var dragBehaviour = d3.drag()
			.on('start', onDrag)
			.on('drag', onDrag);

		var group = d3.select('#chart > svg > g');
		group.select('.top.bound')
			.call(dragBehaviour);

		function onDrag(event) {
			var canvasHeight = $('#chart > svg').height();
			var svgHeight = canvasHeight - margin.top - margin.bottom;

			var topHandleY = event.y < 0 ? 0 : event.y;
			var topHandleVal = maxVal;
			var bottomHandleY = +d3.select('#chart > svg > g > .bottom.bound').attr('y1');
			var bottomHandleVal = minVal;

			var bottomEdgeY = svgHeight;
			var bottomEdgeVal = (bottomEdgeY - bottomHandleY) / (bottomHandleY - topHandleY) * (bottomHandleVal - topHandleVal) + bottomHandleVal;
			var topEdgeY = 0;
			var topEdgeVal = (topEdgeY - topHandleY) / (topHandleY - bottomHandleY) * (topHandleVal - bottomHandleVal) + topHandleVal;

			self.topEdgeVal = topEdgeVal;
			self.bottomEdgeVal = bottomEdgeVal;
			self.drawBBox();
			self.draw();
		}
	},
	initDragBottom: function() {
		const self = this;
		var data = Database.data;
		var margin = self.margin;
		var yVar = self.y;
		var minVal = d3.min(data, function(d) { return d[yVar] });
		var maxVal = d3.max(data, function(d) { return d[yVar] });

		var dragBehaviour = d3.drag()
			.on('start', onDrag)
			.on('drag', onDrag);

		var group = d3.select('#chart > svg > g');
		group.select('.bottom.bound')
			.call(dragBehaviour);

		function onDrag(event) {
			var canvasHeight = $('#chart > svg').height();
			var svgHeight = canvasHeight - margin.top - margin.bottom;

			var bottomHandleY = event.y > svgHeight ? svgHeight :event.y ;
			var bottomHandleVal = minVal;
			var topHandleY = +d3.select('#chart > svg > g > .top.bound').attr('y1');
			var topHandleVal = maxVal;

			var bottomEdgeY = svgHeight;
			var bottomEdgeVal = (bottomEdgeY - bottomHandleY) / (bottomHandleY - topHandleY) * (bottomHandleVal - topHandleVal) + bottomHandleVal;
			var topEdgeY = 0;
			var topEdgeVal = (topEdgeY - topHandleY) / (topHandleY - bottomHandleY) * (topHandleVal - bottomHandleVal) + topHandleVal;

			
			self.topEdgeVal = topEdgeVal;
			self.bottomEdgeVal = bottomEdgeVal;
			self.drawBBox();
			self.draw();
		}
	},
	initButton: function() {
		const self = this;

		$('#chart > .button')
			.on('click', onClickButton);

		function onClickButton() {
			var needToHide = $(this).hasClass('show');

			if (needToHide) {
				var group = d3.select('#chart > svg > g');
				$(this).removeClass('show');
				group.selectAll('.bound').style('display', 'none');
			}

			if (!needToHide) { // show
				var group = d3.select('#chart > svg > g');
				$(this).addClass('show');
				group.selectAll('.bound').style('display', null);
			}
		}
	}
}