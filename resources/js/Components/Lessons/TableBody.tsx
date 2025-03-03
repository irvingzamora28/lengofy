import React from "react";
import TableRow from "./TableRow";

interface TableBodyProps {
	children: React.ReactNode;
}

const TableBody: React.FC<TableBodyProps> = ({ children }) => {
	return (
		<tbody>
			{React.Children.map(children, (child) =>
				// Replace each 'tr' element with the 'TableRow' component
				React.isValidElement(child) ? <TableRow>{child.props.children}</TableRow> : child
			)}
		</tbody>
	);
};

export default TableBody;
