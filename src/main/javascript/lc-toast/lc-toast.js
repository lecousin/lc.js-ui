lc.app.onDefined("lc.ui.Component", function() {
	
	lc.core.extendClass("lc.ui.Toast", lc.ui.Component,
		function(container, doNotConfigure, doNotBuild) {
			var popinContainer = document.createElement("DIV");
			container.appendChild(popinContainer);
			popinContainer.className = "lc-toast";
			this.popin = new lc.ui.Popin(popinContainer, true, true);
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-toast",
			
			configure: function() {
				var attach = this.popin.addExtension(lc.ui.Popin.Attach);
				// by default: top-center
				attach.alignVertical = "top-start";
				attach.alignHorizontal = "center";
				this.popin.attachTo(this.container.parentNode);
				this.popin.performConfiguration();
			},
			
			build: function() {
				this.popin.performBuild();
			},
			
			addToast: function(style, content, closeable, timeout) {
				var toast = document.createElement("DIV");
				toast.className = "lc-toast-" + style;
				if (typeof content === 'string') {
					var div = document.createElement("DIV");
					div.appendChild(document.createTextNode(content));
					content = div;
				}
				var before = document.createElement("DIV");
				var after = document.createElement("DIV");
				toast.appendChild(before);
				toast.appendChild(content);
				toast.appendChild(after);
				if (closeable) {
					var close = document.createElement("DIV");
					close.className = "lc-toast-close";
					after.appendChild(close);
					lc.events.listen(close, "click", new lc.async.Callback(this, function() {
						this.removeToast(toast);
					}));
				}
				this.callExtensions("newToast", this, toast);
				this.popin.container.appendChild(toast);
				if (!this.popin.isShown()) this.popin.show(); else this.popin.computePosition();
				if (timeout > 0) {
					var that = this;
					setTimeout(function() {
						that.removeToast(toast);
					}, timeout);
				}
				return toast;
			},
			
			removeToast: function(toast) {
				if (!toast.parentNode) return;
				lc.animation.collapseHeight(toast, 150).ondone(new lc.async.Callback(this, function() {
					this.popin.container.removeChild(toast);
					if (this.popin.container.childNodes.length == 0)
						this.popin.hide();
					 else
						 this.popin.computePosition();
				}));
			},
			
			destroy: function() {
				if (!this.popin) return;
				this.popin.destroy();
				this.popin = null;
				lc.ui.Component.prototype.destroy.call(this);
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Toast);
	
	lc.core.extendClass("lc.ui.Toast.Extension", lc.ui.Component.Extension, function() {}, {
		newToast: function(toaster, toast) {}
	});
	
});