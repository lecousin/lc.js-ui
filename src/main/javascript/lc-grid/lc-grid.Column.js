lc.app.onDefined("lc.ui.Grid", function() {
	
	lc.core.createClass("lc.ui.Grid.Column", function(grid, id) {
		this.grid = grid;
		this.id = id;
		this.headerCell = new lc.ui.Grid.Cell(grid.columnsHeadersRow, [id]);
		lc.css.addClass(this.headerCell.container, "lc-grid-column-header");
	}, {
		grid: null,
		id: null,
		minWidth: null,
		maxWidth: null,
		width: null,
		canBeMovedOrRemoved: true,
		headerCell: null,
		headerCellRenderer: function() {
			if (this.title)
				this.headerCell.container.appendChild(this.title);
		},
		cellRenderer: function(row, cell) {
			if (this.field && row.data) {
				var value = row.data[this.field];
				if (this.formatter)
					value = this.formatter.formatValue(this.formatter.createValue(value));
				if (value !== null && value !== undefined)
					cell.container.appendChild(document.createTextNode(value));
			}
		},
		destroy: function() {
			this.grid = null;
		}
	});

});