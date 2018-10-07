lc.app.onDefined("lc.ui.Formatter", function() {
	
	lc.core.extendClass("lc.ui.Formatter.Size", lc.ui.Formatter, function() {}, {
		type: "size",
		configureFromAttributes: function(element) {
		},
		createValue: function(value) {
			if (typeof value === 'number') return value;
			if (typeof value === 'string') return parseInt(value);
			return undefined;
		},
		formatValue: function(value) {
			if (typeof value !== 'number') return "";

			if (value >= 1024 * 1024 * 1024 * 1024)
				return Math.floor(value / (1024 * 1024 * 1024 * 1024)) + " TB";
			if (value >= 1024 * 1024 * 1024)
				return Math.floor(value / (1024 * 1024 * 1024)) + " GB";
			if (value >= 1024 * 1024)
				return Math.floor(value / (1024 * 1024)) + " MB";
			if (value >= 1024)
				return Math.floor(value / (1024)) + " KB";
			
			return value;
		}
	});
	
	lc.ui.Formatter.Registry.register(lc.ui.Formatter.Size);
	
});