lc.app.onDefined("lc.ui.Grid", function() {
	
	/** columns are the ones filled by the cell.
	 * If it is null, it means 'all remaining columns'. Only one cell in a row can be like this.
	 * If not null, if can be an array or a single element, which is either a column id or a column object.
	 */
	lc.core.createClass("lc.ui.Grid.Cell", function(row, columns) {
		this.row = row;
		this.container = document.createElement("DIV");
		this.container.className = "lc-grid-cell";
		if (columns == null)
			this.columnsIds = null;
		else {
			if (!Array.isArray(columns))
				columns = [columns];
			this.columnsIds = [];
			for (var i = 0; i < columns.length; ++i) {
				if (typeof columns[i] == 'object')
					columns[i] = columns[i].id;
				this.columnsIds.push(columns[i]);
			}
		}
	}, {
		row: null,
		container: null,
		columnsIds: null,
		destroy: function() {
			this.row = null;
			this.container = null;
		}
	});

});