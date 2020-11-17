const BD = {
	el: null,
	dotSelector: null,
	xAxisSelector: null,
	yAxisSelector: null,

	coordinates: null,
	correlation: null,

	detectBias: function(el, data) {
		const self = this;

		self.el = el;
		self.dotSelector = data.dot;
		self.xAxisSelector = data.xAxis;
		self.yAxisSelector = data.yAxis;

		self.getCoordinates();
		self.computeCorrelation();
		self.createAnimationButton();
		self.createImproveVisButton();
	},
	getCoordinates: function() {
		const self = this;
		var el = self.el;
		var dotSelector = self.dotSelector;
		var coordinates = [];

		d3.select(el).selectAll(dotSelector).each(function(d) {
			var x = +d3.select(this).attr('cx');
			var y = +d3.select(this).attr('cy');

			if (x != null && y != null)
				coordinates.push({ x: x, y: -y, el: this });
		});
		self.coordinates = coordinates;
	},
	computeCorrelation: function() {
		const self = this;
		var values = self.coordinates;
		var n = values.length;
		let meanX = 0;
		let meanY = 0;

		let num = 0;
		let den1 = 0;
		let den2 = 0;
		let den = 0;

		if (n == 0) return 0;

		for (var i = 0; i < n; i++) {
			meanX += values[i].x / n;
			meanY += values[i].y / n;
		}

		for (var i = 0; i < n; i++) {
			let dx = (values[i].x - meanX);
			let dy = (values[i].y - meanY);
			num += dx * dy
			den1 += dx * dx
			den2 += dy * dy
		}

		den = Math.sqrt(den1) * Math.sqrt(den2);
		if (den == 0) return 0;
		self.correlation = num / den;
	},
	createAnimationButton: function() {
		const self = this;
		var el = self.el;
		var bbox = el.getBoundingClientRect();

		$('body').append('<div class="animate-button fa fa-exclamation"></div>');
		$('.animate-button').last()
			.css({
				position: 'absolute',
				left: bbox.right + 10,
				top: bbox.top,
				background: '#ca3433',
				cursor: 'pointer',
				color: 'white',
				'border-radius': '50%',
				'font-size': 15,
				width: 28,
				height: 28,
				display: 'flex',
				'align-items': 'center',
				'justify-content': 'center',
				opacity: 0.5,
				transition: '0.3s'
			});

		self.initHoverAnimationButton();
		self.initClickAnimationButton();
	},
	createImproveVisButton: function() {
		const self = this;
		var el = self.el;
		var bbox = el.getBoundingClientRect();

		$('body').append('<div class="improve-button fa fa-check"></div>');
		$('.improve-button').last()
			.css({
				position: 'absolute',
				left: bbox.right + 10,
				top: bbox.top + 35,
				background: '#30c878',
				cursor: 'pointer',
				color: 'white',
				'border-radius': '50%',
				'font-size': 15,
				width: 28,
				height: 28,
				display: 'flex',
				'align-items': 'center',
				'justify-content': 'center',
				opacity: 0.5,
				transition: '0.3s'
			});

		self.initHoverImproveButton();
		self.initClickImproveButton();
	},
	initHoverAnimationButton: function() {
		$('.animate-button').hover(function() {
		    $(this).css('opacity', 1);
		}, function() {
			$(this).css('opacity', 0.5);
		});
	},
	initClickAnimationButton: function() {
		const self = this;

		$('.animate-button').last()
			.unbind('click')
			.on('click', onClickAnimationButton);

		function onClickAnimationButton() {
			var improveAnimation = [];

			$('.annotation').remove();
			self.addAnnotations();
			self.addCompressAnimtation(improveAnimation);
			self.addReturnAnimation(improveAnimation);
			self.addCorrectedAnimation(improveAnimation);
			self.animate(improveAnimation);
		}
	},
	initHoverImproveButton: function() {
		$('.improve-button').hover(function() {
		    $(this).css('opacity', 1);
		}, function() {
			$(this).css('opacity', 0.5);
		});
	},
	initClickImproveButton: function() {
		const self = this;
		var el = self.el;
		var correlation = Math.round((self.correlation + Number.EPSILON) * 100) / 100;

		$('.improve-button').last()
			.unbind('click')
			.on('click', onClickImproveButton);

		function onClickImproveButton() {
			var improveAnimation = [];

			$('.annotation').remove();
			$('body').append('<span id="annotation1" class="annotation"></span>');
			$('#annotation1')
				.css({
					'font-size': 25,
					 'font-family': 'Arial',
					 color: 'steelblue',
					 background: 'white',
					 padding: 5,
					 position: 'absolute',
					 border: '1px steelblue solid',
					 'border-radius': 2
				})
				.html('Correlation = ' + correlation);

			self.generateImproveAnimation(improveAnimation);
			self.animate(improveAnimation);
		}
	},
	generateImproveAnimation: function(improveAnimation) {
		const self = this;
		var el = self.el;
		var xAxisSelector = self.xAxisSelector;
		var yAxisSelector = self.yAxisSelector;
		var coordinates = self.coordinates;

		var xAxisEl = d3.select(el).select(xAxisSelector).node();
		var yAxisEl = d3.select(el).select(yAxisSelector).node();
		var plotBBox = el.getBoundingClientRect();
		var xAxisBBox = xAxisEl.getBoundingClientRect();
		var yAxisBBox = yAxisEl.getBoundingClientRect();

		var leftEdgeX = 0;
		var rightEdgeX = plotBBox.width - yAxisBBox.width;
		var topEdgeY = 0;
		var bottomEdgeY = plotBBox.height - xAxisBBox.height; 

		var xMinVal = d3.min(coordinates, function(d) { return d.x });
		var xMaxVal = d3.max(coordinates, function(d) { return d.x });
		var xRange = xMaxVal - xMinVal;
		var yMinVal = d3.min(coordinates, function(d) { return d.y });
		var yMaxVal = d3.max(coordinates, function(d) { return d.y });
		var yRange = yMaxVal - yMinVal;

		var xScale = d3.scaleLinear()
			.domain([ xMinVal - xRange * 0.1, xMaxVal + xRange * 0.1 ])
			.range([ leftEdgeX, rightEdgeX ]);
		var yScale = d3.scaleLinear()
			.domain([ yMinVal - yRange * 0.1, yMaxVal + yRange * 0.1 ])
			.range([ bottomEdgeY, topEdgeY ]);

		improveAnimation.push({
			el: xAxisEl,
			from: { opacity: 1 },
			to: { opacity: 0, duration: 0 },
			startTime: 0
		});
		improveAnimation.push({
			el: yAxisEl,
			from: { opacity: 1 },
			to: { opacity: 0, duration: 0 },
			startTime: 0
		});

		for (var i = 0; i < coordinates.length; i++) {
			var data = coordinates[i];
			var animationObject = {
				el: data.el,
				from: { attr: { cx: data.x } },
				to: { attr: { cx: xScale(data.x) }, duration: 0.3 },
				startTime: 0
			}
			improveAnimation.push(animationObject);
		}

		for (var i = 0; i < coordinates.length; i++) {
			var data = coordinates[i];
			var animationObject = {
				el: data.el,
				from: { attr: { cy: -data.y } },
				to: { attr: { cy: yScale(data.y) }, duration: 0.3 },
				startTime: 0.3
			}
			improveAnimation.push(animationObject);
		}

		improveAnimation.push({
			el: '#annotation1',
			from: { opacity: 0, top: plotBBox.top - 15, left: plotBBox.left - 15 },
			to: { opacity: 1, top: plotBBox.top, left: plotBBox.left, duration: 0.3 },
			startTime: 0.6
		});
	},

	// initClickAnimationButton

	addAnnotations: function() {
		const self = this;

		$('body').append('<span class="annotation"></span>');
		// Aspect ratio has huge impact on correlation perception
		// As we compress the points, they become a straight line
		// A straight line indicates a perfect correlation
		// Clearly, your data does not show a perfect correlation
		// The original aspect ratio of your plots is too high
		// We corrected the plot for you, and it shows a correlation = ' + correlation'
	
		$('.annotation')
			.css({
				'font-size': 25,
				 'font-family': 'Arial',
				 color: 'steelblue',
				 background: 'white',
				 padding: 5,
				 position: 'absolute',
				 border: '1px steelblue solid',
				 'border-radius': 2
			});
	},
	addCompressAnimtation: function(improveAnimation) {
		const self = this;
		var el = self.el;
		var xAxisSelector = self.xAxisSelector;
		var yAxisSelector = self.yAxisSelector;
		var coordinates = self.coordinates;

		var xAxisEl = d3.select(el).select(xAxisSelector).node();
		var yAxisEl = d3.select(el).select(yAxisSelector).node();
		var plotBBox = el.getBoundingClientRect();
		var xAxisBBox = xAxisEl.getBoundingClientRect();
		var yAxisBBox = yAxisEl.getBoundingClientRect();

		var topEdgeY = 0;
		var bottomEdgeY = plotBBox.height - xAxisBBox.height; 

		var xMaxVal = d3.max(coordinates, function(d) { return d.x });
		var yMinVal = d3.min(coordinates, function(d) { return d.y });
		var yMaxVal = d3.max(coordinates, function(d) { return d.y });
		var yRange = yMaxVal - yMinVal;

		var yScale = d3.scaleLinear()
			.domain([ yMinVal - yRange * 0.1, yMaxVal + yRange * 0.1 ])
			.range([ bottomEdgeY, topEdgeY ]);

		improveAnimation.push({
			el: '.annotation',
			from: { opacity: 0, top: plotBBox.top + plotBBox.height - 15, left: plotBBox.left - 15
				, onStart: function() { $('.annotation').html('Aspect ratio has huge impact on correlation perception') } },
			to: { opacity: 1, top: plotBBox.top + plotBBox.height, left: plotBBox.left, duration: 0.2 },
			startTime: 0
		});

		for (var i = 0; i < coordinates.length; i++) {
			var data = coordinates[i];
			var animationObject = {
				el: data.el,
				from: { attr: { cx: data.x } },
				to: { attr: { cx: xMaxVal }, duration: 0.3 },
				startTime: 1
			}
			improveAnimation.push(animationObject);
		}

		for (var i = 0; i < coordinates.length; i++) {
			var data = coordinates[i];
			var animationObject = {
				el: data.el,
				from: { attr: { cy: -data.y } },
				to: { attr: { cy: yScale(data.y) }, duration: 0.3 },
				startTime: 1.3
			}
			improveAnimation.push(animationObject);
		}

		improveAnimation.push({
			el: '.annotation',
			from: { opacity: 0, top: plotBBox.top + plotBBox.height - 15, left: plotBBox.left - 15
				, onStart: function() { $('.annotation').html('As we compress the points, they become a straight line') } },
			to: { opacity: 1, top: plotBBox.top + plotBBox.height, left: plotBBox.left, duration: 0.2 },
			startTime: 1.6
		});

		improveAnimation.push({
			el: '.annotation',
			from: { opacity: 0, top: plotBBox.top + plotBBox.height - 15, left: plotBBox.left - 15
				, onStart: function() { $('.annotation').html('A straight line indicates a perfect correlation') } },
			to: { opacity: 1, top: plotBBox.top + plotBBox.height, left: plotBBox.left, duration: 0.2 },
			startTime: 2.6
		});
	},
	addReturnAnimation: function(improveAnimation) {
		const self = this;
		var el = self.el;
		var coordinates = self.coordinates;
		var plotBBox = el.getBoundingClientRect();

		for (var i = 0; i < coordinates.length; i++) {
			var data = coordinates[i];
			var animationObject = {
				el: data.el,
				from: {},
				to: { attr: { cx: data.x, cy: -data.y }, duration: 0.3 },
				startTime: 3.6
			}
			improveAnimation.push(animationObject);
		}

		improveAnimation.push({
			el: '.annotation',
			from: { opacity: 0, top: plotBBox.top + plotBBox.height - 15, left: plotBBox.left - 15
				, onStart: function() { $('.annotation').html('The original aspect ratio of your plots is too high') } },
			to: { opacity: 1, top: plotBBox.top + plotBBox.height, left: plotBBox.left, duration: 0.2 },
			startTime: 3.9
		});
	},
	addCorrectedAnimation: function(improveAnimation) {
		const self = this;
		var el = self.el;
		var xAxisSelector = self.xAxisSelector;
		var yAxisSelector = self.yAxisSelector;
		var coordinates = self.coordinates;

		var xAxisEl = d3.select(el).select(xAxisSelector).node();
		var yAxisEl = d3.select(el).select(yAxisSelector).node();
		var plotBBox = el.getBoundingClientRect();
		var xAxisBBox = xAxisEl.getBoundingClientRect();
		var yAxisBBox = yAxisEl.getBoundingClientRect();

		var leftEdgeX = 0;
		var rightEdgeX = plotBBox.width - yAxisBBox.width;
		var topEdgeY = 0;
		var bottomEdgeY = plotBBox.height - xAxisBBox.height; 

		var xMinVal = d3.min(coordinates, function(d) { return d.x });
		var xMaxVal = d3.max(coordinates, function(d) { return d.x });
		var xRange = xMaxVal - xMinVal;
		var yMinVal = d3.min(coordinates, function(d) { return d.y });
		var yMaxVal = d3.max(coordinates, function(d) { return d.y });
		var yRange = yMaxVal - yMinVal;

		var xScale = d3.scaleLinear()
			.domain([ xMinVal - xRange * 0.1, xMaxVal + xRange * 0.1 ])
			.range([ leftEdgeX, rightEdgeX ]);
		var yScale = d3.scaleLinear()
			.domain([ yMinVal - yRange * 0.1, yMaxVal + yRange * 0.1 ])
			.range([ bottomEdgeY, topEdgeY ]);

		var correlation = Math.round((self.correlation + Number.EPSILON) * 100) / 100;

		for (var i = 0; i < coordinates.length; i++) {
			var data = coordinates[i];
			var animationObject = {
				el: data.el,
				from: { attr: { cx: data.x } },
				to: { attr: { cx: xScale(data.x) }, duration: 0.3 },
				startTime: 4.9
			}
			improveAnimation.push(animationObject);
		}

		for (var i = 0; i < coordinates.length; i++) {
			var data = coordinates[i];
			var animationObject = {
				el: data.el,
				from: { attr: { cy: -data.y } },
				to: { attr: { cy: yScale(data.y) }, duration: 0.3 },
				startTime: 5.2
			}
			improveAnimation.push(animationObject);
		}

		improveAnimation.push({
			el: '.annotation',
			from: { opacity: 0, top: plotBBox.top + plotBBox.height - 15, left: plotBBox.left - 15
				, onStart: function() { $('.annotation').html('We corrected the plot for you, and it shows a correlation = ' + correlation) } },
			to: { opacity: 1, top: plotBBox.top + plotBBox.height, left: plotBBox.left, duration: 0.2 },
			startTime: 5.5
		});
	},
	animate: function(improveAnimation) {
		var tl = gsap.timeline();

		for (var i = 0; i < improveAnimation.length; i++) {
			var data = improveAnimation[i];
			tl.fromTo(data.el, data.from, data.to, data.startTime);
		}
	}
}