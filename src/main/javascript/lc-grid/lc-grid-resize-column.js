lc.app.onDefined("lc.locale", function() {
	var url = lc.core.getMyURL();
	var i = url.path.lastIndexOf('/');
	url = url.path.substring(0,i+1);
	lc.locale.declare(url+'locale/', ['lc-grid.resize-column'], ['en','fr']);
});

lc.app.onDefined("lc.ui.Grid", function() {
	
	lc.core.extendClass("lc.ui.Grid.ResizeColumn", lc.ui.Grid.Extension, function() {}, {
		extensionName: "resize-column",
		
		init: function(grid) {
			lc.ui.Grid.Extension.prototype.init.call(this, grid);
			if (grid.isBuilt()) {
				for (var i = 0; i < grid.columns.length; ++i)
					this.afterAddColumn(grid, grid.columns[i]);
				this.afterLayout(grid);
			}
		},

		afterAddColumn: function(grid, col) {
			col.resizer = document.createElement("DIV");
			col.resizer.className = "lc-grid-column-resizer";
			lc.locale.localizeAttribute(col.resizer, "title", "lc-grid.resize-column", "tooltip resizer");
			var pos = null;
			lc.events.listen(col.resizer, "mousedown", function(event) {
				event.preventDefault();
				pos = event.clientX;
				if (col.width !== null)
					col.width = col.headerCell.container.offsetWidth;
				return false;
			});
			lc.events.listen(col.resizer, "mouseup", function(event) {
				pos = null;
			});
			lc.events.listen(grid.header, "mouseenter", function(event) {
				pos = null;
			});
			lc.events.listen(grid.header, "mouseleave", function(event) {
				pos = null;
			});
			lc.events.listen(grid.header, "mousemove", function(event) {
				if (pos === null) return;
				var diff = event.clientX - pos;
				if (diff == 0) return;
				pos = event.clientX;
				if (col.width === null)
					col.width = col.headerCell.container.offsetWidth + diff;
				else
					col.width += diff;
				grid.layout();
			});
			lc.events.listen(col.resizer, "dblclick", function(event) {
				col.width = null;
				grid.layout();
			});
		},
		
		afterLayout: function(grid) {
			for (var i = 0; i < grid.columns.length; ++i) {
				var col = grid.columns[i];
				if (col.resizer.parentNode != col.headerCell.container.parentNode) {
					if (col.resizer.parentNode)
						col.resizer.parentNode.removeChild(col.resizer);
					if (col.headerCell.container.parentNode)
						col.headerCell.container.parentNode.appendChild(col.resizer);
				}
				col.resizer.style.left = (col.headerCell.container.offsetLeft + col.headerCell.container.offsetWidth - col.resizer.offsetWidth/2) + 'px';
			}
		},
		
		destroy: function(grid) {
			if (grid.columns)
				for (var i = 0; i < grid.columns.length; ++i) {
					if (!grid.columns[i].resizer) continue;
					lc.html.remove(grid.columns[i].resizer);
					grid.columns[i].resizer = null;
				}
		}
	});
	lc.Extension.Registry.register(lc.ui.Grid, lc.ui.Grid.ResizeColumn);
});