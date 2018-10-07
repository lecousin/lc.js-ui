lc.app.onDefined("lc.ui.Popin", function() {
	
	lc.core.extendClass("lc.ui.Popin.Attach", [lc.ui.Popin.Extension, lc.Configurable],
		function() {
			var properties = {
				alignVertical: {
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
							lc.log.warn("lc.ui.Popin.Attach", "Unknown alignVertical value: " + value);
							return;
						}
						if (properties.alignVertical.value == value) return;
						properties.alignVertical.value = value;
						if (this.popin.isShown()) this.popin.$computePosition();
					}
				},
				alignHorizontal: {
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
							lc.log.warn("lc.ui.Popin.Attach", "Unknown alignHorizontal value: " + value);
							return;
						}
						if (properties.alignHorizontal.value == value) return;
						properties.alignHorizontal.value = value;
						if (this.popin.isShown()) this.popin.$computePosition();
					}
				},
				forceOrientation: {
					types: ["boolean"],
					value: false,
					set: function(value, properties) {
						if (typeof value !== 'boolean') return;
						if (properties.forceOrientation.value === value) return;
						properties.forceOrientation.value = value;
						if (this.popin.isShown()) this.popin.$computePosition();
					}
				}
			};
			lc.Configurable.call(this, properties);
		}, {
			extensionName: "attach",
			popin: null,
			
			init: function(popin) {
				this.popin = popin;
				
				popin._attachment = null;
				popin.attachTo = function(element) {
					this._attachment = element;
				};
				
				popin.showAttached = function(attachedTo, verticalAttachment, horizontalAttachment) {
					this.attachTo(attachedTo);
					this.setAttachmentOrientation(verticalAttachment, horizontalAttachment);
					this.show();
				};

				popin.extensionOverridesMethod(this, "$position", function() {
					if (!this._attachment) return;
					var attach = this.getExtension(lc.ui.Popin.Attach);
					var pos;
					var rect = this._attachment.getBoundingClientRect();
					pos = { x: rect.left, y: rect.top };
					switch (attach.alignVertical) {
					case "top-start": break;
					case "top-end": pos.y -= this.container.offsetHeight; break;
					case "bottom-start": pos.y += this._attachment.offsetHeight; break;
					case "bottom-end": pos.y += this._attachment.offsetHeight - this.container.offsetHeight; break;
					case "middle": pos.y += (this._attachment.offsetHeight / 2) - (this.container.offsetHeight / 2); break;
					}
					switch (attach.alignHorizontal) {
					case "left-start": break;
					case "left-end": pos.x -= this.container.offsetWidth; break;
					case "right-start": pos.x += this._attachment.offsetWidth; break;
					case "right-end": pos.x += this._attachment.offsetWidth - this.container.offsetWidth; break;
					case "center": pos.x += (this._attachment.offsetWidth / 2) - (this.container.offsetWidth / 2); break;
					}
					if (!attach.forceOrientation) {
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
					this.container.style.top = pos.y + "px";
					this.container.style.left = pos.x + "px";
				});
				
				lc.ui.Popin.Extension.prototype.init.call(this, popin);
			},
			
			postBuild: function(popin) {
				var attachId = null;
				if (popin.container.hasAttribute("attach-to"))
					attachId = popin.container.getAttribute("attach-to");
				else if (popin.container.hasAttribute("lc-pop-in-attach"))
					attachId = popin.container.getAttribute("lc-pop-in-attach");
				if (attachId != null && attachId.length > 0) {
					var elem = document.getElementById(attachId);
					if (elem)
						popin.attachTo(elem);
					else
						lc.log.warn("lc.ui.Popin.Attach", "pop-in attached to element id '" + attachId + "' but it does not exist.");
				}
				if (popin.container.hasAttribute("attach-orientation")) {
					var s = popin.container.getAttribute("attach-orientation");
					var i = s.indexOf(',');
					if (i < 0)
						this.alignVertical = s.trim();
					else {
						var a = s.substring(0, i).trim();
						if (a.length > 0) this.alignVertical = a;
						a = s.substring(i + 1).trim();
						if (a.length > 0) this.alignHorizontal = a;
					}
				}
			},
			
			afterShow: function() {
				if (this.popin._attachment) {
					lc.events.listen(window, 'resize', this.popin.recomputePositionListener);
					lc.events.listen(window, 'scroll', this.popin.recomputePositionListener);
					var p = this.popin._attachment.parentNode;
					while (p && p != document.body) {
						lc.events.listen(p, 'scroll', this.popin.recomputePositionListener);
						p = p.parentNode;
					}
				}
			},
			
			afterHide: function() {
				if (this.popin._attachment) {
					lc.events.unlisten(window, 'resize', this.popin.recomputePositionListener);
					lc.events.unlisten(window, 'scroll', this.popin.recomputePositionListener);
					var p = this.popin._attachment.parentNode;
					while (p && p != document.body) {
						lc.events.unlisten(p, 'scroll', this.popin.recomputePositionListener);
						p = p.parentNode;
					}
				}
			},
			
			destroy: function(popin) {
				popin.attachTo = null;
				popin.showAttached = null;
				this.popin = null;
				this.attachment = null;
				lc.ui.Popin.Extension.prototype.destroy.call(this, popin);
			}
		}
	);
	
	lc.Extension.Registry.register(lc.ui.Popin, lc.ui.Popin.Attach);
	
});