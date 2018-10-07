lc.app.onDefined("lc.ui.Grid.DataProvider", function() {
	
	lc.core.extendClass("lc.ui.Grid.DataProviderFromURL", lc.ui.Grid.DataProvider, function(url) {
		if (typeof url === 'string')
			this.url = new lc.URL(url);
		else
			this.url = url;
	}, {
		getData: function(grid) {
			return lc.http.rest.get(this.url);
		}
	});

});