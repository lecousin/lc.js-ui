lc.app.onDefined("lc.ui.Grid", function() {
	
	lc.core.createClass("lc.ui.Grid.DataProvider", function() {}, {
		getData: function(grid) { return lc.async.Future.alreadySuccess(); }
	});

});