lc.app.onDefined("lc.ui.Formatter", function() {
	
	lc.core.extendClass("lc.ui.Formatter.Duration", lc.ui.Formatter, function() {}, {
		type: "duration",
		configureFromAttributes: function(element) {
		},
		createValue: function(value) {
			if (typeof value === 'number') return value;
			if (typeof value === 'string') return parseInt(value);
			return undefined;
		},
		formatValue: function(value) {
			if (typeof value !== 'number') return "";
			var s = "";
			if (value >= 24 * 60 * 60 * 1000) {
				s += Math.floor(value / (24 * 60 * 60 * 1000)) + "d ";
				value = value % (24 * 60 * 60 * 1000);
			}
			if (s.length > 0 || value >= 60 * 60 * 1000) {
				s += Math.floor(value / (60 * 60 * 1000)).toString().padStart(2, '0') + 'h';
				value = value % (60 * 60 * 1000);
			}
			if (s.length > 0 || value >= 60 * 1000) {
				s += Math.floor(value / (60 * 1000)).toString().padStart(2, '0') + 'm';
				value = value % (60 * 1000);
			}
			if (s.length > 0 || value >= 1000) {
				s += Math.floor(value / (1000)).toString().padStart(2, '0') + 's';
				value = value % (1000);
			}
			s += value.toString().padStart(3, '0') + 'ms';

			return s;
		}
	});
	
	lc.ui.Formatter.Registry.register(lc.ui.Formatter.Duration);
	
});