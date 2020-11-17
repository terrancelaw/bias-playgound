const BD = {
	detectBias: function(el, data) {
		const self = this;
		var dotSelector = data.dot;
		var xAxisSelector = data.xAxis;
		var yAxisSelector = data.yAxis;
		var gridSelector = data.grid;
		var plotBBox = el.getBoundingClientRect();
		var xAxisBBox = d3.select(el).select(xAxisSelector).node().getBoundingClientRect();
		var yAxisBBox = d3.select(el).select(yAxisSelector).node().getBoundingClientRect();
		var data = {
			scatterplotEl: el,
			dotSelector: dotSelector,
			xAxisSelector: xAxisSelector,
			yAxisSelector: yAxisSelector,
			gridSelector: gridSelector,

			plotBBox: plotBBox,
			xAxisBBox: xAxisBBox,
			yAxisBBox: yAxisBBox,

			currentSlide: 0,
			animationList: []
		};

		self.initPoints(data);
		self.inferCoordinates(data);
		self.inferXValues(data);
		self.inferYValues(data);
		self.computeCorrelation(data);

		self.createImproveVisButton(data);
		self.initHoverImproveButton();
		self.initClickImproveButton();

		self.createAnimateVisButton(data);
		self.initHoverAnimateButton();
		self.initClickAnimateButton();

		self.createUndoButton(data); 
		self.initHoverUndoButton();
		self.initClickUndoButton();
	},
	initPoints: function(data) {
		var scatterplotEl = data.scatterplotEl;
		var dotSelector = data.dotSelector;
		var points = [];

		d3.select(scatterplotEl).selectAll(dotSelector).each(function(d) {
			points.push({ el: this });
		});

		data.points = points;
	},
	inferCoordinates: function(data) {
		var points = data.points;

		for (var i = 0; i < points.length; i++) {
			var point = points[i];
			var el = point.el;
			var bbox = el.getBoundingClientRect();
			var cx = +d3.select(el).attr('cx');
			var cy = +d3.select(el).attr('cy');
			var bx = bbox.x;
			var by = bbox.y;
			point.cx = cx;
			point.cy = cy;
			point.bx = bx;
			point.by = by;
		}
	},
	inferXValues: function(data) {
		var points = data.points;
		var scatterplotEl = data.scatterplotEl;
		var xAxisSelector = data.xAxisSelector;
		var xAxisTicks = [];
		var xScale = d3.scaleLinear();

		d3.select(scatterplotEl).select(xAxisSelector).selectAll('text').each(function() {
			var textEl = this;
			var textBBox = null;
			var text = d3.select(this).text();
			var isNumber = !isNaN(text);

			if (isNumber) {
				textBBox = textEl.getBoundingClientRect();
				xAxisTicks.push({ value: +text, bx: textBBox.x + textBBox.width / 2 });
			}
		});

		if (xAxisTicks.length > 0) {
			xScale.domain(d3.extent(xAxisTicks, function(d) { return d.value }));
			xScale.range(d3.extent(xAxisTicks, function(d) { return d.bx }));
		}

		for (var i = 0; i < points.length; i++) {
			var point = points[i];
			var bx = point.bx;
			var xValue = xScale.invert(bx);
			point.xValue = xValue;
		}

		data.xAxisTicks = xAxisTicks;
	},
	inferYValues: function(data) {
		var points = data.points;
		var scatterplotEl = data.scatterplotEl;
		var yAxisSelector = data.yAxisSelector;
		var yAxisTicks = [];
		var yScale = d3.scaleLinear();

		d3.select(scatterplotEl).select(yAxisSelector).selectAll('text').each(function() {
			var textEl = this;
			var textBBox = null;
			var text = d3.select(this).text();
			var isNumber = !isNaN(text);

			if (isNumber) {
				textBBox = textEl.getBoundingClientRect();
				yAxisTicks.push({ value: +text, by: textBBox.y + textBBox.height / 2 });
			}
		});

		if (yAxisTicks.length > 0) {
			var rangeExtent = d3.extent(yAxisTicks, function(d) { return d.by });
			yScale.domain(d3.extent(yAxisTicks, function(d) { return d.value }));
			yScale.range([ rangeExtent[1], rangeExtent[0] ]);
		}

		for (var i = 0; i < points.length; i++) {
			var point = points[i];
			var by = point.by;
			var yValue = yScale.invert(by);
			point.yValue = yValue;
		}

		data.yAxisTicks = yAxisTicks;
	},
	computeCorrelation: function(data) {
		var points = data.points;
		var n = points.length;
		let meanX = 0;
		let meanY = 0;

		let num = 0;
		let den1 = 0;
		let den2 = 0;
		let den = 0;

		if (n == 0) return 0;

		for (var i = 0; i < n; i++) {
			meanX += points[i].xValue / n;
			meanY += points[i].yValue / n;
		}

		for (var i = 0; i < n; i++) {
			let dx = (points[i].xValue - meanX);
			let dy = (points[i].yValue - meanY);
			num += dx * dy
			den1 += dx * dx
			den2 += dy * dy
		}

		den = Math.sqrt(den1) * Math.sqrt(den2);
		if (den == 0) return 0;
		data.correlation = num / den;
	},

	// improve vis

	createImproveVisButton: function(improveData) {
		var improveButtonEl = null;

		$('body').append('<div class="improve-button fa fa-check"></div>');
		improveButtonEl = $('.improve-button').last()[0];

		$(improveButtonEl).css({
			position: 'absolute',
			left: improveData.plotBBox.left + improveData.plotBBox.width + 10,
			top: improveData.plotBBox.top + 35,
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

		d3.select(improveButtonEl).datum(improveData);
	},
	initHoverImproveButton: function() {
		$('.improve-button').last()
			.hover(function() {
			    $(this).css('opacity', 1);
			}, function() {
				$(this).css('opacity', 0.5);
			});
	},
	initClickImproveButton: function() {
		$('.improve-button').last()
			.unbind('click')
			.on('click', onClickImproveButton);

		function onClickImproveButton() {
			var improveData = d3.select(this).datum();

			improveData.currentSlide = 0;
			improveData.animationList = [];
			addAnotation();
			hideOriginalAxes(this);
			hideOriginalGrids(this);
			createNewAxes(this);
			addXTransitionAnimation(this);
			addYTransitionAnimation(this);
			addCorrelationTextAnimation(this);
			animate(this);
		}

		function addAnotation() {
			$('#my-annotation').remove();
			$('body').append('<span id="my-annotation"></span>');
			$('#my-annotation')
				.css({
					'font-size': 25,
					 'font-family': 'Arial',
					 color: 'steelblue',
					 background: 'white',
					 padding: 5,
					 position: 'absolute',
					 border: '1px steelblue solid',
					 'border-radius': 2,
					 opacity: 0
				});
		}

		function hideOriginalAxes(improveButtonEl) {
			var improveData = d3.select(improveButtonEl).datum();
			var scatterplotEl = improveData.scatterplotEl;
			var xAxisSelector = improveData.xAxisSelector;
			var yAxisSelector = improveData.yAxisSelector;

			d3.select(scatterplotEl).select(xAxisSelector).selectAll('*')
				.style('opacity', 0);
			d3.select(scatterplotEl).select(yAxisSelector).selectAll('*')
				.style('opacity', 0);
		}

		function hideOriginalGrids(improveButtonEl) {
			var improveData = d3.select(improveButtonEl).datum();
			var scatterplotEl = improveData.scatterplotEl;
			var gridSelector = improveData.gridSelector;

			d3.select(scatterplotEl).select(gridSelector)
				.style('opacity', 0);
		}

		function createNewAxes(improveButtonEl) {
			var improveData = d3.select(improveButtonEl).datum();
			var scatterplotEl = improveData.scatterplotEl;
			var xAxisSelector = improveData.xAxisSelector;
			var yAxisSelector = improveData.yAxisSelector;
			var xAxisTicks = improveData.xAxisTicks;
			var yAxisTicks = improveData.yAxisTicks;
			var plotBBox = improveData.plotBBox;
			var xAxisBBox = improveData.xAxisBBox;
			var yAxisBBox = improveData.yAxisBBox;

			var leftX = 0;
			var rightX = plotBBox.width - yAxisBBox.width;
			var topY = 0;
			var bottomY = plotBBox.height - xAxisBBox.height;

			var xScale = d3.scaleLinear()
				.domain(d3.extent(xAxisTicks, function(d) { return d.value }))
				.range([ leftX, rightX ]);
			var yScale = d3.scaleLinear()
				.domain(d3.extent(yAxisTicks, function(d) { return d.value }))
				.range([ bottomY, topY ]);

			d3.select(scatterplotEl).select(xAxisSelector).selectAll('.my-axis')
				.remove();
			d3.select(scatterplotEl).select(xAxisSelector).append('g')
				.attr('class', 'my-axis')
				.call(d3.axisBottom(xScale));
			d3.select(scatterplotEl).select(yAxisSelector).selectAll('.my-axis')
				.remove();
			d3.select(scatterplotEl).select(yAxisSelector).append('g')
				.attr('class', 'my-axis')
				.call(d3.axisLeft(yScale));
		}

		function addXTransitionAnimation(improveButtonEl) {
			var improveData = d3.select(improveButtonEl).datum();
			var scatterplotEl = improveData.scatterplotEl;
			var xAxisSelector = improveData.xAxisSelector;
			var animationList = improveData.animationList;
			var points = improveData.points;
			var plotBBox = improveData.plotBBox;
			var yAxisBBox = improveData.yAxisBBox;

			var xMinVal = d3.min(points, function(d) { return d.xValue });
			var xMaxVal = d3.max(points, function(d) { return d.xValue });
			var xRange = xMaxVal - xMinVal;
			var leftEdgeX = 0;
			var rightEdgeX = plotBBox.width - yAxisBBox.width;
			var xScale = d3.scaleLinear()
				.domain([ xMinVal - xRange * 0.1, xMaxVal + xRange * 0.1 ])
				.range([ leftEdgeX, rightEdgeX ]);

			for (var i = 0; i < points.length; i++) {
				var data = points[i];
				var animationObject = {
					el: data.el,
					from: { attr: { cx: data.cx } },
					to: { attr: { cx: xScale(data.xValue) }, duration: 0.3 },
					startTime: 0
				}
				animationList.push(animationObject);
			}

			if (animationList.length > 0)
				animationList[0].from.onStart = function() { // animate axis
					d3.select(scatterplotEl).select(xAxisSelector).select('.my-axis')
						.transition()
						.duration(300)
						.call(d3.axisBottom(xScale));
				}
		}

		function addYTransitionAnimation(improveButtonEl) {
			var improveData = d3.select(improveButtonEl).datum();
			var scatterplotEl = improveData.scatterplotEl;
			var yAxisSelector = improveData.yAxisSelector;
			var animationList = improveData.animationList;
			var points = improveData.points;
			var plotBBox = improveData.plotBBox;
			var xAxisBBox = improveData.xAxisBBox;

			var yMinVal = d3.min(points, function(d) { return d.yValue });
			var yMaxVal = d3.max(points, function(d) { return d.yValue });
			var yRange = yMaxVal - yMinVal;
			var topEdgeY = 0;
			var bottomEdgeY = plotBBox.height - xAxisBBox.height; 
			var yScale = d3.scaleLinear()
				.domain([ yMinVal - yRange * 0.1, yMaxVal + yRange * 0.1 ])
				.range([ bottomEdgeY, topEdgeY ]);
			var startIndex = animationList.length;

			for (var i = 0; i < points.length; i++) {
				var data = points[i];
				var animationObject = {
					el: data.el,
					from: { attr: { cy: data.cy } },
					to: { attr: { cy: yScale(data.yValue) }, duration: 0.3 },
					startTime: 0.3
				}
				animationList.push(animationObject);
			}

			if (animationList.length > startIndex)
				animationList[startIndex].to.onStart = function() { // animate axis
					d3.select(scatterplotEl).select(yAxisSelector).select('.my-axis')
						.transition()
						.duration(300)
						.call(d3.axisLeft(yScale));
				}
		}

		function addCorrelationTextAnimation(improveButtonEl) {
			var improveData = d3.select(improveButtonEl).datum();
			var animationList = improveData.animationList;
			var correlation = improveData.correlation;
			var plotBBox = improveData.plotBBox;

			correlation = Math.round((correlation + Number.EPSILON) * 100) / 100;

			animationList.push({
				el: '#my-annotation',
				from: { opacity: 0, top: plotBBox.top - 15, left: plotBBox.left - 15
					, onStart: function() { $('#my-annotation').html('Correlation = ' + correlation) } },
				to: { opacity: 1, top: plotBBox.top, left: plotBBox.left, duration: 0.3 },
				startTime: 0.6
			});
		}

		function animate(improveButtonEl) {
			var improveData = d3.select(improveButtonEl).datum();
			var animationList = improveData.animationList;
			var tl = gsap.timeline();

			for (var i = 0; i < animationList.length; i++) {
				var data = animationList[i];
				tl.fromTo(data.el, data.from, data.to, data.startTime);
			}
		}
	},

	// improve vis

	createAnimateVisButton: function(animateData) {
		var animateButtonEl = null;

		$('body').append('<div class="animate-button fa fa-exclamation"></div>');
		animateButtonEl = $('.animate-button').last()[0];

		$(animateButtonEl)
			.css({
				position: 'absolute',
				left: animateData.plotBBox.left + animateData.plotBBox.width + 10,
				top: animateData.plotBBox.top,
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

		d3.select(animateButtonEl).datum(animateData);
	},
	initHoverAnimateButton: function() {
		$('.animate-button').last()
			.hover(function() {
			    $(this).css('opacity', 1);
			}, function() {
				$(this).css('opacity', 0.5);
			});
	},
	initClickAnimateButton: function() {
		$('.animate-button').last()
			.unbind('click')
			.on('click', onClickAnimateButton);

		function onClickAnimateButton() {
			var animateData = d3.select(this).datum();
			var currentSlide = animateData.currentSlide;

			if (currentSlide == 0) {
				animateData.animationList = [];
				addAnotation();
				hideOriginalAxes(this);
				hideOriginalGrids(this);
				createNewAxes(this);
				addRestoreTransitionAnimation(this);
				addIntroTextAnimation(this);
				animate(this);
				animateData.currentSlide++;
			}
			else if (currentSlide == 1) {
				animateData.animationList = [];
				addXTransitionAnimation(this);
				addYTransitionAnimation(this);
				addStlineTextAnimation(this);
				animate(this);
				animateData.currentSlide++;
			}
			else if (currentSlide == 2) {
				animateData.animationList = [];
				addStlineCorrTextAnimation(this);
				animate(this);
				animateData.currentSlide++;
			}
			else if (currentSlide == 3) {
				animateData.animationList = [];
				addHoweverTextAnimation(this);
				animate(this);
				animateData.currentSlide++;
			}
			else if (currentSlide == 4) {
				animateData.animationList = [];
				addRestoreTransitionAnimation(this);
				addHighAspectTextAnimation(this);
				animate(this);
				animateData.currentSlide++;
			}
			else if (currentSlide == 5) {
				animateData.animationList = [];
				addCorrectedXTransitionAnimation(this);
				addCorrectedYTransitionAnimation(this);
				addCorrectionTextAnimation(this);
				animate(this);
				animateData.currentSlide = 0;
			}
		}

		function addAnotation() {
			$('#my-annotation').remove();
			$('body').append('<span id="my-annotation"></span>');
			$('#my-annotation')
				.css({
					'font-size': 25,
					 'font-family': 'Arial',
					 color: 'steelblue',
					 background: 'white',
					 padding: 5,
					 position: 'absolute',
					 border: '1px steelblue solid',
					 'border-radius': 2,
					 opacity: 0
				});
		}

		function hideOriginalAxes(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var scatterplotEl = animateData.scatterplotEl;
			var xAxisSelector = animateData.xAxisSelector;
			var yAxisSelector = animateData.yAxisSelector;

			d3.select(scatterplotEl).select(xAxisSelector).selectAll('*')
				.style('opacity', 0);
			d3.select(scatterplotEl).select(yAxisSelector).selectAll('*')
				.style('opacity', 0);
		}

		function hideOriginalGrids(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var scatterplotEl = animateData.scatterplotEl;
			var gridSelector = animateData.gridSelector;

			d3.select(scatterplotEl).select(gridSelector)
				.style('opacity', 0);
		}

		function createNewAxes(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var scatterplotEl = animateData.scatterplotEl;
			var xAxisSelector = animateData.xAxisSelector;
			var yAxisSelector = animateData.yAxisSelector;
			var xAxisTicks = animateData.xAxisTicks;
			var yAxisTicks = animateData.yAxisTicks;
			var plotBBox = animateData.plotBBox;
			var xAxisBBox = animateData.xAxisBBox;
			var yAxisBBox = animateData.yAxisBBox;

			var leftX = 0;
			var rightX = plotBBox.width - yAxisBBox.width;
			var topY = 0;
			var bottomY = plotBBox.height - xAxisBBox.height;

			var xScale = d3.scaleLinear()
				.domain(d3.extent(xAxisTicks, function(d) { return d.value }))
				.range([ leftX, rightX ]);
			var yScale = d3.scaleLinear()
				.domain(d3.extent(yAxisTicks, function(d) { return d.value }))
				.range([ bottomY, topY ]);

			d3.select(scatterplotEl).select(xAxisSelector).selectAll('.my-axis')
				.remove();
			d3.select(scatterplotEl).select(xAxisSelector).append('g')
				.attr('class', 'my-axis')
				.call(d3.axisBottom(xScale));
			d3.select(scatterplotEl).select(yAxisSelector).selectAll('.my-axis')
				.remove();
			d3.select(scatterplotEl).select(yAxisSelector).append('g')
				.attr('class', 'my-axis')
				.call(d3.axisLeft(yScale));
		}

		function addIntroTextAnimation(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var animationList = animateData.animationList;
			var correlation = animateData.correlation;
			var plotBBox = animateData.plotBBox;

			animationList.push({
				el: '#my-annotation',
				from: { opacity: 0, top: plotBBox.top + plotBBox.height - 15, left: plotBBox.left - 15
					, onStart: function() { $('#my-annotation').html('Aspect ratio has huge impact on correlation perception') } },
				to: { opacity: 1, top: plotBBox.top + plotBBox.height, left: plotBBox.left, duration: 0.2 },
				startTime: 0
			});
		}

		function addXTransitionAnimation(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var scatterplotEl = animateData.scatterplotEl;
			var xAxisSelector = animateData.xAxisSelector;
			var animationList = animateData.animationList;
			var points = animateData.points;
			var plotBBox = animateData.plotBBox;
			var yAxisBBox = animateData.yAxisBBox;

			var xMinVal = d3.min(points, function(d) { return d.xValue });
			var xMaxVal = d3.max(points, function(d) { return d.xValue });
			var leftEdgeX = 0;
			var rightEdgeX = plotBBox.width - yAxisBBox.width;
			var xScale = d3.scaleLinear()
				.domain([ -Infinity, xMaxVal ])
				.range([ leftEdgeX, rightEdgeX ]);

			for (var i = 0; i < points.length; i++) {
				var data = points[i];
				var animationObject = {
					el: data.el,
					from: { attr: { cx: data.cx } },
					to: { attr: { cx: rightEdgeX }, duration: 0.3 },
					startTime: 0
				}
				animationList.push(animationObject);
			}

			if (animationList.length > 0)
				animationList[0].from.onStart = function() { // animate axis
					d3.select(scatterplotEl).select(xAxisSelector).select('.my-axis')
						.transition()
						.duration(300)
						.call(d3.axisBottom(xScale));
				}
		}

		function addYTransitionAnimation(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var scatterplotEl = animateData.scatterplotEl;
			var yAxisSelector = animateData.yAxisSelector;
			var animationList = animateData.animationList;
			var points = animateData.points;
			var plotBBox = animateData.plotBBox;
			var xAxisBBox = animateData.xAxisBBox;

			var yMinVal = d3.min(points, function(d) { return d.yValue });
			var yMaxVal = d3.max(points, function(d) { return d.yValue });
			var yRange = yMaxVal - yMinVal;
			var topEdgeY = 0;
			var bottomEdgeY = plotBBox.height - xAxisBBox.height; 
			var yScale = d3.scaleLinear()
				.domain([ yMinVal - yRange * 0.1, yMaxVal + yRange * 0.1 ])
				.range([ bottomEdgeY, topEdgeY ]);
			var startIndex = animationList.length;

			for (var i = 0; i < points.length; i++) {
				var data = points[i];
				var animationObject = {
					el: data.el,
					from: { attr: { cy: data.cy } },
					to: { attr: { cy: yScale(data.yValue) }, duration: 0.3 },
					startTime: 0.3
				}
				animationList.push(animationObject);
			}

			if (animationList.length > startIndex)
				animationList[startIndex].to.onStart = function() { // animate axis
					d3.select(scatterplotEl).select(yAxisSelector).select('.my-axis')
						.transition()
						.duration(300)
						.call(d3.axisLeft(yScale));
				}
		}

		function addStlineTextAnimation(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var animationList = animateData.animationList;
			var plotBBox = animateData.plotBBox;

			animationList.push({
				el: '#my-annotation',
				from: { opacity: 0, top: plotBBox.top + plotBBox.height - 15, left: plotBBox.left - 15
					, onStart: function() { $('#my-annotation').html('As we compress the points, they become a straight line') } },
				to: { opacity: 1, top: plotBBox.top + plotBBox.height, left: plotBBox.left, duration: 0.2 },
				startTime: 0.6
			});
		}

		function addStlineCorrTextAnimation(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var animationList = animateData.animationList;
			var plotBBox = animateData.plotBBox;

			animationList.push({
				el: '#my-annotation',
				from: { opacity: 0, top: plotBBox.top + plotBBox.height - 15, left: plotBBox.left - 15
					, onStart: function() { $('#my-annotation').html('A straight line indicates a perfect correlation') } },
				to: { opacity: 1, top: plotBBox.top + plotBBox.height, left: plotBBox.left, duration: 0.2 },
				startTime: 0
			});
		}

		function addHoweverTextAnimation(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var animationList = animateData.animationList;
			var plotBBox = animateData.plotBBox;

			animationList.push({
				el: '#my-annotation',
				from: { opacity: 0, top: plotBBox.top + plotBBox.height - 15, left: plotBBox.left - 15
					, onStart: function() { $('#my-annotation').html('But clearly, your data does not show a perfect correlation') } },
				to: { opacity: 1, top: plotBBox.top + plotBBox.height, left: plotBBox.left, duration: 0.2 },
				startTime: 0
			});
		}

		function addRestoreTransitionAnimation(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var animationList = animateData.animationList;
			var points = animateData.points;
			var scatterplotEl = animateData.scatterplotEl;
			var xAxisSelector = animateData.xAxisSelector;
			var yAxisSelector = animateData.yAxisSelector;
			var plotBBox = animateData.plotBBox;
			var xAxisBBox = animateData.xAxisBBox;
			var yAxisBBox = animateData.yAxisBBox;
			var xAxisTicks = animateData.xAxisTicks;
			var yAxisTicks = animateData.yAxisTicks;

			var leftX = 0;
			var rightX = plotBBox.width - yAxisBBox.width;
			var topY = 0;
			var bottomY = plotBBox.height - xAxisBBox.height;

			var xScale = d3.scaleLinear()
				.domain(d3.extent(xAxisTicks, function(d) { return d.value }))
				.range([ leftX, rightX ]);
			var yScale = d3.scaleLinear()
				.domain(d3.extent(yAxisTicks, function(d) { return d.value }))
				.range([ bottomY, topY ]);

			for (var i = 0; i < points.length; i++) {
				var data = points[i];
				var animationObject = {
					el: data.el,
					from: {},
					to: { attr: { cx: data.cx, cy: data.cy }, duration: 0.3 },
					startTime: 0
				}
				animationList.push(animationObject);
			}

			if (animationList.length > 0)
				animationList[0].from.onStart = function() { // animate axis
					d3.select(scatterplotEl).select(xAxisSelector).select('.my-axis')
						.transition()
						.duration(300)
						.call(d3.axisBottom(xScale));
					d3.select(scatterplotEl).select(yAxisSelector).select('.my-axis')
						.transition()
						.duration(300)
						.call(d3.axisLeft(yScale));
				}
		}

		function addHighAspectTextAnimation(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var animationList = animateData.animationList;
			var plotBBox = animateData.plotBBox;

			animationList.push({
				el: '#my-annotation',
				from: { opacity: 0, top: plotBBox.top + plotBBox.height - 15, left: plotBBox.left - 15
					, onStart: function() { $('#my-annotation').html('The original aspect ratio of your plots is too high') } },
				to: { opacity: 1, top: plotBBox.top + plotBBox.height, left: plotBBox.left, duration: 0.2 },
				startTime: 0.3
			});
		}

		function addCorrectedXTransitionAnimation(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var scatterplotEl = animateData.scatterplotEl;
			var xAxisSelector = animateData.xAxisSelector;
			var animationList = animateData.animationList;
			var points = animateData.points;
			var plotBBox = animateData.plotBBox;
			var yAxisBBox = animateData.yAxisBBox;

			var xMinVal = d3.min(points, function(d) { return d.xValue });
			var xMaxVal = d3.max(points, function(d) { return d.xValue });
			var xRange = xMaxVal - xMinVal;
			var leftEdgeX = 0;
			var rightEdgeX = plotBBox.width - yAxisBBox.width;
			var xScale = d3.scaleLinear()
				.domain([ xMinVal - xRange * 0.1, xMaxVal + xRange * 0.1 ])
				.range([ leftEdgeX, rightEdgeX ]);

			for (var i = 0; i < points.length; i++) {
				var data = points[i];
				var animationObject = {
					el: data.el,
					from: { attr: { cx: data.cx } },
					to: { attr: { cx: xScale(data.xValue) }, duration: 0.3 },
					startTime: 0
				}
				animationList.push(animationObject);
			}

			if (animationList.length > 0)
				animationList[0].from.onStart = function() { // animate axis
					d3.select(scatterplotEl).select(xAxisSelector).select('.my-axis')
						.transition()
						.duration(300)
						.call(d3.axisBottom(xScale));
				}
		}

		function addCorrectedYTransitionAnimation(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var scatterplotEl = animateData.scatterplotEl;
			var yAxisSelector = animateData.yAxisSelector;
			var animationList = animateData.animationList;
			var points = animateData.points;
			var plotBBox = animateData.plotBBox;
			var xAxisBBox = animateData.xAxisBBox;

			var yMinVal = d3.min(points, function(d) { return d.yValue });
			var yMaxVal = d3.max(points, function(d) { return d.yValue });
			var yRange = yMaxVal - yMinVal;
			var topEdgeY = 0;
			var bottomEdgeY = plotBBox.height - xAxisBBox.height; 
			var yScale = d3.scaleLinear()
				.domain([ yMinVal - yRange * 0.1, yMaxVal + yRange * 0.1 ])
				.range([ bottomEdgeY, topEdgeY ]);
			var startIndex = animationList.length;

			for (var i = 0; i < points.length; i++) {
				var data = points[i];
				var animationObject = {
					el: data.el,
					from: { attr: { cy: data.cy } },
					to: { attr: { cy: yScale(data.yValue) }, duration: 0.3 },
					startTime: 0.3
				}
				animationList.push(animationObject);
			}

			if (animationList.length > startIndex)
				animationList[startIndex].to.onStart = function() { // animate axis
					d3.select(scatterplotEl).select(yAxisSelector).select('.my-axis')
						.transition()
						.duration(300)
						.call(d3.axisLeft(yScale));
				}
		}

		function addCorrectionTextAnimation(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var animationList = animateData.animationList;
			var correlation = animateData.correlation;
			var plotBBox = animateData.plotBBox;

			correlation = Math.round((correlation + Number.EPSILON) * 100) / 100;

			animationList.push({
				el: '#my-annotation',
				from: { opacity: 0, top: plotBBox.top + plotBBox.height - 15, left: plotBBox.left - 15
					, onStart: function() { $('#my-annotation').html('We corrected the plot for you, and it shows a correlation = ' + correlation) } },
				to: { opacity: 1, top: plotBBox.top + plotBBox.height, left: plotBBox.left, duration: 0.2 },
				startTime: 0.6
			});
		}

		function animate(animateButtonEl) {
			var animateData = d3.select(animateButtonEl).datum();
			var animationList = animateData.animationList;
			var tl = gsap.timeline();

			for (var i = 0; i < animationList.length; i++) {
				var data = animationList[i];
				tl.fromTo(data.el, data.from, data.to, data.startTime);
			}
		}
	},

	// undo vis

	createUndoButton: function(data) {
		var undoButtonEl = null;

		$('body').append('<div class="undo-button fa fa-undo-alt"></div>');
		undoButtonEl = $('.undo-button').last()[0];

		$(undoButtonEl)
			.css({
				position: 'absolute',
				left: data.plotBBox.left + data.plotBBox.width + 10,
				top: data.plotBBox.top + 70,
				background: 'gray',
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

		d3.select(undoButtonEl).datum(data);
	},
	initHoverUndoButton: function() {
		$('.undo-button').last()
			.hover(function() {
			    $(this).css('opacity', 1);
			}, function() {
				$(this).css('opacity', 0.5);
			});
	},
	initClickUndoButton: function() {
		$('.undo-button').last()
			.unbind('click')
			.on('click', onClickUndoButton);

		function onClickUndoButton() {
			var data = d3.select(this).datum();

			data.currentSlide = 0;
			data.animationList = [];
			removeMyAnnotation(this);
			removeMyAxes(this);
			showGrid(this);
			showAxes(this);
			addRestoreAnimation(this);
			animate(this);
		}

		function removeMyAnnotation() {
			$('#my-annotation').remove();
		}

		function removeMyAxes(buttonEl) {
			var data = d3.select(buttonEl).datum();
			var scatterplotEl = data.scatterplotEl;
			var xAxisSelector = data.xAxisSelector;
			var yAxisSelector = data.yAxisSelector;

			d3.select(scatterplotEl).select(xAxisSelector).selectAll('.my-axis')
				.remove();
			d3.select(scatterplotEl).select(yAxisSelector).selectAll('.my-axis')
				.remove();
		}

		function showGrid(buttonEl) {
			var data = d3.select(buttonEl).datum();
			var scatterplotEl = data.scatterplotEl;
			var gridSelector = data.gridSelector;

			d3.select(scatterplotEl).select(gridSelector)
				.style('opacity', null);
		}

		function showAxes(buttonEl) {
			var data = d3.select(buttonEl).datum();
			var scatterplotEl = data.scatterplotEl;
			var xAxisSelector = data.xAxisSelector;
			var yAxisSelector = data.yAxisSelector;

			d3.select(scatterplotEl).select(xAxisSelector).selectAll('*')
				.style('opacity', null);
			d3.select(scatterplotEl).select(yAxisSelector).selectAll('*')
				.style('opacity', null);
		}

		function addRestoreAnimation(buttonEl) {
			var buttonData = d3.select(buttonEl).datum();
			var animationList = buttonData.animationList;
			var points = buttonData.points;
			var scatterplotEl = buttonData.scatterplotEl;
			var xAxisSelector = buttonData.xAxisSelector;
			var yAxisSelector = buttonData.yAxisSelector;
			var plotBBox = buttonData.plotBBox;
			var xAxisBBox = buttonData.xAxisBBox;
			var yAxisBBox = buttonData.yAxisBBox;
			var xAxisTicks = buttonData.xAxisTicks;
			var yAxisTicks = buttonData.yAxisTicks;

			var leftX = 0;
			var rightX = plotBBox.width - yAxisBBox.width;
			var topY = 0;
			var bottomY = plotBBox.height - xAxisBBox.height;

			var xScale = d3.scaleLinear()
				.domain(d3.extent(xAxisTicks, function(d) { return d.value }))
				.range([ leftX, rightX ]);
			var yScale = d3.scaleLinear()
				.domain(d3.extent(yAxisTicks, function(d) { return d.value }))
				.range([ bottomY, topY ]);

			for (var i = 0; i < points.length; i++) {
				var data = points[i];
				var animationObject = {
					el: data.el,
					from: {},
					to: { attr: { cx: data.cx, cy: data.cy }, duration: 0.3 },
					startTime: 0
				}
				animationList.push(animationObject);
			}
		}		

		function animate(buttonEl) {
			var buttonData = d3.select(buttonEl).datum();
			var animationList = buttonData.animationList;
			var tl = gsap.timeline();

			for (var i = 0; i < animationList.length; i++) {
				var data = animationList[i];
				tl.fromTo(data.el, data.from, data.to, data.startTime);
			}
		}
	}
}