lc.app.onDefined("lc.ui.Formatter", function() {
	
	lc.core.extendClass("lc.ui.Formatter.Timestamp", lc.ui.Formatter, function() {}, {
		type: "timestamp",
		configureFromAttributes: function(element) {
			if (element.hasAttribute("format"))
				this.format = element.getAttribute("format");
			if (!this.format) this.format = "dd/MM/yyyy HH:mm:ss";
		},
		createValue: function(value) {
			if (typeof value === 'number') return value;
			if (typeof value === 'string') return parseInt(value);
			if (value === null || value === undefined) return value;
			if (typeof value["getTime"] === 'function') return value.getTime();
			return undefined;
		},
		formatValue: function(value) {
			if (!value) return "";
			
			var aDate = new Date();
			aDate.setTime(value);
			value = this.format;
			
			 /* yyyy */  value = value.replace(/y{4}/g,     (aDate.getFullYear()).toString().padStart(4, '0'));
			 /* yy   */  value = value.replace(/y{2}/g,      Math.floor(aDate.getFullYear()/100).toString().padStart(2, '0'));
			 /* MM   */  value = value.replace(/M{2}/g,      (aDate.getMonth() + 1).toString().padStart(2, '0'));
			 /* dd   */  value = value.replace(/d{2}/g,      (aDate.getDate()).toString().padStart(2, '0'));
			 /* FF   */  value = value.replace(/F{2}/g,      (aDate.getDay()).toString().padStart(2, '0'));
			 /* HH   */  value = value.replace(/H{2}/g,      (aDate.getHours()).toString().padStart(2, '0'));
			 /* mm   */  value = value.replace(/m{2}/g,      (aDate.getMinutes()).toString().padStart(2, '0'));
			 /* ss   */  value = value.replace(/s{2}/g,      (aDate.getSeconds()).toString().padStart(2, '0'));
			 /* SS   */  value = value.replace(/S{3}/g,      (aDate.getMilliseconds()).toString().padStart(3, '0'));

			return value;
		}
	});
	
	lc.ui.Formatter.Registry.register(lc.ui.Formatter.Timestamp);
	
});