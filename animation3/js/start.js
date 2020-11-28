$(function() {
	Database.load(function() {
		var lineChartEl = null;
		var slideList = [
			[ { slide: BD.hideOldVis } , { slide: BD.fadeInNewVis } ],
			[ { slide: BD.changeAspectRatio, ratio: 0.02 } ],
			[ { slide: BD.changeAspectRatio, ratio: 0.4 } ],
			[ { slide: BD.restoreAspectRatio } ],
			[ { slide: BD.changeAspectRatio, ratio: 0.3 } ],
			[ { slide: BD.fadeOutNewVis }, { slide: BD.showOldVis } ]
		];

		LineChart.init();
		LineChart.draw();
		lineChartEl = d3.select('svg > g').node();
		BD.detectBias(lineChartEl, {
			xAxis: '.x.axis',
			yAxis: '.y.axis',
			path: '.line'
		}, slideList);
	});
});