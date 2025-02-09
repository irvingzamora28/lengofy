import React from "react";
import { ReactNode } from "react";

interface TableRowProps {
	children: ReactNode;
}

const TableRow: React.FC<TableRowProps> = ({ children }) => {
	return <tr className="hover:bg-gray-300 dark:hover:bg-blue-900 dark:hover:text-indigo-200 even:bg-gray-100 odd:bg-white dark:even:bg-indigo-700 dark:odd:bg-indigo-600 dark:text-indigo-50">{children}</tr>;
};

export default TableRow;
