lc.app.onDefined(["lc.ui.Component"], function() {
	
	lc.core.extendClass("lc.ui.Popin", [lc.ui.Component, lc.Configurable], 
		function(container, doNotConfigure, doNotBuild) {
			var properties = {
				attachVertical: {
					types: ["enum"],
					value: "bottom-start",
					enumValues: ["top-start", "top-end", "middle", "bottom-start", "bottom-end"],
					set: function(value, properties) {
						if (!value) return;
						if (value.toLowerCase() == 'top-start') value = 'top-start';
						else if (value.toLowerCase() == 'top-end') value = 'top-end';
						else if (value.toLowerCase() == 'middle') value = 'middle';
						else if (value.toLowerCase() == 'bottom-start') value = 'bottom-start';
						else if (value.toLowerCase() == 'bottom-end') value = 'bottom-end';
						else {
							lc.log.warn("lc.ui.Popin", "Unknown attachVertical value: " + value);
							return;
						}
						if (properties.attachVertical.value == value) return;
						properties.attachVertical.value = value;
						if (this.isShown()) this._computePosition();
					}
				},
				attachHorizontal: {
					types: ["enum"],
					value: "left-start",
					enumValues: ["left-start", "left-end", "center", "right-start", "right-end"],
					set: function(value, properties) {
						if (!value) return;
						if (value.toLowerCase() == 'left-start') value = 'left-start';
						else if (value.toLowerCase() == 'left-end') value = 'left-end';
						else if (value.toLowerCase() == 'center') value = 'center';
						else if (value.toLowerCase() == 'right-start') value = 'right-start';
						else if (value.toLowerCase() == 'right-end') value = 'right-end';
						else {
							lc.log.warn("lc.ui.Popin", "Unknown attachHorizontal value: " + value);
							return;
						}
						if (properties.attachHorizontal.value == value) return;
						properties.attachHorizontal.value = value;
						if (this.isShown()) this._computePosition();
					}
				},
				forceOrientation: {
					types: ["boolean"],
					value: false,
					set: function(value, properties) {
						if (typeof value !== 'boolean') return;
						if (properties.forceOrientation.value === value) return;
						properties.forceOrientation.value = value;
						if (this.isShown()) this._computePosition();
					}
				}
			};
			lc.Configurable.call(this, properties);
			
			this._attachment = null;
			this._shown = false;
			
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-pop-in",
			
			configure: function() {
				this.registerEvents(["show", "hide"]);
				this._recomputePosition = new lc.async.Callback(this, this._computePosition);
			},
			
			build: function() {
				document.body.appendChild(this.container);
				if (this.container.hasAttribute("attach-to")) {
					var elem = document.getElementById(this.container.getAttribute("attach-to"));
					if (elem)
						this.attachTo(elem);
					else
						lc.log.warn("lc.ui.Popin", "pop-in attached to element id '" + this.container.getAttribute("attach-to") + "' but it does not exist.");
				}
				if (this.container.hasAttribute("attach-orientation")) {
					var s = this.container.getAttribute("attach-orientation");
					var i = s.indexOf(',');
					if (i < 0)
						this.attachVertical = s.trim();
					else {
						var a = s.substring(0, i).trim();
						if (a.length > 0) this.attachVertical = a;
						a = s.substring(i + 1).trim();
						if (a.length > 0) this.attachHorizontal = a;
					}
				}
			},
			
			attachTo: function(element) {
				this._attachment = element;
			},
			
			show: function() {
				if (this._shown) return;
				var animation = lc.animation.animate(this.container);
				this.callExtensions("beforeShow");
				this._shown = true;
				this._computePosition();
				if (this._attachment) {
					lc.events.listen(window, 'resize', this._recomputePosition);
					lc.events.listen(window, 'scroll', this._recomputePosition);
					var p = this._attachment.parentNode;
					while (p && p != document.body) {
						lc.events.listen(p, 'scroll', this._recomputePosition);
						p = p.parentNode;
					}
				}
				this.callExtensions("afterShow", animation);
				this.trigger("show", animation);
			},
			
			showAttached: function(attachedTo, verticalAttachment, horizontalAttachment) {
				this.attachTo(attachedTo);
				this.setAttachmentOrientation(verticalAttachment, horizontalAttachment);
				this.show();
			},
			
			hide: function() {
				if (!this._shown) return;
				var animation = lc.animation.animateReverse(this.container);
				this.callExtensions("beforeHide");
				this._shown = false;
				animation.ondone(new lc.async.Callback(this, function() { this.container.style.display = "none"; }));
				if (this._attachment) {
					lc.events.unlisten(window, 'resize', this._recomputePosition);
					lc.events.unlisten(window, 'scroll', this._recomputePosition);
					var p = this._attachment.parentNode;
					while (p && p != document.body) {
						lc.events.unlisten(p, 'scroll', this._recomputePosition);
						p = p.parentNode;
					}
				}
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
			
			_computePosition: function() {
				this.container.style.maxHeight = "";
				this.container.style.overflowY = "";
				this.container.style.maxWidth = "";
				this.container.style.overflowX = "";
				this.container.style.display = "block";
				//this.container.style.position = "absolute";
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
				
				var pos;
				if (this._attachment) {
					//pos = lc.layout.getAbsolutePosition(this._attachment);
					var rect = this._attachment.getBoundingClientRect();
					pos = { x: rect.left, y: rect.top };
					switch (this.attachVertical) {
					case "top-start": break;
					case "top-end": pos.y -= this.container.offsetHeight; break;
					case "bottom-start": pos.y += this._attachment.offsetHeight; break;
					case "bottom-end": pos.y += this._attachment.offsetHeight - this.container.offsetHeight; break;
					case "middle": pos.y += (this._attachment.offsetHeight / 2) - (this.container.offsetHeight / 2); break;
					}
					switch (this.attachHorizontal) {
					case "left-start": break;
					case "left-end": pos.x -= this.container.offsetWidth; break;
					case "right-start": pos.x += this._attachment.offsetWidth; break;
					case "right-end": pos.x += this._attachment.offsetWidth - this.container.offsetWidth; break;
					case "center": pos.x += (this._attachment.offsetWidth / 2) - (this.container.offsetWidth / 2); break;
					}
					if (!this.forceOrientation) {
						if (pos.y + this.container.offsetHeight > window.innerHeight) {
							if (window.innerHeight - pos.y >= 75) {
								this.container.style.maxHeight = (window.innerHeight - pos.y) + 'px';
								this.container.style.overflowY = "auto";
							} else {
								// force position on top
								pos.y = rect.top - this.container.offsetHeight;
							}
						}
						if (pos.y < 0) pos.y = 0;

						if (pos.x + this.container.offsetWidth > window.innerWidth) {
							if (window.innerWidth - pos.x >= 75) {
								this.container.style.maxWidth = (window.innerWidth - pos.x) + 'px';
								this.container.style.overflowX = "auto";
							} else {
								// force position on left
								pos.x = rect.left - this.container.offsetWidth;
							}
						}
						if (pos.x < 0) pos.x = 0;
					}
					
					lc.css.removeClass(this.container, "lc-animate-down");
					lc.css.removeClass(this.container, "lc-animate-up");
					lc.css.removeClass(this.container, "lc-animate-left");
					lc.css.removeClass(this.container, "lc-animate-right");
					if (pos.y <= rect.top) lc.css.addClass(this.container, "lc-animate-up");
					else lc.css.addClass(this.container, "lc-animate-down");
					if (pos.x <= rect.left) lc.css.addClass(this.container, "lc-animate-left");
					if (pos.x >= rect.left + this._attachment.offsetWidth) lc.css.addClass(this.container, "lc-animate-right");
				} else
					pos = { x: 0, y: 0 };
				this.container.style.top = pos.y + "px";
				this.container.style.left = pos.x + "px";
				this.callExtensions("afterPosition", pos);
			},
			
			destroy: function() {
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
		afterPosition: function(position) {}
	});
});