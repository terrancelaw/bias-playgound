$(function() {
	Database.load(function() {
		Scatterplot.init();
		Scatterplot.draw();
		Scatterplot.drawBBox();
		Scatterplot.initDrag();
		Scatterplot.initButton();
	});
});