lc.app.onDefined(["lc.ui.Component"], function() {
	
	lc.core.extendClass("lc.ui.Popin", lc.ui.Component, 
		function(container, doNotConfigure, doNotBuild) {
			this._shown = false;
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-pop-in",
			
			configure: function() {
				this.container.style.display = "none";
				this.registerEvents(["show", "hide"]);
				this.recomputePositionListener = new lc.async.Callback(this, this.computePosition);
			},
			
			build: function() {
				// keep location before to move it to the body
				lc.ui.navigation.setUrl(this.container, lc.ui.navigation.getUrl(this.container));
				// if the current container is destroyed, we need to destroy ourself
				if (!this.container.parentNode) throw new Error("A pop-in must be in the document so we can know when to destroy it");
				lc.events.listen(this.container.parentNode, "destroy", new lc.async.Callback(this, this.destroy));
				// move ourself to the body
				document.body.appendChild(this.container);
			},
			
			show: function() {
				if (this._shown) return;
				var animation = lc.animation.animate(this.container);
				this.callExtensions("beforeShow");
				this._shown = true;
				this.computePosition();
				this.callExtensions("afterShow", animation);
				this.trigger("show", animation);
			},
			
			hide: function() {
				if (!this._shown) return;
				var animation = lc.animation.animateReverse(this.container);
				this.callExtensions("beforeHide");
				this._shown = false;
				animation.ondone(new lc.async.Callback(this, function() { if (this.container) this.container.style.display = "none"; }));
				this.callExtensions("afterHide", animation);
				this.trigger("hide", animation);
			},
			
			isShown: function() {
				return this._shown;
			},
			
			isHidden: function() {
				return !this._shown;
			},
			
			toggleShow: function() {
				if (this.isShown()) this.hide();
				else this.show();
			},
			
			computePosition: function() {
				this.container.style.maxHeight = "";
				this.container.style.overflowY = "";
				this.container.style.maxWidth = "";
				this.container.style.overflowX = "";
				this.container.style.display = "";
				this.container.style.position = "fixed";

				// check max width and height
				if (this.container.offsetHeight > window.innerHeight * 0.9) {
					this.container.style.maxHeight = Math.floor(window.innerHeight * 0.9) + 'px';
					this.container.style.overflowY = "auto";
				}
				if (this.container.offsetWidth > window.innerWidth * 0.9) {
					this.container.style.maxWidth = Math.floor(window.innerWidth * 0.9) + 'px';
					this.container.style.overflowX = "auto";
				}
				
				this.$position();

				this.callExtensions("afterPosition");
			},
			
			$position: function() {
				// center on page
				this.container.style.top = "50%";
				this.container.style.left = "50%";
				this.container.style.transform = "translateX(-50%) translateY(-50%)";
			},
			
			destroy: function() {
				if (!this.container) return;
				if (this._shown) this.hide();
				this._attachment = null;
				lc.ui.Component.prototype.destroy.call(this);
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Popin);
	
	lc.core.extendClass("lc.ui.Popin.Extension", lc.ui.Component.Extension, function() {}, {
		beforeShow: function() {},
		afterShow: function(animation) {},
		beforeHide: function() {},
		afterHide: function(animation) {},
		afterPosition: function() {}
	});
});