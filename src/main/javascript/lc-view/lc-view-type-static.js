lc.app.onDefined("lc.ui.View.TypeHandler", function() {
	
	lc.core.extendClass("lc.ui.View.TypeHandler.Static", [lc.ui.View.TypeHandler],
		function() {
			lc.ui.View.TypeHandler.call(this, "static");
		}, {
			initPage: function(page) {
				
			},
			
			initPageFromElement: function(page, element) {
				page.element = element;
				page.processed = false;
			},
			
			load: function(page) {
				var future = new lc.async.Future();
				future.success();
				return future;
			},
			
			show: function(page, container) {
				container.appendChild(page.element);
				if (!page.processed) {
					lc.html.processor.process(page.element);
					page.processed = true;
				}
			},
			
			hide: function(page, container) {
				container.removeChild(page.element);
			},
			
			destroyPage: function(page) {
				lc.events.destroyed(page.element);
				page.element = null;
			}
		}
	);
	
	lc.ui.View.TypeHandler.Registry.register(new lc.ui.View.TypeHandler.Static());
	
});