$(function() {
	Database.load(function() {
		var scatterplotEl = null;
		Scatterplot.init();
		Scatterplot.draw();
		scatterplotEl = d3.select('svg > g').node();
		BD.detectBias(scatterplotEl, {
			xAxis: '.x.axis',
			yAxis: '.y.axis',
			dot: '.plot circle',
			grid: '.grids'
		});
	});
});