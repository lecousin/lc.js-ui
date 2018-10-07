lc.app.onDefined("lc.ui.Grid.Row.Renderer", function() {
	
	lc.core.extendClass("lc.ui.Grid.Row.DefaultRenderer", lc.ui.Grid.Row.Renderer, function(row) {
		lc.ui.Grid.Row.Renderer.call(this, row);
		row.pinLeft = document.createElement("DIV");
		row.pinLeft.className = "lc-grid-pinned-part";
		row.pinRight = document.createElement("DIV");
		row.pinRight.className = "lc-grid-pinned-part";
		row.container.insertBefore(row.pinLeft, row.scrollable);
		row.container.appendChild(row.pinRight);
	}, {
		addCell: function(cell) {
			lc.ui.Grid.Row.Renderer.prototype.addCell.call(this, cell);
			this.row.scrollable.appendChild(cell.container);
			this.row.grid.refreshPinnedColumns(this.row);
		},
		resetLayout: function() {
			lc.ui.Grid.Row.Renderer.prototype.resetLayout.call(this);
			this.row.pinLeft.style.width = "";
			this.row.pinLeft.style.height = "";
			this.row.pinRight.style.width = "";
			this.row.pinRight.style.height = "";
		},
		destroy: function() {
			this.row.pinLeft = null;
			this.row.scrollable = null;
			this.row.pinRight = null;
			lc.ui.Grid.Row.Renderer.prototype.destroy.call(this);
		}
	});

});