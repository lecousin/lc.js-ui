lc.app.onDefined("lc.ui.View.TypeHandler", function() {
	
	lc.core.extendClass("lc.ui.View.TypeHandler.Url", [lc.ui.View.TypeHandler],
		function() {
			lc.ui.View.TypeHandler.call(this, "url");
		}, {
			initPage: function(page) {
			},
			
			initPageFromElement: function(page, element) {
				page.element = element;
				page.url = element.getAttribute("view-url");
			},
			
			load: function(page) {
				return lc.resources.html(page.url);
			},
			
			show: function(page, container) {
				if (!page.elements) {
					var div = document.createElement("DIV");
					div.innerHTML = page.loading.getResult();
					page.elements = [];
					while (div.childNodes.length > 0)
						page.elements.push(div.removeChild(div.childNodes[0]));
				}
				for (var i = 0; i < page.elements.length; ++i)
					page.element.appendChild(page.elements[i]);
				container.appendChild(page.element);
				if (!page.processed) {
					lc.html.processor.process(page.element);
					page.processed = true;
				}
			},
			
			hide: function(page, container) {
				while (container.childNodes.length > 0)
					container.removeChild(container.childNodes[0]);
			},
			
			destroyPage: function(page) {
				for (var i = 0; i < page.elements.length; ++i)
					lc.events.destroyed(page.elements[i]);
				page.elements = null;
				page.url = null;
			}
		}
	);
	
	lc.ui.View.TypeHandler.Registry.register(new lc.ui.View.TypeHandler.Url());
	
});