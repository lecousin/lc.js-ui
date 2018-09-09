lc.app.onDefined("lc.ui.Component", function() {
	
	lc.core.extendClass("lc.ui.ProgressBar", [lc.ui.Component, lc.Configurable],
		function(container, doNotConfigure, doNotBuild) {
			var properties = {
				total: {
					types: ["integer"],
					value: 1,
					set: function(total, properties) {
						if (!total) total = 1;
						if (typeof total == 'string')
							total = parseInt(total);
						if (total <= 0) total = 1;
						properties.total.value = total;
						this.updateBar();
					}
				},
				position: {
					types: ["integer"],
					value: 0,
					set: function(pos, properties) {
						if (!pos) pos = 0;
						if (typeof pos == 'string')
							pos = parseInt(pos);
						properties.position.value = pos;
						this.updateBar();
					}
				},
				percentTextVisible: {
					types: ["boolean"],
					value: false,
					set: function(visible, properties) {
						properties.percentTextVisible.value = visible ? true : false;
						this.percentTextContainer.style.display = visible ? "" : "none";
					}
				},
				text: {
					types: ["string","Node"],
					value: "",
					set: function(text, properties) {
						if (!text) text = '';
						properties.text.value = text;
						if (typeof text == 'string')
							text = document.createTextNode(text);
						lc.html.empty(this.textContainer);
						this.textContainer.appendChild(text);
					}
				},
				subText: {
					types: ["string","Node"],
					value: "",
					set: function(text, properties) {
						if (!text) text = '';
						properties.subText.value = text;
						if (typeof text == 'string')
							text = document.createTextNode(text);
						lc.html.empty(this.subTextContainer);
						this.subTextContainer.appendChild(text);
					}
				}
			};
			lc.Configurable.call(this, properties);
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-progress-bar",

			configure: function() {
				this.textContainer = document.createElement("DIV");
				this.textContainer.className = "progressText";
				this.barContainer = document.createElement("DIV");
				this.barContainer.className = "progressBarContainer";
				this.bar = document.createElement("DIV");
				this.bar.className = "progressBar";
				this.barContainer.appendChild(this.bar);
				this.subTextContainer = document.createElement("DIV");
				this.subTextContainer.className = "progressSubText";
				this.percentTextContainer = document.createElement("DIV");
				this.percentTextContainer.className = "progressPercentTextContainer";
				this.barContainer.appendChild(this.percentTextContainer);
				this.percentText = document.createElement("DIV");
				this.percentText.className = "progressPercentText";
				this.percentTextContainer.appendChild(this.percentText);
				if (this.container.hasAttribute("percent-text"))
					this.percentTextVisible = this.container.getAttribute("percent-text") == "true";
				this.percentTextContainer.style.display = this.percentTextVisible ? "" : "none";
			},
			
			build: function() {
				var a;
				a = this.container.getAttribute("text");
				if (a) this.text = a;
				a = this.container.getAttribute("subText");
				if (a) this.subText = a;
				a = this.container.getAttribute("total");
				if (a) this.total = a;
				a = this.container.getAttribute("position");
				if (a) this.position = a;
				this.container.appendChild(this.textContainer);
				this.container.appendChild(this.barContainer);
				this.container.appendChild(this.subTextContainer);
				this.updateBar();
			},
			
			updateBar: function() {
				this.bar.style.width = (this.position * 100 / this.total) + '%';
				var percent = Math.floor(this.position * 100 / this.total);
				this.percentText.innerHTML = percent + ' %';
			},
			
			destroy: function() {
				lc.UIComponent.prototype.destroy.call(this);
				this.textContainer = null;
				this.barContainer = null;
				this.bar = null;
				this.subTextContainer = null;
				this.percentTextContainer = null;
				this.percentText = null;
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.ProgressBar);

	lc.core.extendClass("lc.ui.ProgressBar.Extension", lc.ui.Component.Extension, function() {}, {
	});

});