lc.app.onDefined(["lc.ui.Popin.Extension"], function() {
	lc.core.extendClass("lc.ui.Popin.AutoHide", [lc.ui.Popin.Extension],
		function() {
			this.ignoreClickOnElements = [];
		}, {
			extensionName: "auto-hide",
			
			ignoreClickOnElements: null,
			
			init: function(popin) {
				this.popin = popin;
				this.onautohide = new lc.async.Callback(this, function(event) {
					var p = event.target;
					while (p != null && p != document.body && p.parentNode != p) {
						if (p == this.popin.container || this.ignoreClickOnElements.indexOf(p) >= 0)
							return;
						p = p.parentNode;
					}
					this.popin.hide();
				});
			},
			
			afterShow: function() {
				lc.events.listen(document.body, "click", this.onautohide, true);
			},
			
			afterHide: function() {
				lc.events.unlisten(document.body, "click", this.onautohide, true);
			},
			
			destroy: function() {
				lc.events.unlisten(document.body, "click", this.onautohide, true);
				this.onautohide = null;
				this.ignoreClickOnElements = null;
				this.popin = null;
			}
		}
	);
	
	lc.Extension.Registry.register(lc.ui.Popin, lc.ui.Popin.AutoHide);
});
