lc.app.onDefined("lc.ui.Component", function() {
	
	lc.core.extendClass("lc.ui.BrowserScrollbar", lc.ui.Component,
	function(container, doNotConfigure, doNotBuild) {
		lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
	}, {
		componentName: "lc-browser-scrollbar",
		horizontal: null,
		
		configure: function() {
			this.container.style.display = "none";
			this.container.style.position = "relative";
			this.scrollBar = document.createElement("DIV");
			this.scrollBar.style.position = "absolute";
			this.container.appendChild(this.scrollBar);
			this.scrollBarGenerator = document.createElement("DIV");
			this.scrollBar.appendChild(this.scrollBarGenerator);
			lc.events.listen(this.scrollBar, "scroll", new lc.async.Callback(this, this._scrolling));
			
			this.registerEvents(["scroll"]);
		},
		
		build: function() {
			this.setDirection(this.container.getAttribute("scrollbar-direction") == "horizontal");
			var v = this.container.getAttribute("scrollbar-total");
			var v2 = this.container.getAttribute("scrollbar-visible");
			if (v && v2) this.setAmount(parseInt(v), parseInt(v2));
			v = this.container.getAttribute("scrollbar-position");
			if (v) this.setPosition(parseInt(v));
		},
		
		setDirection: function(horizontal) {
			this.horizontal = horizontal;
			if (horizontal) {
				this.container.style.height = (lc.ui.BrowserScrollbar.size.height)+"px";
				this.scrollBar.style.overflowX = "auto";
				this.scrollBar.style.overflowY = "hidden";
				this.scrollBar.style.top = "0px";
				this.scrollBar.style.left = "0px";
				this.scrollBar.style.right = "0px";
				this.scrollBar.style.height = (lc.ui.BrowserScrollbar.size.height)+"px";
				this.scrollBarGenerator.style.width = "0px";
				this.scrollBarGenerator.style.height = "1px";
			} else {
				// TODO
			}
		},
		
		setPosition: function(position) {
			if (this.horizontal)
				this.scrollBar.scrollLeft = position;
			else
				this.scrollBar.scrollTop = position;
		},
		
		setAmount: function(amount, visible) {
			if (this.horizontal) {
				if (amount > visible) {
					this.scrollBarGenerator.style.width = amount+'px';
					this.container.style.display = "block";
				} else {
					this.container.style.display = "none";
				}
			} else {
				// TODO
			}
		},
		
		refreshFrom: function(scrollable) {
			if (this.horizontal) {
				this.setAmount(scrollable.scrollWidth, scrollable.clientWidth);
			} else {
				// TODO
			}
		},
		
		_scrolling: function(event) {
			this.trigger("scroll", event);
		},
		
		destroy: function() {
			lc.ui.Component.prototype.destroy.call(this);
			// TODO
		}
	});
	
	lc.ui.Component.Registry.register(lc.ui.BrowserScrollbar);
	
	(function() {
		var div = document.createElement("DIV");
		div.style.overflow = "auto";
		div.style.position = "absolute";
		div.style.top = "-1000px";
		div.style.width = "100px";
		div.style.height = "100px";
		var innerDiv = document.createElement("DIV");
		innerDiv.style.width = "200px";
		innerDiv.style.height = "200px";
		div.appendChild(innerDiv);
		document.body.appendChild(div);
		lc.ui.BrowserScrollbar.size = {
			width: div.offsetWidth - div.clientWidth + 1,
			height: div.offsetHeight - div.clientHeight + 1
		};
	})();
	
});