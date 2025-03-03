import React from "react";

interface TableRowProps {
	children: React.ReactNode;
}

const TableRow: React.FC<TableRowProps> = ({ children }) => {
	const cells = React.Children.toArray(children);

	// If there's only one cell, apply colspan=2
	if (cells.length === 1 && React.isValidElement<HTMLTableCellElement>(cells[0])) {
		return (
            <tr className="hover:bg-gray-300 dark:hover:bg-blue-900 dark:hover:text-indigo-200 even:bg-gray-100 odd:bg-white dark:even:bg-indigo-700 dark:odd:bg-indigo-600 dark:text-indigo-50">
				{React.cloneElement(cells[0] as React.ReactElement<HTMLTableCellElement>, {
					colSpan: 2,
					className: `${cells[0].props.className || ""} text-center font-semibold`,
				})}
			</tr>
		);
	} else {
        return <tr className="hover:bg-gray-300 dark:hover:bg-blue-900 dark:hover:text-indigo-200 even:bg-gray-100 odd:bg-white dark:even:bg-indigo-700 dark:odd:bg-indigo-600 dark:text-indigo-50">{children}</tr>;
    }
};

export default TableRow;
