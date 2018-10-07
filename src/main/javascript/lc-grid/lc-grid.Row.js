lc.app.onDefined("lc.ui.Grid", function() {
	
	lc.core.createClass("lc.ui.Grid.Row", function(grid, data) {
		this.grid = grid;
		this.data = data;
		this.container = document.createElement("DIV");
		lc.css.addClass(this.container, "lc-grid-row-container");
		this.scrollable = document.createElement("DIV");
		this.scrollable.className = "lc-grid-scrollable-part";
		this.container.appendChild(this.scrollable);
		this.cells = [];
	}, {
		grid: null,
		data: null,
		container: null,
		cells: null,
		renderer: null,
		getCellForColumnId: function(colId) {
			for (var i = 0; i < this.cells.length; ++i)
				if (this.cells[i].columnsIds.indexOf(colId) >= 0)
					return this.cells[i];
			return null;
		},
		destroy: function() {
			if (this.container)
				lc.html.remove(this.container);
			if (this.cells)
				for (var i = 0; i < this.cells.length; ++i)
					this.cells[i].destroy();
			if (this.renderer)
				this.renderer.destroy();
			this.renderer = null;
			this.container = null;
			this.data = null;
			this.cells = null;
			this.grid = null;
		}
	});

});