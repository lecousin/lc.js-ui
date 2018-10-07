lc.app.onDefined("lc.ui.Grid.DataProvider", function() {
	
	lc.core.extendClass("lc.ui.Grid.DataProviderFromContext", lc.ui.Grid.DataProvider, function(expression) {
		this.expression = expression;
	}, {
		getData: function(grid) {
			try {
				var data = lc.Context.expression.evaluate(this.expression, grid.container, grid);
				return lc.async.Future.alreadySuccess(data);
			} catch (e) {
				lc.log.error("lc.ui.Grid", "Invalid data context expression " + this.expression, e);
			}
		}
	});

});