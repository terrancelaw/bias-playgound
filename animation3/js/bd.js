const BD = {

	// for converting between coord systems
	chartLeftCorner: {
		screenCoord: null,
		chartCoord: null,
	}, 
	SVGLeftCorner: {
		SVGCoord: null,
		screenCoord: null,
	},

	detectBias: function(el, data, slideList=null) {
		const self = this;
		var xAxisSelector = data.xAxis;
		var yAxisSelector = data.yAxis;
		var pathSelector = data.path;
		var animationData = {
			lineChartEl: el,
			xAxisSelector: xAxisSelector,
			yAxisSelector: yAxisSelector,
			pathSelector: pathSelector,

			// for slides
			currentSlide: 0,
			currentTime: 0,
			animationList: [],
			slideList: slideList,

			// everythin in SVG coord
			inferredLeftEdge: null,
			inferredBottomEdge: null,
			inferredXAxisPoints: null,
			inferredYAxisPoints: null,
			inferredDataPoints: null
		};

		self.getReferencePoints(animationData);
		self.inferLeftEdge(animationData);
		self.inferBottomEdge(animationData);
		self.inferXAxisPoints(animationData);
		self.inferYAxisPoints(animationData);
		self.convertPathToPoints(animationData);

		self.createAnimateVisButton(animationData);
		self.initHoverAnimateVisButton();
		self.initClickAnimateVisButton();
	},
	getReferencePoints: function(data) {
		const self = this;
		var lineChartEl = data.lineChartEl;
		var pathSelector = data.pathSelector;		
		var SVGBBox = $(lineChartEl).closest('svg')[0].getBoundingClientRect();
		var pathBBoxInScreenCoord = d3.select(lineChartEl).select(pathSelector).node().getBoundingClientRect();
		var pathBBoxInChartCoord = d3.select(lineChartEl).select(pathSelector).node().getBBox();

		var SVGLeftCornerLeftInSVGCoord = 0;
		var SVGLeftCornerTopInSVGCoord = 0;
		var SVGLeftCornerLeftInScreenCoord = SVGBBox.left;
		var SVGLeftCornerTopInScreenCoord = SVGBBox.top;

		var chartLeftCornerLeftInScreenCoord = pathBBoxInScreenCoord.x;
		var chartLeftCornerTopInScreenCoord = pathBBoxInScreenCoord.y;
		var chartLeftCornerLeftInChartCoord = pathBBoxInChartCoord.x;
		var chartLeftCornerTopInChartCoord = pathBBoxInChartCoord.y;

		self.chartLeftCorner.screenCoord = {
			left: chartLeftCornerLeftInScreenCoord,
			top: chartLeftCornerTopInScreenCoord
		};
		self.chartLeftCorner.chartCoord = {
			left: chartLeftCornerLeftInChartCoord,
			top: chartLeftCornerTopInChartCoord
		};
		self.SVGLeftCorner.SVGCoord = {
			left: SVGLeftCornerLeftInSVGCoord,
			top: SVGLeftCornerTopInSVGCoord
		};
		self.SVGLeftCorner.screenCoord = {
			left: SVGLeftCornerLeftInScreenCoord,
			top: SVGLeftCornerTopInScreenCoord
		};
	},
	inferLeftEdge: function(data) {
		const self = this;
		var lineChartEl = data.lineChartEl;
		var yAxisSelector = data.yAxisSelector;
		var yAxisBBox = d3.select(lineChartEl).select(yAxisSelector).node().getBoundingClientRect();
		var leftEdgeInScreenCoord = yAxisBBox.left + yAxisBBox.width;
		var leftEdgeInSVGCoord = self.screenCoordToSVGCoord({
			left: leftEdgeInScreenCoord, top: 0
		}).left;

		data.inferredLeftEdge = leftEdgeInSVGCoord;
	},
	inferBottomEdge: function(data) {
		const self = this;
		var lineChartEl = data.lineChartEl;
		var xAxisSelector = data.xAxisSelector;
		var xAxisBBox = d3.select(lineChartEl).select(xAxisSelector).node().getBoundingClientRect();
		var bottomEdgeInScreenCoord = xAxisBBox.top;
		var bottomEdgeInSVGCoord = self.screenCoordToSVGCoord({
			left: 0, top: bottomEdgeInScreenCoord
		}).top;

		data.inferredBottomEdge = bottomEdgeInSVGCoord;
	},
	inferXAxisPoints: function(data) {
		const self = this;
		var lineChartEl = data.lineChartEl;
		var xAxisSelector = data.xAxisSelector;
		var inferredXAxisPoints = [];

		d3.select(lineChartEl).select(xAxisSelector).selectAll('text').each(function() {
			var textEl = this;
			var textBBox = null;
			var textLeftInSVGCoord = null;
			var text = d3.select(this).text();
			var isNumber = !isNaN(text);

			if (isNumber) {
				textBBox = textEl.getBoundingClientRect();
				textLeftInSVGCoord = self.screenCoordToSVGCoord({
					left: textBBox.left + textBBox.width / 2, top: 0
				}).left;
				inferredXAxisPoints.push({
					value: +text, 
					left: textLeftInSVGCoord
				});
			}
		});

		data.inferredXAxisPoints = inferredXAxisPoints;
	},
	inferYAxisPoints: function(data) {
		const self = this;
		var lineChartEl = data.lineChartEl;
		var yAxisSelector = data.yAxisSelector;
		var inferredYAxisPoints = [];

		d3.select(lineChartEl).select(yAxisSelector).selectAll('text').each(function() {
			var textEl = this;
			var textBBox = null;
			var textTopInSVGCoord = null;
			var text = d3.select(this).text();
			var isNumber = !isNaN(text);

			if (isNumber) {
				textBBox = textEl.getBoundingClientRect();
				textTopInSVGCoord = self.screenCoordToSVGCoord({
					left: 0, top: textBBox.top + textBBox.height / 2
				}).top;
				inferredYAxisPoints.push({
					value: +text,
					top: textTopInSVGCoord
				});
			}
		});

		data.inferredYAxisPoints = inferredYAxisPoints;
	},
	convertPathToPoints: function(data) {
		const self = this;
		var lineChartEl = data.lineChartEl;
		var pathSelector = data.pathSelector;
		var inferredXAxisPoints = data.inferredXAxisPoints;
		var inferredYAxisPoints = data.inferredYAxisPoints;
		var pathEl = d3.select(lineChartEl).select(pathSelector).node();
		var yScale = d3.scaleLinear()
			.domain([ inferredYAxisPoints[0].value, inferredYAxisPoints[inferredYAxisPoints.length - 1].value ])
			.range([ inferredYAxisPoints[0].top, inferredYAxisPoints[inferredYAxisPoints.length - 1].top ]);
		var inferredDataPoints = [];

		for (var i = 0; i < inferredXAxisPoints.length; i++) {
			var leftInSVGCoord = inferredXAxisPoints[i].left;
			var leftInChartCoord = self.SVGCoordToChartCoord({
				left: leftInSVGCoord, top: 0
			}).left;
			var pointInChartCoord = self.getPointInChartCoord(pathEl, leftInChartCoord);
			var topInChartCoord = pointInChartCoord.y;
			var topInSVGCoord = self.chartCoordToSVGCoord({
				left: 0, top: topInChartCoord
			}).top;
			var pointInSVGCoord = {
				left: leftInSVGCoord, top: topInSVGCoord,
				year: inferredXAxisPoints[i].value, value: yScale.invert(topInSVGCoord)
			};
			inferredDataPoints.push(pointInSVGCoord);
		}

		data.inferredDataPoints = inferredDataPoints;
	},

	// buttons

	createAnimateVisButton: function(data) {
		var animateVisButtonEl = null;
		var plotBBox = data.lineChartEl.getBoundingClientRect();

		$('body').append('<div class="animate-button fa fa-exclamation"></div>');
		animateVisButtonEl = $('.animate-button').last()[0];

		$(animateVisButtonEl)
			.css({
				position: 'absolute',
				left: plotBBox.left + plotBBox.width + 10,
				top: plotBBox.top,
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
		d3.select(animateVisButtonEl)
			.datum(data);
	},
	createChangeAspectRatioButtons: function() {

	},

	// events

	initHoverAnimateVisButton: function() {
		$('.animate-button').last()
			.hover(function() {
			    $(this).css('opacity', 1);
			}, function() {
				$(this).css('opacity', 0.5);
			});
	},
	initClickAnimateVisButton: function() {
		$('.animate-button').last()
			.unbind('click')
			.on('click', onClickAnimateVisButton);

		function onClickAnimateVisButton() {
			var data = d3.select(this).datum();
			var defaultSlideList = [
				[ { slide: BD.hideOldVis } , { slide: BD.fadeInNewVis } ],
				[ { slide: BD.changeAspectRatio, ratio: 0.02 } ],
				[ { slide: BD.changeAspectRatio, ratio: 0.4 } ],
				[ { slide: BD.restoreAspectRatio } ],
				[ { slide: BD.changeAspectRatio, ratio: 0.3 } ],
				[ { slide: BD.fadeOutNewVis }, { slide: BD.showOldVis } ]
			];
			var slideList = data.slideList !== null ? data.slideList : defaultSlideList;

			data.animationList = [];
			data.currentTime = 0;

			for (var i = 0; i < slideList[data.currentSlide].length; i++) {
				var currentSlide = slideList[data.currentSlide][i];
				var slideFunction = currentSlide.slide;

				if (slideFunction == BD.changeAspectRatio)
					slideFunction(currentSlide.ratio, this);
				else if (slideFunction != BD.changeAspectRatio)
					slideFunction(this);
			}

			BD.animate(this);
			data.currentSlide++;

			// restart
			if (data.currentSlide == slideList.length)
				data.currentSlide = 0;
		}
	},
	initHoverChangeAspectRatioButtons: function() {

	},
	initClickChangeAspectRatioButtons: function() {

	},
	initDragBoundingBoxBehaviour: function() {

	},

	// slides

	hideOldVis: function(animateVisButtonEl) {
		var data = d3.select(animateVisButtonEl).datum();
		var lineChartEl = data.lineChartEl;
		var animationList = data.animationList;

		animationList.push({
			el: lineChartEl,
			to: { css: { opacity: 0 }, duration: 0 },
			startTime: 0
		});
	},
	showOldVis: function(animateVisButtonEl) {
		var data = d3.select(animateVisButtonEl).datum();
		var lineChartEl = data.lineChartEl;
		var animationList = data.animationList;
		var currentTime = data.currentTime;
		var SVGEl = $(lineChartEl).closest('svg')[0];

		animationList.push({
			el: lineChartEl,
			to: { css: { opacity: 1 }, duration: 0.3, onComplete: function() {
				d3.select(SVGEl).selectAll('.animation-canvas').remove();
			}},
			startTime: currentTime
		});
		currentTime += currentTime;
		data.currentTime = currentTime;
	},
	fadeInNewVis: function(animateVisButtonEl) {
		var data = d3.select(animateVisButtonEl).datum();
		var lineChartEl = data.lineChartEl;
		var animationList = data.animationList;
		var currentTime = data.currentTime;
		var SVGEl = $(lineChartEl).closest('svg')[0];
		var hasAnimationCanvas = !d3.select(SVGEl).select('.animation-canvas').empty();

		var prevOpaquePoint = null;
		var inferredDataPoints = data.inferredDataPoints;
		var inferredLeftEdge = data.inferredLeftEdge;
		var inferredBottomEdge = data.inferredBottomEdge;
		var lineGenerator = d3.line()
			.x(function(d) { return d.left })
        	.y(function(d) { return d.top });

		if (hasAnimationCanvas) d3.select(SVGEl).selectAll('.animation-canvas > *').remove();
		if (!hasAnimationCanvas) d3.select(SVGEl).append('g').attr('class', 'animation-canvas');

		// get y and opacity
		if (inferredDataPoints.length > 0)
			prevOpaquePoint = inferredDataPoints[0];
		for (var i = 0; i < inferredDataPoints.length; i++) {
			var currPoint = inferredDataPoints[i];
			var distanceFromPrevOpPoint = null;

			currPoint.y = currPoint.top;
			currPoint.opacity = 1;

			if (i >= 1) {
				distanceFromPrevOpPoint = Math.abs(currPoint.top - prevOpaquePoint.top);
				if (distanceFromPrevOpPoint <= 20) currPoint.opacity = 0; // not shown
				if (distanceFromPrevOpPoint > 20) prevOpaquePoint = currPoint; // shown
			}
		}

		// vertical lines
		var vLineUpdate = d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-v-line')
			.data(inferredDataPoints);
		var vLineEnter = vLineUpdate.enter()
			.append('line')
			.attr('class', 'bd-v-line')
			.attr('y2', inferredBottomEdge + 10)
			.style('fill', 'none')
			.style('stroke', '#d3d3d3')
			.style('stroke-dasharray', '3,3')
			.style('opacity', 0);
		vLineUpdate.merge(vLineEnter)
			.attr('y1', function(d) { return d.top })
			.attr('x1', function(d) { return d.left })
			.attr('x2', function(d) { return d.left });
		var vLineExit = vLineUpdate.exit()
			.remove();

		// horizontal lines
		var hLineUpdate = d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-h-line')
			.data(inferredDataPoints);
		var hLineEnter = hLineUpdate.enter()
			.append('line')
			.attr('class', 'bd-h-line')
			.attr('x1', inferredLeftEdge + 5)
			.style('fill', 'none')
			.style('stroke', '#d3d3d3')
			.style('stroke-dasharray', '3,3')
			.style('opacity', 0);
		hLineUpdate.merge(hLineEnter)
			.attr('x2', function(d) { return d.left })
			.attr('y1', function(d) { return d.top })
			.attr('y2', function(d) { return d.top });
		var hLineExit = hLineUpdate.exit()
			.remove();

		// path
		d3.select(SVGEl).select('.animation-canvas').append('path')
			.datum(inferredDataPoints)
			.attr('class', 'bd-path')
			.attr('d', lineGenerator(inferredDataPoints))
			.style('fill', 'none')
			.style('stroke', 'steelblue')
			.style('stroke-width', 1.5)
			.style('opacity', 0);

		// circle
		var circleUpdate = d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-dot')
			.data(inferredDataPoints);
		var circleEnter = circleUpdate.enter()
			.append('circle')
			.attr('class', 'bd-dot');
		circleUpdate.merge(circleEnter)
			.attr('cx', function(d) { return d.left })
			.attr('cy', function(d) { return d.top })
			.style('r', 5)
			.style('stroke', 'white')
			.style('stroke-width', 2)
			.style('fill', 'steelblue')
			.style('opacity', 0);
		var circleExit = circleUpdate.exit()
			.remove();
		
		// x axis
		var xUpdate = d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-x-text')
			.data(inferredDataPoints);
		var xEnter = xUpdate.enter()
			.append('text')
			.attr('class', 'bd-x-text')
			.attr('y', inferredBottomEdge)
			.attr('dy', 25)
			.style('text-anchor', 'middle')
			.style('font-family', 'Quicksand')
			.style('font-size', 12)
			.style('opacity', 0);
		xUpdate.merge(xEnter)
			.attr('x', function(d) { return d.left })
			.text(function(d) { return d.year });
		var xExit = xUpdate.exit()
			.remove();

		// y axis
		var yUpdate = d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-y-text')
			.data(inferredDataPoints);
		var yEnter = yUpdate.enter()
			.append('text')
			.attr('class', 'bd-y-text')
			.attr('x', inferredLeftEdge)
			.style('text-anchor', 'end')
			.style('alignment-baseline', 'middle')
			.style('font-family', 'Quicksand')
			.style('font-size', 12)
			.style('opacity', 0);
		yUpdate.merge(yEnter)
			.attr('y', function(d) { return d.top })
			.text(function(d) { 
				return Math.round((d.value  + Number.EPSILON) * 100) / 100;
			});
		var yExit = yUpdate.exit()
			.remove();

		// animate path
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-path').each(function(d) {
			animationList.push({
				el: this, to: { css: { opacity: 1 }, duration: 0.3 },
				startTime: currentTime
			});
			currentTime += 0.3;
		});

		// animate dots
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-dot').each(function(d) {
			animationList.push({
				el: this, to: { css: { opacity: 1 }, duration: 0.05 },
				startTime: currentTime
			});
			currentTime += 0.05;
		});

		// animate x
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-x-text').each(function(d, i) {
			animationList.push({
				el: this,
				to: { css: { opacity: 1 }, duration: 0.05 },
				startTime: currentTime + i * 0.05
			});
		});
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-v-line').each(function(d, i) {
			animationList.push({
				el: this,
				to: { css: { opacity: 1 }, duration: 0.05 },
				startTime: currentTime + i * 0.05
			});
		});
		currentTime += inferredDataPoints.length * 0.05;

		// animate y
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-y-text').each(function(d, i) {
			if (d.opacity == 1)
				animationList.push({
					el: this,
					to: { css: { opacity: 1 }, duration: 0.05 },
					startTime: currentTime + i * 0.05
				});
		});
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-h-line').each(function(d, i) {
			animationList.push({
				el: this,
				to: { css: { opacity: 1 }, duration: 0.05 },
				startTime: currentTime + i * 0.05
			});
		});
		currentTime += inferredDataPoints.length * 0.05;	

		data.currentTime = currentTime;	
	},
	fadeOutNewVis: function(animateVisButtonEl) {
		var data = d3.select(animateVisButtonEl).datum();
		var lineChartEl = data.lineChartEl;
		var animationList = data.animationList;
		var currentTime = data.currentTime;
		var SVGEl = $(lineChartEl).closest('svg')[0];

		// animate path and dots
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-path').each(function(d) {
			animationList.push({
				el: this, 
				to: { css: { opacity: 0 }, duration: 0.3 },
				startTime: currentTime
			});
		});
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-dot').each(function(d) {
			animationList.push({
				el: this,
				to: { css: { opacity: 0 }, duration: 0.3 },
				startTime: currentTime
			});
		});
		currentTime += 0.3;

		// animate x and y
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-y-text').each(function(d) {
			animationList.push({
				el: this,
				to: { css: { opacity: 0 }, duration: 0.3 },
				startTime: currentTime
			});
		});
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-h-line').each(function(d, i) {
			animationList.push({
				el: this,
				to: { css: { opacity: 0 }, duration: 0.3 },
				startTime: currentTime
			});
		});
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-x-text').each(function(d) {
			animationList.push({
				el: this,
				to: { css: { opacity: 0 }, duration: 0.3 },
				startTime: currentTime
			});
		});
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-v-line').each(function(d, i) {
			animationList.push({
				el: this,
				to: { css: { opacity: 0 }, duration: 0.3 },
				startTime: currentTime
			});
		});
		currentTime += 0.3;

		data.currentTime = currentTime;
	},
	fadeInBoundingBox: function() {

	},
	fadeOutBoundingBox: function() {

	},
	blurBoundingBox: function() {

	},
	sharpenBoundingBox: function() {

	},
	changeAspectRatio: function(ratio, animateVisButtonEl) {
		var data = d3.select(animateVisButtonEl).datum();
		var lineChartEl = data.lineChartEl;
		var animationList = data.animationList;
		var currentTime = data.currentTime;
		var SVGEl = $(lineChartEl).closest('svg')[0];

		var prevOpaquePoint = null;
		var inferredDataPoints = data.inferredDataPoints;
		var inferredLeftEdge = data.inferredLeftEdge;
		var inferredBottomEdge = data.inferredBottomEdge;
		var lineGenerator = d3.line()
			.x(function(d) { return d.left })
        	.y(function(d) { return d.y });

        var minLeft = d3.min(inferredDataPoints, function(d) { return d.left });
        var maxLeft = d3.max(inferredDataPoints, function(d) { return d.left });
        var minVal = d3.min(inferredDataPoints, function(d) { return d.value });
        var maxTop = d3.max(inferredDataPoints, function(d) { return d.top });
        var maxVal = d3.max(inferredDataPoints, function(d) { return d.value });
        var minTop = d3.min(inferredDataPoints, function(d) { return d.top });
        var newMaxTop = maxTop;
        var newMinTop = maxTop - (maxLeft - minLeft) * ratio;
        var yScale = d3.scaleLinear()
        	.domain([ maxVal, minVal ])
        	.range([ newMinTop, newMaxTop ]);
        
		// get y and opacity
		if (inferredDataPoints.length > 0)
			prevOpaquePoint = inferredDataPoints[0];
		for (var i = 0; i < inferredDataPoints.length; i++) {
			var currPoint = inferredDataPoints[i];
			var distanceFromPrevOpPoint = null;

			currPoint.y = yScale(currPoint.value);
			currPoint.opacity = 1;

			if (i >= 1) {
				distanceFromPrevOpPoint = Math.abs(currPoint.y - prevOpaquePoint.y);
				if (distanceFromPrevOpPoint <= 20) currPoint.opacity = 0; // not shown
				if (distanceFromPrevOpPoint > 20) prevOpaquePoint = currPoint; // shown
			}
		}

		// animate path and dots
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-path').each(function(d) {
			animationList.push({
				el: this, 
				to: { attr: { d: lineGenerator(inferredDataPoints) }, duration: 0.3 },
				startTime: currentTime
			});
		});
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-dot').each(function(d) {
			animationList.push({
				el: this,
				to: { attr: { cy: d.y }, duration: 0.3 },
				startTime: currentTime
			});
		});

		// animate x
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-v-line').each(function(d) {
			animationList.push({
				el: this,
				to: { attr: { y1: d.y }, duration: 0.3 },
				startTime: currentTime
			});
		});

		// animate y
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-y-text').each(function(d) {
			if (d.opacity == 1) d3.select(this).style('opacity', 1);
			else if (d.opacity == 0) d3.select(this).style('opacity', 0);

			animationList.push({
				el: this,
				to: { attr: { y: d.y }, duration: 0.3 },
				startTime: currentTime
			});
		});
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-h-line').each(function(d, i) {
			animationList.push({
				el: this,
				to: { attr: { y1: d.y, y2: d.y }, duration: 0.3 },
				startTime: currentTime
			});
		});
		currentTime += 0.3;

		data.currentTime = currentTime;
	},
	restoreAspectRatio: function(animateVisButtonEl) {
		var data = d3.select(animateVisButtonEl).datum();
		var lineChartEl = data.lineChartEl;
		var animationList = data.animationList;
		var currentTime = data.currentTime;
		var SVGEl = $(lineChartEl).closest('svg')[0];
		var hasAnimationCanvas = !d3.select(SVGEl).select('.animation-canvas').empty();

		var prevOpaquePoint = null;
		var inferredDataPoints = data.inferredDataPoints;
		var inferredLeftEdge = data.inferredLeftEdge;
		var inferredBottomEdge = data.inferredBottomEdge;
		var lineGenerator = d3.line()
			.x(function(d) { return d.left })
        	.y(function(d) { return d.y });

		// get y and opacity
		if (inferredDataPoints.length > 0)
			prevOpaquePoint = inferredDataPoints[0];
		for (var i = 0; i < inferredDataPoints.length; i++) {
			var currPoint = inferredDataPoints[i];
			var distanceFromPrevOpPoint = null;

			currPoint.y = currPoint.top;
			currPoint.opacity = 1;

			if (i >= 1) {
				distanceFromPrevOpPoint = Math.abs(currPoint.y - prevOpaquePoint.y);
				if (distanceFromPrevOpPoint <= 20) currPoint.opacity = 0; // not shown
				if (distanceFromPrevOpPoint > 20) prevOpaquePoint = currPoint; // shown
			}
		}

		// animate path and dots
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-path').each(function(d) {
			animationList.push({
				el: this, 
				to: { attr: { d: lineGenerator(inferredDataPoints) }, duration: 0.3 },
				startTime: currentTime
			});
		});
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-dot').each(function(d) {
			animationList.push({
				el: this,
				to: { attr: { cy: d.y }, duration: 0.3 },
				startTime: currentTime
			});
		});

		// animate x
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-v-line').each(function(d) {
			animationList.push({
				el: this,
				to: { attr: { y1: d.y }, duration: 0.3 },
				startTime: currentTime
			});
		});

		// animate y
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-y-text').each(function(d) {
			if (d.opacity == 1) d3.select(this).style('opacity', 1);
			else if (d.opacity == 0) d3.select(this).style('opacity', 0);

			animationList.push({
				el: this,
				to: { attr: { y: d.y }, duration: 0.3 },
				startTime: currentTime
			});
		});
		d3.select(SVGEl).select('.animation-canvas').selectAll('.bd-h-line').each(function(d, i) {
			animationList.push({
				el: this,
				to: { attr: { y1: d.y, y2: d.y }, duration: 0.3 },
				startTime: currentTime
			});
		});

		currentTime += 0.3;

		data.currentTime = currentTime;
	},
	showAnnotation: function() {

	},
	hideAnnotation: function() {

	},

	// helper

	getPointInChartCoord: function(pathEl, x) {
		var leftLength = 0;
		var rightLength = pathEl.getTotalLength();
		var leftPoint = pathEl.getPointAtLength(leftLength); // in chart coord
		var rightPoint = pathEl.getPointAtLength(rightLength); // in chart coord
		var count = 0;

		while (true) {
			var middleLength = (leftLength + rightLength) / 2;
			var middlePoint = pathEl.getPointAtLength(middleLength); // in chart coord

			if (middlePoint.x > x) {
				rightLength = middleLength;
				rightPoint = middlePoint;
			}
			else if (middlePoint.x < x) {
				leftLength = middleLength;
				leftPoint = middlePoint;
			}
			else if (middlePoint.x == x)
				return middlePoint;

			// next iteration
			count++;
			if (count >= 30) break;
		}

		return pathEl.getPointAtLength(middleLength);
	},
	SVGCoordToScreenCoord: function(pointInSVGCoord) {
		const self = this;
		var SVGLeftCorner = self.SVGLeftCorner;
		var leftDifference = SVGLeftCorner.screenCoord.left - SVGLeftCorner.SVGCoord.left;
		var topDifference = SVGLeftCorner.screenCoord.top - SVGLeftCorner.SVGCoord.top;
		var pointInScreenCoord = {
			left: pointInSVGCoord.left + leftDifference,
			top: pointInSVGCoord.top + topDifference
		};
		return pointInScreenCoord;
	},
	screenCoordToSVGCoord: function(pointInScreenCoord) {
		const self = this;
		var SVGLeftCorner = self.SVGLeftCorner;
		var leftDifference = SVGLeftCorner.SVGCoord.left - SVGLeftCorner.screenCoord.left;
		var topDifference = SVGLeftCorner.SVGCoord.top - SVGLeftCorner.screenCoord.top;
		var pointInSVGCoord = {
			left: pointInScreenCoord.left + leftDifference,
			top: pointInScreenCoord.top + topDifference
		};
		return pointInSVGCoord;
	},
	SVGCoordToChartCoord: function(pointInSVGCoord) {
		const self = this;
		var pointInScreenCoord = self.SVGCoordToScreenCoord(pointInSVGCoord);
		var chartLeftCorner = self.chartLeftCorner;
		var leftDifference = chartLeftCorner.chartCoord.left - chartLeftCorner.screenCoord.left;
		var topDifference = chartLeftCorner.chartCoord.top - chartLeftCorner.screenCoord.top;
		var pointInChartCoord = {
			left: pointInScreenCoord.left + leftDifference,
			top: pointInScreenCoord.top + topDifference,
		};
		return pointInChartCoord;
	},
	chartCoordToSVGCoord: function(pointInChartCoord) {
		const self = this;
		var chartLeftCorner = self.chartLeftCorner;
		var leftDifference =  chartLeftCorner.screenCoord.left - chartLeftCorner.chartCoord.left;
		var topDifference =  chartLeftCorner.screenCoord.top - chartLeftCorner.chartCoord.top;
		var pointInScreenCoord = {
			left: pointInChartCoord.left + leftDifference,
			top: pointInChartCoord.top + topDifference
		};
		var pointInSVGCoord = self.screenCoordToSVGCoord(pointInScreenCoord);
		return pointInSVGCoord;
	},
	screenCoordToChartCoord: function(pointInScreenCoord) {
		const self = this;
		var chartLeftCorner = self.chartLeftCorner;
		var leftDifference = chartLeftCorner.chartCoord.left - chartLeftCorner.screenCoord.left;
		var topDifference = chartLeftCorner.chartCoord.top - chartLeftCorner.screenCoord.top;
		var pointInChartCoord = {
			left: pointInScreenCoord.left + leftDifference,
			top: pointInScreenCoord.top + topDifference
		};
		return pointInChartCoord;
	},
	chartCoordToScreenCoord: function(pointInChartCoord) {
		const self = this;
		var chartLeftCorner = self.chartLeftCorner;
		var leftDifference =  chartLeftCorner.screenCoord.left - chartLeftCorner.chartCoord.left;
		var topDifference =  chartLeftCorner.screenCoord.top - chartLeftCorner.chartCoord.top;
		var pointInScreenCoord = {
			left: pointInChartCoord.left + leftDifference,
			top: pointInChartCoord.top + topDifference
		};
		return pointInScreenCoord;
	},
	animate: function(animateVisButtonEl) {
		var data = d3.select(animateVisButtonEl).datum();
		var animationList = data.animationList;
		var tl = gsap.timeline();

		for (var i = 0; i < animationList.length; i++) {
			var slideData = animationList[i];
			tl.fromTo(slideData.el, slideData.from, slideData.to, slideData.startTime);
		}
	}
}