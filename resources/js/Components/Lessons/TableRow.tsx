import React from "react";

interface TableRowProps {
	children: React.ReactNode;
}

const TableRow: React.FC<TableRowProps> = ({ children }) => {
	const cells = React.Children.toArray(children);

	// If there's only one cell, apply colspan=2
	if (cells.length === 1 && React.isValidElement<HTMLTableCellElement>(cells[0])) {
		return (
            <tr className="hover:bg-gray-200 dark:hover:bg-gray-700
                even:bg-gray-50 odd:bg-white
                dark:even:bg-gray-700/80 dark:odd:bg-gray-600/80
                dark:text-gray-200
                transition-colors duration-200">
				{React.cloneElement(cells[0] as React.ReactElement<HTMLTableCellElement>, {
					colSpan: 2,
					className: `${cells[0].props.className || ""} text-center font-semibold`,
				})}
			</tr>
		);
	} else {
        return (
            <tr className="hover:bg-gray-200 dark:hover:bg-gray-700
                even:bg-gray-50 odd:bg-white
                dark:even:bg-gray-700/80 dark:odd:bg-gray-600/80
                dark:text-gray-200
                transition-colors duration-200">
                {children}
            </tr>
        );
    }
};

export default TableRow;
