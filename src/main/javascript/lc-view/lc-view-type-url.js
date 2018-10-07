lc.app.onDefined("lc.ui.View.TypeHandler", function() {
	
	lc.core.extendClass("lc.ui.View.TypeHandler.Url", [lc.ui.View.TypeHandler],
		function() {
			lc.ui.View.TypeHandler.call(this, "url");
		}, {
			initPage: function(view, page) {
				page.url = lc.ui.navigation.resolveUrl(page.from ? page.from : view.container, page.url);
				if (!page.element)
					page.element = document.createElement("DIV");
				page.element.style.height = "100%";
			},
			
			initPageFromElement: function(view, page, element) {
				page.element = element;
				page.url = element.getAttribute("view-url");
				page.url = lc.ui.navigation.resolveUrl(view.container, page.url);
				page.element.style.height = "100%";
			},
			
			load: function(view, page) {
				return lc.resources.html(page.url);
			},
			
			show: function(view, page, container) {
				if (!page.elements) {
					var div = document.createElement("DIV");
					div.innerHTML = page.loading.getResult();
					page.elements = [];
					while (div.childNodes.length > 0)
						page.elements.push(div.removeChild(div.childNodes[0]));
				}
				if (page.keepInstance) {
					for (var i = 0; i < page.elements.length; ++i)
						page.element.appendChild(page.elements[i]);
				} else {
					for (var i = 0; i < page.elements.length; ++i)
						page.element.appendChild(page.elements[i].cloneNode(true));
					page.processed = false;
				}
				lc.ui.navigation.setUrl(page.element, page.url);
				container.appendChild(page.element);
				if (!page.processed)
					page.processed = lc.html.processor.process(page.element);
				return page.processed;
			},
			
			hide: function(view, page, container) {
				if (!page.keepInstance) {
					while (page.element.childNodes.length > 0)
						lc.html.remove(page.element.childNodes[0]);
				}
				container.removeChild(page.element);
				return lc.async.Future.alreadySuccess();
			},
			
			isSamePageReference: function(page1, page2) {
				if (!page1.url || !page2.url) return false;
				return page1.url.equals(page2.url);
			},
			
			destroyPage: function(view, page) {
				if (!page.url) return;
				while (page.element.childNodes.length > 0)
					lc.html.remove(page.element.childNodes[0]);
				lc.html.remove(page.element);
				page.element = null;
				page.elements = null;
				page.url = null;
				page.processed = true;
			}
		}
	);
	
	lc.ui.View.TypeHandler.Registry.register(new lc.ui.View.TypeHandler.Url());
	
});